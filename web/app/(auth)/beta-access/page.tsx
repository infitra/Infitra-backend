"use client";

import { useActionState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { submitBetaCode } from "@/app/actions/beta";

/**
 * Beta-access gate. Cream + wave theme — relies on the parent (auth)
 * layout for the brand wordmark and the wave background. Form sits in
 * a soft white card just like the login surface, so the two screens
 * read as one continuous brand.
 */
function BetaForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/login";
  const [state, action, pending] = useActionState(submitBetaCode, null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="rounded-3xl p-8 md:p-10"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 16px 48px rgba(15,34,41,0.06)",
      }}
    >
      <div className="mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
          style={{
            backgroundColor: "rgba(8,145,178,0.10)",
            border: "1px solid rgba(8,145,178,0.25)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
          <span
            className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline"
            style={{ fontWeight: 700 }}
          >
            Private Beta
          </span>
        </div>
        <h1
          className="text-2xl font-headline tracking-tight"
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Access required.
        </h1>
        <p className="text-sm mt-2" style={{ color: "#64748b" }}>
          Enter your access code to continue.
        </p>
      </div>

      {state?.error && (
        <div
          className="mb-4 p-3 rounded-xl"
          style={{
            backgroundColor: "rgba(255,97,48,0.10)",
            border: "1px solid rgba(255,97,48,0.30)",
          }}
        >
          <p className="text-sm" style={{ color: "#FF6130" }}>
            {state.error}
          </p>
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
          className="w-full px-4 py-3 rounded-xl text-sm font-mono tracking-widest focus:outline-none transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(15,34,41,0.15)",
            color: "#0F2229",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            backgroundColor: "#FF6130",
            fontWeight: 700,
            boxShadow:
              "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          {pending ? "..." : "Continue"}
        </button>
      </form>
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
