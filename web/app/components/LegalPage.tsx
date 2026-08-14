import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { LegalFooter } from "@/app/components/LegalFooter";

/**
 * LegalPage — the shared chrome for the legal pack (/imprint, /privacy,
 * /terms, /refund-policy). Mirrors /pilot-terms exactly: cream + wave,
 * slim brand bar, max-w-3xl column, cyan eyebrow, headline. The pack is
 * plain language by design; these components keep it readable, and the
 * highlighted callouts satisfy the unusual-clause rule (clauses a buyer
 * would not expect must be visibly flagged or they simply do not bind).
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        <div className="px-6 pt-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <div className="mb-10 md:mb-12">
              <p
                className="text-[11px] uppercase tracking-[0.22em] font-headline mb-4"
                style={{ color: "#0891b2", fontWeight: 700 }}
              >
                {eyebrow}
              </p>
              <h1
                className="text-3xl md:text-4xl font-headline tracking-tight leading-[1.1]"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                {title}
              </h1>
              {intro && (
                <div
                  className="mt-5 space-y-3 text-base leading-relaxed"
                  style={{ color: "#334155" }}
                >
                  {intro}
                </div>
              )}
            </div>

            <div className="space-y-10">{children}</div>

            <div className="mt-14 pt-8" style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }}>
              <Link
                href="/"
                className="text-sm font-bold font-headline hover:opacity-80"
                style={{ color: "#0891b2" }}
              >
                ← Back to INFITRA
              </Link>
              <LegalFooter className="mt-6 !justify-start" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-xl md:text-2xl font-headline tracking-tight mb-4"
        style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.015em" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-base leading-relaxed" style={{ color: "#334155" }}>
        {children}
      </div>
    </section>
  );
}

/** The highlighted callout for unusual clauses (read-first box, section
 *  leads). Orange spine + warm fill: impossible to miss, on brand. */
export function LegalCallout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        backgroundColor: "rgba(255,97,48,0.06)",
        boxShadow: "inset 0 0 0 1px rgba(255,97,48,0.20)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: "#FF6130" }} aria-hidden />
      <div className="pl-6 pr-5 py-5 space-y-3 text-[15px] leading-relaxed" style={{ color: "#334155" }}>
        {children}
      </div>
    </div>
  );
}

/** Version footer, identical across the pack. */
export function LegalVersion({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs" style={{ color: "#94a3b8" }}>
      {children}
    </p>
  );
}
