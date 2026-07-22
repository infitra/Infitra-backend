"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/app/actions/auth";

/**
 * Founding expert signup — reached only through a validated invite link.
 * Posts to the shared signUp action with role=creator and the invite code;
 * the DB trigger redeems the code atomically at account creation.
 */
export function JoinAsExpertForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(signUp, null);

  const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors";
  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(15,34,41,0.15)",
    color: "#0F2229",
  };
  const labelClass =
    "block text-[10px] font-bold uppercase tracking-wider mb-2 font-headline";
  const labelStyle: React.CSSProperties = { color: "rgba(15,34,41,0.55)" };

  return (
    <div
      className="rounded-3xl p-8 md:p-10"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 16px 48px rgba(15,34,41,0.06)",
      }}
    >
      <div
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
        style={{
          backgroundColor: "rgba(255,97,48,0.10)",
          border: "1px solid rgba(255,97,48,0.30)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6130] animate-pulse" />
        <span
          className="text-[#FF6130] text-[10px] tracking-widest uppercase font-headline"
          style={{ fontWeight: 700 }}
        >
          Founding pilot · Your invitation
        </span>
      </div>

      <h1
        className="text-2xl font-headline tracking-tight mb-2"
        style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        Welcome, founding expert.
      </h1>
      <p className="text-sm mb-8" style={{ color: "#64748b" }}>
        Set up your expert account. This invite is personal and single use.
      </p>

      {state?.error && (
        <div
          className="mb-6 p-3 rounded-xl"
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
        <input type="hidden" name="role" value="creator" />
        <input type="hidden" name="creator_invite_code" value={code} />

        <div>
          <label htmlFor="expert_display_name" className={labelClass} style={labelStyle}>
            Display Name
          </label>
          <input
            id="expert_display_name"
            name="display_name"
            type="text"
            required
            minLength={2}
            maxLength={50}
            placeholder="Your name or studio name"
            className={inputClass}
            style={inputStyle}
          />
          <p className="mt-1.5 text-xs" style={{ color: "#94a3b8" }}>
            Shown publicly on your experiences.
          </p>
        </div>
        <div>
          <label htmlFor="expert_email" className={labelClass} style={labelStyle}>
            Email
          </label>
          <input
            id="expert_email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="expert_password" className={labelClass} style={labelStyle}>
            Password
          </label>
          <input
            id="expert_password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            minLength={8}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full mt-2 py-3.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            backgroundColor: "#FF6130",
            fontWeight: 700,
            boxShadow:
              "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          {pending ? "..." : "Create your expert account"}
        </button>

        <p className="text-[11px] text-center pt-1" style={{ color: "#94a3b8" }}>
          By continuing you agree to the{" "}
          <Link href="/pilot-terms" className="underline hover:text-[#0891b2]">
            pilot terms
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
