"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthLoadingScreen, useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: isCheckingAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password || isSigningIn) return;

    setError("");
    setIsSigningIn(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError(signInError.message || "Unable to sign in.");
      setIsSigningIn(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (isCheckingAuth || user) {
    return <AuthLoadingScreen />;
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-black px-4 py-8">
      <section className="w-full max-w-md rounded-xl border border-jarvis-border bg-jarvis-surface p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-[#00BCD4] bg-[linear-gradient(135deg,_#00BCD4,_#006064)] text-white shadow-[0_0_24px_rgba(0,188,212,0.35)]">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-[0.18em] text-[#00BCD4]">
            JARVIS
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Private access</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
              Email
            </span>
            <div className="flex items-center rounded-lg border border-jarvis-border bg-black/70 transition-[box-shadow,border-color] duration-200 focus-within:border-[#00BCD4] focus-within:shadow-[0_0_0_2px_rgba(0,188,212,0.3)]">
              <Mail className="ml-3.5 h-5 w-5 shrink-0 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-700"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
              Password
            </span>
            <div className="flex items-center rounded-lg border border-jarvis-border bg-black/70 transition-[box-shadow,border-color] duration-200 focus-within:border-[#00BCD4] focus-within:shadow-[0_0_0_2px_rgba(0,188,212,0.3)]">
              <LockKeyhole className="ml-3.5 h-5 w-5 shrink-0 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-700"
                placeholder="Enter your password"
              />
            </div>
          </label>

          {error ? (
            <div
              className="rounded-lg border border-jarvis-error/35 bg-jarvis-error/10 px-4 py-3 text-sm text-jarvis-error"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!email.trim() || !password || isSigningIn}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#00BCD4] px-4 text-sm font-extrabold text-black shadow-[0_0_22px_rgba(0,188,212,0.24)] transition-all duration-200 hover:bg-[#31D7E8] hover:shadow-[0_0_28px_rgba(0,188,212,0.4)] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
          >
            {isSigningIn ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
            {isSigningIn ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
