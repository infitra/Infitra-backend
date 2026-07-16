import { INK, CYAN, MUTED, FAINT, ApplyCTA } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M1 · HERO — the claim + the artifact, fully chip-free (polish round 1).
 * One clean experience card carries the punch; the system story starts one
 * scroll below on the rail. The single honesty caption of the page sits
 * quietly under the card.
 */
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

        {/* ── The artifact — one clean card, nothing pinned to it ── */}
        <div className="max-w-md w-full mx-auto lg:mx-0">
          <MockBuyerCard />
          <p className="text-center text-[11px] mt-3 tracking-wide" style={{ color: FAINT }}>
            An example experience, built on INFITRA.
          </p>
        </div>
      </div>
    </section>
  );
}
