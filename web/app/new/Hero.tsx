import { EX } from "./content";
import { INK, CYAN, MUTED, ApplyCTA } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M1 · HERO — the claim + the artifact in one view.
 * Left: headline-dominant copy (kept from V1, "experiences" vocabulary).
 * Right: the real example experience as a faithful buyer-card mock with
 * three proof chips pinned to it — governance, money, traction (honest).
 */

function ProofChip({
  children,
  className = "",
  tone = "ink",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "ink" | "orange" | "live";
}) {
  const styles =
    tone === "ink"
      ? { backgroundColor: "rgba(15,34,41,0.92)", color: "#9CF0FF" }
      : tone === "orange"
        ? { backgroundColor: "#FFFFFF", color: "#c2410c", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.35), 0 8px 24px rgba(15,34,41,0.14)" }
        : { backgroundColor: "#FFFFFF", color: "#ef4444", boxShadow: "0 0 0 1px rgba(15,34,41,0.10), 0 8px 24px rgba(15,34,41,0.14)" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-headline whitespace-nowrap ${className}`}
      style={{ fontWeight: 800, boxShadow: "0 8px 24px rgba(15,34,41,0.18)", ...styles }}
    >
      {children}
    </span>
  );
}

const CHECK = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center px-6 pt-28 pb-16">
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
        {/* ── Copy ── */}
        <div className="text-center lg:text-left">
          <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
            <div className="hidden sm:block w-10 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
            <p className="text-[10px] uppercase tracking-[0.25em] font-headline" style={{ color: CYAN, fontWeight: 700 }}>
              The platform for live, co-created fitness experiences
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
            style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.25)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
            <span className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline" style={{ fontWeight: 700 }}>
              Closed pilot · Applications open
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl xl:text-6xl font-headline tracking-tight leading-[1.05] mb-6"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            Build an experience beyond what you can offer alone.
          </h1>

          <p className="text-lg md:text-xl leading-relaxed mb-9 max-w-xl mx-auto lg:mx-0" style={{ color: MUTED }}>
            Combine your expertise with a complementary expert and deliver it as one seamless
            live experience. The page, the checkout, the contract, the revenue split, the live
            rooms, the tribe — INFITRA runs it. You coach.
          </p>

          <ApplyCTA micro="5 founding pairs · DACH · reviewed individually · starting now" />
        </div>

        {/* ── The artifact — example experience card + proof chips ── */}
        <div className="relative max-w-md w-full mx-auto lg:mx-0">
          <MockBuyerCard />
          {/* Desktop: pinned to the card edges */}
          <div className="hidden md:block" aria-hidden>
            <ProofChip tone="ink" className="absolute -left-8 top-16">
              <span style={{ color: "#4ade80" }}>{CHECK}</span> Contract signed · SHA-256 {EX.sha.slice(0, 4)}…
            </ProofChip>
            <ProofChip tone="orange" className="absolute -right-6 top-[42%]">
              Split {EX.split.owner}/{EX.split.cohost} · automatic
            </ProofChip>
            <ProofChip tone="live" className="absolute -left-6 top-[44%]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> {EX.members} members in
            </ProofChip>
          </div>
          {/* Mobile: a quiet row under the card */}
          <div className="md:hidden flex flex-wrap justify-center gap-2 mt-4" aria-hidden>
            <ProofChip tone="ink">
              <span style={{ color: "#4ade80" }}>{CHECK}</span> Contract · SHA-256 {EX.sha.slice(0, 4)}…
            </ProofChip>
            <ProofChip tone="orange">Split {EX.split.owner}/{EX.split.cohost} · automatic</ProofChip>
            <ProofChip tone="live">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> {EX.members} members in
            </ProofChip>
          </div>
        </div>
      </div>
    </section>
  );
}
