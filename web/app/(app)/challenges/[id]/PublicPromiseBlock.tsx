/**
 * PublicPromiseBlock — the conversion beat.
 *
 * The Promise text in display-size editorial typography, treated like
 * a quote. Slight warm tint so it stands out from the page bg as its
 * own band. Attribution line below in muted small caps, signed by all
 * creators (parity preserved).
 *
 * This is the "why should I care" moment — design language is
 * deliberately editorial / magazine, not utility / product card.
 */

interface Creator {
  id: string;
  display_name: string | null;
  role: "owner" | "cohost";
}

interface Props {
  promise: string;
  creators: Creator[];
}

function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function PublicPromiseBlock({ promise, creators }: Props) {
  const creatorNames = creators
    .map((c) => c.display_name)
    .filter((n): n is string => !!n);

  return (
    <section
      className="px-6 lg:px-12 py-16 lg:py-24"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,97,48,0.04) 0%, rgba(255,97,48,0.025) 100%)",
        borderTop: "1px solid rgba(255,97,48,0.08)",
        borderBottom: "1px solid rgba(255,97,48,0.08)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Subtle eyebrow label so the buyer knows what they're reading */}
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-[0.25em] mb-6 text-center"
          style={{ color: "#c2410c" }}
        >
          The Promise
        </p>

        {/* Promise text — editorial display size */}
        <p
          className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline leading-snug text-center"
          style={{ color: "#0F2229" }}
        >
          {/* Opening quote mark — typographic, not just a character */}
          <span
            className="inline-block mr-2 align-top"
            style={{
              color: "#FF6130",
              fontSize: "1.4em",
              lineHeight: 0.6,
              fontWeight: 900,
            }}
            aria-hidden="true"
          >
            “
          </span>
          {promise}
          <span
            className="inline-block ml-1 align-baseline"
            style={{
              color: "#FF6130",
              fontSize: "1.4em",
              lineHeight: 0.6,
              fontWeight: 900,
            }}
            aria-hidden="true"
          >
            ”
          </span>
        </p>

        {/* Attribution — both creators signed, parity preserved */}
        {creatorNames.length > 0 && (
          <p
            className="text-xs font-bold font-headline uppercase tracking-[0.18em] mt-8 text-center"
            style={{ color: "#94a3b8" }}
          >
            — From {joinNames(creatorNames)}
          </p>
        )}
      </div>
    </section>
  );
}
