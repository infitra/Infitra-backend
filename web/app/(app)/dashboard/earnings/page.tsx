import { createClient } from "@/lib/supabase/server";

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
  const totalAttendees = Number(summary?.total_attendees ?? 0);

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
        <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
          Earnings
        </h1>
        <p className="text-sm text-[#9CF0FF]/40 mt-1">
          Revenue breakdown across all your sessions and challenges.
        </p>
      </div>

      {/* ── Summary Cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            Total Revenue
          </p>
          <p className="text-2xl font-black text-white font-headline tracking-tight">
            {chf(grossCents)}
          </p>
          <p className="text-[10px] text-[#9CF0FF]/25 mt-1">Gross sales</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-green-400/15">
          <p className="text-[10px] font-bold text-green-400/60 uppercase tracking-widest font-headline mb-2">
            Your Earnings
          </p>
          <p className="text-2xl font-black text-green-400 font-headline tracking-tight">
            {chf(creatorCutCents)}
          </p>
          <p className="text-[10px] text-[#9CF0FF]/25 mt-1">
            80% creator share
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            Platform Fee
          </p>
          <p className="text-2xl font-black text-[#9CF0FF]/50 font-headline tracking-tight">
            {chf(platformCutCents)}
          </p>
          <p className="text-[10px] text-[#9CF0FF]/25 mt-1">
            20% of gross
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
          <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
            Buyers
          </p>
          <p className="text-2xl font-black text-white font-headline tracking-tight">
            {uniqueBuyers}
          </p>
          <p className="text-[10px] text-[#9CF0FF]/25 mt-1">
            Unique customers
          </p>
        </div>
      </div>

      {/* ── Revenue Breakdown ────────────────────────────── */}
      {hasTransactions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          <div className="px-5 py-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline">
                Sessions
              </p>
              <p className="text-xs text-[#9CF0FF]/25 mt-0.5">
                Ticket sales
              </p>
            </div>
            <p className="text-lg font-black text-white font-headline">
              {chf(sessionRevenue)}
            </p>
          </div>
          <div className="px-5 py-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline">
                Challenges
              </p>
              <p className="text-xs text-[#9CF0FF]/25 mt-0.5">
                Bundle sales
              </p>
            </div>
            <p className="text-lg font-black text-white font-headline">
              {chf(challengeRevenue)}
            </p>
          </div>
          <div className="px-5 py-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline">
                Processing
              </p>
              <p className="text-xs text-[#9CF0FF]/25 mt-0.5">
                Stripe fees
              </p>
            </div>
            <p className="text-lg font-black text-[#9CF0FF]/40 font-headline">
              {chf(totalFees)}
            </p>
          </div>
        </div>
      )}

      {/* ── Transaction History ──────────────────────────── */}
      <div>
        <h2 className="text-lg font-black text-white font-headline tracking-tight mb-4">
          Transactions
        </h2>

        {!hasTransactions ? (
          <div className="text-center py-16 rounded-2xl bg-[#0F2229] border border-dashed border-[#9CF0FF]/10">
            <p className="text-sm text-[#9CF0FF]/30">
              No transactions yet. Revenue will appear here when participants
              purchase your sessions or challenges.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#9CF0FF]/8 text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline">
              <div className="col-span-3">Item</div>
              <div className="col-span-2">Buyer</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Gross</div>
              <div className="col-span-1 text-right">Fees</div>
              <div className="col-span-1 text-right">Platform</div>
              <div className="col-span-2 text-right">Your Cut</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#9CF0FF]/5">
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
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-[#9CF0FF]/3 transition-colors"
                  >
                    {/* Item */}
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded font-headline ${
                            tx.type === "bundle"
                              ? "text-[#FF6130]/60 bg-[#FF6130]/10"
                              : "text-[#9CF0FF]/50 bg-[#9CF0FF]/8"
                          }`}
                        >
                          {tx.type === "bundle" ? "CHALLENGE" : "SESSION"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white font-headline truncate mt-1">
                        {itemTitle ?? "Unknown"}
                      </p>
                    </div>

                    {/* Buyer */}
                    <div className="col-span-2 flex items-center">
                      <p className="text-xs text-[#9CF0FF]/50 truncate">
                        {tx.buyer_name ?? "—"}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center">
                      <p className="text-xs text-[#9CF0FF]/40">
                        {formatDate(tx.created_at)}{" "}
                        <span className="text-[#9CF0FF]/25">
                          {formatTime(tx.created_at)}
                        </span>
                      </p>
                    </div>

                    {/* Gross */}
                    <div className="col-span-1 flex items-center justify-end">
                      <p className="text-xs text-white font-headline font-bold">
                        {chf(tx.amount_gross_cents)}
                      </p>
                    </div>

                    {/* Fees */}
                    <div className="col-span-1 flex items-center justify-end">
                      <p className="text-xs text-[#9CF0FF]/30">
                        -{chf(fees)}
                      </p>
                    </div>

                    {/* Platform */}
                    <div className="col-span-1 flex items-center justify-end">
                      <p className="text-xs text-[#9CF0FF]/30">
                        -{chf(tx.platform_cut_cents)}
                      </p>
                    </div>

                    {/* Your Cut */}
                    <div className="col-span-2 flex items-center justify-end">
                      <p className="text-sm font-black text-green-400 font-headline">
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
