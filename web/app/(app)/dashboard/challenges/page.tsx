import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";

export const metadata = {
  title: "Challenges — INFITRA",
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "text-[#9CF0FF]/50 bg-[#9CF0FF]/8 border-[#9CF0FF]/15",
  },
  published: {
    label: "Published",
    color: "text-green-400 bg-green-400/8 border-green-400/20",
  },
  completed: {
    label: "Completed",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/5 border-[#9CF0FF]/10",
  },
  canceled: {
    label: "Canceled",
    color: "text-red-400/60 bg-red-400/8 border-red-400/15",
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
            className="px-5 py-2.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)]"
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
              className="px-6 py-3 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)]"
            >
              Create Challenge
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge: any) => {
            const s =
              STATUS_STYLES[challenge.status] ?? STATUS_STYLES.draft;
            const priceCHF = (challenge.price_cents ?? 0) / 100;
            const sessionCount = countMap[challenge.id] ?? 0;

            return (
              <Link
                key={challenge.id}
                href={`/dashboard/challenges/${challenge.id}`}
                className="block p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#FF6130]/25 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-white font-headline tracking-tight truncate group-hover:text-[#FF6130] transition-colors">
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
                      {priceCHF > 0 && (
                        <span>CHF {priceCHF.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    className="text-[#9CF0FF]/20 group-hover:text-[#FF6130] transition-colors shrink-0 mt-1"
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
