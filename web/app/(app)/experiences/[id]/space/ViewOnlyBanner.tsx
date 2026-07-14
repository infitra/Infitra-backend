"use client";

/**
 * Threshold surfaces that read the shared space's `joinable_runs`:
 *   ViewOnlyBanner — the ENDED read-along banner. The lineage moved on; the
 *     viewer sees the live run whitened below and here can Join the current run
 *     or Enroll in the next.
 *   ContinueStrip — a subtle nudge for an ACTIVE member: enroll in the next
 *     chapter so they continue after this run ends.
 * Both reuse PurchaseButton (→ create_checkout_session).
 */

import { PurchaseButton } from "@/app/components/PurchaseButton";
import type { JoinableRun } from "@/lib/experienceSpace/store";

const INK = "#0F2229";
const CYAN = "#0891b2";

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function RunRow({ run }: { run: JoinableRun }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}
    >
      <div className="min-w-0">
        <p
          className="text-[10px] uppercase tracking-[0.14em] font-headline"
          style={{ color: run.isActive ? "#ef4444" : CYAN, fontWeight: 800 }}
          suppressHydrationWarning
        >
          {run.isActive ? "Live now" : `Starts ${fmtDate(run.startDate)}`}
        </p>
        <p className="text-[13px] font-black font-headline truncate" style={{ color: INK }}>{run.title}</p>
      </div>
      <div className="w-[118px] shrink-0">
        <PurchaseButton kind="challenge" targetId={run.id}>
          {run.isActive ? "Join now" : "Enroll"}
        </PurchaseButton>
      </div>
    </div>
  );
}

export function ViewOnlyBanner({ joinableRuns }: { joinableRuns: JoinableRun[] }) {
  const hasRuns = joinableRuns.length > 0;
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        background: "linear-gradient(135deg, rgba(15,34,41,0.05), rgba(15,34,41,0.02))",
        boxShadow: "0 0 0 1px rgba(15,34,41,0.10), 0 6px 20px rgba(15,34,41,0.06)",
      }}
    >
      <div className="flex items-start gap-3.5">
        <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(15,34,41,0.07)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-black font-headline leading-snug" style={{ color: INK, letterSpacing: "-0.01em" }}>
            This experience has moved into its next chapter
          </p>
          <p className="text-[13px] font-bold font-headline mt-0.5" style={{ color: "#64748b" }}>
            {hasRuns ? "Join the live group, or enroll in the next." : "This experience has concluded."}
          </p>
        </div>
      </div>
      {hasRuns && (
        <div className="mt-3.5 space-y-2">
          {joinableRuns.map((r) => <RunRow key={r.id} run={r} />)}
        </div>
      )}
    </div>
  );
}

export function ContinueStrip({ run }: { run: JoinableRun }) {
  return (
    <div
      className="rounded-2xl px-5 py-3.5 sm:flex sm:items-center sm:justify-between sm:gap-5"
      style={{
        background: "linear-gradient(135deg, rgba(8,145,178,0.10), rgba(156,240,255,0.08))",
        boxShadow: "0 0 0 1px rgba(8,145,178,0.16), 0 6px 20px rgba(8,145,178,0.08)",
      }}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-black font-headline" style={{ color: INK }}>Continue into the next chapter</p>
        <p className="text-[12px] font-bold font-headline mt-0.5" style={{ color: "#5b7886" }} suppressHydrationWarning>
          {run.title} · starts {fmtDate(run.startDate)}
        </p>
      </div>
      <div className="mt-3 sm:mt-0 sm:w-[150px] shrink-0">
        <PurchaseButton kind="challenge" targetId={run.id}>Enroll</PurchaseButton>
      </div>
    </div>
  );
}
