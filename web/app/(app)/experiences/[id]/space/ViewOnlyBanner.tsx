"use client";

/**
 * Threshold surfaces that read the shared space's `joinable_runs`:
 *
 *   ReactivateCard — shown to an ENDED viewer, centered over the strongly-frosted,
 *     inert live room (see ExperienceSpaceShell's `viewerState === "ended"`
 *     branch). Their run wrapped and the tribe moved on; the card makes that
 *     unmistakable ("your run has ended · it keeps going without you unless you
 *     jump back in") and lists the joinable run(s) — the current/next one to
 *     Join, any later one to Enroll — each with its dates + price.
 *
 *   ContinueStrip — a subtle nudge for an ACTIVE member with a future run already
 *     published: enroll now so they continue after this run ends.
 *
 * Both reuse PurchaseButton (→ create_checkout_session).
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";
import { Avatar } from "./Avatar";
import type { JoinableRun, ExperienceSummary, SpaceCreator } from "@/lib/experienceSpace/store";

const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function fmtRange(startIso: string, endIso: string): string {
  const s = new Date(`${startIso}T00:00:00`);
  const e = new Date(`${endIso}T00:00:00`);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sTxt = s.toLocaleDateString("en-GB", sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  const eTxt = e.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${sTxt} – ${eTxt}`;
}

function fmtPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

const PRIMARY_PILL =
  "w-full py-2.5 rounded-full text-white text-[13px] font-black font-headline bg-[#FF6130] shadow-[0_4px_14px_rgba(255,97,48,0.30)] hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100";
const SECONDARY_PILL =
  "w-full py-2.5 rounded-full text-[13px] font-black font-headline bg-white text-[#0891b2] shadow-[0_0_0_1.5px_rgba(8,145,178,0.35)] hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100";

/** One joinable run inside the re-activate card. The first (most current) run is
 *  the primary orange "Join"; any later run is a secondary cyan "Enroll". */
function RunRow({ run, primary }: { run: JoinableRun; primary: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
      style={{
        backgroundColor: primary ? "rgba(255,97,48,0.05)" : "#F7FAFB",
        boxShadow: primary ? "0 0 0 1px rgba(255,97,48,0.22)" : "0 0 0 1px rgba(15,34,41,0.07)",
      }}
    >
      <div className="min-w-0">
        <p
          className="text-[10px] uppercase tracking-[0.14em] font-headline flex items-center gap-1.5"
          style={{ color: run.isActive ? "#ef4444" : CYAN, fontWeight: 800 }}
          suppressHydrationWarning
        >
          {run.isActive && <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ef4444" }} />}
          {run.isActive ? "Live now" : `Starts ${fmtDate(run.startDate)}`}
        </p>
        <p className="text-[12px] font-bold font-headline mt-0.5" style={{ color: "#5b7886" }} suppressHydrationWarning>
          {fmtRange(run.startDate, run.endDate)} · {fmtPrice(run.priceCents, run.currency)}
        </p>
      </div>
      <div className="w-[104px] shrink-0">
        <PurchaseButton kind="challenge" targetId={run.id} className={primary ? PRIMARY_PILL : SECONDARY_PILL}>
          {run.isActive ? "Join now" : primary ? "Join" : "Enroll"}
        </PurchaseButton>
      </div>
    </div>
  );
}

export function ReactivateCard({
  experience,
  joinableRuns,
  creators,
  sessionCount,
}: {
  experience: ExperienceSummary;
  joinableRuns: JoinableRun[];
  creators: SpaceCreator[];
  sessionCount: number;
}) {
  const hasRuns = joinableRuns.length > 0;
  const primary = joinableRuns[0] ?? null;
  const blurb = experience.promiseText?.trim() || experience.description?.trim() || "";
  const weeks = experience.weeklyArc?.length ?? 0;
  return (
    <div
      className="pointer-events-auto w-full max-w-lg rounded-3xl px-7 py-8 sm:px-9 sm:py-9"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.08), 0 26px 64px rgba(15,34,41,0.24)" }}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(15,34,41,0.06)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="11" width="17" height="10" rx="2" />
            <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
          </svg>
        </div>
        <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: "#64748b", fontWeight: 800 }}>
          Your run has ended
        </p>
      </div>

      <h2 className="text-2xl sm:text-3xl font-headline tracking-tight mt-4" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {experience.title}
      </h2>
      <p className="text-[15px] font-medium mt-2.5 leading-relaxed" style={{ color: "#5b7886" }}>
        {hasRuns
          ? "Infitra experiences are alive and all about momentum. This tribe moved on to its next run — jump back in and continue your journey!"
          : "This experience has wrapped. Thanks for showing up — watch this space for the next run."}
      </p>

      {creators.length > 0 && (
        <div className="mt-5 flex items-center gap-x-3 gap-y-1.5 flex-wrap">
          {creators.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <Avatar src={c.avatar} name={c.name} size={24} ring={c.role === "owner" ? ORANGE : CYAN} />
              <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>{c.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* What you're joining — what continues (the promise) + what's in the run. */}
      {hasRuns && (blurb || sessionCount > 0) && (
        <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#F7FAFB", boxShadow: "inset 0 0 0 1px rgba(15,34,41,0.06)" }}>
          <p className="text-[10px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
            What you&apos;re joining
          </p>
          {blurb && (
            <p className="text-[13px] font-medium mt-1.5 leading-relaxed" style={{ color: INK }}>
              {blurb}
            </p>
          )}
          {sessionCount > 0 && (
            <p className="text-[12px] font-bold font-headline mt-2 flex items-center gap-1.5" style={{ color: "#5b7886" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CYAN }} />
              {sessionCount} live session{sessionCount === 1 ? "" : "s"}
              {weeks > 0 && ` · ${weeks} week${weeks === 1 ? "" : "s"}`}
              {" · led live by your experts"}
            </p>
          )}
        </div>
      )}

      {hasRuns && (
        <div className="mt-5 space-y-2.5">
          {joinableRuns.map((r, i) => (
            <RunRow key={r.id} run={r} primary={i === 0} />
          ))}
        </div>
      )}

      {/* Calm secondary — full details on the experience's own page. */}
      {primary && (
        <div className="mt-4 text-center">
          <Link
            href={`/experiences/${primary.id}`}
            className="text-[12px] font-bold font-headline transition-colors hover:text-[#0F2229]"
            style={{ color: "#94a3b8" }}
          >
            See full details →
          </Link>
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
