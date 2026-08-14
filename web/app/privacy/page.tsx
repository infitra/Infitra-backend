import { LegalPage, LegalSection, LegalVersion } from "@/app/components/LegalPage";

/**
 * Privacy Policy — combined nDSG (FADP) + GDPR, plain language. Every
 * mandatory item is here: controller identity, purposes with legal bases,
 * named processors with countries (the Swiss extra), transfer safeguards
 * (Swiss-U.S. DPF / SCCs), sensitive-data consent, retention with the
 * 10-year bookkeeping carve-out, rights, complaint route. Claims in here
 * are backed by mechanisms: the health consent is a real signup checkbox,
 * the log retention has a purge cron, the fonts are self-hosted.
 */

export const metadata = {
  title: "Privacy Policy · INFITRA",
  description: "What INFITRA processes, why, where it goes and your rights.",
};

const H = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: "#0F2229" }}>{children}</strong>
);

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy Policy"
      title="Your data, plainly explained."
      intro={
        <>
          <p>
            INFITRA is a platform where health and fitness experts run live
            experiences together and participants take part in them. Running that
            requires some of your data. This policy explains what we process, why,
            where it goes and what your rights are. It is written to satisfy the
            Swiss Data Protection Act (FADP) and, for residents of the EU and EEA,
            the GDPR.
          </p>
          <p>
            Transparency is how we want to work, so this is written in plain
            language. If anything is unclear, write to us and we will answer
            plainly too.
          </p>
        </>
      }
    >
      <LegalSection title="1. Who is responsible">
        <p>The controller for all processing described here is:</p>
        <p style={{ color: "#0F2229" }}>
          INFITRA · Yves Oliver Imhasly (sole proprietorship)
          <br />
          Flühstrasse 40, 4114 Hofstetten SO, Switzerland
          <br />
          Email:{" "}
          <a href="mailto:hello@infitra.fit" className="underline hover:text-[#0891b2]">
            hello@infitra.fit
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. What we process, and why">
        <p>
          <H>Your account.</H> When you create an account we process your email
          address, password (stored only in hashed form by our authentication
          provider), display name and the profile details you choose to add
          (photo, bio, facts you fill in). We use this to run your account and
          show you as yourself inside your experiences. If you are an expert, your
          public profile (name, photo, bio) also appears on the marketing pages of
          your experiences, which anyone on the web can see. Legal basis:
          performance of our contract with you.
        </p>
        <p>
          You are not obliged to provide any data, but without an email address
          and payment details we cannot run your account or sell you access.
        </p>
        <p>
          <H>Purchases and payments.</H> When you buy access to an experience we
          process what you bought, the price, the payment status and the receipt
          we send you. Your card details go directly to Stripe, our payment
          provider; we never see or store your full card number. Legal basis:
          performance of the contract; keeping financial records is also a legal
          obligation (Swiss bookkeeping law).
        </p>
        <p>
          <H>Live sessions.</H> When you join a live session we process the fact
          and time that you joined (attendance) and issue you a personal access
          token for the video room. Your video and audio streams are processed by
          our live video provider (Daily.co) to deliver the call to the other
          people in the room. Streams are transient: they are not stored. See
          section 4 for recordings. Legal basis: performance of the contract.
        </p>
        <p>
          <H>The tribe space.</H> Posts, comments, questions, reactions and
          reflections you share are processed so your tribe and your experts can
          see them. Legal basis: performance of the contract; for health-related
          content, your consent (section 3).
        </p>
        <p>
          <H>Materials.</H> Documents your experts attach to sessions are stored
          so you can download them during your experience. If you are an expert,
          the materials you upload are processed to deliver them to your
          participants. Legal basis: performance of the contract.
        </p>
        <p>
          <H>Emails.</H> We send transactional email only: receipts, session
          reminders, a welcome note, account emails such as password resets,
          confirmations when you apply, and answers to things you send us. We do
          not run marketing lists. Legal basis: performance of the contract; the
          receipt is also a legal obligation (order confirmation).
        </p>
        <p>
          <H>Applications and the waitlist.</H> If you apply for the founding
          pilot or join the waitlist, we process the details you submit to review
          your application or notify you. Legal basis: taking steps before
          entering a contract, and our legitimate interest in building the pilot.
        </p>
        <p>
          <H>Analytics.</H> We use Umami, a cookieless, EU-hosted analytics tool
          that gives us aggregate numbers (how many people visited which page). It
          sets nothing on your device and does not track you across sites. Legal
          basis: our legitimate interest in understanding whether the website
          works.
        </p>
        <p>
          <H>Security and operations.</H> We keep technical logs (authentication
          events, access to privileged functions, errors) to keep the platform
          secure and to find problems. Legal basis: our legitimate interest in
          running a secure service.
        </p>
      </LegalSection>

      <LegalSection title="3. Health-related information">
        <p>
          INFITRA is a fitness platform, so some of what you share can say
          something about your health: a reflection after a session, an energy
          rating, or the fact that you take part in an experience that relates to
          your physical condition (for example an experience built around
          post-partum recovery). Swiss and EU law treat this as sensitive data,
          and it deserves extra care.
        </p>
        <p>
          We process health-related information only to run your experience: your
          reflections and check-ins are visible to your tribe and your experts
          because sharing them there is their purpose. We do not use them for
          advertising and we do not sell them, or any other data, to anyone.
        </p>
        <p>
          Because this is sensitive data, we ask for your explicit consent when
          you create a participant account. You can withdraw that consent at any
          time by deleting the content, or by writing to us; withdrawing does not
          affect processing that already happened.
        </p>
      </LegalSection>

      <LegalSection title="4. Live video and recordings">
        <p>
          Live sessions run over Daily.co, a US video provider. Your video and
          audio are processed in real time to deliver the session and are not
          stored.
        </p>
        <p>
          In the future, sessions may be recorded so participants can watch a
          replay for a limited time (currently planned: 24 hours). If a session is
          recorded, the recording can include your video, audio and chat if you
          take part with camera or microphone on. You will be told before you join
          a recorded session, a recording indicator will be visible in the room,
          and you can keep your camera and microphone off if you do not want to
          appear. Recordings are deleted after the replay window. Recording will
          only start once this consent flow is in place; this section exists so
          you know it is coming.
        </p>
      </LegalSection>

      <LegalSection title="5. Who helps us run INFITRA">
        <p>
          We use a small set of service providers (processors) who process data on
          our instructions:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><H>Supabase</H> · database, authentication and file storage · hosted in Zurich, Switzerland (AWS eu-central-2)</li>
          <li><H>Stripe</H> · payment processing · USA</li>
          <li><H>Daily.co</H> · live video · USA</li>
          <li><H>Resend</H> · transactional email delivery · USA</li>
          <li><H>Vercel</H> · web hosting · USA</li>
          <li><H>Umami</H> · cookieless analytics · EU</li>
          <li><H>Google Workspace</H> · our business email · USA</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Where your data goes">
        <p>
          Most data lives in Switzerland (Supabase, Zurich). Some providers are in
          the United States or process data there. EU and EEA countries are
          recognized by Switzerland as providing adequate data protection.
        </p>
        <p>
          Switzerland recognizes transfers to US companies certified under the
          Swiss-U.S. Data Privacy Framework. Where a provider holds that
          certification, we rely on it. Where it does not, we rely on the European
          Commission&apos;s Standard Contractual Clauses, adapted for Swiss law as
          recognized by the Swiss data protection authority (FDPIC). You can ask
          us which safeguard applies to a specific provider and request a copy.
        </p>
        <p>
          The list above reflects our providers&apos; primary processing
          locations. Providers may use sub-processors in other countries under the
          same safeguards; ask us and we will tell you what applies to a specific
          provider. Beyond what these providers need to deliver their service, we
          do not transfer your data anywhere else.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies">
        <p>
          We use only cookies that are strictly necessary to run the service: your
          login session, a cookie that remembers you passed the private access
          gate, and a flag that remembers you completed onboarding. No marketing
          or tracking cookies, which is why there is no cookie banner. Our
          analytics (Umami) is cookieless. The fonts on this site are served from
          our own domain; no font provider sees your visit.
        </p>
      </LegalSection>

      <LegalSection title="8. How long we keep things">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <H>Account data</H>: for as long as your account exists, then deleted
            or anonymized within 30 days of account deletion.
          </li>
          <li>
            <H>Financial records</H> (orders, transactions, receipts, payouts): 10
            years, because Swiss bookkeeping law (Art. 958f Code of Obligations)
            requires it. This applies even if you delete your account.
          </li>
          <li>
            <H>Tribe space posts</H>: while the tribe space exists. If you delete
            your account, your reflections are deleted; other posts may be
            anonymized so conversations stay readable.
          </li>
          <li>
            <H>Live video</H>: not stored. Future recordings: deleted after the
            replay window (planned 24 hours).
          </li>
          <li>
            <H>Applications and waitlist entries</H>: until we have decided and
            told you, then up to 12 months in case you reapply, unless you ask us
            to delete them sooner.
          </li>
          <li>
            <H>Technical and security logs</H>: up to 12 months.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Your rights">
        <p>You can, at any time:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><H>Access</H> the data we hold about you</li>
          <li><H>Correct</H> data that is wrong</li>
          <li><H>Delete</H> your data (except what we must keep by law, like financial records)</li>
          <li><H>Receive</H> the data you gave us in a portable, machine-readable format</li>
          <li><H>Restrict or object</H> to processing based on our legitimate interest</li>
          <li><H>Withdraw consent</H> you have given, with effect for the future</li>
        </ul>
        <p>
          Write to{" "}
          <a href="mailto:hello@infitra.fit" className="underline hover:text-[#0891b2]">
            hello@infitra.fit
          </a>
          . We answer within 30 days and it costs nothing. We may ask you to
          confirm your identity so we do not hand your data to someone else.
        </p>
        <p>
          If you believe we handle your data unlawfully, you can complain to the
          Swiss Federal Data Protection and Information Commissioner (FDPIC) or,
          if you live in the EU or EEA, to your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="10. No automated decision-making">
        <p>
          We do not make automated decisions about you that have legal or
          similarly significant effects. No profiling, no scoring.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          When we change this policy in a way that matters, we will tell you in
          the product or by email, with the date the change takes effect. The
          current version is always at infitra.fit/privacy.
        </p>
      </LegalSection>

      <LegalVersion>Version 1.0 · Effective 14 August 2026</LegalVersion>
    </LegalPage>
  );
}
