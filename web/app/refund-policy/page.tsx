import Link from "next/link";
import { LegalPage, LegalSection, LegalVersion } from "@/app/components/LegalPage";

/**
 * Refund Policy — part of the Terms. Swiss law grants NO statutory
 * withdrawal right for online purchases, so this published policy IS the
 * refund right. v1.2 (founder call, 16 Aug): change-of-mind refunds end
 * when the experience starts; pro rata survives ONLY for provider-side
 * failures (session finally cancelled and not replaced), with reschedule
 * as the stated first remedy. EU position rests on CRD Art. 16(l); the
 * accepted residual edge is logged in legal/lawyer-at-scale.md.
 */

export const metadata = {
  title: "Refund Policy · INFITRA",
  description: "How refunds work on INFITRA, stated plainly.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refund Policy"
      title="Refunds, stated plainly."
      intro={
        <p>
          This policy is part of INFITRA&apos;s{" "}
          <Link href="/terms" className="underline hover:text-[#0891b2]">
            Terms and Conditions
          </Link>
          . Swiss law does not grant an automatic right to cancel online purchases,
          so this policy is the refund right, stated plainly. It is short on
          purpose: a clear cancellation window before the experience starts, and
          the promise that you never pay for an experience or a session that
          does not happen.
        </p>
      }
    >
      <LegalSection title="If you cancel">
        <p>
          <strong style={{ color: "#0F2229" }}>
            Within 14 days of purchase, before the first live session:
          </strong>{" "}
          full refund, no questions asked. The card processing fee is refunded
          too. If you bought fewer than 14 days before the start, you can cancel
          any time until the first session starts.
        </p>
        <p>
          <strong style={{ color: "#0F2229" }}>In every other case:</strong> no
          refund for change of mind. Once your 14-day window has passed, or once
          the experience has started, the purchase is final. Your spot is held
          for you either way. The cases below, where the experience does not
          happen as promised, always apply in full.
        </p>
      </LegalSection>

      <LegalSection title="If the experience changes or does not happen">
        <p>
          <strong style={{ color: "#0F2229" }}>
            The experience is cancelled or never starts:
          </strong>{" "}
          full refund, automatically, including the processing fee. You do not
          need to ask.
        </p>
        <p>
          <strong style={{ color: "#0F2229" }}>A session is cancelled:</strong>{" "}
          rescheduling always comes first. Experts can move a session, and a
          rescheduled session is delivered, not cancelled. Only if a session is
          finally cancelled and not rescheduled or replaced do we refund its
          share pro rata: the experience price divided by its number of live
          sessions, with the processing fee refunded in the same proportion.
        </p>
        <p>
          <strong style={{ color: "#0F2229" }}>The experience changes materially</strong>{" "}
          (for example the experts are replaced or the schedule moves
          substantially): you can exit. Full refund before the start, pro rata
          after.
        </p>
        <p>
          <strong style={{ color: "#0F2229" }}>
            A session cannot happen because of a technical failure on our side:
          </strong>{" "}
          it is rescheduled; if it cannot be, its share is refunded pro rata.
        </p>
        <p>Refund requests close with the final session of the experience.</p>
      </LegalSection>

      <LegalSection title="How to cancel">
        <p>
          Write to{" "}
          <a href="mailto:hello@infitra.fit?subject=Cancel%20my%20purchase" className="underline hover:text-[#0891b2]">
            hello@infitra.fit
          </a>{" "}
          with the subject &quot;Cancel my purchase&quot; from the email address of
          your account, and name the experience. That is all. We confirm within 2
          business days.
        </p>
      </LegalSection>

      <LegalSection title="How refunds are paid">
        <p>
          Refunds go to your original payment method via Stripe, within 14 days of
          your cancellation.
        </p>
      </LegalSection>

      <LegalSection title="A note for EU residents">
        <p>
          When you buy, your experience space opens right away: the tribe
          space, and the materials as the experts release them. The experience
          itself begins with its first scheduled session.
          EU law provides no withdrawal right for leisure services with a
          specific date or period of performance (Art. 16(l) of the Consumer
          Rights Directive), and live experiences with scheduled sessions are
          exactly that in our understanding. Independently of that, this
          policy&apos;s own window gives you a full, unconditional refund before
          the experience starts. Rights that the law of your country grants you
          and that cannot be excluded remain unaffected.
        </p>
      </LegalSection>

      <LegalVersion>Version 1.2 · Effective 16 August 2026</LegalVersion>
    </LegalPage>
  );
}
