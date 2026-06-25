"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Phone, Search } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { supabase } from "@/lib/supabase";
import { contactColor } from "@/lib/utils";

function ContactLine({ icon: Icon, children, accentClass = "text-jarvis-accent" }) {
  if (!children) return null;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
      <Icon className={`h-4 w-4 shrink-0 ${accentClass}`} />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    document.title = "Jarvis | Contacts";

    async function loadContacts() {
      try {
        const { data, error: fetchError } = await supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true });

        if (fetchError) throw fetchError;
        setContacts(data || []);
      } catch (fetchError) {
        console.log("Failed to load contacts", fetchError);
        setError("Unable to load contacts.");
      } finally {
        setIsLoading(false);
      }
    }

    loadContacts();
  }, [user]);

  const visibleContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;

    return contacts.filter((contact) => String(contact.name || "").toLowerCase().includes(query));
  }, [contacts, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search contacts"
          className="h-12 w-full rounded-xl border border-jarvis-border bg-jarvis-surface pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-jarvis-accent focus:shadow-softGlow"
        />
      </div>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingSkeleton rows={6} /> : null}
      {!isLoading && !error && visibleContacts.length === 0 ? <EmptyState /> : null}
      {!isLoading && !error && visibleContacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleContacts.map((contact) => {
            const name = contact.name || "Unknown";
            const color = contactColor(name);

            return (
              <article
                key={contact.id || name}
                className="rounded-xl border border-jarvis-border bg-jarvis-card p-4 transition-all hover:border-jarvis-accent/35 hover:shadow-softGlow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-extrabold text-black"
                    style={{ backgroundColor: color, boxShadow: `0 0 18px ${color}33` }}
                  >
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold text-white">{name}</h2>
                    {contact.category ? (
                      <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase text-zinc-300">
                        {contact.category}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <ContactLine icon={Phone}>{contact.phone}</ContactLine>
                  <ContactLine icon={MessageCircle} accentClass="text-jarvis-success">{contact.whatsapp}</ContactLine>
                  <ContactLine icon={Mail}>{contact.email}</ContactLine>
                </div>

                {contact.notes ? (
                  <p className="mt-5 border-t border-jarvis-border pt-4 text-sm italic leading-relaxed text-zinc-500">
                    {contact.notes}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
