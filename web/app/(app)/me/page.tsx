import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { ParticipantPanel } from "./ParticipantPanel";
import {
  ParticipantExperienceCard,
  CompletedExperienceCard,
  type MeExperience,
} from "./ParticipantExperienceCard";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your experiences — INFITRA" };

/**
 * /me — the participant home, rendered from the creator dashboard's vocabulary:
 * a lean profile console on the left, the experiences you've joined as cards on
 * the right (cover · momentum · next moment · Enter your space), and completed
 * experiences below with a "Rate this experience" nudge.
 */

type StageM = "pre-launch" | "live" | "completed";

function computeStage(status: string, startDate: string | null, endDate: string | null): StageM {
  const today = new Date().toISOString().slice(0, 10);
  if (status === "completed" || (endDate && endDate < today)) return "completed";
  if (startDate && startDate <= today && (!endDate || endDate >= today)) return "live";
  return "pre-launch";
}

interface ChallengeRow {
  id: string;
  title: string;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

// All data loading lives here (not in the component body) so the impure
// time calls stay out of render — same pattern as the creator dashboard.
async function loadMe(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, role, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("app_challenge_member")
    .select("challenge_id, app_challenge(id, title, image_url, start_date, end_date, status)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  const rows = ((memberships ?? []) as Array<{ app_challenge: ChallengeRow | ChallengeRow[] | null }>)
    .map((m) => (Array.isArray(m.app_challenge) ? m.app_challenge[0] : m.app_challenge))
    .filter((c): c is ChallengeRow => !!c);

  const challengeIds = rows.map((r) => r.id);

  // ── Spaces (the doorway) ──
  const { data: spaces } = challengeIds.length
    ? await supabase
        .from("app_challenge_space")
        .select("id, source_challenge_id")
        .in("source_challenge_id", challengeIds)
    : { data: [] };
  const spaceByChallenge = new Map<string, string>();
  const challengeBySpace = new Map<string, string>();
  for (const s of (spaces ?? []) as Array<{ id: string; source_challenge_id: string | null }>) {
    if (s.source_challenge_id) {
      spaceByChallenge.set(s.source_challenge_id, s.id);
      challengeBySpace.set(s.id, s.source_challenge_id);
    }
  }

  const stageById = new Map<string, StageM>();
  for (const r of rows) stageById.set(r.id, computeStage(r.status, r.start_date, r.end_date));

  // ── Next session per experience ──
  const nextByChallenge = new Map<string, MeExperience["nextSession"]>();
  if (challengeIds.length) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(id, title, start_time, status, image_url)")
      .in("challenge_id", challengeIds);
    const nowMs = Date.now();
    const byChallenge = new Map<
      string,
      Array<{ title: string; start_time: string; status: string; image_url: string | null }>
    >();
    for (const l of (links ?? []) as Array<{ challenge_id: string; app_session: unknown }>) {
      const s = (Array.isArray(l.app_session) ? l.app_session[0] : l.app_session) as
        | { title: string; start_time: string; status: string; image_url: string | null }
        | null;
      if (!s) continue;
      const arr = byChallenge.get(l.challenge_id) ?? [];
      arr.push(s);
      byChallenge.set(l.challenge_id, arr);
    }
    for (const [cid, sess] of byChallenge) {
      const upcoming = sess
        .filter((s) => s.status === "published" && new Date(s.start_time).getTime() > nowMs)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      if (upcoming[0]) {
        nextByChallenge.set(cid, {
          title: upcoming[0].title,
          startTime: upcoming[0].start_time,
          imageUrl: upcoming[0].image_url ?? null,
        });
      }
    }
  }

  // ── New posts (last 7d) across the active experiences' spaces ──
  const postsByChallenge = new Map<string, number>();
  const activeSpaceIds = rows
    .filter((r) => stageById.get(r.id) !== "completed")
    .map((r) => spaceByChallenge.get(r.id))
    .filter((x): x is string => !!x);
  if (activeSpaceIds.length) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: posts } = await supabase
      .from("app_challenge_post")
      .select("space_id")
      .in("space_id", activeSpaceIds)
      .neq("author_id", userId)
      .gte("created_at", sevenDaysAgo);
    for (const p of (posts ?? []) as Array<{ space_id: string }>) {
      const cid = challengeBySpace.get(p.space_id);
      if (cid) postsByChallenge.set(cid, (postsByChallenge.get(cid) ?? 0) + 1);
    }
  }

  // ── Which completed experiences the viewer has already rated ──
  const ratedSet = new Set<string>();
  const completedIds = rows.filter((r) => stageById.get(r.id) === "completed").map((r) => r.id);
  if (completedIds.length) {
    const { data: reviews } = await supabase
      .from("app_review")
      .select("challenge_id")
      .eq("reviewer_id", userId)
      .in("challenge_id", completedIds);
    for (const rv of (reviews ?? []) as Array<{ challenge_id: string }>) ratedSet.add(rv.challenge_id);
  }

  const experiences: MeExperience[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    startDate: r.start_date,
    endDate: r.end_date,
    spaceId: spaceByChallenge.get(r.id) ?? null,
    stage: stageById.get(r.id) ?? "pre-launch",
    nextSession: nextByChallenge.get(r.id) ?? null,
    newPosts: postsByChallenge.get(r.id) ?? 0,
    rated: ratedSet.has(r.id),
  }));

  const active = experiences.filter((e) => e.stage !== "completed");
  const completed = experiences.filter((e) => e.stage === "completed");
  const tribePulse = {
    newPosts: active.reduce((n, e) => n + e.newPosts, 0),
    experiences: active.length,
  };

  return { profile, active, completed, tribePulse };
}

