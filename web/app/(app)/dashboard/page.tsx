import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveProgramCard, pickHero, type ProgramStage } from "./ActiveProgramCard";
import { OtherProgramCard } from "./OtherProgramCard";
import { TopAlert } from "./TopAlert";
import { CollabInvitations } from "./CollabInvitations";
import { ProfilePanel } from "./ProfilePanel";
import { ProfileModalHost } from "@/app/components/ProfileModal";
import { OverlayHost } from "@/app/components/DashboardOverlay";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";
import { sessionLiveState } from "@/lib/liveWindow";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home — INFITRA" };

/**
 * Pilot dashboard — a console, not a feed.
 *
 * Composition:
 *   [TopAlert when live or going-live — full width]
 *   [Console grid]
 *     LEFT RAIL  — ProfilePanel: who you are + quick actions + a global
 *                  "across your tribes" pulse. Sticky on desktop, the top
 *                  card on mobile. Same grammar as the in-Space YouPanel.
 *     RIGHT COL  — your work stream, top to bottom:
 *                    ACTIVE NOW   — hero (cover band + experts + pulse +
 *                                   one door) then tier-2 compact cards
 *                    DRAFTS       — pre-publish, 2-up
 *                    ARCHIVE      — completed runs, 2-up
 *                    INVITATIONS  — collab requests waiting on you
 *
 * "You" left, "what's happening" right — the same spatial language as
 * stepping inside an Experience Space, so the product reads as one building.
 *
 * Notification bell (in top nav) carries the ambient "what's happened" feed;
 * the dashboard carries the live state (tribe pulse, next session, earnings).
 */

// ─── Types ──────────────────────────────────────────────────

interface ChallengeRow {
  id: string;
  title: string;
  image_url: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  owner_id: string;
  contract_id: string | null;
  created_at: string;
  continuation_group_id: string | null;
}

export interface ProgramSummary {
  id: string;
  title: string;
  imageUrl: string | null;
  stage: ProgramStage;
  startDate: string | null;
  endDate: string | null;
  isOwner: boolean;
  spaceId: string | null;
  continuationGroupId: string | null;
  /** The upcoming next run in this lineage, folded into the active run's card
   *  (set by collapseLineages). null when there is no distinct next run. */
  nextRun: { id: string; title: string; startDate: string | null; stage: ProgramStage } | null;
  /** Capped member faces for the tribe constellation. */
  tribeFaces?: Array<{ profileId: string; name: string; avatar: string | null }>;
  partner: {
    id: string;
    name: string;
    avatar: string | null;
    pendingInvite: boolean;
  } | null;
  // Filled for active programs only
  enrolledCount?: number;
  earningsCentsThisWeek?: number;
  newMembersThisWeek?: number;
  sessionsDoneThisWeek?: number;
  pendingQuestions?: number;
  /** Lineage-cumulative rating from vw_experience_review_stats (P6c). */
  reviewAvg?: number | null;
  reviewCount?: number;
  reviewsThisWeek?: number;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewerName: string | null;
  }>;
  newPosts?: number;
  nextSession?: {
    id: string;
    title: string;
    startTime: string;
    imageUrl: string | null;
    status: string;
  } | null;
  sessions?: {
    id: string;
    title: string;
    startTime: string;
    imageUrl: string | null;
    status: string;
  }[];
}

// ─── Stage computation ──────────────────────────────────────

function computeStage(
  ch: ChallengeRow,
  partnerPendingInvite: boolean,
  contractLockedAt: string | null,
): ProgramStage {
  if (ch.status === "draft") {
    if (contractLockedAt) return "awaiting-signatures";
    if (partnerPendingInvite) return "drafting-solo";
    return "drafting-jointly";
  }
  if (ch.status === "published") {
    const today = new Date().toISOString().split("T")[0];
    if (ch.start_date && ch.end_date) {
      if (today > ch.end_date) return "completed";
      if (today >= ch.start_date) return "published-live";
    }
    return "published-pre-launch";
  }
  return "completed";
}

function isActiveStage(s: ProgramStage): boolean {
  return s === "published-live" || s === "published-pre-launch";
}

// Within active programs: live > pre-launch (live takes the front
// row). Within other programs: drafting > awaiting > completed.
function activeRank(s: ProgramStage): number {
  if (s === "published-live") return 1;
  if (s === "published-pre-launch") return 2;
  return 99;
}
function otherRank(s: ProgramStage): number {
  if (s === "awaiting-signatures") return 1;
  if (s === "drafting-jointly") return 2;
  if (s === "drafting-solo") return 3;
  if (s === "completed") return 4;
  return 99;
}

function isDraftStage(s: ProgramStage): boolean {
  return s === "drafting-solo" || s === "drafting-jointly" || s === "awaiting-signatures";
}

