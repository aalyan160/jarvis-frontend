# JARVIS Frontend

Private Next.js frontend for the JARVIS AI assistant.

## Environment Variables

Copy `.env.example` to `.env.local` and provide:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
```

Add the same values in Vercel under Project Settings > Environment Variables.

## Supabase Authentication

1. In Supabase Dashboard, open Authentication > Providers and enable Email.
2. Disable public sign-ups if this project must remain private.
3. Open Authentication > Users and create your personal user manually.
4. Copy that user's UUID.
5. Run `supabase-auth-setup.sql` in Supabase SQL Editor.
6. Replace `YOUR_AUTH_USER_UUID` in the commented migration statements and
   run those updates to assign existing records to your account.
7. Update n8n workflows to write the authenticated UUID received as `userId`
   or `user_id` into each table's UUID `user_id` column.

The auth helper package is pinned to `0.10.0` because this project currently
uses `createClientComponentClient`. Supabase has deprecated auth helpers in
favor of `@supabase/ssr`; migrate when upgrading the authentication stack.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Unauthenticated visitors are redirected to
`/login`.
