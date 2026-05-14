import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { PilotApplicationForm } from "./PilotApplicationForm";

/**
 * /apply — pilot application form. Standalone surface (not under (auth)
 * or (app)) because applicants are cold visitors arriving from the
 * landing page CTA. Uses the same cream + wave shell as the landing
 * so the conversion arc reads as one continuous brand.
 */

export const metadata = {
  title: "Apply for the pilot — INFITRA",
  description:
    "Apply to be one of the first five creator pairs running a joint live program on INFITRA.",
};

export default function ApplyPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        {/* Slim brand bar — no full nav, this is a focused conversion page */}
        <div className="px-6 pt-6 pb-2">
          <div className="max-w-2xl mx-auto">
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
          <div className="max-w-2xl mx-auto">
            {/* ── Header ─────────────────────────────────────── */}
            <div className="mb-8 md:mb-10">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5"
                style={{
                  backgroundColor: "rgba(8,145,178,0.10)",
                  border: "1px solid rgba(8,145,178,0.25)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
                <span
                  className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline"
                  style={{ fontWeight: 700 }}
                >
                  Pilot — first 5 pairs
                </span>
              </div>
              <h1
                className="text-3xl md:text-4xl font-headline tracking-tight leading-[1.1]"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Tell us about you
                <br />
                <span style={{ color: "#FF6130" }}>and your work.</span>
              </h1>
              <p
                className="mt-5 text-base md:text-lg leading-relaxed"
                style={{ color: "#475569" }}
              >
                We&apos;re looking for five creator pairs to run joint live programs in the
                pilot. If your expertise complements another creator&apos;s — and a 4–6
                week program would land for your audience — we want to hear from you.
              </p>
            </div>

            {/* ── Form (client) ──────────────────────────────── */}
            <PilotApplicationForm />

            {/* ── Footer note ────────────────────────────────── */}
            <p
              className="mt-8 text-xs leading-relaxed text-center"
              style={{ color: "#94a3b8" }}
            >
              By applying you agree to the{" "}
              <Link href="/pilot-terms" className="underline hover:text-[#0891b2]">
                pilot terms
              </Link>
              . We&apos;ll respond within a week.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
