import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { PilotApplicationForm } from "./PilotApplicationForm";

/**
 * /apply — pilot application form. Standalone surface (not under (auth)
 * or (app)) because applicants are cold visitors arriving from the
 * landing page CTA. Uses the same cream + wave shell as the landing
 * so the conversion arc reads as one continuous brand.
 */

export const metadata = {
  title: "Apply for the pilot · INFITRA",
  description:
    "Apply to be one of the first five expert pairs running a joint live experience on INFITRA.",
};

export default function ApplyPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        {/* Slim brand bar — no full nav, this is a focused conversion page.
           The logo links home; an explicit "back" gives a clear escape hatch
           without scrolling past the whole form (mirrors /pilot-terms). */}
        <div className="px-6 pt-6 pb-2">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img
                src="/logo-mark.png"
                alt="INFITRA"
                width={28}
                height={28}
                className="block rounded-lg"
              />
              <span
                className="text-lg tracking-tight font-headline leading-none"
                style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                INFITRA
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm font-headline transition-opacity hover:opacity-70 whitespace-nowrap"
              style={{ color: "#475569", fontWeight: 600 }}
            >
              <span className="sm:hidden">← Back</span>
              <span className="hidden sm:inline">← Back to landing</span>
            </Link>
          </div>
        </div>

        <main className="px-6 py-10 md:py-14">
          <div className="max-w-2xl mx-auto">
            {/* ── Header ─────────────────────────────────────── */}
            <div className="mb-8 md:mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
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
                  Pilot · first 5 pairs
                </span>
              </div>
              <h1
                className="text-3xl md:text-4xl font-headline tracking-tight leading-[1.1]"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Tell us about you
                <br />
                <span style={{ color: "#FF6130" }}>and your work.</span>
              </h1>
              <p
                className="mt-5 text-base md:text-lg leading-relaxed"
                style={{ color: "#475569" }}
              >
                We&apos;re looking for five expert pairs to run a pilot. Apply solo or with
                a partner: if your expertise could complement another expert&apos;s and you
                are open to collaborate, we want to hear from you. No partner yet? We&apos;ll
                help you find your match!
              </p>
            </div>

            {/* The punchy reassurance that leads into the deal. */}
            <p
              className="text-[17px] md:text-lg font-headline mb-7"
              style={{ color: "#0F2229", fontWeight: 700 }}
            >
              No upfront costs, no subscriptions.
            </p>

            {/* ── The deal, in short ─────────────────────────── */}
            {/* The pilot terms, visible without leaving: the money and the
               no-lock-in up top (the transparency win), full terms one tap away. */}
            <PilotSummary />

            {/* ── Form (client) ──────────────────────────────── */}
            <PilotApplicationForm />

            {/* ── Footer note ────────────────────────────────── */}
            <p
              className="mt-8 text-xs leading-relaxed text-center"
              style={{ color: "#94a3b8" }}
            >
              By applying you agree to the{" "}
              <Link href="/pilot-terms" className="underline hover:text-[#0891b2]">
                pilot terms
              </Link>
              . We&apos;ll respond within a week.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * The pilot deal in five lines, led by the money and the no-lock-in — the
 * transparency the founder wanted, right where an applicant decides, with the
 * full terms one tap away.
 */
const DEAL: string[] = [
  "You and your partner keep 90% of revenue, split as you agree. INFITRA’s founding platform fee is 10%.",
  "Five founding pairs, one 4 to 6 week live experience, co-hosted.",
  "You host live and bring your audience. We run the platform, priced in CHF.",
  "No lock-in. Keep your experiences, archive them, or leave anytime after the pilot.",
  "Early positioning: you keep your pilot reviews and early access. Once we go live, you’re in pole position.",
  "No partner yet? We’ll help you pair up.",
];

function PilotSummary() {
  return (
    <div
      className="rounded-3xl p-6 md:p-7 mb-8"
      style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.22)" }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.22em] font-headline mb-4"
        style={{ color: "#0891b2", fontWeight: 800 }}
      >
        The pilot, in short
      </p>
      <ul className="space-y-2.5">
        {DEAL.map((line) => (
          <li key={line} className="flex gap-3">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0891b2"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[14.5px] leading-snug" style={{ color: "#334155" }}>
              {line}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/pilot-terms"
        className="inline-block mt-5 text-sm font-headline hover:opacity-70"
        style={{ color: "#0891b2", fontWeight: 700 }}
      >
        Read the full pilot terms →
      </Link>
    </div>
  );
}
