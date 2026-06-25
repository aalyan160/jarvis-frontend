"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import BootAnimation from "@/components/BootAnimation";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { PAGE_TITLES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const title = useMemo(() => PAGE_TITLES[pathname] || "Jarvis", [pathname]);

  useEffect(() => {
    let ignore = false;

    async function loadPendingCount() {
      try {
        const { count, error } = await supabase
          .from("approvals")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");

        if (error) throw error;
        if (!ignore) setPendingApprovals(count || 0);
      } catch (error) {
        console.log("Failed to load pending approvals count", error);
      }
    }

    loadPendingCount();

    const channel = supabase
      .channel("sidebar-approvals-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, loadPendingCount)
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <ToastProvider>
      <BootAnimation />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pendingApprovals={pendingApprovals}
      />
      <div className="min-h-dvh bg-black lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-jarvis-border bg-black/88 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-lg border border-jarvis-border text-zinc-300 hover:border-jarvis-accent hover:text-jarvis-accent hover:shadow-softGlow lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-lg font-bold text-white">{title}</h1>
            <div className="flex items-center gap-2 rounded-full border border-jarvis-success/20 bg-jarvis-success/[0.07] px-2.5 py-1 text-xs font-semibold text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-jarvis-success shadow-[0_0_10px_rgba(0,255,136,0.75)] animate-pulseDot" />
              Online
            </div>
          </div>
          <div className="hidden text-xs font-semibold uppercase text-zinc-600 sm:block">JARVIS OS</div>
        </header>
        <main className="min-h-[calc(100dvh-3.5rem)] p-4 sm:p-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
