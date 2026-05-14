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
  title: "Pilot terms — INFITRA",
  description:
    "What we ask of pilot creators, what we offer, and how the money flows during the INFITRA pilot.",
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
                What we ask, what we offer, and how the money flows.
              </h1>
              <p
                className="mt-5 text-base md:text-lg leading-relaxed"
                style={{ color: "#475569" }}
              >
                Plain language, no boilerplate. The formal collaboration agreement
                is the contract document you and your partner sign inside the
                workspace before publishing — this page sets expectations.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-10">
              <Section title="What the pilot is">
                <p>
                  We&apos;re running INFITRA with five creator pairs to learn how joint
                  live programs actually work in practice. You and your partner design
                  one challenge — typically four to six weeks, with two live sessions
                  a week — co-host it, and we manage the platform and the money.
                </p>
                <p>
                  This is a closed pilot. We&apos;re not opening to the public, and we&apos;re
                  not advertising your program through INFITRA — your participants
                  come from your audiences.
                </p>
              </Section>

              <Section title="What we ask of you">
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    Run one full program end to end with us — design, publish, host
                    every live session, post in the cohort space, answer questions.
                  </li>
                  <li>
                    Talk to us regularly. Honest feedback after each session is the
                    point of the pilot — what worked, what was clunky, what you wish
                    existed.
                  </li>
                  <li>
                    Show up live. The whole pitch is that the live moment is the
                    program — recorded replays are not part of the pilot.
                  </li>
                  <li>
                    Promote the program to your own audience. We don&apos;t do paid
                    acquisition for you during the pilot.
                  </li>
                </ul>
              </Section>

              <Section title="What we offer">
                <ul className="space-y-2 list-disc pl-5">
                  <li>
                    A working platform: workspace co-design, signed split contracts,
                    a public sales page, payment processing, live video, the cohort
                    space, and pre/post-session pulses.
                  </li>
                  <li>
                    Direct, founder-level support throughout. If something breaks,
                    you have our number.
                  </li>
                  <li>
                    A meaningful share of any platform improvements that come out of
                    your feedback — early creators shape the product.
                  </li>
                </ul>
              </Section>

              <Section title="Money flow">
                <p>
                  Participants pay through the public sales page via Stripe. The
                  buyer absorbs Stripe processing fees (3% + CHF 0.30 per
                  transaction).
                </p>
                <p>
                  After the Stripe processing fee, INFITRA takes a fixed{" "}
                  <strong>20% platform fee</strong>. You and your partner split the
                  remaining 80% according to the percentages you agree in your signed
                  collaboration contract.
                </p>
                <p>
                  During the pilot, payouts are processed manually by us at the end
                  of each program (not automatically per transaction). You&apos;ll see
                  every transaction in your earnings dashboard in real time, and
                  receive your share within fourteen days of the program ending.
                </p>
              </Section>

              <Section title="Currency">
                <p>
                  All pricing during the pilot is in Swiss francs (CHF). Multi-currency
                  support comes after the pilot.
                </p>
              </Section>

              <Section title="Confidentiality">
                <p>
                  Anything you see in the workspace, the dashboard, or the
                  collaboration chat is yours and your partner&apos;s. We don&apos;t share
                  unpublished program drafts, financial details, or private
                  conversations with anyone outside the pilot.
                </p>
                <p>
                  We may discuss anonymous, aggregate learnings (e.g. &quot;creators
                  found the workspace easy to use&quot;) when talking publicly about
                  the pilot. We&apos;ll never share specifics that identify you, your
                  partner, or your participants without explicit permission.
                </p>
              </Section>

              <Section title="What happens after the pilot">
                <p>
                  When the pilot wraps, you&apos;ll have first access to whatever
                  INFITRA becomes next — including any pricing or platform-share
                  changes. You can keep your existing programs running on the
                  platform, archive them, or take your audience elsewhere. We don&apos;t
                  hold creator audiences hostage.
                </p>
              </Section>

              <Section title="Founder contact">
                <p>
                  Yves Imhasly — founder. You&apos;ll have direct contact via the
                  workspace chat for your program; for anything else, the email you
                  applied with is how we&apos;ll reach you.
                </p>
              </Section>
            </div>

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
