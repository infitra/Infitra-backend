/**
 * The legend beside an experience's tribe constellation.
 *
 * Deliberately NOT a card: hairline-separated notes on whatever surface they
 * sit on, so the numbers read as annotations OF the circle rather than a
 * panel parked next to it (founder call, 17 Aug, after a boxed version read
 * as two unrelated objects).
 *
 * Shared by both dashboards. The expert reads the tribe they are running;
 * the participant reads the tribe they are in. Same grammar, so the product
 * looks like one building from either side.
 */

const CYAN = "#0891b2";
const INK = "#0F2229";
const MUTED = "#94a3b8";

export function LegendNote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="border-t first:border-t-0 py-3.5 first:pt-0 last:pb-0"
      style={{ borderColor: "rgba(15,34,41,0.08)" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.16em] font-headline mb-1"
        style={{ color: CYAN, fontWeight: 800 }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

/** The legend's headline: the headcount as a real numeral, because it is the
 *  reading of the picture beside it. */
export function TribeHeadcount({ memberTotal }: { memberTotal: number }) {
  if (memberTotal === 0) {
    return (
      <p className="text-[15px] font-bold font-headline" style={{ color: MUTED }}>
        Still forming
      </p>
    );
  }
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-[28px] font-black font-headline leading-none tabular-nums" style={{ color: INK }}>
        {memberTotal}
      </span>
      <span className="text-[13px]" style={{ color: "#64748b", fontWeight: 600 }}>
        {memberTotal === 1 ? "person has joined" : "people have joined"}
      </span>
    </p>
  );
}

/** One "· 2 new posts" activity line. Renders nothing at zero — a legend of
 *  zeroes is noise, and callers show a quiet line when everything is zero. */
export function ActivityLine({
  value,
  singular,
  plural,
  color,
  emphasise,
}: {
  value: number;
  singular: string;
  plural: string;
  color: string;
  emphasise?: boolean;
}) {
  if (!value) return null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] leading-relaxed">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="font-black font-headline tabular-nums" style={{ color: emphasise ? color : INK }}>
        {value}
      </span>
      <span style={{ color: emphasise ? color : "#64748b", fontWeight: 600 }}>
        {value === 1 ? singular : plural}
      </span>
    </p>
  );
}
