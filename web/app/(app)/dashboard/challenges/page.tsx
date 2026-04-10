import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CSSProperties } from "react";
import { createDraftChallenge } from "@/app/actions/challenge";

export const metadata = {
  title: "Challenges — INFITRA",
};

// ── Light theme tokens ──────────────────────────────────────────
// No featured extra styling — all cards are uniform

const buttonOrangePill: CSSProperties = {
  backgroundColor: "#FF6130",
  boxShadow:
    "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "text-slate-500 bg-slate-100/70 border-slate-200",
  },
  published: {
    label: "Published",
    color: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
  },
  completed: {
    label: "Completed",
    color: "text-slate-500 bg-slate-100/70 border-slate-200",
  },
  canceled: {
    label: "Canceled",
    color: "text-slate-400 bg-slate-100/50 border-slate-200",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ChallengesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenges } = await supabase
    .from("app_challenge")
    .select(
      "id, title, status, start_date, end_date, price_cents, capacity, created_at"
    )
    .eq("owner_id", user!.id)
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const challengeIds = (challenges ?? []).map((c: any) => c.id);
  const { data: sessionCounts } = challengeIds.length
    ? await supabase
        .from("app_challenge_session")
        .select("challenge_id")
        .in("challenge_id", challengeIds)
    : { data: [] };

  const countMap: Record<string, number> = {};
  (sessionCounts ?? []).forEach((row: any) => {
    countMap[row.challenge_id] = (countMap[row.challenge_id] ?? 0) + 1;
  });

  const hasChallenges = challenges && challenges.length > 0;

  // Featured: currently-running > next upcoming
  const today = new Date().toISOString().split("T")[0];
  const publishedChallenges = (challenges ?? []).filter(
    (c: any) => c.status === "published",
  );
  const runningChallenge = publishedChallenges.find(
    (c: any) => c.start_date <= today && c.end_date >= today,
  );
  const upcomingChallenge = publishedChallenges
    .filter((c: any) => c.start_date > today)
    .sort((a: any, b: any) => a.start_date.localeCompare(b.start_date))[0];
  const featuredChallenge = runningChallenge ?? upcomingChallenge;
  const featuredLabel = runningChallenge ? "Active" : "Next up";

  const orderedChallenges = (() => {
    if (!challenges) return [];
    if (!featuredChallenge) return challenges;
    const rest = challenges.filter((c: any) => c.id !== featuredChallenge.id);
    return [featuredChallenge, ...rest];
  })();

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1
            className="text-3xl md:text-4xl font-black font-headline tracking-tight"
            style={{ color: "#0F2229" }}
          >
            Challenges
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Build multi-session programmes for your community.
          </p>
        </div>
        <form action={createDraftChallenge}>
          <button
            type="submit"
            className="px-7 py-3 rounded-md text-white text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
            style={buttonOrangePill}
          >
            New Challenge
          </button>
        </form>
      </div>

      {!hasChallenges ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              backgroundColor: "rgba(255, 97, 48, 0.10)",
              border: "1px solid rgba(255, 97, 48, 0.25)",
            }}
          >
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="#FF6130"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h2
            className="text-xl font-black font-headline tracking-tight mb-2"
            style={{ color: "#0F2229" }}
          >
            No challenges yet
          </h2>
          <p
            className="text-sm mb-6 max-w-xs mx-auto"
            style={{ color: "#64748b" }}
          >
            Create your first challenge to bundle sessions into a programme.
          </p>
          <form action={createDraftChallenge} className="inline-block">
            <button
              type="submit"
              className="px-7 py-3 rounded-md text-white text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
              style={buttonOrangePill}
            >
              Create Challenge
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3 pb-12">
          {orderedChallenges.map((challenge: any) => {
            const s = STATUS_STYLES[challenge.status] ?? STATUS_STYLES.draft;
            const priceCHF = (challenge.price_cents ?? 0) / 100;
            const sessionCount = countMap[challenge.id] ?? 0;
            const isFeatured = challenge.id === featuredChallenge?.id;

            return (
              <Link
                key={challenge.id}
                href={`/dashboard/challenges/${challenge.id}`}
                className="block p-5 rounded-2xl infitra-card-link group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isFeatured && (
                        <span
                          className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] shrink-0"
                          style={{ color: "#0891b2" }}
                        >
                          {featuredLabel}
                        </span>
                      )}
                      <h3
                        className="text-lg font-black font-headline tracking-tight truncate text-[#0F2229] group-hover:text-[#FF6130]"
                      >
                        {challenge.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-4 text-xs"
                      style={{ color: "#64748b" }}
                    >
                      <span>
                        {formatDate(challenge.start_date)} —{" "}
                        {formatDate(challenge.end_date)}
                      </span>
                      <span>
                        {sessionCount} session{sessionCount !== 1 ? "s" : ""}
                      </span>
                      {priceCHF > 0 && <span>CHF {priceCHF.toFixed(2)}</span>}
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    className="shrink-0 mt-1 opacity-0 group-hover:opacity-50"
                    style={{ color: "#0F2229" }}
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
