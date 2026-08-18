import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sessionLiveState } from "@/lib/liveWindow";
import { LiveSessionBanner } from "@/app/components/LiveSessionBanner";
import { LiveMomentWatcher } from "@/app/components/LiveMomentWatcher";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { ParticipantPanel } from "./ParticipantPanel";
import { ProfileModalHost } from "@/app/components/ProfileModal";
import { OverlayHost } from "@/app/components/DashboardOverlay";
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
  owner_id: string;
}

// All data loading lives here (not in the component body) so the impure
// time calls stay out of render — same pattern as the creator dashboard.
async function loadMe(userId: string) {
  const supabase = await createClient();

  // This function was a 14-round-trip WATERFALL — every query awaited one
  // by one, ~1.5s of pure serialized latency on a phone before the first
  // byte (13 Aug rehearsal: "mobile lags in loading"). Same queries, same
  // derivations, restructured into three Promise.all phases by what each
  // actually depends on. Depth is now 3 round trips, not 14.

  // PHASE 1 — the two roots everything hangs off: who the viewer is, and
  // which experiences they belong to.
  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("app_profile")
      .select("display_name, role, avatar_url, created_at, profile_facts, visibility")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("app_challenge_member")
      .select("challenge_id, app_challenge(id, title, image_url, start_date, end_date, status, owner_id)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false }),
  ]);
  const profile = profileResult.data;

  const rows = ((membershipsResult.data ?? []) as Array<{ app_challenge: ChallengeRow | ChallengeRow[] | null }>)
    .map((m) => (Array.isArray(m.app_challenge) ? m.app_challenge[0] : m.app_challenge))
    .filter((c): c is ChallengeRow => !!c);

  const challengeIds = rows.map((r) => r.id);

  const stageById = new Map<string, StageM>();
  for (const r of rows) stageById.set(r.id, computeStage(r.status, r.start_date, r.end_date));
  const completedIds = rows.filter((r) => stageById.get(r.id) === "completed").map((r) => r.id);

  // PHASE 2 — everything that needs only the membership list: spaces,
  // cohost links, session links, reviews, continuation groups, tribe faces.
  const none = Promise.resolve({ data: [] as any[] });
  const [spacesResult, cohostsResult, linksResult, reviewsResult, grpResult, facesResult] =
    await Promise.all([
      challengeIds.length
        ? supabase
            .from("app_challenge_space")
            .select("id, source_challenge_id")
            .in("source_challenge_id", challengeIds)
        : none,
      challengeIds.length
        ? supabase
            .from("app_challenge_cohost")
            .select("challenge_id, cohost_id")
            .in("challenge_id", challengeIds)
        : none,
      challengeIds.length
        ? supabase
            .from("app_challenge_session")
            .select(
              "challenge_id, app_session(id, title, start_time, duration_minutes, status, image_url, live_room_id, started_at)",
            )
            .in("challenge_id", challengeIds)
        : none,
      completedIds.length
        ? supabase
            .from("app_review")
            .select("challenge_id")
            .eq("reviewer_id", userId)
            .in("challenge_id", completedIds)
        : none,
      completedIds.length
        ? supabase
            .from("app_challenge")
            .select("id, continuation_group_id")
            .in("id", completedIds)
        : none,
      challengeIds.length
        ? supabase.rpc("load_tribe_faces", { p_challenge_ids: challengeIds, p_limit: 11 })
        : none,
    ]);

  // ── Spaces (the doorway) ──
  const spaceByChallenge = new Map<string, string>();
  const challengeBySpace = new Map<string, string>();
  for (const s of (spacesResult.data ?? []) as Array<{ id: string; source_challenge_id: string | null }>) {
    if (s.source_challenge_id) {
      spaceByChallenge.set(s.source_challenge_id, s.id);
      challengeBySpace.set(s.id, s.source_challenge_id);
    }
  }

  // ── Experts (owner + co-hosts) per experience ──
  // Same RLS-safe path the public buyer page uses (app_challenge_cohost.cohost_id
  // + app_profile), so a member can read who's leading. The cohost links
  // arrived in phase 2; the profile lookup needs their ids, so it rides
  // phase 3 below, and the assembly happens after it.
  const expertsByChallenge = new Map<string, MeExperience["experts"]>();
  const cohostsByChallenge = new Map<string, string[]>();
  const personIds = new Set<string>();
  for (const r of rows) personIds.add(r.owner_id);
  for (const c of (cohostsResult.data ?? []) as Array<{ challenge_id: string; cohost_id: string }>) {
    const arr = cohostsByChallenge.get(c.challenge_id) ?? [];
    arr.push(c.cohost_id);
    cohostsByChallenge.set(c.challenge_id, arr);
    personIds.add(c.cohost_id);
  }

  // ── Next session per experience ──
  // A live/doors session OWNS the slot: the surface a participant checks on
  // their phone at 14:02 must show the open room, not tomorrow's session.
  // Same shared clock as every other live badge (lib/liveWindow.ts).
  const nextByChallenge = new Map<string, MeExperience["nextSession"]>();
  {
    const links = (linksResult.data ?? []) as Array<{ challenge_id: string; app_session: unknown }>;
    const nowMs = Date.now();
    type SessRow = {
      id: string;
      title: string;
      start_time: string;
      duration_minutes: number | null;
      status: string;
      image_url: string | null;
      live_room_id: string | null;
      started_at: string | null;
    };
    const byChallenge = new Map<string, SessRow[]>();
    for (const l of links) {
      const s = (Array.isArray(l.app_session) ? l.app_session[0] : l.app_session) as SessRow | null;
      if (!s) continue;
      const arr = byChallenge.get(l.challenge_id) ?? [];
      arr.push(s);
      byChallenge.set(l.challenge_id, arr);
    }
    for (const [cid, sess] of byChallenge) {
      const stateOf = (s: SessRow) =>
        sessionLiveState(
          {
            startTime: s.start_time,
            durationMinutes: s.duration_minutes,
            status: s.status,
            liveRoomId: s.live_room_id,
            startedAt: s.started_at,
          },
          nowMs,
        );
      const joinable =
        sess.find((s) => stateOf(s) === "live") ?? sess.find((s) => stateOf(s) === "doors");
      if (joinable) {
        nextByChallenge.set(cid, {
          id: joinable.id,
          title: joinable.title,
          startTime: joinable.start_time,
          imageUrl: joinable.image_url ?? null,
          liveState: stateOf(joinable) as "live" | "doors",
        });
        continue;
      }
      const upcoming = sess
        .filter((s) => s.status === "published" && new Date(s.start_time).getTime() > nowMs)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      if (upcoming[0]) {
        nextByChallenge.set(cid, {
          id: upcoming[0].id,
          title: upcoming[0].title,
          startTime: upcoming[0].start_time,
          imageUrl: upcoming[0].image_url ?? null,
          liveState: null,
        });
      }
    }
  }

  // ── New posts: space ids resolve in phase 2, the count rides phase 3 ──
  const postsByChallenge = new Map<string, number>();
  const activeSpaceIds = rows
    .filter((r) => stageById.get(r.id) !== "completed")
    .map((r) => spaceByChallenge.get(r.id))
    .filter((x): x is string => !!x);

  // ── Which completed experiences the viewer has already rated ──
  const ratedSet = new Set<string>();
  for (const rv of (reviewsResult.data ?? []) as Array<{ challenge_id: string }>) ratedSet.add(rv.challenge_id);

  // ── Continuation: for a completed run, the lineage's joinable run (live now or
  // the next upcoming) the viewer doesn't already hold — so the completed card
  // can signal "this moved on" and offer the way back in. Mirrors the backend's
  // joinable_runs rule (published · not held · not ended · live-first).
  const continuationByChallenge = new Map<string, { id: string; startDate: string | null; isActive: boolean }>();
  const groupByCompleted = new Map<string, string>();
  const groupIds = new Set<string>();
  for (const g of (grpResult.data ?? []) as Array<{ id: string; continuation_group_id: string | null }>) {
    if (g.continuation_group_id) {
      groupByCompleted.set(g.id, g.continuation_group_id);
      groupIds.add(g.continuation_group_id);
    }
  }

  // PHASE 3 — the second-order reads: expert profiles (need cohost ids),
  // recent posts (need space ids), continuation runs (need group ids).
  const [profsResult, postsResult, runsResult] = await Promise.all([
    personIds.size
      ? supabase
          .from("app_profile")
          .select("id, display_name, avatar_url")
          .in("id", [...personIds])
      : none,
    activeSpaceIds.length
      ? supabase
          .from("app_challenge_post")
          .select("space_id")
          .in("space_id", activeSpaceIds)
          .neq("author_id", userId)
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      : none,
    groupIds.size
      ? supabase
          .from("app_challenge")
          .select("id, continuation_group_id, start_date, end_date")
          .in("continuation_group_id", [...groupIds])
          .eq("status", "published")
      : none,
  ]);

  // Experts assembly (owner first, then cohosts).
  const profById = new Map<string, { name: string; avatar: string | null }>();
  for (const p of (profsResult.data ?? []) as Array<{ id: string; display_name: string | null; avatar_url: string | null }>) {
    profById.set(p.id, { name: p.display_name ?? "Expert", avatar: p.avatar_url });
  }
  for (const r of rows) {
    const list: MeExperience["experts"] = [];
    const owner = profById.get(r.owner_id);
    if (owner) list.push({ id: r.owner_id, name: owner.name, avatar: owner.avatar, role: "owner" });
    for (const cid of cohostsByChallenge.get(r.id) ?? []) {
      const p = profById.get(cid);
      if (p) list.push({ id: cid, name: p.name, avatar: p.avatar, role: "cohost" });
    }
    expertsByChallenge.set(r.id, list);
  }

  // Recent-posts assembly.
  for (const p of (postsResult.data ?? []) as Array<{ space_id: string }>) {
    const cid = challengeBySpace.get(p.space_id);
    if (cid) postsByChallenge.set(cid, (postsByChallenge.get(cid) ?? 0) + 1);
  }

  // Continuation assembly (published · not held · not ended · live-first).
  if (groupIds.size) {
    const today = new Date().toISOString().slice(0, 10);
    const held = new Set(challengeIds);
    const byGroup = new Map<string, Array<{ id: string; start_date: string | null; end_date: string | null }>>();
    for (const run of (runsResult.data ?? []) as Array<{ id: string; continuation_group_id: string | null; start_date: string | null; end_date: string | null }>) {
      if (!run.continuation_group_id || held.has(run.id)) continue; // already a member
      if (run.end_date && run.end_date < today) continue; // already ended
      const arr = byGroup.get(run.continuation_group_id) ?? [];
      arr.push(run);
      byGroup.set(run.continuation_group_id, arr);
    }
    for (const [cid, group] of groupByCompleted) {
      const cands = byGroup.get(group) ?? [];
      if (!cands.length) continue;
      const live = cands.find((r) => r.start_date && r.start_date <= today && (!r.end_date || r.end_date >= today));
      const chosen = live ?? [...cands].sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))[0];
      continuationByChallenge.set(cid, { id: chosen.id, startDate: chosen.start_date, isActive: !!live });
    }
  }

  // Tribe faces for the constellation — same definer RPC as the expert
  // dashboard, gated on the caller belonging to the experience.
  const facesByChallenge = new Map<string, Array<{ profileId: string; name: string; avatar: string | null }>>();
  const totalsByChallenge = new Map<string, number>();
  for (const f of (facesResult.data ?? []) as Array<{
    challenge_id: string; profile_id: string; display_name: string | null;
    avatar_url: string | null; member_total: number;
  }>) {
    const arr = facesByChallenge.get(f.challenge_id) ?? [];
    arr.push({ profileId: f.profile_id, name: f.display_name ?? "Member", avatar: f.avatar_url });
    facesByChallenge.set(f.challenge_id, arr);
    totalsByChallenge.set(f.challenge_id, f.member_total ?? 0);
  }

  const experiences: MeExperience[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    startDate: r.start_date,
    endDate: r.end_date,
    spaceId: spaceByChallenge.get(r.id) ?? null,
    stage: stageById.get(r.id) ?? "pre-launch",
    experts: expertsByChallenge.get(r.id) ?? [],
    nextSession: nextByChallenge.get(r.id) ?? null,
    newPosts: postsByChallenge.get(r.id) ?? 0,
    rated: ratedSet.has(r.id),
    continuation: continuationByChallenge.get(r.id) ?? null,
    tribeFaces: facesByChallenge.get(r.id) ?? [],
    memberTotal: totalsByChallenge.get(r.id) ?? 0,
  }));

  const active = experiences.filter((e) => e.stage !== "completed");
  const completed = experiences.filter((e) => e.stage === "completed");

  return { profile, active, completed };
}

