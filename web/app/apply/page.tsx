import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { PilotApplicationForm } from "./PilotApplicationForm";

/**
 * /apply: the founding-network application. Standalone surface (not under
 * (auth) or (app)) because applicants are cold visitors arriving from the
 * landing CTA. Same cream + wave shell as the landing so the conversion arc
 * reads as one continuous brand.
 *
 * CUT TO ONE SCREEN (17 Sep 2026). The page had drifted into something
 * between a contact form and onboarding: a status pill, a six-line
 * paragraph, a 90% line and a five-item deal card, about 200 words of pitch
 * before the first input, all of it read once already on the landing page
 * the applicant just left.
 *
 * The page is not the profile. Accounts-lite keeps those apart: an
 * invitation mints a card and the profile gets built at /network. So this
 * form only has to carry enough for the founder to judge fit and write a
 * personal reply. Everything else is asked in that reply, which converts
 * better than a textarea does.
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
            {/* ── Header: the ask, in two lines ──────────────── */}
            <div className="mb-6">
              <h1
                className="text-3xl md:text-4xl font-headline tracking-tight leading-[1.1]"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Join the{" "}
                <span style={{ color: "#FF6130" }}>founding network.</span>
              </h1>
              <p
                className="mt-4 text-base md:text-lg leading-relaxed"
                style={{ color: "#475569" }}
              >
                Tell me what you do and who you would want next to you. I read
                every one and reply personally.
              </p>
            </div>

            {/* ── The deal, in one line ──────────────────────── */}
            {/* The five-item card became this: the money and the no-lock-in
               still stand where the decision is made, the full terms one tap
               away, at a quarter of the height. */}
            <Terms />

            {/* ── Form (client) ──────────────────────────────── */}
            <PilotApplicationForm />

            <p
              className="mt-7 text-xs leading-relaxed text-center"
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
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * The deal on one line, money first, between two hairlines so it carries
 * weight without becoming a card again.
 */
const FACTS = ["Keep 90% of every sale", "No upfront cost", "Nothing binding"];

function Terms() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3.5 mb-7"
      style={{
        borderTop: "1px solid rgba(8,145,178,0.20)",
        borderBottom: "1px solid rgba(8,145,178,0.20)",
      }}
    >
      {/* Each fact carries its own trailing middot and never breaks inside,
         so a wrap at phone width starts a line with a word rather than a
         separator floating on its own. */}
      {FACTS.map((fact, i) => (
        <span
          key={fact}
          className="text-[13.5px] font-headline whitespace-nowrap"
          style={{ color: "#0F2229", fontWeight: 600 }}
        >
          {fact}
          {i < FACTS.length - 1 && <span className="ml-2" style={{ color: "#94a3b8" }}>·</span>}
        </span>
      ))}
      <Link
        href="/pilot-terms"
        className="text-[13.5px] font-headline hover:opacity-70 whitespace-nowrap w-full sm:w-auto sm:ml-auto mt-1 sm:mt-0"
        style={{ color: "#0891b2", fontWeight: 700 }}
      >
        Read the full pilot terms →
      </Link>
    </div>
  );
}
