import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, FAINT, PRODUCT_SHADOW, Person } from "./ui";

/**
 * Faithful, STRIPPED mock of the real buyer page's hero card: cover + LIVE
 * pill, kicker title, promise headline, experts, CTA. Conceptual by design —
 * no price, no dates, no operational chrome (polish round 1).
 *
 * `compact`   — smaller paddings, no stats line (the Move-04 payoff).
 * `frameless` — no outer radius/shadow; the browser frame supplies the chrome.
 */
export function MockBuyerCard({
  compact = false,
  frameless = false,
}: {
  compact?: boolean;
  frameless?: boolean;
}) {
  return (
    <div
      className={`${frameless ? "" : "rounded-3xl"} overflow-hidden text-left`}
      style={{ backgroundColor: "#FFFFFF", ...(frameless ? {} : { boxShadow: PRODUCT_SHADOW }) }}
      aria-hidden
    >
      {/* Cover */}
      <div className={`relative overflow-hidden ${compact ? "aspect-[16/8]" : "aspect-[16/9]"}`} style={{ backgroundColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(15,34,41,0.45), rgba(15,34,41,0))" }}
        />
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#9CF0FF", fontWeight: 700 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
          Live · {EX.weeks} weeks
        </span>
      </div>

      <div className={compact ? "p-5" : "p-6"}>
        <p className="text-[10px] uppercase tracking-[0.2em] font-headline mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>
          {EX.title}
        </p>
        <p
          className={`font-headline tracking-tight leading-snug ${compact ? "text-base" : "text-lg md:text-xl"}`}
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}
        >
          {EX.promise}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Person avatar={ALEX.avatar} name={ALEX.name} tag={ALEX.tag} color={ORANGE} size={compact ? 32 : 36} />
          <Person avatar={MIRA.avatar} name={MIRA.name} tag={MIRA.tag} color={CYAN} size={compact ? 32 : 36} />
        </div>

        {!compact && (
          <p className="text-[12px] font-bold font-headline mt-4" style={{ color: "#5b7886" }}>
            {EX.weeks} weeks · {EX.sessions} live sessions
            <span style={{ color: FAINT, fontWeight: 600 }}> · Always on: Tribe + Expert access</span>
          </p>
        )}

        <div
          className="mt-4 rounded-full py-3 text-center text-white text-sm font-black font-headline"
          style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.32)" }}
        >
          I&apos;m in →
        </div>
      </div>
    </div>
  );
}
