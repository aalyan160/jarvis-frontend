"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  Contact,
  FileClock,
  MessageSquareText,
  X
} from "lucide-react";

const navItems = [
  { href: "/", label: "Chat", icon: MessageSquareText },
  { href: "/approvals", label: "Approvals", icon: Bell },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/contacts", label: "Contacts", icon: Contact },
  { href: "/logs", label: "Tool Logs", icon: FileClock }
];

export default function Sidebar({ isOpen, onClose, pendingApprovals = 0 }) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[260px] flex-col border-r border-jarvis-border bg-black transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/"
            onClick={onClose}
            className="text-2xl font-extrabold tracking-[0.18em] text-jarvis-accent drop-shadow-[0_0_15px_rgba(0,212,255,0.8)]"
          >
            JARVIS
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg border border-jarvis-border text-zinc-400 hover:border-jarvis-accent hover:text-jarvis-accent hover:shadow-softGlow lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-5 flex items-center gap-2 rounded-full border border-jarvis-border bg-jarvis-surface px-3 py-2 text-sm text-zinc-300">
          <span className="h-2.5 w-2.5 rounded-full bg-jarvis-success shadow-[0_0_12px_rgba(0,255,136,0.85)] animate-pulseDot" />
          Online
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "border border-jarvis-accent/45 bg-jarvis-accent/10 text-white shadow-softGlow"
                    : "border border-transparent text-zinc-400 hover:border-jarvis-accent/25 hover:bg-jarvis-accent/5 hover:text-white hover:shadow-softGlow"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-jarvis-accent" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.href === "/approvals" && pendingApprovals > 0 ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-jarvis-error px-1.5 py-0.5 text-xs font-bold text-white">
                    {pendingApprovals > 99 ? "99+" : pendingApprovals}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-jarvis-border px-5 py-4 text-xs text-zinc-600">
          jarvis.alyanabbas.tech
        </div>
      </aside>
    </>
  );
}
