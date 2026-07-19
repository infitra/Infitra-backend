"use client";

import { useActionState } from "react";
import { submitWaitlist } from "@/app/actions/waitlist";
import { CYAN, FAINT, MUTED } from "./ui";

/**
 * One-field participant waitlist form (the finale's quiet door).
 * Success replaces the form — the decision is made, no residue.
 */
export function WaitlistForm() {
  const [state, action, pending] = useActionState(submitWaitlist, null);

  if (state && "success" in state && state.success) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: "rgba(8,145,178,0.08)", boxShadow: "0 0 0 1.5px rgba(8,145,178,0.30)" }}
      >
        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: CYAN }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p className="text-[15px] font-headline text-left" style={{ color: "#0F2229", fontWeight: 700 }}>
          You&apos;re on the list — see you in the room.
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <div className="flex flex-col gap-3">
        {/* Honeypot — hidden from real users, tempting to bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          className="w-full rounded-full px-6 py-4 text-base outline-none"
          style={{ backgroundColor: "#FFFFFF", color: "#0F2229", boxShadow: "0 0 0 1.5px rgba(8,145,178,0.30)" }}
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full px-7 py-4 rounded-full text-white text-base font-headline transition-transform hover:scale-[1.02] disabled:opacity-60 whitespace-nowrap"
          style={{ backgroundColor: CYAN, fontWeight: 800, boxShadow: "0 6px 20px rgba(8,145,178,0.30)" }}
        >
          {pending ? "Joining…" : "Join the waitlist"}
        </button>
      </div>
      {state && "error" in state && state.error && (
        <p className="text-[13px] mt-2.5 text-left" style={{ color: "#dc2626" }}>{state.error}</p>
      )}
      <p className="text-xs mt-3 text-left" style={{ color: FAINT }}>
        One email when the doors open. <span style={{ color: MUTED }}>Nothing else.</span>
      </p>
    </form>
  );
}
