import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { PilotApplicationForm } from "./PilotApplicationForm";

/**
 * /apply: the founding-network application form. Standalone surface (not under (auth)
 * or (app)) because applicants are cold visitors arriving from the
 * landing page CTA. Uses the same cream + wave shell as the landing
 * so the conversion arc reads as one continuous brand.
 */

export const metadata = {
  title: "Join the founding network · INFITRA",
  description:
    "Join INFITRA’s founding network: experts, studios and gyms open to creating one live experience together, online.",
};

export default function ApplyPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        {/* Slim brand bar, no full nav: this is a focused conversion page.
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
                  The founding network is forming
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
                The founding network is forming: experts, studios and gyms open to
                creating one live experience together, online. Nothing here is binding.
                Your profile says what you bring and who you would want next to you, and
                when a profile fits yours, Yves introduces you personally. Join as an
                expert, or as a studio or gym.
              </p>
            </div>

            {/* The punchy reassurance that leads into the deal. */}
            <p
              className="text-[17px] md:text-lg font-headline mb-7"
              style={{ color: "#0F2229", fontWeight: 700 }}
            >
              You keep 90%, and nothing is binding.
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
              </Link>{" "}
              and the{" "}
              <Link href="/privacy" className="underline hover:text-[#0891b2]">
                Privacy Policy
              </Link>
              . We reply within a week.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * The founding-network deal in five lines, led by the money and the no-lock-in, the
 * transparency the founder wanted, right where an applicant decides, with the
 * full terms one tap away.
 */
const DEAL: string[] = [
  "You keep 90% of every sale, split as you agree. INFITRA’s founding fee is the remaining 10%.",
  "Joining costs a profile, and nothing else. No upfront cost, no subscription, nothing binding.",
  "When a profile fits yours, we introduce you personally. Nothing happens publicly about you without your word.",
  "The founding member badge stays on your profile at public launch, and founding profiles hold the top spot in discovery.",
  "No lock-in. Your audience and your clients stay entirely yours, and you can leave any time.",
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
        The founding network, in short
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
