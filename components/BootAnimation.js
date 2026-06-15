"use client";

import { useEffect, useState } from "react";

const WORD = "JARVIS";

export default function BootAnimation() {
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const alreadyShown = sessionStorage.getItem("jarvis_boot_complete");
    if (alreadyShown) return;

    setVisible(true);
    let index = 0;
    const typeTimer = window.setInterval(() => {
      index += 1;
      setTyped(WORD.slice(0, index));

      if (index >= WORD.length) {
        window.clearInterval(typeTimer);
      }
    }, 120);

    const leaveTimer = window.setTimeout(() => {
      setLeaving(true);
      sessionStorage.setItem("jarvis_boot_complete", "true");
    }, 2000);

    const removeTimer = window.setTimeout(() => setVisible(false), 2450);

    return () => {
      window.clearInterval(typeTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-black transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center">
        <div className="text-5xl font-extrabold tracking-[0.22em] text-jarvis-accent drop-shadow-[0_0_18px_rgba(0,212,255,0.65)] sm:text-7xl">
          {typed}
          <span className="ml-1 inline-block h-10 w-[3px] translate-y-1 bg-jarvis-accent shadow-glow sm:h-14" />
        </div>
        <div className={`mt-5 text-sm font-medium uppercase tracking-[0.32em] text-zinc-400 transition-opacity duration-700 ${typed === WORD ? "opacity-100" : "opacity-0"}`}>
          Personal AI Assistant
        </div>
      </div>
    </div>
  );
}