// One card per lineage: a continuation group's PUBLISHED runs collapse into the
// currently-active run, carrying the upcoming next run as an inside-the-card chip
// (the card "flips" to the next run once the live one ends). Drafts are never
// collapsed — they stay in the Drafts section.
function collapseLineages(programs: ProgramSummary[]): ProgramSummary[] {
  const byGroup = new Map<string, ProgramSummary[]>();
  const passthrough: ProgramSummary[] = [];
  for (const p of programs) {
    if (p.continuationGroupId && !isDraftStage(p.stage)) {
      const arr = byGroup.get(p.continuationGroupId) ?? [];
      arr.push(p);
      byGroup.set(p.continuationGroupId, arr);
    } else {
      passthrough.push(p);
    }
  }
  const collapsed: ProgramSummary[] = [];
  for (const runs of byGroup.values()) {
    if (runs.length === 1) {
      collapsed.push(runs[0]);
      continue;
    }
    const byStart = (a: ProgramSummary, b: ProgramSummary) =>
      (a.startDate ?? "").localeCompare(b.startDate ?? "");
    const live = runs.filter((r) => r.stage === "published-live").sort(byStart);
    const upcoming = runs.filter((r) => r.stage === "published-pre-launch").sort(byStart);
    const rest = runs
      .filter((r) => r.stage !== "published-live" && r.stage !== "published-pre-launch")
      .sort((a, b) => byStart(b, a));
    const rep = live[0] ?? upcoming[0] ?? rest[0] ?? runs[0];
    const next = upcoming.find((r) => r.id !== rep.id) ?? null;
    collapsed.push({
      ...rep,
      nextRun: next
        ? { id: next.id, title: next.title, startDate: next.startDate, stage: next.stage }
        : null,
    });
  }
  return [...passthrough, ...collapsed];
}

// ─── Data loader ────────────────────────────────────────────

