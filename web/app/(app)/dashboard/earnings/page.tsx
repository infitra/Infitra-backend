import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Earnings — INFITRA",
};

const INK = "#0F2229";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const GREEN = "#047857";
const GREEN2 = "#059669";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

function pct(n: number) {
  return `${Math.round(n)}%`;
}

const num = (v: unknown) => Number(v ?? 0);

type EarningLine = {
  id: string;
  type: string;
  created_at: string;
  product_title: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  amount_gross_cents: number | string;
  platform_cut_cents: number | string;
  creator_cut_cents: number | string;
  effective_fee_percent: number | string;
  my_role: "owner" | "cohost";
  my_split_percent: number | null;
  cohost_cut_cents: number | string | null;
  cohost_count: number | null;
  cohost_name: string | null;
  your_cut_cents: number | string;
};

export default async function EarningsPage() {
  const supabase = await createClient();

  // Co-host-aware earnings: one attributed line per sale for the current user
  // (owner remainder OR co-host split). SECURITY DEFINER view, scoped to auth.uid().
  const { data } = await supabase
    .from("vw_my_earnings_lines")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as EarningLine[];

  const totalEarned = rows.reduce((s, r) => s + num(r.your_cut_cents), 0);
  const totalGross = rows.reduce((s, r) => s + num(r.amount_gross_cents), 0);
  const totalPlatform = rows.reduce((s, r) => s + num(r.platform_cut_cents), 0);
  const totalCohost = rows.reduce((s, r) => s + num(r.cohost_cut_cents), 0);
  const salesCount = rows.length;
  const buyers = new Set(rows.map((r) => r.buyer_id).filter(Boolean)).size;
  const hasCohosts = rows.some((r) => num(r.cohost_cut_cents) > 0);
  const hasRows = rows.length > 0;

  // Column spans flex depending on whether the Co-host column is shown.
  const C = hasCohosts
    ? {
        item: "col-span-3",
        buyer: "col-span-1",
        date: "col-span-2",
        gross: "col-span-1",
        platform: "col-span-1",
        cohost: "col-span-2",
        cut: "col-span-2",
      }
    : {
        item: "col-span-3",
        buyer: "col-span-2",
        date: "col-span-2",
        gross: "col-span-2",
        platform: "col-span-1",
        cohost: "",
        cut: "col-span-2",
      };

  return (
    <div className="py-10">
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-black font-headline tracking-tight"
          style={{ color: INK }}
        >
          Earnings
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          What you&rsquo;ve earned across your experiences and sessions.
        </p>
      </div>

      {/* ── Top: net only ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div
          className="col-span-2 p-5 rounded-2xl backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(220, 252, 231, 0.78)",
            border: "1px solid rgba(16, 185, 129, 0.30)",
            boxShadow:
              "0 1px 2px rgba(15, 34, 41, 0.04), 0 4px 16px rgba(16, 185, 129, 0.12)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: GREEN }}
          >
            Total earned
          </p>
          <p
            className="text-3xl font-black font-headline tracking-tight"
            style={{ color: GREEN }}
          >
            {chf(totalEarned)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: GREEN2 }}>
            Net to your account
          </p>
        </div>

        <div className="p-5 rounded-2xl infitra-glass">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Sales
          </p>
          <p
            className="text-2xl font-black font-headline tracking-tight"
            style={{ color: INK }}
          >
            {salesCount}
          </p>
          <p className="text-[10px] mt-1" style={{ color: FAINT }}>
            Completed
          </p>
        </div>

        <div className="p-5 rounded-2xl infitra-glass">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Buyers
          </p>
          <p
            className="text-2xl font-black font-headline tracking-tight"
            style={{ color: INK }}
          >
            {buyers}
          </p>
          <p className="text-[10px] mt-1" style={{ color: FAINT }}>
            Unique customers
          </p>
        </div>
      </div>

      {/* ── Transactions: full breakdown lives here ───────── */}
      <div>
        <h2
          className="text-lg font-black font-headline tracking-tight mb-4"
          style={{ color: INK }}
        >
          Transactions
        </h2>

        {!hasRows ? (
          <div
            className="text-center py-16 rounded-2xl border border-dashed"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              borderColor: "rgba(15, 34, 41, 0.15)",
            }}
          >
            <p className="text-sm" style={{ color: MUTED }}>
              No earnings yet. Revenue will appear here when participants purchase
              your experiences or sessions.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl infitra-glass overflow-hidden">
            {/* Desktop header */}
            <div
              className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b text-[10px] font-bold uppercase tracking-widest font-headline"
              style={{
                borderColor: "rgba(15, 34, 41, 0.10)",
                color: "rgba(15, 34, 41, 0.55)",
              }}
            >
              <div className={C.item}>Item</div>
              <div className={C.buyer}>Buyer</div>
              <div className={C.date}>Date</div>
              <div className={`${C.gross} text-right`}>Gross</div>
              <div className={`${C.platform} text-right`}>Platform</div>
              {hasCohosts && (
                <div className={`${C.cohost} text-right`}>Co-host</div>
              )}
              <div className={`${C.cut} text-right`}>Your cut</div>
            </div>

            {/* Rows */}
            <div
              className="divide-y"
              style={{ borderColor: "rgba(15, 34, 41, 0.06)" }}
            >
              {rows.map((tx) => {
                const isBundle = tx.type === "bundle";
                const cohostCut = num(tx.cohost_cut_cents);
                const cohostLabel =
                  cohostCut > 0
                    ? tx.cohost_name ??
                      `${tx.cohost_count ?? ""} co-hosts`.trim()
                    : null;

                return (
                  <div key={tx.id} className="px-5 py-4">
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                      {/* Item */}
                      <div className={`${C.item} min-w-0`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded font-headline border ${
                              isBundle
                                ? "text-orange-700 bg-orange-100/80 border-orange-200"
                                : "text-cyan-700 bg-cyan-100/80 border-cyan-200"
                            }`}
                          >
                            {isBundle ? "EXPERIENCE" : "SESSION"}
                          </span>
                          {tx.my_role === "cohost" && (
                            <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded font-headline border text-emerald-700 bg-emerald-50 border-emerald-200">
                              CO-HOST {pct(num(tx.my_split_percent))}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-sm font-bold font-headline truncate mt-1"
                          style={{ color: INK }}
                        >
                          {tx.product_title ?? "Unknown"}
                        </p>
                      </div>

                      {/* Buyer */}
                      <div className={`${C.buyer} min-w-0`}>
                        <p className="text-xs truncate" style={{ color: "#475569" }}>
                          {tx.buyer_name ?? "—"}
                        </p>
                      </div>

                      {/* Date */}
                      <div className={C.date}>
                        <p className="text-xs" style={{ color: MUTED }}>
                          {formatDate(tx.created_at)}
                        </p>
                      </div>

                      {/* Gross */}
                      <div className={`${C.gross} text-right`}>
                        <p
                          className="text-xs font-headline font-bold"
                          style={{ color: INK }}
                        >
                          {chf(num(tx.amount_gross_cents))}
                        </p>
                      </div>

                      {/* Platform */}
                      <div className={`${C.platform} text-right`}>
                        <p className="text-xs" style={{ color: FAINT }}>
                          -{chf(num(tx.platform_cut_cents))}
                        </p>
                        <p className="text-[9px]" style={{ color: FAINT }}>
                          {pct(num(tx.effective_fee_percent))}
                        </p>
                      </div>

                      {/* Co-host */}
                      {hasCohosts && (
                        <div className={`${C.cohost} text-right min-w-0`}>
                          {cohostLabel ? (
                            <>
                              <p
                                className="text-[11px] truncate"
                                style={{ color: MUTED }}
                              >
                                {cohostLabel}
                              </p>
                              <p className="text-xs" style={{ color: FAINT }}>
                                -{chf(cohostCut)}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs" style={{ color: FAINT }}>
                              —
                            </p>
                          )}
                        </div>
                      )}

                      {/* Your cut */}
                      <div className={`${C.cut} text-right`}>
                        <p
                          className="text-sm font-black font-headline"
                          style={{ color: GREEN }}
                        >
                          {chf(num(tx.your_cut_cents))}
                        </p>
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div className="md:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded font-headline border ${
                                isBundle
                                  ? "text-orange-700 bg-orange-100/80 border-orange-200"
                                  : "text-cyan-700 bg-cyan-100/80 border-cyan-200"
                              }`}
                            >
                              {isBundle ? "EXPERIENCE" : "SESSION"}
                            </span>
                            {tx.my_role === "cohost" && (
                              <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded font-headline border text-emerald-700 bg-emerald-50 border-emerald-200">
                                CO-HOST {pct(num(tx.my_split_percent))}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-sm font-bold font-headline truncate"
                            style={{ color: INK }}
                          >
                            {tx.product_title ?? "Unknown"}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                            {(tx.buyer_name ?? "—") + " · " + formatDate(tx.created_at)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className="text-base font-black font-headline"
                            style={{ color: GREEN }}
                          >
                            {chf(num(tx.your_cut_cents))}
                          </p>
                          <p className="text-[10px]" style={{ color: FAINT }}>
                            your cut
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-2 text-[11px]"
                        style={{ color: MUTED }}
                      >
                        <span>Gross {chf(num(tx.amount_gross_cents))}</span>
                        <span>
                          Platform -{chf(num(tx.platform_cut_cents))} (
                          {pct(num(tx.effective_fee_percent))})
                        </span>
                        {cohostLabel && (
                          <span>
                            {cohostLabel} -{chf(cohostCut)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals row — full reconciliation under the lines */}
            <div
              className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-t text-xs font-headline"
              style={{
                borderColor: "rgba(15, 34, 41, 0.12)",
                backgroundColor: "rgba(15, 34, 41, 0.02)",
              }}
            >
              <div
                className={`${C.item} font-bold uppercase tracking-widest text-[10px]`}
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Totals
              </div>
              <div className={C.buyer} />
              <div className={C.date} />
              <div className={`${C.gross} text-right font-bold`} style={{ color: INK }}>
                {chf(totalGross)}
              </div>
              <div className={`${C.platform} text-right`} style={{ color: MUTED }}>
                -{chf(totalPlatform)}
              </div>
              {hasCohosts && (
                <div className={`${C.cohost} text-right`} style={{ color: MUTED }}>
                  -{chf(totalCohost)}
                </div>
              )}
              <div
                className={`${C.cut} text-right font-black`}
                style={{ color: GREEN }}
              >
                {chf(totalEarned)}
              </div>
            </div>

            {/* Mobile totals */}
            <div
              className="md:hidden px-5 py-4 border-t flex items-center justify-between"
              style={{
                borderColor: "rgba(15, 34, 41, 0.12)",
                backgroundColor: "rgba(15, 34, 41, 0.02)",
              }}
            >
              <div className="text-[11px]" style={{ color: MUTED }}>
                <p>Gross {chf(totalGross)}</p>
                <p>
                  Platform -{chf(totalPlatform)}
                  {hasCohosts ? ` · Co-hosts -${chf(totalCohost)}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-lg font-black font-headline"
                  style={{ color: GREEN }}
                >
                  {chf(totalEarned)}
                </p>
                <p className="text-[10px]" style={{ color: FAINT }}>
                  total earned
                </p>
              </div>
            </div>
          </div>
        )}

        {hasRows && (
          <p className="text-[11px] mt-3" style={{ color: FAINT }}>
            Card processing fees are covered by the buyer at checkout — they
            don&rsquo;t affect your earnings.
          </p>
        )}
      </div>
    </div>
  );
}