export default async function MeHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/me");

  // The console (loadMe), the social layer, and the timezone cookie are
  // mutually independent — one departure, not a queue.
  const [viewerTimeZone, { data: connectionRows }, { count: sessionsAttended }, me] =
    await Promise.all([
      resolveViewerTimeZone(),
      supabase.rpc("load_my_connections"),
      supabase
        .from("app_attendance")
        .select("session_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("joined_at", "is", null),
      loadMe(user.id),
    ]);
  const connections = (connectionRows ?? []) as import("@/app/components/ConnectionsGrid").ConnectionRow[];
  const { profile, active, completed } = me;
  const pendingReviews = completed.filter((e) => !e.rated).map((e) => ({ id: e.id, title: e.title }));

  // An open room outranks everything: live first, else doors, across all
  // active experiences (already computed on the shared clock in loadMe).
  const joinableMoments = active
    .map((e) => e.nextSession)
    .filter((s): s is NonNullable<typeof s> => !!s && s.liveState !== null);
  const liveMoment =
    joinableMoments.find((s) => s.liveState === "live") ?? joinableMoments[0] ?? null;

  // The rows whose UPDATE can change the banner: each experience's chosen
  // moment — already either the joinable one or the next upcoming, which is
  // exactly what precreate and issue_join_token write to.
  const watchedSessionIds = active
    .map((e) => e.nextSession?.id)
    .filter((id): id is string => !!id);

  return (
    <ProfileModalHost>
    <OverlayHost>
      <ParticipantNav displayName={profile?.display_name ?? null} role={profile?.role ?? undefined} />

      <div className="pt-20 px-6">
        <div className="max-w-7xl mx-auto py-8">
          {/* THE live banner — same dark interrupt as the expert dashboard's
              TopAlert, at the very top: an open room outranks everything.
              The watcher keeps it truthful without a reload. */}
          {watchedSessionIds.length > 0 && (
            <LiveMomentWatcher sessionIds={watchedSessionIds} />
          )}
          {liveMoment && (
            <LiveSessionBanner
              href={`/sessions/${liveMoment.id}/live`}
              pulseColor={liveMoment.liveState === "live" ? "#ef4444" : "#FF6130"}
              label={liveMoment.liveState === "live" ? "Live now" : "Doors open"}
              title={liveMoment.title}
              cta="Join the room →"
            />
          )}
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
                pendingReviews={pendingReviews}
                connections={connections}
                facts={(profile as { profile_facts?: Record<string, unknown> } | null)?.profile_facts ?? {}}
                viewerId={user.id}
                journey={{
                  experiences: active.length + completed.length,
                  completed: completed.length,
                  sessionsAttended: sessionsAttended ?? 0,
                  connections: connections.length,
                }}
                visibility={(profile as { visibility?: string } | null)?.visibility ?? "public"}
              />
            </aside>

            {/* Flex column so the card can absorb the row's slack: the
                console fills its grid item via h-full, so without this the
                experience card sat short whenever the console was taller
                (same fix as the expert dashboard). Only meaningful in the
                single-active case, which is where items-stretch applies. */}
            <div className="min-w-0 space-y-5 lg:flex lg:flex-col">
              {active.length > 0 ? (
                active.map((e) => (
                  <ParticipantExperienceCard key={e.id} exp={e} timeZone={viewerTimeZone} viewerId={user.id} />
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
                Your story
                <span style={{ color: "#94a3b8" }}> · {completed.length} completed</span>
              </p>
              <p className="text-[12px] mb-5 px-1 -mt-3" style={{ color: "#94a3b8" }}>
                Every experience you finished stays yours: the space, the
                people, the proof.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completed.map((e) => (
                  <CompletedExperienceCard key={e.id} exp={e} />
                ))}
              </div>
            </div>
          )}


          {/* Discover — fills the footer + invites joining more. */}
          {(active.length > 0 || completed.length > 0) && (
            <div className="mt-14">
              <div
                className="rounded-2xl px-6 py-8 lg:px-10 lg:py-9 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
                style={{
                  background: "linear-gradient(120deg, rgba(8,145,178,0.08), rgba(255,97,48,0.08))",
                  border: "1px solid rgba(15,34,41,0.06)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[10px] uppercase tracking-[0.25em] font-headline mb-1.5"
                    style={{ color: "#0891b2", fontWeight: 700 }}
                  >
                    Discover
                  </p>
                  <h2
                    className="text-xl lg:text-2xl font-headline tracking-tight"
                    style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.015em" }}
                  >
                    Looking for your next experience?
                  </h2>
                  <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>
                    Browse live experiences from creators across INFITRA.
                  </p>
                </div>
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold font-headline"
                  style={{
                    color: "#94a3b8",
                    border: "1px solid rgba(15,34,41,0.12)",
                    backgroundColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  Coming soon
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </OverlayHost>
    </ProfileModalHost>
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
