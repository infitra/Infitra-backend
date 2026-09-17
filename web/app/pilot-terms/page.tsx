import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { LegalVersion } from "@/app/components/LegalPage";

/**
 * /pilot-terms — plain-language terms for the founding network. Linked
 * from the landing footer and from the apply form. Not a legal contract:
 * the formal collaboration agreement is the locked contract document the
 * collaborators sign in their workspace before publishing. This page sets
 * expectations honestly so applicants know what they are signing up for.
 *
 * REWRITTEN FOR THE NETWORK (17 Sep 2026). Every line assumed a pair of
 * experts ("you and your partner", "co-hosted"), which read as a closed
 * door to the studios and gyms the network now recruits. The terms
 * themselves did not change: the same 90%, the same founding fee, the same
 * no-lock-in. What changed is who the page admits and what the parties are
 * called, plus a section naming the shapes a collaboration can take.
 */

export const metadata = {
  title: "Pilot terms · INFITRA",
  description:
    "The INFITRA founding network in plain language, for experts, studios and gyms: what it is, who creates with whom, what you do, what you get, and how the money works.",
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
                The founding network, in plain language.
              </h1>
              <p
                className="mt-5 text-base md:text-lg leading-relaxed"
                style={{ color: "#475569" }}
              >
                The whole deal for everyone in the founding network: experts, studios
                and gyms. The formal split agreement is the document the collaborators
                sign inside the workspace before publishing; this page sets the
                expectations.
              </p>
            </div>

            {/* Body: six tight blocks. Everything an applicant needs, nothing more. */}
            <div className="space-y-10">
              <Section title="What it is">
                <p>
                  A founding network of experts, studios and gyms. Each collaboration
                  creates one live experience: typically four to six weeks, online.
                  Participants buy once, meet the experts live on video across the
                  weeks, and stay connected in a tribe space, the private group space
                  that runs alongside, in between. It is a closed founding round and
                  every application is reviewed individually.
                </p>
              </Section>

              <Section title="Who creates with whom">
                <p>
                  That part is yours. Two independent experts whose expertise completes
                  each other. A studio or gym bringing in an outside expert for its
                  members. Two studios creating one together. A third expert where the
                  experience needs one.
                </p>
                <p>
                  Nothing here limits the shape. Whoever is in the collaboration is
                  named in the agreement, and the split follows what you agree between
                  you.
                </p>
              </Section>

              <Section title="What you do">
                <p>
                  Design and publish one experience with the people you create with,
                  host every live session, show up in the tribe space, and answer
                  questions. And tell us what worked and what did not after each
                  session.
                </p>
                <p>
                  Who teaches which part is written into the agreement. A studio can
                  bring its members and its brand and leave the live hours to the
                  expert it brings in, or teach alongside them. Either way it is agreed
                  before anything sells.
                </p>
              </Section>

              <Section title="What you get">
                <p>
                  The whole platform: the co-design workspace, a recorded split
                  agreement, a public marketing page with checkout, live rooms, the
                  tribe space, and pre and post-session pulses. Direct support the
                  whole way. And a real hand in shaping what INFITRA becomes.
                </p>
                <p>
                  And when INFITRA opens publicly, you are in pole position: the
                  founding member badge stays on your profile, the reviews you earn now
                  carry over, and founding profiles hold the top spot in discovery.
                </p>
              </Section>

              <Section title="The money">
                <p>
                  Participants pay on your marketing page through Stripe, and the
                  buyer covers Stripe&apos;s processing fee (3% + CHF 0.30).{" "}
                  <strong style={{ color: "#0F2229" }}>You and the people you create
                  with keep 90% of every sale</strong>, split by the percentages in your
                  recorded agreement.
                </p>
                <p>
                  INFITRA&apos;s founding fee is the remaining 10%, locked in for the
                  duration of the pilot. Every sale shows in your earnings dashboard in real time,
                  and we pay out manually within 14 days of your experience ending. All
                  pricing is in Swiss francs for the pilot. Refunds issued under the published{" "}
                  <Link href="/refund-policy" className="underline hover:text-[#0891b2]">
                    refund policy
                  </Link>{" "}
                  reduce the experience&apos;s revenue before the split is calculated.
                </p>
                <p>
                  One thing to be clear about: the agreement is between the
                  collaborators. INFITRA gives you the process, records the result and
                  pays out exactly what it says, but we are not a party to it and we do
                  not arbitrate it. If you disagree about the split, we hold the
                  disputed amount until you have sorted it out. And your content and
                  guidance stay yours in every sense: you are responsible for them, and
                  you hold INFITRA harmless from claims that arise from them.
                </p>
              </Section>

              <Section title="After the pilot">
                <p>
                  No lock-in. You get first access to whatever comes next, and you can
                  keep your experiences running, archive them, or take your audience
                  elsewhere. We never hold audiences or members hostage.
                </p>
              </Section>
            </div>

            {/* The fine print — confidentiality + contact, one compact note. */}
            <p className="mt-10 text-sm leading-relaxed" style={{ color: "#64748b" }}>
              Your drafts, earnings and private conversations stay between you and the
              people you create with; we only ever share anonymous, aggregate learnings
              about the pilot. Questions? You have a direct line to us and quick
              answers, whatever it is.
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
                Join the founding network
              </Link>
            </div>
            <div className="mt-10">
              <LegalVersion>Version 1.2 · Effective 17 September 2026</LegalVersion>
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
