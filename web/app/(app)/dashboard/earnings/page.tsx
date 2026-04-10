import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Earnings — INFITRA",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function chf(cents: number) {
  return `CHF ${(cents / 100).toFixed(2)}`;
}

export default async function EarningsPage() {
  const supabase = await createClient();

  // Summary stats
  const { data: summary } = await supabase
    .from("vw_my_creator_summary")
    .select("*")
    .single();

  const grossCents = Number(summary?.gross_cents ?? 0);
  const creatorCutCents = Number(summary?.creator_cut_cents ?? 0);
  const platformCutCents = grossCents - creatorCutCents;
  const uniqueBuyers = Number(summary?.unique_buyers ?? 0);

  // Transaction history
  const { data: transactions } = await supabase
    .from("vw_my_transactions")
    .select("*");

  const hasTransactions = transactions && transactions.length > 0;

  // Compute totals by type
  const sessionRevenue = (transactions ?? [])
    .filter((t: any) => t.type === "ticket")
    .reduce((sum: number, t: any) => sum + (t.creator_cut_cents ?? 0), 0);
  const challengeRevenue = (transactions ?? [])
    .filter((t: any) => t.type === "bundle")
    .reduce((sum: number, t: any) => sum + (t.creator_cut_cents ?? 0), 0);
  const totalFees = (transactions ?? []).reduce(
    (sum: number, t: any) =>
      sum +
      (t.processing_fee_fixed_cents ?? 0) +
      (t.processing_fee_percent_cents ?? 0),
    0
  );

  return (
    <div className="py-10">
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-black font-headline tracking-tight"
          style={{ color: "#0F2229" }}
        >
          Earnings
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Revenue breakdown across all your sessions and challenges.
        </p>
      </div>

      {/* ── Summary Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="p-5 rounded-2xl infitra-glass">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Total Revenue
          </p>
          <p
            className="text-2xl font-black font-headline tracking-tight"
            style={{ color: "#0F2229" }}
          >
            {chf(grossCents)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>
            Gross sales
          </p>
        </div>
        <div
          className="p-5 rounded-2xl backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(220, 252, 231, 0.78)",
            border: "1px solid rgba(16, 185, 129, 0.30)",
            boxShadow:
              "0 1px 2px rgba(15, 34, 41, 0.04), 0 4px 16px rgba(16, 185, 129, 0.12)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: "#047857" }}
          >
            Your Earnings
          </p>
          <p
            className="text-2xl font-black font-headline tracking-tight"
            style={{ color: "#047857" }}
          >
            {chf(creatorCutCents)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#059669" }}>
            80% creator share
          </p>
        </div>
        <div className="p-5 rounded-2xl infitra-glass">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Platform Fee
          </p>
          <p
            className="text-2xl font-black font-headline tracking-tight"
            style={{ color: "#64748b" }}
          >
            {chf(platformCutCents)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>
            20% of gross
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
            style={{ color: "#0F2229" }}
          >
            {uniqueBuyers}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>
            Unique customers
          </p>
        </div>
      </div>

      {/* ── Revenue Breakdown ────────────────────────────── */}
      {hasTransactions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <div className="px-5 py-4 rounded-xl infitra-glass flex items-center justify-between">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Sessions
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Ticket sales
              </p>
            </div>
            <p
              className="text-lg font-black font-headline"
              style={{ color: "#0F2229" }}
            >
              {chf(sessionRevenue)}
            </p>
          </div>
          <div className="px-5 py-4 rounded-xl infitra-glass flex items-center justify-between">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Challenges
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Bundle sales
              </p>
            </div>
            <p
              className="text-lg font-black font-headline"
              style={{ color: "#0F2229" }}
            >
              {chf(challengeRevenue)}
            </p>
          </div>
          <div className="px-5 py-4 rounded-xl infitra-glass flex items-center justify-between">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Processing
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Stripe fees
              </p>
            </div>
            <p
              className="text-lg font-black font-headline"
              style={{ color: "#64748b" }}
            >
              {chf(totalFees)}
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction History ──────────────────────────── */}
      <div>
        <h2
          className="text-lg font-black font-headline tracking-tight mb-4"
          style={{ color: "#0F2229" }}
        >
          Transactions
        </h2>

        {!hasTransactions ? (
          <div
            className="text-center py-16 rounded-2xl border border-dashed"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              borderColor: "rgba(15, 34, 41, 0.15)",
            }}
          >
            <p className="text-sm" style={{ color: "#64748b" }}>
              No transactions yet. Revenue will appear here when participants
              purchase your sessions or challenges.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl infitra-glass overflow-hidden">
            {/* Table header */}
            <div
              className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b text-[10px] font-bold uppercase tracking-widest font-headline"
              style={{
                borderColor: "rgba(15, 34, 41, 0.10)",
                color: "rgba(15, 34, 41, 0.55)",
              }}
            >
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Buyer</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Gross</div>
              <div className="col-span-1 text-right">Fees</div>
              <div className="col-span-1 text-right">Platform</div>
              <div className="col-span-2 text-right">Your Cut</div>
            </div>

            {/* Rows */}
            <div
              className="divide-y"
              style={{ borderColor: "rgba(15, 34, 41, 0.06)" }}
            >
              {transactions!.map((tx: any) => {
                const itemTitle =
                  tx.type === "bundle"
                    ? tx.challenge_title
                    : tx.session_title;
                const fees =
                  (tx.processing_fee_fixed_cents ?? 0) +
                  (tx.processing_fee_percent_cents ?? 0);

                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 transition-colors"
                  >
                    {/* Item */}
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded font-headline border ${
                            tx.type === "bundle"
                              ? "text-orange-700 bg-orange-100/80 border-orange-200"
                              : "text-cyan-700 bg-cyan-100/80 border-cyan-200"
                          }`}
                        >
                          {tx.type === "bundle" ? "CHALLENGE" : "SESSION"}
                        </span>
                      </div>
                      <p
                        className="text-sm font-bold font-headline truncate mt-1"
                        style={{ color: "#0F2229" }}
                      >
                        {itemTitle ?? "Unknown"}
                      </p>
                    </div>

                    {/* Buyer */}
                    <div className="col-span-2 flex items-center">
                      {tx.buyer_id ? (
                        <Link
                          href={`/profile/${tx.buyer_id}`}
                          className="text-xs truncate transition-colors hover:opacity-75"
                          style={{ color: "#475569" }}
                        >
                          {tx.buyer_name ?? "—"}
                        </Link>
                      ) : (
                        <p
                          className="text-xs truncate"
                          style={{ color: "#475569" }}
                        >
                          —
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center">
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        {formatDate(tx.created_at)}{" "}
                        <span style={{ color: "#94a3b8" }}>
                          {formatTime(tx.created_at)}
                        </span>
                      </p>
                    </div>

                    {/* Gross */}
                    <div className="col-span-1 flex items-center justify-end">
                      <p
                        className="text-xs font-headline font-bold"
                        style={{ color: "#0F2229" }}
                      >
                        {chf(tx.amount_gross_cents)}
                      </p>
                    </div>

                    {/* Fees */}
                    <div className="col-span-1 flex items-center justify-end">
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        -{chf(fees)}
                      </p>
                    </div>

                    {/* Platform */}
                    <div className="col-span-1 flex items-center justify-end">
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        -{chf(tx.platform_cut_cents)}
                      </p>
                    </div>

                    {/* Your Cut */}
                    <div className="col-span-2 flex items-center justify-end">
                      <p
                        className="text-sm font-black font-headline"
                        style={{ color: "#047857" }}
                      >
                        {chf(tx.creator_cut_cents)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
