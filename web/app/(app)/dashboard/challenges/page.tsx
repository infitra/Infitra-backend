import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CSSProperties } from "react";
import { createDraftChallenge } from "@/app/actions/challenge";

export const metadata = {
  title: "Challenges — INFITRA",
};

// ── Beam vocabulary tokens ──────────────────────────────────────
// Inset bottom line follows any rounded radius automatically; outer
// shadows provide the downward-biased halo. Cyan = featured / structural,
// Orange = primary action.
const cardBeamCyan: CSSProperties = {
  boxShadow: [
    "inset 0 -3px 0 #9CF0FF",
    "0 0 18px rgba(156,240,255,0.45)",
    "0 0 48px rgba(156,240,255,0.20)",
    "0 6px 30px rgba(156,240,255,0.32)",
    "0 14px 50px rgba(156,240,255,0.16)",
  ].join(", "),
};

const buttonBeamOrange: CSSProperties = {
  boxShadow: [
    "inset 0 -3px 0 #FF6130",
    "0 0 14px rgba(255,97,48,0.55)",
    "0 0 36px rgba(255,97,48,0.28)",
    "0 5px 22px rgba(255,97,48,0.40)",
  ].join(", "),
};

// Status badges — kept inside the cyan family so they don't compete
// with the beam vocabulary.
const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "text-[#9CF0FF]/50 bg-[#9CF0FF]/8 border-[#9CF0FF]/15",
  },
  published: {
    label: "Published",
    color: "text-[#9CF0FF] bg-[#9CF0FF]/10 border-[#9CF0FF]/25",
  },
  completed: {
    label: "Completed",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/4 border-[#9CF0FF]/10",
  },
  canceled: {
    label: "Canceled",
    color: "text-white/30 bg-white/4 border-white/10",
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

  // Query user's challenges directly — vw_my_challenges_overview may be empty for new creators
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

  // Get session counts per challenge
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

  // Identify the Featured challenge — the only row that gets the cyan beam.
  // Priority: currently-running published challenge → otherwise the next
  // upcoming published challenge.
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

  // Reorder so the featured challenge is always first in the list —
  // otherwise the cyan beam can hide far down a long history.
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
          <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
            Challenges
          </h1>
          <p className="text-sm text-[#9CF0FF]/40 mt-1">
            Build multi-session programmes for your community.
          </p>
        </div>
        <form action={createDraftChallenge}>
          <button
            type="submit"
            className="px-7 py-3 rounded-md bg-[#0F2229] text-[#FF6130] text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
            style={buttonBeamOrange}
          >
            New Challenge
          </button>
        </form>
      </div>

      {!hasChallenges ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#FF6130]/10 border border-[#FF6130]/20 flex items-center justify-center mx-auto mb-6">
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
          <h2 className="text-xl font-black text-white font-headline tracking-tight mb-2">
            No challenges yet
          </h2>
          <p className="text-sm text-[#9CF0FF]/40 mb-6 max-w-xs mx-auto">
            Create your first challenge to bundle sessions into a programme.
          </p>
          <form action={createDraftChallenge} className="inline-block">
            <button
              type="submit"
              className="px-7 py-3 rounded-md bg-[#0F2229] text-[#FF6130] text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
              style={buttonBeamOrange}
            >
              Create Challenge
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {orderedChallenges.map((challenge: any) => {
            const s = STATUS_STYLES[challenge.status] ?? STATUS_STYLES.draft;
            const priceCHF = (challenge.price_cents ?? 0) / 100;
            const sessionCount = countMap[challenge.id] ?? 0;
            const isFeatured = challenge.id === featuredChallenge?.id;

            return (
              <Link
                key={challenge.id}
                href={`/dashboard/challenges/${challenge.id}`}
                className="beam-hover-cyan block p-5 rounded-xl bg-[rgba(15,34,41,0.55)] backdrop-blur-xl border border-[rgba(156,240,255,0.10)] hover:bg-[rgba(15,34,41,0.85)] hover:border-[rgba(156,240,255,0.28)] group"
                style={isFeatured ? cardBeamCyan : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isFeatured && (
                        <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CF0FF] shrink-0">
                          {featuredLabel}
                        </span>
                      )}
                      <h3 className="text-lg font-black text-white font-headline tracking-tight truncate">
                        {challenge.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9CF0FF]/40">
                      <span>
                        {formatDate(challenge.start_date)} —{" "}
                        {formatDate(challenge.end_date)}
                      </span>
                      <span>
                        {sessionCount} session
                        {sessionCount !== 1 ? "s" : ""}
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
                    className="text-[#9CF0FF]/30 group-hover:text-[#9CF0FF]/60 transition-colors shrink-0 mt-1"
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
