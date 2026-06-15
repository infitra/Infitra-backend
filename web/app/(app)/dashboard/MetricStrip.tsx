/**
 * MetricStrip — a row of aligned number+label cells, divided by hairlines.
 * The shared "console readout" language for the dashboard: it replaces the
 * floating chip + bare stat line that read as leftover data. Used in the
 * profile rail ("across your tribes") and inside the active card's live-state
 * panel, so both speak the same visual grammar.
 *
 * Pure JSX (no hooks) → usable from both server and client components.
 */

const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#c2410c";
const MUTED = "#94a3b8";

export interface Metric {
  value: number | string;
  label: string;
  /** number colour; "orange" also tints the label (urgency). */
  accent?: "ink" | "cyan" | "orange";
}

export function MetricStrip({
  metrics,
  framed = true,
}: {
  metrics: Metric[];
  /** When false, drops the outer border/radius so it can sit inside a panel. */
  framed?: boolean;
}) {
  const numColor = (a: Metric["accent"]) =>
    a === "cyan" ? CYAN : a === "orange" ? ORANGE : INK;
  return (
    <div
      className="flex"
      style={
        framed
          ? { border: "1px solid rgba(15,34,41,0.08)", borderRadius: 11, overflow: "hidden" }
          : undefined
      }
    >
      {metrics.map((m, i) => (
        <div
          key={i}
          className="flex-1 text-center px-1.5 py-2.5"
          style={{ borderLeft: i > 0 ? "1px solid rgba(15,34,41,0.08)" : undefined }}
        >
          <div
            className="text-lg font-black font-headline leading-none tabular-nums"
            style={{ color: numColor(m.accent) }}
          >
            {m.value}
          </div>
          <div className="text-[11px] mt-1" style={{ color: m.accent === "orange" ? ORANGE : MUTED }}>
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}
