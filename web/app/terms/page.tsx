import Link from "next/link";
import {
  LegalPage,
  LegalSection,
  LegalCallout,
  LegalVersion,
} from "@/app/components/LegalPage";

/**
 * Terms and Conditions — the participant/platform umbrella document.
 * Structure follows the Swiss consumer-terms constraints: unusual clauses
 * (health risk, recordings, liability cap, UGC license) are visibly
 * highlighted (Ungewöhnlichkeitsregel — unflagged surprises simply do not
 * bind), liability preserves intent/gross negligence/personal injury
 * (OR 100), the forum clause reserves mandatory consumer forums (CPC
 * 32/35, Lugano 15-17), and expert-side commercial terms stay in the
 * Pilot Terms + the recorded collaboration agreement.
 */

export const metadata = {
  title: "Terms and Conditions · INFITRA",
  description: "The terms for using INFITRA, in plain language.",
};

const H = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: "#0F2229" }}>{children}</strong>
);

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms and Conditions"
      title="The terms, in plain language."
      intro={
        <>
          <p>
            These terms govern your use of INFITRA, the platform at
            www.infitra.fit where health and fitness experts run live experiences
            together and participants take part in them. INFITRA is operated by
            Yves Oliver Imhasly, sole proprietorship, Flühstrasse 40, 4114
            Hofstetten SO, Switzerland (see the{" "}
            <Link href="/imprint" className="underline hover:text-[#0891b2]">
              Legal Notice
            </Link>
            ).
          </p>
          <p>
            By creating an account or buying access to an experience you agree to
            these terms. They are written in plain language on purpose: we would
            rather you actually read them.
          </p>
        </>
      }
    >
      <LegalCallout>
        <p>
          <H>READ THIS FIRST: the four things that matter most</H>
        </p>
        <p>
          <H>1. Fitness carries risk.</H> You take part in live training at your
          own responsibility. Check with a doctor before starting if you have a
          health condition, an injury or are pregnant, and stop if something
          hurts. Our liability to you is limited as described in Section 10: we
          always remain liable for intent, gross negligence and personal injury,
          and beyond that our liability is capped at what you paid. Section 6 has
          the health details.
        </p>
        <p>
          <H>2. Sessions may be recorded in the future.</H> If a session is
          recorded for a replay, you will be told before you join, and you can
          always keep your camera and microphone off. Section 8.
        </p>
        <p>
          <H>3. Refunds are defined, not implied.</H> Swiss law gives no automatic
          right to cancel online purchases; what you get is what the{" "}
          <Link href="/refund-policy" className="underline hover:text-[#0891b2]">
            Refund Policy
          </Link>{" "}
          says, and we think it is fair: full refund in the first 14 days (at the
          latest until the first session starts), pro rata after the start, and
          always a refund if the experts cancel. Section 5 and the Refund Policy.
        </p>
        <p>
          <H>4. Your access starts immediately.</H> When you buy, you expressly
          ask us to open your experience space (your sessions, tribe space and
          materials) right away. For EU residents: cancel within the statutory 14
          days and completed sessions are deducted pro rata; once the experience
          is fully delivered, the withdrawal right lapses. Details in the Refund
          Policy.
        </p>
      </LegalCallout>

      <LegalSection title="1. What INFITRA is">
        <p>
          INFITRA is a platform for live fitness experiences created and run by
          independent experts, usually as a team (for example a strength coach and
          a nutritionist). An experience typically runs four to six weeks and
          includes live video sessions, a private space for its participants (the
          tribe space), and supporting materials.
        </p>
        <p>
          INFITRA provides the infrastructure: the experience pages and checkout,
          the live rooms, the tribe spaces, the delivery of materials, and the
          agreement process experts use to record how they collaborate. The
          experts provide the experience itself: its content, its guidance and
          its delivery.
        </p>
        <p>
          When you buy access to an experience, your contract for the purchase and
          for access to the platform is with INFITRA. The experts design and
          deliver the content of the experience as independent professionals. They
          are not employees, agents or partners of INFITRA, and INFITRA itself
          does not provide fitness, nutrition, medical or health advice of any
          kind.
        </p>
      </LegalSection>

      <LegalSection title="2. Your account">
        <p>
          You must be at least 18 to use INFITRA. Keep your account information
          accurate, keep your login personal, and use one account. Your account
          type (participant or expert) is set when the account is created.
        </p>
        <p>
          We can suspend or close accounts that break these terms. Except in cases
          of abuse, fraud or legal necessity, we will tell you why and give you a
          chance to respond.
        </p>
      </LegalSection>

      <LegalSection title="3. Buying an experience">
        <p>
          <H>How buying works.</H> You choose an experience, click the buy button,
          and complete payment on our payment provider&apos;s page (Stripe), where
          you see exactly what you are buying and the total price before you pay.
          You can review and correct your details there before confirming. The
          purchase contract is concluded when your payment succeeds; the
          confirmation email with your receipt documents it, and your access to
          the experience opens.
        </p>
        <p>
          <H>Prices.</H> All prices are in Swiss francs (CHF). The card processing
          fee (3% of the amount charged plus CHF 0.30) is paid by the buyer; the
          exact total is shown with the price on the experience page and again,
          itemized, before you pay.
        </p>
        <p>
          <H>What you get.</H> Access to the live sessions of the experience, its
          tribe space, and the materials the experts release, for the duration of
          the experience. Access is personal and not transferable.
        </p>
        <p>
          <H>Refunds.</H> The{" "}
          <Link href="/refund-policy" className="underline hover:text-[#0891b2]">
            Refund Policy
          </Link>{" "}
          is part of these terms. In short: full refund within 14 days of
          purchase (at the latest until the first session starts); after the
          start, a pro-rata refund within that window; always a full refund if
          the experience is cancelled; pro-rata refunds for sessions that are
          cancelled and not replaced.
        </p>
      </LegalSection>

      <LegalSection title="4. Live sessions">
        <p>
          Sessions happen at the scheduled times. Live means live: if you miss a
          session, it is not automatically available afterwards. Experts may
          reschedule a session when needed; you will see the change in your
          experience space. If a session is cancelled and not rescheduled or
          replaced, the Refund Policy applies.
        </p>
        <p>
          We work to keep the platform and the live rooms running reliably, but we
          cannot promise uninterrupted availability. If a session cannot take
          place because of a failure on our side, it will be rescheduled or
          refunded pro rata.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes and cancellation by the experts or INFITRA">
        <p>
          If an experience is cancelled before it starts, or never starts, you get
          a full refund automatically, including the processing fee. If it
          materially changes after you bought it, for example both experts are
          replaced or the schedule moves substantially, you can exit: full refund
          before the start, pro rata after. Details in the{" "}
          <Link href="/refund-policy" className="underline hover:text-[#0891b2]">
            Refund Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Health and safety">
        <p>
          <H>This section matters. Please actually read it.</H>
        </p>
        <p>
          Physical training carries inherent risk, including the risk of injury.
          You take part in sessions and follow training or nutrition guidance at
          your own responsibility.
        </p>
        <p>
          Before starting an experience, talk to a doctor if you have a medical
          condition, an injury, are pregnant or were recently pregnant, or are
          unsure whether the training suits you. During sessions, you are
          responsible for your own environment and equipment: enough space, a
          stable floor, weights you can control. Stop immediately if you feel
          pain, dizziness or discomfort.
        </p>
        <p>
          The content on INFITRA is general fitness and lifestyle guidance from
          independent experts. It is not medical advice, not a diagnosis and not
          treatment, and it does not replace a doctor, physiotherapist or other
          health professional. Experts owe you diligent, professional guidance;
          neither they nor INFITRA can promise specific results.
        </p>
      </LegalSection>

      <LegalSection title="7. The tribe space and your content">
        <p>
          <H>
            In short: what you post stays yours; you let us host and show it
            inside the platform, nothing more.
          </H>
        </p>
        <p>
          The tribe space belongs to the people in the experience. Posts,
          questions, comments and reflections are visible to the participants and
          experts of that experience only; nothing you write there is public.
        </p>
        <p>
          You own what you post. So that the platform can work, you grant INFITRA
          a non-exclusive, worldwide, royalty-free license to host, display and
          distribute your content within the platform, for the purpose of
          operating the service and nothing else. We will not use your posts in
          marketing without asking you separately.
        </p>
        <p>
          Keep it constructive. No harassment, discrimination, spam, unlawful
          content, or sharing other participants&apos; personal information. Do
          not give medical advice to other participants. We and the experts can
          remove content and, for repeated or serious violations, remove people,
          to keep the space safe. If we remove you for a serious violation,
          sessions already held are not refunded; whether the remainder is
          refunded is decided fairly case by case.
        </p>
      </LegalSection>

      <LegalSection title="8. Recordings">
        <p>
          <H>Live sessions may be recorded in the future</H> so that participants
          can watch a replay for a limited time (currently planned: 24 hours, then
          deleted). If a session is recorded, you will be told before you join it
          and a recording indicator will be visible in the room. Recordings can
          include your video, audio and chat if you take part with camera or
          microphone on; you can always participate with them off. Recordings are
          available only to the participants and experts of the experience. The{" "}
          <Link href="/privacy" className="underline hover:text-[#0891b2]">
            Privacy Policy
          </Link>{" "}
          describes the data protection side.
        </p>
      </LegalSection>

      <LegalSection title="9. Experts' content and intellectual property">
        <p>
          The materials, session content and methods the experts share are theirs
          (or licensed to them). You may use them for your personal,
          non-commercial purposes during and after the experience. You may not
          record sessions, redistribute materials, or resell any of it.
        </p>
        <p>
          The INFITRA platform, brand and software are ours. Feedback you give us
          about the product may be used to improve it.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability">
        <p>
          <H>
            In short: we are always fully liable for intent, gross negligence and
            personal injury; for everything else our liability is limited to what
            you paid.
          </H>
        </p>
        <p>
          INFITRA and the experts are fully liable for damage caused intentionally
          or by gross negligence, and for personal injury for which they are
          responsible under the law. That liability is not limited by anything in
          these terms.
        </p>
        <p>
          Beyond that, to the extent permitted by applicable law, liability for
          slight negligence is excluded; where liability nevertheless exists, it
          is limited to the amount you paid for the experience concerned.
          Liability that cannot be excluded or limited under the law that applies
          to you remains unaffected.
        </p>
        <p>
          We are not liable for events outside our reasonable control: failures
          of third-party providers, internet or power outages, or an expert being
          unable to host. Sessions affected by such events are rescheduled or
          refunded under the Refund Policy, and that is the remedy.
        </p>
      </LegalSection>

      <LegalSection title="11. For experts">
        <p>
          Experts use INFITRA under these terms plus the{" "}
          <Link href="/pilot-terms" className="underline hover:text-[#0891b2]">
            Pilot Terms
          </Link>{" "}
          (during the founding pilot) and the recorded collaboration agreement
          each expert team signs in its workspace. Where those documents govern
          the same point, they prevail for the expert relationship: the revenue
          split, the platform fee and the payout schedule live there. Refunds
          issued under the Refund Policy reduce the revenue of the experience
          before any split is calculated.
        </p>
        <p>
          The collaboration agreement is a contract between the experts. INFITRA
          provides the agreement process, records the result and pays out
          according to it, but is not a party to it and does not enforce or
          arbitrate it; disputes about it are between the experts. If experts
          dispute their split, INFITRA may hold the disputed amount until they
          resolve it.
        </p>
        <p>
          Experts are responsible for the professional quality and lawfulness of
          their content and guidance, confirm they hold the qualifications they
          present, and hold INFITRA harmless from third-party claims that arise
          from their content, guidance or conduct.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to these terms">
        <p>
          We may update these terms as INFITRA evolves. For material changes we
          will notify you by email or in the product at least 30 days before they
          take effect. If you are in a paid, running experience and reject a
          material change that disadvantages you, you can exit with a refund for
          the remaining part. Continued use after the effective date counts as
          acceptance. The current version is always at infitra.fit/terms, and each
          version is dated.
        </p>
        <p>
          If INFITRA&apos;s business is transferred to a legal entity that
          continues it (for example after the founding pilot), your agreements
          transfer with it. Your rights do not change as a result.
        </p>
      </LegalSection>

      <LegalSection title="13. Final provisions">
        <p>If a provision of these terms is invalid, the rest remains in force.</p>
        <p>
          These terms are governed by Swiss law, and the courts at INFITRA&apos;s
          seat (Hofstetten SO, Switzerland) have jurisdiction. If you are a
          consumer, mandatory consumer protection rules and the mandatory consumer
          forums, including the courts at your own place of residence, remain
          available to you where the law provides for them.
        </p>
        <p>
          Questions:{" "}
          <a href="mailto:hello@infitra.fit" className="underline hover:text-[#0891b2]">
            hello@infitra.fit
          </a>
          . We answer personally.
        </p>
      </LegalSection>

      <LegalVersion>Version 1.1 · Effective 15 August 2026</LegalVersion>
    </LegalPage>
  );
}
