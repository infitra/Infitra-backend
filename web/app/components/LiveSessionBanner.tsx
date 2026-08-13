import Link from "next/link";

/**
 * THE live banner — one design for "a room is open right now", everywhere.
 *
 * Extracted from the dashboard's TopAlert (the founder's reference: dark
 * ink ground, pulse, white title, orange pill CTA) so the expert dashboard,
 * the participant home and the experience space all interrupt with the
 * SAME shape at the very top of the page. Time-critical signals only:
 * live (red pulse) or doors-open (orange pulse). Render nothing yourself
 * when there is no signal — this component is the shape, the surfaces
 * decide when it appears.
 */
export function LiveSessionBanner({
  href,
  pulseColor,
  label,
  title,
  cta,
}: {
  href: string;
  pulseColor: string;
  label: string;
  title: string;
  cta: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden p-5 md:p-6 mb-6 flex items-center justify-between gap-4"
      style={{
        backgroundColor: "#0F2229",
        boxShadow: "0 4px 20px rgba(15,34,41,0.25)",
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: pulseColor }}
          />
          <span
            className="text-[10px] uppercase tracking-widest font-headline"
            style={{ color: pulseColor, fontWeight: 700 }}
          >
            {label}
          </span>
        </div>
        <h2
          className="text-base md:text-lg font-headline tracking-tight text-white truncate"
          style={{ fontWeight: 700 }}
        >
          {title}
        </h2>
      </div>
      {/* The CTA carries the SAME accent as the pulse: red when an expert is
          in the room, orange when the doors are merely open. A red banner
          with an orange button read as two different urgencies at once. */}
      <Link
        href={href}
        className="shrink-0 px-5 md:px-6 py-2.5 md:py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
        style={{
          backgroundColor: pulseColor,
          fontWeight: 700,
          boxShadow: `0 4px 14px ${pulseColor}59`,
        }}
      >
        {cta}
      </Link>
    </div>
  );
}