export default async function MeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/me");

  const viewerTimeZone = await resolveViewerTimeZone();
  const { profile, active, completed, tribePulse } = await loadMe(user.id);

  return (
    <>
      <ParticipantNav displayName={profile?.display_name ?? null} role={profile?.role ?? undefined} />

      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto py-8">
          {/* Console — "you" left, your experiences right. Equal height when
              there's a single active experience (mirrors the creator card);
              top-aligned when there are several. */}
          <div
            className={`lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 ${
              active.length === 1 ? "lg:items-stretch" : "lg:items-start"
            }`}
          >
            <aside className="mb-8 lg:mb-0">
              <ParticipantPanel
                displayName={profile?.display_name ?? ""}
                avatarUrl={profile?.avatar_url ?? null}
                joinedAt={(profile as { created_at?: string } | null)?.created_at ?? null}
                tribePulse={tribePulse}
                hasActiveExperiences={active.length > 0}
              />
            </aside>

            <div className="min-w-0 space-y-5">
              {active.length > 0 ? (
                active.map((e) => (
                  <ParticipantExperienceCard key={e.id} exp={e} timeZone={viewerTimeZone} />
                ))
              ) : (
                <EmptyState hasCompleted={completed.length > 0} />
              )}
            </div>
          </div>

          {/* Completed — with the rate nudge. */}
          {completed.length > 0 && (
            <div className="mt-14">
              <p
                className="text-[11px] uppercase tracking-[0.22em] font-headline mb-5 px-1"
                style={{ color: "#475569", fontWeight: 700 }}
              >
                Completed
                <span style={{ color: "#94a3b8" }}> · {completed.length}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map((e) => (
                  <CompletedExperienceCard key={e.id} exp={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function EmptyState({ hasCompleted }: { hasCompleted: boolean }) {
  return (
    <div
      className="rounded-3xl p-8 md:p-10"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 10px 32px rgba(15,34,41,0.10)" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3"
        style={{ color: "#0891b2", fontWeight: 700 }}
      >
        {hasCompleted ? "Nothing live right now" : "Welcome"}
      </p>
      <h2
        className="text-2xl md:text-3xl font-headline tracking-tight mb-3"
        style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {hasCompleted ? "No active experiences" : "You haven’t joined an experience yet"}
      </h2>
      <p className="text-sm md:text-base max-w-md" style={{ color: "#64748b" }}>
        When you join a live experience, it shows up here — with the next moment and a
        door straight into your tribe.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 px-6 py-3 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: "#0891b2", boxShadow: "0 4px 14px rgba(8,145,178,0.30)" }}
      >
        Explore experiences →
      </Link>
    </div>
  );
}
