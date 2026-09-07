"use client";

import { useActionState } from "react";
import { attestSigningIdentity } from "@/app/actions/profile";

/**
 * The one binding step, shown once, on the first workspace visit (6 Sep 2026).
 * It used to sit inside creator onboarding; moving it here means joining the
 * founding network asks for nothing legal, and the workspace asks for it
 * exactly when a contract could exist.
 */
export function WorkspaceEntryForm() {
  const [state, action, pending] = useActionState(attestSigningIdentity, null);

  return (
    <div className="max-w-lg mx-auto py-10">
      <p
        className="text-[10px] uppercase tracking-widest font-bold font-headline mb-3"
        style={{ color: "#0891b2" }}
      >
        Your workspace is open
      </p>
      <h1
        className="text-3xl font-black font-headline tracking-tight mb-3"
        style={{ color: "#0F2229" }}
      >
        One thing before you build.
      </h1>
      <p className="text-sm mb-8" style={{ color: "#64748b" }}>
        Collaboration agreements on INFITRA are recorded in writing before anything sells.
        The name below appears on them. Asked once, never again.
      </p>

      {state?.error && (
        <div
          className="mb-5 p-4 rounded-2xl"
          style={{ backgroundColor: "rgba(255,97,48,0.08)", border: "1px solid rgba(255,97,48,0.25)" }}
        >
          <p className="text-sm" style={{ color: "#FF6130" }}>
            {state.error}
          </p>
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="legal_name"
            className="block text-xs font-bold uppercase tracking-wider mb-2 font-headline"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Legal name
          </label>
          <input
            id="legal_name"
            name="legal_name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            placeholder="Your full legal name"
            className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors text-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.78)",
              border: "1px solid rgba(15, 34, 41, 0.15)",
              color: "#0F2229",
            }}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "#94a3b8" }}>
            Appears on collaboration agreements.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            name="attested"
            required
            className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[#FF6130]"
          />
          <span className="text-xs leading-relaxed" style={{ color: "#0F2229" }}>
            I confirm this is my legal name and I can sign collaboration agreements under it.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full mt-4 py-3.5 rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline disabled:opacity-50 disabled:hover:scale-100 text-white"
          style={{
            backgroundColor: "#FF6130",
            boxShadow: "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          {pending ? "..." : "Open the workspace"}
        </button>
      </form>
    </div>
  );
}
