import Link from "next/link";
import { LegalPage, LegalSection, LegalVersion } from "@/app/components/LegalPage";

/**
 * Refund Policy — part of the Terms. Swiss law grants NO statutory
 * withdrawal right for online purchases, so this published policy IS the
 * refund right; it is designed so that no participant, including EU
 * residents with statutory withdrawal rights, is ever worse off under it
 * than under the law (CRD Arts. 14(3)/16(a)/16(l) mechanics).
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
          so this policy is the refund right, stated plainly. We designed it so
          that no participant, including EU residents with statutory withdrawal
          rights, is ever worse off under this policy than under the law.
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
          <strong style={{ color: "#0F2229" }}>
            After the first session, within 14 days of purchase:
          </strong>{" "}
          pro-rata refund. We deduct the share of the sessions that have already
          taken place (the experience price divided by its number of live
          sessions) and refund the rest. The card processing fee is refunded in
          the same proportion.
        </p>
        <p>
          <strong style={{ color: "#0F2229" }}>
            Later than 14 days after purchase:
          </strong>{" "}
          no refund for change of mind. The cases below still apply in full.
        </p>
        <p>Refund requests close with the final session of the experience.</p>
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
          <strong style={{ color: "#0F2229" }}>
            A session is cancelled and not rescheduled or replaced:
          </strong>{" "}
          pro-rata refund of that session&apos;s share.
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
          it is rescheduled, or refunded pro rata.
        </p>
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
          When you buy, you expressly ask us to begin right away: your experience
          space and materials open immediately. EU law also provides no withdrawal
          right for leisure services with a fixed date or period of performance,
          which live experiences with scheduled sessions are in our understanding
          (Art. 16(l) of the Consumer Rights Directive). Independently of that,
          this policy gives you at least what the EU withdrawal rules would:
          cancellation with a pro-rata deduction while the 14-day window runs, and
          everything back if we do not deliver.
        </p>
      </LegalSection>

      <LegalVersion>Version 1.1 · Effective 15 August 2026</LegalVersion>
    </LegalPage>
  );
}
