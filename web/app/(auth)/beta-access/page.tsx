"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { submitBetaCode } from "@/app/actions/beta";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

function BetaForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/login";
  const [state, action, pending] = useActionState(submitBetaCode, null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col items-center justify-center px-6 relative">
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#9CF0FF]/4 blur-[150px]" />
      </div>

      <Link href="/" className="relative z-10 mb-12">
        <div className="flex items-center gap-3">
          <div className="rounded-xl overflow-hidden">
            <Image src="/logo-mark.png" alt="INFITRA" width={40} height={40} className="block" />
          </div>
          <span className="text-2xl font-black text-[#FF6130] tracking-tighter font-headline italic">
            INFITRA
          </span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-[#0F2229] rounded-2xl border border-[#9CF0FF]/10 p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
              <span className="text-[#9CF0FF] text-xs font-bold tracking-widest uppercase font-headline">
                Private Beta
              </span>
            </div>
            <h1 className="text-2xl font-black text-white font-headline tracking-tight">
              Access required.
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 mt-2">
              Enter your access code to continue.
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
              <p className="text-sm text-[#FF6130]">{state.error}</p>
            </div>
          )}

          <form action={action} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <input
              ref={inputRef}
              id="code"
              name="code"
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="Access code"
              className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/20 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm font-mono tracking-widest"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 bg-[#FF6130] text-white rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline shadow-[0_0_20px_rgba(255,97,48,0.25)] disabled:opacity-50 disabled:hover:scale-100"
            >
              {pending ? "..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BetaAccessPage() {
  return (
    <Suspense>
      <BetaForm />
    </Suspense>
  );
}
