import { LegalPage, LegalSection, LegalVersion } from "@/app/components/LegalPage";

/**
 * Legal Notice (Impressum) — UWG Art. 3(1)(s): an e-commerce offering must
 * clearly identify its operator (full personal name for an unregistered
 * sole proprietorship — the brand alone identifies nobody who can be
 * served), a mailable street address, and a working email address.
 * Reachable one click from every page via LegalFooter.
 */

export const metadata = {
  title: "Legal Notice · INFITRA",
  description: "Operator identification and legal notice for INFITRA.",
};

export default function ImprintPage() {
  return (
    <LegalPage eyebrow="Legal Notice" title="Impressum">
      <LegalSection title="Operator of this website and service">
        <p>INFITRA is operated by:</p>
        <p style={{ color: "#0F2229" }}>
          <strong>Yves Oliver Imhasly</strong>
          <br />
          Sole proprietorship (Einzelunternehmen)
          <br />
          Flühstrasse 40
          <br />
          4114 Hofstetten SO
          <br />
          Switzerland
        </p>
        <p>
          Email:{" "}
          <a href="mailto:hello@infitra.fit" className="underline hover:text-[#0891b2]">
            hello@infitra.fit
          </a>
        </p>
        <p>
          INFITRA is the brand under which Yves Oliver Imhasly offers the services
          described on this website. During the founding pilot, INFITRA operates as
          a Swiss sole proprietorship. We plan to transfer the business to a Swiss
          legal entity later; if that happens, your agreements move with it (see
          the Terms).
        </p>
      </LegalSection>

      <LegalSection title="Responsible for content">
        <p>Yves Oliver Imhasly, address as above.</p>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <p>
          The content of this website is created with care, but we cannot guarantee
          that everything is complete, correct and current at all times. Content
          provided by experts on the platform (experience descriptions, session
          content, materials, posts) is the responsibility of the expert who
          provides it.
        </p>
        <p>
          External links lead to third-party content we do not control. We check
          links when we add them; nothing unlawful was apparent at that time.
        </p>
      </LegalSection>

      <LegalVersion>Version 1.0 · Effective 14 August 2026</LegalVersion>
    </LegalPage>
  );
}
