/**
 * PublicChallengeHero — top of the buyer page.
 *
 * Full-bleed cover image (~60vh) with title overlaid bottom-left,
 * time strip (start date · weeks · sessions) just under the title,
 * and a "Led by [A] & [B]" creator pair line with avatars in parity.
 *
 * Two-creator parity is the brand differentiator: both avatars same
 * size, no role labels visible to buyers (the owner/cohost split is
 * INFITRA internals, not buyer-facing).
 *
 * Mobile-first: title and meta stack below the cover image (better
 * legibility on small screens than overlay text on a busy photo).
 * Desktop ≥1024px: title overlaid bottom-left with gradient mask.
 */

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "cohost";
}

interface Props {
  title: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  sessionCount: number;
  creators: Creator[];
}

function formatStartDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function weeksBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function PublicChallengeHero({
  title,
  imageUrl,
  startDate,
  endDate,
  sessionCount,
  creators,
}: Props) {
  const weeks = weeksBetween(startDate, endDate);

  return (
    <section className="relative">
      {/* Cover image — full-bleed, generous height */}
      <div className="relative w-full overflow-hidden" style={{ height: "60vh", minHeight: 420 }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #0F2229 0%, #1a3340 50%, #2a1508 100%)",
            }}
          />
        )}

        {/* Gradient mask for overlay text legibility — bottom-up dark */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(15,34,41,0.72) 0%, rgba(15,34,41,0.15) 45%, rgba(15,34,41,0) 70%)",
          }}
        />

        {/* Desktop: title + meta overlaid on the cover */}
        <div className="hidden lg:flex absolute inset-x-0 bottom-0 px-12 pb-12 flex-col gap-4">
          <h1
            className="text-5xl xl:text-6xl font-black font-headline text-white tracking-tight max-w-4xl leading-[1.05]"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.30)" }}
          >
            {title}
          </h1>
          <div className="flex items-center gap-3 text-white/95 text-sm font-bold font-headline">
            <span>Starts {formatStartDate(startDate)}</span>
            <span className="opacity-50">·</span>
            <span>{weeks} {weeks === 1 ? "week" : "weeks"}</span>
            <span className="opacity-50">·</span>
            <span>{sessionCount} live {sessionCount === 1 ? "session" : "sessions"}</span>
          </div>
        </div>

        {/* Scroll hint chevron */}
        <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-1 text-white/70 text-[10px] font-bold font-headline uppercase tracking-widest">
          <span>Discover</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Mobile: title + meta below the cover (legibility over busy photos) */}
      <div className="lg:hidden px-6 pt-8 pb-6">
        <h1
          className="text-3xl sm:text-4xl font-black font-headline tracking-tight leading-tight"
          style={{ color: "#0F2229" }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-2 mt-3 text-xs font-bold font-headline flex-wrap" style={{ color: "#64748b" }}>
          <span>Starts {formatStartDate(startDate)}</span>
          <span className="opacity-50">·</span>
          <span>{weeks} {weeks === 1 ? "week" : "weeks"}</span>
          <span className="opacity-50">·</span>
          <span>{sessionCount} live {sessionCount === 1 ? "session" : "sessions"}</span>
        </div>
      </div>

      {/* Creator pair — appears below cover on all viewports.
          Both avatars same size, no role labels, "Led by A & B" framing. */}
      <div className="px-6 lg:px-12 pb-10 lg:pt-8">
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-[0.2em] mb-3"
          style={{ color: "#94a3b8" }}
        >
          Led by
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          {creators.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">
              {c.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.avatar_url}
                  alt={c.display_name ?? "Creator"}
                  className="w-14 h-14 rounded-full object-cover"
                  style={{ border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: c.role === "owner" ? "rgba(255,97,48,0.15)" : "rgba(8,145,178,0.15)",
                    border: "2px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                  }}
                >
                  <span
                    className="text-lg font-black font-headline"
                    style={{ color: c.role === "owner" ? "#FF6130" : "#0891b2" }}
                  >
                    {(c.display_name ?? "?")[0]}
                  </span>
                </div>
              )}
              <span
                className="text-base font-black font-headline tracking-tight"
                style={{ color: "#0F2229" }}
              >
                {c.display_name ?? "Creator"}
              </span>
              {i < creators.length - 1 && (
                <span className="text-base font-headline" style={{ color: "#94a3b8" }}>
                  &amp;
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
