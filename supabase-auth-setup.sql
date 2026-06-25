-- Run this in Supabase SQL Editor after creating your private Auth user.
-- Existing non-UUID user_id columns are preserved as user_id_legacy.

do $$
declare
  target_table text;
  current_type text;
begin
  foreach target_table in array array[
    'n8n_chat_histories',
    'approvals',
    'tasks',
    'contacts',
    'tool_logs',
    'memories',
    'project_logs'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is null then
      continue;
    end if;

    select c.udt_name
      into current_type
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = target_table
        and c.column_name = 'user_id';

    if current_type is null then
      execute format(
        'alter table public.%I add column user_id uuid references auth.users(id) on delete cascade',
        target_table
      );
    elsif current_type <> 'uuid' then
      if exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = target_table
          and c.column_name = 'user_id_legacy'
      ) then
        raise exception
          'Table public.% already has user_id_legacy. Resolve it before running this migration.',
          target_table;
      end if;

      execute format(
        'alter table public.%I rename column user_id to user_id_legacy',
        target_table
      );
      execute format(
        'alter table public.%I add column user_id uuid references auth.users(id) on delete cascade',
        target_table
      );
    end if;

    execute format(
      'create index if not exists %I on public.%I (user_id)',
      target_table || '_user_id_idx',
      target_table
    );
  end loop;
end
$$;

-- After creating your Auth user, replace YOUR_AUTH_USER_UUID and run these
-- updates once to assign all existing personal records to that account.
--
-- update public.n8n_chat_histories set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;
-- update public.approvals set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;
-- update public.tasks set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;
-- update public.contacts set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;
-- update public.tool_logs set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;
-- update public.memories set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;
-- update public.project_logs set user_id = 'YOUR_AUTH_USER_UUID' where user_id is null;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'n8n_chat_histories',
    'approvals',
    'tasks',
    'contacts',
    'tool_logs',
    'memories',
    'project_logs'
  ]
  loop
    if to_regclass(format('public.%I', target_table)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', target_table);
    execute format(
      'drop policy if exists "Users can only access own data" on public.%I',
      target_table
    );
    execute format(
      'create policy "Users can only access own data" on public.%I
       for all to authenticated
       using ((select auth.uid()) = user_id)
       with check ((select auth.uid()) = user_id)',
      target_table
    );
  end loop;
end
$$;
