"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ClipboardList,
  Contact,
  FileClock,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  X
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    href: "/",
    label: "Chat",
    icon: MessageSquareText,
    iconClass: "text-cyan-300",
    iconSurface: "bg-cyan-400/10"
  },
  {
    href: "/approvals",
    label: "Approvals",
    icon: Bell,
    iconClass: "text-amber-300",
    iconSurface: "bg-amber-400/10"
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: ClipboardList,
    iconClass: "text-violet-300",
    iconSurface: "bg-violet-400/10"
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: Contact,
    iconClass: "text-emerald-300",
    iconSurface: "bg-emerald-400/10"
  },
  {
    href: "/logs",
    label: "Tool Logs",
    icon: FileClock,
    iconClass: "text-sky-300",
    iconSurface: "bg-sky-400/10"
  }
];

export default function Sidebar({ isOpen, onClose, pendingApprovals = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast("Logout failed", "error");
      setIsLoggingOut(false);
      return;
    }

    onClose();
    router.replace("/login");
    router.refresh();
  }

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

        <nav className="sidebar-scrollbar mt-3 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-lg border px-2.5 py-2.5 text-sm font-semibold transition-all before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-jarvis-accent before:transition-opacity ${
                  active
                    ? "border-jarvis-accent/45 bg-jarvis-accent/15 text-white shadow-softGlow before:opacity-100"
                    : "border-transparent text-zinc-400 before:opacity-0 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.iconSurface}`}>
                  <Icon className={`h-[18px] w-[18px] ${item.iconClass}`} />
                </span>
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

        <div className="flex items-center justify-between gap-3 border-t border-jarvis-border px-5 py-3">
          <span className="min-w-0 truncate text-xs text-zinc-600">
            jarvis.alyanabbas.tech
          </span>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#00BCD4]/30 text-[#00BCD4] transition-all duration-200 hover:border-[#00BCD4] hover:bg-[#00BCD4]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Logout"
            title="Logout"
          >
            {isLoggingOut ? (
              <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <LogOut className="h-[18px] w-[18px]" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