async function loadDashboard(userId: string) {
  const supabase = await createClient();

  // Phase A — base queries in parallel
  const [profileResult, ownedResult, cohostJoinsResult, receivedInvitesResult, upcomingSessionsResult] =
    await Promise.all([
      supabase
        .from("app_profile")
        .select("display_name, avatar_url, tagline, bio, profile_facts, role, created_at, visibility, is_founding_expert")
        .eq("id", userId)
        .single(),
      supabase
        .from("app_challenge")
        .select("id, title, description, image_url, status, start_date, end_date, owner_id, contract_id, created_at, continuation_group_id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("app_challenge_cohost")
        .select(
          "challenge_id, app_challenge(id, title, image_url, status, start_date, end_date, owner_id, contract_id, created_at, continuation_group_id)",
        )
        .eq("cohost_id", userId),
      supabase
        .from("app_collaboration_invite")
        .select(
          "id, from_id, message, initial_split_percent, created_at, challenge_id, app_challenge(title, image_url)",
        )
        .eq("to_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("app_session")
        .select("id, title, start_time, duration_minutes, status, live_room_id, started_at, host_id")
        .eq("host_id", userId)
        .in("status", ["published", "ended"])
        // Recent-window bound: without it, a host with >20 lifetime sessions
        // pushes today's live one past the limit and loses the banner.
        .gte("start_time", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
        .order("start_time", { ascending: true })
        .limit(20),
    ]);

  const profile = profileResult.data;
  const ownedChallenges: Array<ChallengeRow & { isOwner: boolean }> = (
    (ownedResult.data ?? []) as ChallengeRow[]
  ).map((c) => ({ ...c, isOwner: true }));
  const cohostChallenges: Array<ChallengeRow & { isOwner: boolean }> = (
    cohostJoinsResult.data ?? []
  )
    .map((j: any) => (Array.isArray(j.app_challenge) ? j.app_challenge[0] : j.app_challenge))
    .filter(Boolean)
    .map((c: ChallengeRow) => ({ ...c, isOwner: false }));

  const allChallenges = [...ownedChallenges, ...cohostChallenges];
  const challengeIds = allChallenges.map((c) => c.id);

  // Phase B — for ALL programs: contract state, space id, cohost lookup, pending-partner-invite
  let contractLocks: Record<string, string | null> = {};
  let spaceIds: Record<string, string | null> = {};
  let cohostMap: Record<string, string[]> = {};
  let pendingPartnerInvites: Record<string, string | null> = {};
  // Sessions of every experience the viewer runs — not just the ones they
  // host. A cohost is an expert of the session (is_session_expert), so the
  // live banner must reach them too; host-scoping it meant Mira saw nothing
  // on /dashboard while Alex's session was live (rehearsal, 13 Aug).
  type LiveSignalRow = {
    id: string;
    title: string;
    start_time: string;
    duration_minutes: number | null;
    status: string;
    live_room_id: string | null;
    started_at: string | null;
    host_id: string | null;
  };
  let teamSessionRows: LiveSignalRow[] = [];

  if (challengeIds.length > 0) {
    const contractIds = allChallenges
      .map((c) => c.contract_id)
      .filter((x): x is string => !!x);

    const [
      contractsResult,
      spacesResult,
      cohostsResult,
      partnerInvitesResult,
      teamSessionsResult,
    ] = await Promise.all([
        contractIds.length > 0
          ? supabase
              .from("app_collaboration_contract")
              .select("id, locked_at")
              .in("id", contractIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from("app_challenge_space")
          .select("id, source_challenge_id")
          .in("source_challenge_id", challengeIds),
        supabase
          .from("app_challenge_cohost")
          .select("challenge_id, cohost_id")
          .in("challenge_id", challengeIds),
        supabase
          .from("app_collaboration_invite")
          .select("challenge_id, to_id")
          .in("challenge_id", challengeIds)
          .eq("status", "pending"),
        supabase
          .from("app_challenge_session")
          .select(
            "app_session(id, title, start_time, duration_minutes, status, live_room_id, started_at, host_id)",
          )
          .in("challenge_id", challengeIds),
      ]);

    teamSessionRows = ((teamSessionsResult.data ?? []) as any[])
      .map((r) => (Array.isArray(r.app_session) ? r.app_session[0] : r.app_session))
      .filter(
        (s: any): s is LiveSignalRow =>
          !!s && (s.status === "published" || s.status === "ended"),
      );

    for (const ch of allChallenges) {
      const c = (contractsResult.data ?? []).find((r: any) => r.id === ch.contract_id);
      contractLocks[ch.id] = (c as any)?.locked_at ?? null;
    }
    for (const s of spacesResult.data ?? []) {
      spaceIds[(s as any).source_challenge_id] = (s as any).id;
    }
    for (const c of cohostsResult.data ?? []) {
      const id = (c as any).challenge_id;
      cohostMap[id] = cohostMap[id] ?? [];
      cohostMap[id].push((c as any).cohost_id);
    }
    for (const i of partnerInvitesResult.data ?? []) {
      pendingPartnerInvites[(i as any).challenge_id] = (i as any).to_id;
    }
  }

  // Phase C — partner profile lookup (everyone we need to display)
  const partnerProfileIds = new Set<string>();
  for (const ch of allChallenges) {
    if (ch.isOwner) {
      const cohostIds = cohostMap[ch.id] ?? [];
      const pendingTo = pendingPartnerInvites[ch.id];
      if (cohostIds[0]) partnerProfileIds.add(cohostIds[0]);
      else if (pendingTo) partnerProfileIds.add(pendingTo);
    } else {
      partnerProfileIds.add(ch.owner_id);
    }
  }

  const partnerProfiles: Record<string, { name: string; avatar: string | null }> = {};
  if (partnerProfileIds.size > 0) {
    const { data } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url")
      .in("id", [...partnerProfileIds]);
    for (const p of data ?? [])
      partnerProfiles[(p as any).id] = {
        name: (p as any).display_name ?? "Expert",
        avatar: (p as any).avatar_url,
      };
  }

  // Empty-draft noise guard: an owned draft with no title, description,
  // cover, cohost or pending invite is an accidental "+ Create" visit, not
  // work. Same rule as the create page's isMeaningfulDraft, which also
  // prunes these from the DB after 30 min — this hides whatever that
  // cleanup hasn't seen yet. Collected during the map (where cohost and
  // invite context lives) and filtered after.
  const noiseDraftIds = new Set<string>();

  // Build program summaries with stage + partner
  const rawPrograms: ProgramSummary[] = allChallenges
    .map((ch) => {
      const cohostIds = cohostMap[ch.id] ?? [];
      const pendingTo = pendingPartnerInvites[ch.id] ?? null;
      const partnerId = ch.isOwner
        ? cohostIds[0] ?? pendingTo ?? null
        : ch.owner_id;
      const partner =
        partnerId && partnerProfiles[partnerId]
          ? {
              id: partnerId,
              name: partnerProfiles[partnerId].name,
              avatar: partnerProfiles[partnerId].avatar,
              pendingInvite: ch.isOwner && !cohostIds[0] && !!pendingTo,
            }
          : null;
      const stage = computeStage(
        ch,
        partner?.pendingInvite ?? false,
        contractLocks[ch.id] ?? null,
      );

      if (
        ch.status === "draft" &&
        ch.isOwner &&
        (ch.title ?? "").trim() === "Untitled Challenge" &&
        !((ch as any).description ?? "").trim() &&
        !ch.image_url &&
        cohostIds.length === 0 &&
        !pendingTo
      ) {
        noiseDraftIds.add(ch.id);
      }

      return {
        id: ch.id,
        title: ch.title,
        imageUrl: ch.image_url,
        stage,
        startDate: ch.start_date,
        endDate: ch.end_date,
        isOwner: ch.isOwner,
        spaceId: spaceIds[ch.id] ?? null,
        continuationGroupId: ch.continuation_group_id,
        nextRun: null,
        partner,
      };
    })
    // Two hides: completed rows without an end date (legacy artifacts), and
    // the empty-draft noise collected above. NOTE: the previous version of
    // this comment claimed to hide empty drafts while the predicate only
    // checked the completed case — that gap was exactly the draft noise the
    // founder saw on the dashboard.
    .filter(
      (p) =>
        (p.stage !== ("completed" as ProgramStage) || p.endDate) &&
        !noiseDraftIds.has(p.id),
    );

  // One card per lineage: collapse a continuation group's published runs into the
  // active run, carrying the upcoming next run as an inside-the-card chip.
  const programs = collapseLineages(rawPrograms);

  // Phase D — for ACTIVE programs, enrich with insights + next session
  const activePrograms = programs.filter((p) => isActiveStage(p.stage));
  if (activePrograms.length > 0) {
    const activeIds = activePrograms.map((p) => p.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowMs = Date.now();

    const [
      memberCountsResult,
      newMembersResult,
      txResult,
      sessionLinksResult,
      reviewStatsResult,
      recentReviewsResult,
      reviewListResult,
    ] = await Promise.all([
      supabase
        .from("app_challenge_member")
        .select("challenge_id")
        .in("challenge_id", activeIds),
      supabase
        .from("app_challenge_member")
        .select("challenge_id")
        .in("challenge_id", activeIds)
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("vw_my_transactions")
        .select("challenge_id, creator_cut_cents, created_at")
        .in("challenge_id", activeIds)
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("app_challenge_session")
        .select("challenge_id, app_session(id, title, start_time, status, image_url)")
        .in("challenge_id", activeIds),
      // Reviews as oversight (founder's walk): aggregate + this-week
      // activity on the card that is the door into the experience.
      supabase
        .from("vw_experience_review_stats")
        .select("challenge_id, avg_rating, total_reviews")
        .in("challenge_id", activeIds),
      supabase
        .from("app_review")
        .select("challenge_id")
        .in("challenge_id", activeIds)
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("vw_experience_reviews_public")
        .select("challenge_id, review_id, rating, comment, created_at, reviewer_name")
        .in("challenge_id", activeIds)
        .order("created_at", { ascending: false }),
    ]);

    const totalByChallenge: Record<string, number> = {};
    for (const r of memberCountsResult.data ?? []) {
      const id = (r as any).challenge_id;
      totalByChallenge[id] = (totalByChallenge[id] ?? 0) + 1;
    }
    const weeklyMembers: Record<string, number> = {};
    for (const r of newMembersResult.data ?? []) {
      const id = (r as any).challenge_id;
      weeklyMembers[id] = (weeklyMembers[id] ?? 0) + 1;
    }
    const weeklyEarnings: Record<string, number> = {};
    for (const r of txResult.data ?? []) {
      const id = (r as any).challenge_id;
      weeklyEarnings[id] = (weeklyEarnings[id] ?? 0) + Number((r as any).creator_cut_cents ?? 0);
    }

    // Sessions: link rows include the session payload; bucket by challenge
    const sessionsByChallenge: Record<string, Array<any>> = {};
    for (const r of sessionLinksResult.data ?? []) {
      const id = (r as any).challenge_id;
      const s = Array.isArray((r as any).app_session)
        ? (r as any).app_session[0]
        : (r as any).app_session;
      if (!s) continue;
      sessionsByChallenge[id] = sessionsByChallenge[id] ?? [];
      sessionsByChallenge[id].push(s);
    }

    for (const p of activePrograms) {
      p.enrolledCount = totalByChallenge[p.id] ?? 0;
      {
        const rs = ((reviewStatsResult.data ?? []) as Array<{ challenge_id: string; avg_rating: number | null; total_reviews: number }>).find(
          (r) => r.challenge_id === p.id,
        );
        p.reviewAvg = rs?.avg_rating ?? null;
        p.reviewCount = rs?.total_reviews ?? 0;
        p.reviewsThisWeek = ((recentReviewsResult.data ?? []) as Array<{ challenge_id: string }>).filter(
          (r) => r.challenge_id === p.id,
        ).length;
        p.reviews = ((reviewListResult.data ?? []) as Array<{
          challenge_id: string; review_id: string; rating: number;
          comment: string | null; created_at: string; reviewer_name: string | null;
        }>)
          .filter((r) => r.challenge_id === p.id)
          .map((r) => ({
            id: r.review_id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at,
            reviewerName: r.reviewer_name,
          }));
      }
      p.newMembersThisWeek = weeklyMembers[p.id] ?? 0;
      p.earningsCentsThisWeek = weeklyEarnings[p.id] ?? 0;

      const sessions = sessionsByChallenge[p.id] ?? [];
      p.sessionsDoneThisWeek = sessions.filter(
        (s) =>
          s.status === "ended" &&
          new Date(s.start_time).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).length;

      // Full ordered list — drives the hero-density horizontal session row.
      const ordered = [...sessions].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
      p.sessions = ordered.map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.start_time,
        imageUrl: s.image_url ?? null,
        status: s.status,
      }));

      const upcoming = ordered.filter(
        (s) => s.status === "published" && new Date(s.start_time).getTime() > nowMs,
      );
      p.nextSession = upcoming[0]
        ? {
            id: upcoming[0].id,
            title: upcoming[0].title,
            startTime: upcoming[0].start_time,
            imageUrl: upcoming[0].image_url ?? null,
            status: upcoming[0].status,
          }
        : null;
    }

    // Experience pulse (H5): waiting questions + recent tribe posts, so the
    // dashboard card reflects what's actually moving in the Space.
    const challengeBySpace = new Map<string, string>();
    for (const p of activePrograms) {
      const sid = spaceIds[p.id];
      if (sid) challengeBySpace.set(sid, p.id);
    }
    const activeSpaceIds = [...challengeBySpace.keys()];

    const [statsResults, postsResult] = await Promise.all([
      Promise.all(
        activePrograms.map((p) =>
          supabase
            .rpc("load_experience_creator_stats", { p_challenge_id: p.id })
            .then(({ data }) => ({ id: p.id, data })),
        ),
      ),
      activeSpaceIds.length > 0
        ? supabase
            .from("app_challenge_post")
            .select("space_id")
            .in("space_id", activeSpaceIds)
            .neq("author_id", userId)
            .gte("created_at", sevenDaysAgo)
        : Promise.resolve({ data: [] as Array<{ space_id: string }> }),
    ]);

    const pendingByChallenge: Record<string, number> = {};
    for (const r of statsResults) {
      const d = r.data as { authorized?: boolean; pending_questions?: number } | null;
      if (d?.authorized) pendingByChallenge[r.id] = d.pending_questions ?? 0;
    }
    const postsByChallenge: Record<string, number> = {};
    for (const row of (postsResult.data ?? []) as Array<{ space_id: string }>) {
      const cid = challengeBySpace.get(row.space_id);
      if (cid) postsByChallenge[cid] = (postsByChallenge[cid] ?? 0) + 1;
    }
    for (const p of activePrograms) {
      p.pendingQuestions = pendingByChallenge[p.id] ?? 0;
      p.newPosts = postsByChallenge[p.id] ?? 0;
    }
  }

  // Sort active by activeRank then by start_date for tiebreak
  activePrograms.sort((a, b) => {
    const r = activeRank(a.stage) - activeRank(b.stage);
    if (r !== 0) return r;
    return (a.startDate ?? "").localeCompare(b.startDate ?? "");
  });

  // Other programs (drafts / awaiting / completed)
  const otherPrograms = programs
    .filter((p) => !isActiveStage(p.stage))
    .sort((a, b) => otherRank(a.stage) - otherRank(b.stage));

  // Pulse signals (for TopAlert) — the shared live clock, so this rail can
  // never claim "Live now" for an expired or merely-precreated room.
  // Union of "sessions I host" and "sessions of experiences I run", deduped.
  // Both legs keep the published/ended status filter, so drafts stay out.
  const sessionById = new Map<string, any>();
  for (const s of (upcomingSessionsResult.data ?? []) as any[]) sessionById.set(s.id, s);
  for (const s of teamSessionRows) if (!sessionById.has(s.id)) sessionById.set(s.id, s);
  const sessions = [...sessionById.values()].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const now = Date.now();
  const liveStateOf = (s: any) =>
    sessionLiveState(
      {
        startTime: s.start_time,
        durationMinutes: s.duration_minutes,
        status: s.status,
        liveRoomId: s.live_room_id,
        startedAt: s.started_at,
      },
      now,
    );
  const liveSession = sessions.find((s) => liveStateOf(s) === "live") ?? null;
  // "Go live": the host's room is provisioned and waiting (doors), or the
  // T-15 window has opened and the room just isn't created yet.
  const goLiveSoonSession = !liveSession
    ? (sessions.find((s) => liveStateOf(s) === "doors") ??
      sessions.find((s) => {
        if (s.live_room_id) return false;
        if (s.status !== "published") return false;
        // No room yet: the live page redirects straight back out, so this
        // dead end stays the HOST's problem (they can force provisioning by
        // going live). Never send a co-expert into it.
        if (s.host_id !== userId) return false;
        const startMs = new Date(s.start_time).getTime();
        return now >= startMs - 15 * 60 * 1000 && now < startMs;
      }))
    : null;

  // Pending received invites
  const pendingReceivedInvites: any[] = [];
  const inviteRows = (receivedInvitesResult.data ?? []) as any[];
  if (inviteRows.length > 0) {
    const inviterIds = [...new Set(inviteRows.map((i) => i.from_id))];
    const { data: inviterProfiles } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url, tagline")
      .in("id", inviterIds);
    const inviterMap: Record<string, { name: string; avatar: string | null; tagline: string | null }> = {};
    for (const p of inviterProfiles ?? [])
      inviterMap[(p as any).id] = {
        name: (p as any).display_name ?? "Expert",
        avatar: (p as any).avatar_url,
        tagline: (p as any).tagline,
      };
    for (const i of inviteRows) {
      const ch = Array.isArray(i.app_challenge) ? i.app_challenge[0] : i.app_challenge;
      const rawTitle = ch?.title ?? "";
      const isMeaningful =
        !!rawTitle && rawTitle !== "Untitled Collaboration" && rawTitle !== "Untitled Challenge";
      pendingReceivedInvites.push({
        id: i.id,
        fromId: i.from_id,
        fromName: inviterMap[i.from_id]?.name ?? "Expert",
        fromAvatar: inviterMap[i.from_id]?.avatar ?? null,
        fromTagline: inviterMap[i.from_id]?.tagline ?? null,
        message: i.message,
        splitPercent: i.initial_split_percent ?? 0,
        createdAt: i.created_at,
        challengeTitle: isMeaningful ? rawTitle : null,
        challengeImageUrl: ch?.image_url ?? null,
      });
    }
  }

  return {
    profile: {
      displayName: profile?.display_name ?? "",
      avatarUrl: profile?.avatar_url ?? null,
      profileFacts: (profile?.profile_facts ?? {}) as Record<string, unknown>,
      tagline: profile?.tagline ?? null,
      bio: profile?.bio ?? null,
      joinedAt: (profile as any)?.created_at ?? null,
      visibility: ((profile as any)?.visibility as string) ?? "public",
      isFoundingExpert: !!(profile as any)?.is_founding_expert,
    },
    activePrograms,
    otherPrograms,
    pendingReceivedInvites,
    liveSession: liveSession ? { id: liveSession.id, title: liveSession.title } : null,
    goLiveSoonSession: goLiveSoonSession
      ? {
          id: goLiveSoonSession.id,
          title: goLiveSoonSession.title,
          startTime: goLiveSoonSession.start_time,
          // "Go live" is the host's act. A co-expert is joining.
          viewerIsHost: goLiveSoonSession.host_id === userId,
        }
      : null,
  };
}

// ─── Page ───────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await loadDashboard(user.id);
  const viewerTimeZone = await resolveViewerTimeZone();

  // Console data — the account-wide layer the rail now surfaces: the derived
  // connection graph (Your people overlay), the recorded agreements
  // (Account settings overlay) and the caller's own proof numbers (the same
  // definer RPC the profile modal uses, turned inward for YOUR ACCOUNT).
  const [{ data: connectionRows }, { data: ownProfilePayload }, { data: ownedAgr }, { data: cohostAgr }] =
    await Promise.all([
      supabase.rpc("load_my_connections"),
      supabase.rpc("load_public_profile", { p_profile_id: user.id }),
      supabase
        .from("app_challenge")
        .select("id, title, status, start_date, contract_id")
        .eq("owner_id", user.id)
        .not("contract_id", "is", null),
      supabase
        .from("app_challenge_cohost")
        .select("app_challenge(id, title, status, start_date, contract_id)")
        .eq("cohost_id", user.id),
    ]);
  const connections = (connectionRows ?? []) as import("@/app/components/ConnectionsGrid").ConnectionRow[];
  const ownProof = ((ownProfilePayload as { proof?: Record<string, number> } | null)?.proof ?? {}) as Record<string, number>;
  const accountProof = {
    tribeCount: ownProof.tribe_count ?? 0,
    activeTribeMembers: ownProof.active_tribe_members ?? 0,
    avgRating: Number(ownProof.avg_rating ?? 0),
    totalReviews: ownProof.total_reviews ?? 0,
    sessionsLed: ownProof.sessions_led ?? 0,
    hostingCount: ownProof.hosting_count ?? 0,
  };
  type Agr = { id: string; title: string | null; status: string; start_date: string | null; contract_id: string | null };
  const agrById = new Map<string, Agr>();
  for (const a of (ownedAgr ?? []) as Agr[]) agrById.set(a.id, a);
  for (const l of (cohostAgr ?? []) as Array<{ app_challenge: Agr | Agr[] | null }>) {
    const c = Array.isArray(l.app_challenge) ? l.app_challenge[0] : l.app_challenge;
    if (c?.contract_id) agrById.set(c.id, c);
  }
  const agreements = [...agrById.values()]
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""))
    .map(({ id, title, status, start_date }) => ({ id, title, status, start_date }));

  // Tribe faces for the constellation — one call for every active card.
  const activeIdsForFaces = data.activePrograms.map((p) => p.id);
  if (activeIdsForFaces.length > 0) {
    const { data: faceRows } = await supabase.rpc("load_tribe_faces", {
      p_challenge_ids: activeIdsForFaces,
      p_limit: 11,
    });
    const byChallenge = new Map<string, Array<{ profileId: string; name: string; avatar: string | null }>>();
    for (const f of (faceRows ?? []) as Array<{
      challenge_id: string; profile_id: string; display_name: string | null; avatar_url: string | null;
    }>) {
      const arr = byChallenge.get(f.challenge_id) ?? [];
      arr.push({ profileId: f.profile_id, name: f.display_name ?? "Member", avatar: f.avatar_url });
      byChallenge.set(f.challenge_id, arr);
    }
    for (const p of data.activePrograms) p.tribeFaces = byChallenge.get(p.id) ?? [];
  }

  const allPrograms = [...data.activePrograms, ...data.otherPrograms];
  const titleById = new Map(allPrograms.map((p) => [p.id, p.title]));
  const allIds = allPrograms.map((p) => p.id);
  const { data: allReviewRows } = allIds.length
    ? await supabase
        .from("vw_experience_reviews_public")
        .select("challenge_id, review_id, rating, comment, created_at, reviewer_name")
        .in("challenge_id", allIds)
        .order("created_at", { ascending: false })
    : { data: [] };
  const expertReviews = ((allReviewRows ?? []) as Array<{
    challenge_id: string; review_id: string; rating: number;
    comment: string | null; created_at: string; reviewer_name: string | null;
  }>).map((r) => ({
    id: r.review_id,
    challengeId: r.challenge_id,
    challengeTitle: titleById.get(r.challenge_id) ?? "Experience",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    reviewerName: r.reviewer_name,
  }));
  const userInitial = data.profile.displayName?.[0]?.toUpperCase() ?? "?";
  const userProp = {
    id: user.id,
    name: data.profile.displayName,
    avatar: data.profile.avatarUrl,
    initial: userInitial,
  };
  const hasInvites = data.pendingReceivedInvites.length > 0;
  const activeCount = data.activePrograms.length;

  // The dashboard is an attention system — at most one program holds
  // the editorial weight at any time. `pickHero` ranks by urgency and
  // hands back the rest as tier-2 cards.
  const { hero, others: tier2 } = pickHero(data.activePrograms);

  // Other programs split into two honest zones: drafts (still being
  // built) and archive (completed runs). Each gets its own section
  // when present — no more catch-all "OTHER" label that accidentally
  // groups drafts with completed programs.
  const drafts = data.otherPrograms.filter(
    (p) => p.stage !== "completed",
  );
  const archive = data.otherPrograms.filter(
    (p) => p.stage === "completed",
  );
  const draftsCount = drafts.length;
  const archiveCount = archive.length;

  // Global pulse for the profile rail — summed from the live experiences the
  // page already loaded (zero extra queries). The feeling we're after:
  // "this is happening, jump in."
  const needsYou = {
    invitations: data.pendingReceivedInvites.length,
    // One row per experience with open questions — each deep-links into that
    // space with the feed pre-filtered (?focus=questions). A count that
    // scrolls to a card is not a door.
    openQuestions: data.activePrograms
      .filter((p) => (p.pendingQuestions ?? 0) > 0)
      .map((p) => ({ id: p.id, title: p.title, count: p.pendingQuestions ?? 0 })),
    awaitingSignatures: drafts.filter((p) => p.stage === "awaiting-signatures").length,
    // Real opportunities, named: owned completed runs with no next run in
    // the lineage yet. Each links to its space's Next chapter console.
    nextChapters: archive
      .filter((p) => p.isOwner && !p.nextRun)
      .map((p) => ({ id: p.id, title: p.title, spaceId: p.spaceId ?? null })),
  };
  const earningsWeekCents = data.activePrograms.reduce(
    (n, p) => n + (p.earningsCentsThisWeek ?? 0),
    0,
  );

  const tribePulse = {
    members: data.activePrograms.reduce((n, p) => n + (p.enrolledCount ?? 0), 0),
    newPosts: data.activePrograms.reduce((n, p) => n + (p.newPosts ?? 0), 0),
    pendingQuestions: data.activePrograms.reduce((n, p) => n + (p.pendingQuestions ?? 0), 0),
    experiences: data.activePrograms.length,
  };

  return (
    // Horizontal overflow is already guarded by the (app) layout root
    // (overflow-x-clip there) — adding it again here created a nested clip
    // context that broke the wave background on iOS scroll-up.
    <ProfileModalHost>
    <OverlayHost>
    <div className="py-8">
      {/* TopAlert sits above everything else — global urgency signal,
          rendered without a section heading because it speaks for
          itself when present. */}
      {(data.liveSession || data.goLiveSoonSession) && (
        <div className="mb-8">
          <TopAlert
            liveSession={data.liveSession}
            goLiveSoonSession={data.goLiveSoonSession}
          />
        </div>
      )}

      {/* Console layout — "you" on the left, "what's happening" on the
          right. Same spatial grammar as the in-Space view (YouPanel left,
          feed right), so the dashboard and the Experience Space feel like
          one building. items-stretch keeps the console and the active card the
          same height; on mobile it's simply the top card of the stack. */}
      {/* items-start (not stretch) + sticky: the compressed console pins as
          a fixed command surface on desktop while the page scrolls; on
          mobile it simply stacks as before. max-height + overflow guard
          short viewports. */}
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        <aside className="mb-8 lg:mb-0 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <ProfilePanel
            displayName={data.profile.displayName}
            avatarUrl={data.profile.avatarUrl}
            tagline={data.profile.tagline}
            bio={data.profile.bio}
            profileFacts={data.profile.profileFacts}
            viewerId={user.id}
            joinedAt={data.profile.joinedAt}
            agreements={agreements}
            connections={connections}
            reviews={expertReviews}
            isFoundingExpert={data.profile.isFoundingExpert}
            activeExperiences={activeCount}
            activeMembers={accountProof.activeTribeMembers}
            tribeConnections={accountProof.tribeCount}
            avgRating={accountProof.avgRating}
            totalReviews={accountProof.totalReviews}
            sessionsLed={accountProof.sessionsLed}
            needsYou={needsYou}
            earningsWeekCents={earningsWeekCents}
          />
        </aside>

        {/* Right column — the headliner. When an experience is live it holds
            the active card; the rest (drafts/archive/invites) flows in
            full-width bands BELOW. When nothing is live, the work stream
            (drafts/archive/invites) carries this column instead. */}
        <div className="space-y-12 min-w-0">
          {/* Empty "start your first" hero — only when there's genuinely
              nothing at all. */}
          {activeCount === 0 &&
            draftsCount === 0 &&
            archiveCount === 0 &&
            !hasInvites && (
              <ActiveProgramCard program={null} partner={null} user={userProp} density="hero" />
            )}

          {/* No "Active now" heading — the cover's status chip already names
              the state, and a heading here pushed the card out of alignment
              with the profile console. */}
          {activeCount > 0 && (
            <div className="space-y-5 scroll-mt-24" id="active">
              {hero && (
                  <ActiveProgramCard
                    program={hero}
                    partner={hero.partner}
                    user={userProp}
                    density="hero"
                    timeZone={viewerTimeZone}
                  />
                )}
                {tier2.length > 0 && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {tier2.map((p) => (
                      <ActiveProgramCard
                        key={p.id}
                        program={p}
                        partner={p.partner}
                        user={userProp}
                        density="compact"
                        timeZone={viewerTimeZone}
                      />
                    ))}
                  </div>
                )}
              </div>
          )}

          {/* No active experience → the work stream lives here, in the
              column beside the profile. */}
          {activeCount === 0 && (
            <>
              {draftsCount > 0 && (
                <Section
                  label="Experience drafts"
                  count={draftsCount}
                  id="drafts"
                  action={{ label: "+ Start new", href: "/dashboard/create" }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {drafts.map((p) => (
                      <OtherProgramCard key={p.id} program={p} user={userProp} />
                    ))}
                  </div>
                </Section>
              )}
              {archiveCount > 0 && (
                <Section label="Completed" count={archiveCount} id="completed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {archive.map((p) => (
                      <OtherProgramCard key={p.id} program={p} user={userProp} />
                    ))}
                  </div>
                </Section>
              )}
              {hasInvites && (
                <Section
                  label="Collaboration invitations"
                  count={data.pendingReceivedInvites.length}
                >
                  <div id="invitations">
                    <div id="invitations" className="scroll-mt-24"><CollabInvitations invites={data.pendingReceivedInvites} /></div>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Full-width bands BELOW the console — only when an active experience
          holds the top zone. Drafts/archive scroll horizontally so they read
          as a supporting strip, not a vertical pile; invitations span full
          width. This also fills the space beneath the (shorter) profile rail. */}
      {activeCount > 0 && (
        <div className="mt-14 space-y-12">
          {draftsCount > 0 ? (
            <Section label="Experience drafts" count={draftsCount} id="drafts">
              <ProgramBand>
                {drafts.map((p) => (
                  <div key={p.id} className="w-[300px] shrink-0">
                    <OtherProgramCard program={p} user={userProp} />
                  </div>
                ))}
                <StartNewTile />
              </ProgramBand>
            </Section>
          ) : (
            <div className="flex justify-center">
              <Link
                href="/dashboard/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-headline transition-colors"
                style={{
                  color: "#0891b2",
                  border: "1.5px dashed rgba(8,145,178,0.40)",
                  backgroundColor: "rgba(156,240,255,0.06)",
                  fontWeight: 700,
                }}
              >
                + Start a new experience
              </Link>
            </div>
          )}

          {archiveCount > 0 && (
            <Section label="Completed" count={archiveCount} id="completed">
              <ProgramBand>
                {archive.map((p) => (
                  <div key={p.id} className="w-[300px] shrink-0">
                    <OtherProgramCard program={p} user={userProp} />
                  </div>
                ))}
              </ProgramBand>
            </Section>
          )}

          {hasInvites && (
            <Section
              label="Collaboration invitations"
              count={data.pendingReceivedInvites.length}
            >
              <div id="invitations">
                <div id="invitations" className="scroll-mt-24"><CollabInvitations invites={data.pendingReceivedInvites} /></div>
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
    </OverlayHost>
    </ProfileModalHost>
  );
}

/**
 * ProgramBand — a horizontal strip of fixed-width tiles that scrolls on
 * overflow. Vertical padding leaves room for the cards' hover shadow (an
 * overflow-x container clips the y-axis otherwise).
 */
function ProgramBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pt-1 pb-3">{children}</div>
  );
}

/** Dashed "start a new experience" tile that lives at the end of the band. */
function StartNewTile() {
  return (
    <Link
      href="/dashboard/create"
      className="w-[300px] shrink-0 rounded-2xl flex items-center justify-center text-sm font-headline transition-colors hover:bg-[rgba(156,240,255,0.10)]"
      style={{
        border: "1.5px dashed rgba(8,145,178,0.40)",
        color: "#0891b2",
        backgroundColor: "rgba(156,240,255,0.06)",
        fontWeight: 700,
        minHeight: "132px",
      }}
    >
      + Start a new experience
    </Link>
  );
}

/**
 * Section heading — uppercase, tracked-widest, slate. Subtle but
 * present. Optional count (after a thin middle dot) and optional
 * right-aligned action link. Same vocabulary across every dashboard
 * zone so the page reads as one document.
 */
function Section({
  label,
  count,
  action,
  id,
  children,
}: {
  label: string;
  count?: number;
  action?: { label: string; href: string };
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center justify-between mb-5 px-1">
        <p
          className="text-[11px] uppercase tracking-[0.22em] font-headline"
          style={{ color: "#475569", fontWeight: 700 }}
        >
          {label}
          {count !== undefined && (
            <span style={{ color: "#94a3b8" }}> · {count}</span>
          )}
        </p>
        {action && (
          <Link
            href={action.href}
            className="text-[11px] uppercase tracking-[0.2em] font-headline transition-colors hover:text-[#FF6130]"
            style={{ color: "#0891b2", fontWeight: 700 }}
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
