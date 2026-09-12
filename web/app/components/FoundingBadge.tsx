/**
 * The founding marker, in one place.
 *
 * Lived inside PublicChallengeHero until the landing's hero tiles needed the
 * badge: a client component there may not pull the whole buyer page, its
 * carousel and its purchase button into the bundle just to show a chip. Pure
 * presentation, no hooks, so either module graph may import it.
 */

/**
 * The founding marker: the INFITRA mark in gold. The brand glyph ships as an
 * alpha PNG (/founding-mark.png, the bold cyan mark with its alpha as the
 * shape);
 * CSS masks a warm gold gradient through it, so it's the logo, just gold, at
 * any size. Kept in the mark's own 561:395 aspect, not squished to a square.
 */
function FoundingExpertMark({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 align-middle ${className}`}
      style={{
        width: size,
        height: Math.round((size * 395) / 561),
        background: "linear-gradient(145deg, #F0C43A 0%, #D2A015 52%, #9C7207 100%)",
        WebkitMaskImage: "url(/founding-mark.png)",
        maskImage: "url(/founding-mark.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        filter: "drop-shadow(0 1px 1px rgba(120,85,5,0.30))",
      }}
    />
  );
}

/**
 * Compact founding marker for anywhere the expert appears OUTSIDE their
 * profile/detail block (hero identity, the live space). The gold INFITRA
 * mark by the name; hovering reveals "Founding member" via a real tooltip
 * element (the native title attribute was unreliable). The labelled pill
 * (FoundingExpertBadge) is reserved for the detailed "Meet your Experts".
 */
export function FoundingExpertStar({
  size = 18,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center align-middle group ${className}`}
      aria-label="Founding member"
      style={{ cursor: "default" }}
    >
      <FoundingExpertMark size={size} />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold font-headline opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ backgroundColor: "#0F2229", color: "#FFFFFF", zIndex: 30, letterSpacing: "0.01em" }}
      >
        Founding member
      </span>
    </span>
  );
}

/**
 * Founding member chip (renamed from Founding Expert on 8 Sep 2026, so it
 * reads right for studios too): the labelled credential for the detailed expert
 * cards ("Meet your Experts"): the gold INFITRA mark + label on a warm gold
 * pill. Everywhere else uses the compact FoundingExpertStar.
 */
export function FoundingExpertBadge({ className = "", large = false }: { className?: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center ${large ? "gap-2 px-3.5 py-1.5" : "gap-1.5 px-2.5 py-1"} rounded-full align-middle ${className}`}
      style={{
        backgroundColor: "rgba(184,134,11,0.10)",
        boxShadow: "inset 0 0 0 1px rgba(184,134,11,0.32)",
      }}
    >
      <FoundingExpertMark size={large ? 20 : 15} />
      <span
        className={`${large ? "text-[12px]" : "text-[10px]"} font-bold font-headline uppercase tracking-[0.1em]`}
        style={{ color: "#9a7414" }}
      >
        Founding member
      </span>
    </span>
  );
}
