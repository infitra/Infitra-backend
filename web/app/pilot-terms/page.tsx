import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";

/**
 * /pilot-terms — plain-language terms for the pilot. Linked from the
 * landing footer and from the apply form. Not a legal contract — the
 * formal collaboration agreement is the locked contract document each
 * pair signs in their workspace before publishing. This page sets
 * expectations honestly so applicants know what they're signing up for.
 */

export const metadata = {
  title: "Pilot terms · INFITRA",
  description:
    "The INFITRA pilot for founding experts, in plain language: what it is, what you do, what you get, and how the money works.",
};

export default function PilotTermsPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        {/* Slim brand bar */}
        <div className="px-6 pt-6 pb-2">
          <div className="max-w-3xl mx-auto">
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
          </div>
        </div>

        <main className="px-6 py-10 md:py-14">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-10 md:mb-12">
              <p
                className="text-[11px] uppercase tracking-[0.22em] font-headline mb-4"
                style={{ color: "#0891b2", fontWeight: 700 }}
              >
                Pilot terms
              </p>
              <h1
                className="text-3xl md:text-4xl font-headline tracking-tight leading-[1.1]"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                The pilot, in plain language.
              </h1>
              <p
                className="mt-5 text-base md:text-lg leading-relaxed"
                style={{ color: "#475569" }}
              >
                This is the whole deal for founding pilot experts. The formal split
                contract is the document you and your partner sign inside your workspace
                before publishing; this page sets the expectations.
              </p>
            </div>

            {/* Body — five tight blocks. Everything an applicant needs, nothing more. */}
            <div className="space-y-10">
              <Section title="What it is">
                <p>
                  Five founding pairs, each running one live experience: typically four
                  to six weeks, co-hosted. It&apos;s a closed pilot, so your participants
                  come from your own audience, not from INFITRA.
                </p>
              </Section>

              <Section title="What you do">
                <p>
                  Design and publish one experience, host every live session, show up in
                  the tribe space, and answer questions. Promote it to your audience. And
                  tell us what&apos;s working and what isn&apos;t after each session.
                </p>
              </Section>

              <Section title="What you get">
                <p>
                  The whole platform: the co-design workspace, a signed split contract,
                  a public sales page with checkout, live rooms, the tribe space, and
                  pre and post-session pulses. Direct, founder-level support the whole
                  way. And a real hand in shaping what INFITRA becomes.
                </p>
                <p>
                  And when INFITRA goes public, you&apos;re in pole position: you get a
                  founding expert badge, you keep your reviews, and your experiences are
                  ready and tested.
                </p>
              </Section>

              <Section title="The money">
                <p>
                  Participants pay on your sales page through Stripe, and the buyer
                  covers Stripe&apos;s processing fee (3% + CHF 0.30).{" "}
                  <strong style={{ color: "#0F2229" }}>You and your partner keep 90% of
                  every sale</strong>, split by the percentages in your signed agreement.
                </p>
                <p>
                  INFITRA&apos;s founding platform fee is the remaining 10%, locked in for
                  pilot experts. Every sale shows in your earnings dashboard in real time,
                  and we pay out manually within 14 days of your experience ending. All
                  pricing is in Swiss francs for the pilot.
                </p>
              </Section>

              <Section title="After the pilot">
                <p>
                  No lock-in. You get first access to whatever comes next, and you can
                  keep your experiences running, archive them, or take your audience
                  elsewhere. We never hold expert audiences hostage.
                </p>
              </Section>
            </div>

            {/* The fine print — confidentiality + contact, one compact note. */}
            <p className="mt-10 text-sm leading-relaxed" style={{ color: "#64748b" }}>
              Your drafts, earnings, and private conversations stay between you and your
              partner; we only ever share anonymous, aggregate learnings about the
              pilot. Questions? You&apos;ll have our direct number and easy founder access
              and support.
            </p>

            {/* Footer */}
            <div
              className="mt-16 pt-8 flex flex-col md:flex-row gap-4 items-center justify-between"
              style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }}
            >
              <Link
                href="/"
                className="text-sm font-headline"
                style={{ color: "#475569", fontWeight: 600 }}
              >
                ← Back to landing
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center px-6 py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: "#FF6130",
                  fontWeight: 700,
                  boxShadow:
                    "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
                }}
              >
                Apply for the pilot
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-xl md:text-2xl font-headline tracking-tight mb-4"
        style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.015em" }}
      >
        {title}
      </h2>
      <div
        className="space-y-3 text-base leading-relaxed"
        style={{ color: "#334155" }}
      >
        {children}
      </div>
    </section>
  );
}
