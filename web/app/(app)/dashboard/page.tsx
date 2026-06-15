import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveProgramCard, pickHero, type ProgramStage } from "./ActiveProgramCard";
import { OtherProgramCard } from "./OtherProgramCard";
import { TopAlert } from "./TopAlert";
import { CollabInvitations } from "./CollabInvitations";
import { ProfilePanel } from "./ProfilePanel";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";
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

// ─── Data loader ────────────────────────────────────────────

async function loadDashboard(userId: string) {
  const supabase = await createClient();

  // Phase A — base queries in parallel
  const [profileResult, ownedResult, cohostJoinsResult, receivedInvitesResult, upcomingSessionsResult] =
    await Promise.all([
      supabase
        .from("app_profile")
        .select("display_name, avatar_url, tagline, bio, cover_image_url, role, created_at")
        .eq("id", userId)
        .single(),
      supabase
        .from("app_challenge")
        .select("id, title, image_url, status, start_date, end_date, owner_id, contract_id, created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("app_challenge_cohost")
        .select(
          "challenge_id, app_challenge(id, title, image_url, status, start_date, end_date, owner_id, contract_id, created_at)",
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
        .select("id, title, start_time, duration_minutes, status, live_room_id")
        .eq("host_id", userId)
        .in("status", ["published", "ended"])
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

  if (challengeIds.length > 0) {
    const contractIds = allChallenges
      .map((c) => c.contract_id)
      .filter((x): x is string => !!x);

    const [contractsResult, spacesResult, cohostsResult, partnerInvitesResult] =
      await Promise.all([
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
      ]);

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
        name: (p as any).display_name ?? "Creator",
        avatar: (p as any).avatar_url,
      };
  }

  // Build program summaries with stage + partner
  const programs: ProgramSummary[] = allChallenges
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
      return {
        id: ch.id,
        title: ch.title,
        imageUrl: ch.image_url,
        stage,
        startDate: ch.start_date,
        endDate: ch.end_date,
        isOwner: ch.isOwner,
        spaceId: spaceIds[ch.id] ?? null,
        partner,
      };
    })
    // Hide stale empty drafts (defensive — the create-page cleanup
    // also handles this on its own visit)
    .filter((p) => p.stage !== ("completed" as ProgramStage) || p.endDate);

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

  // Pulse signals (for TopAlert)
  const sessions = (upcomingSessionsResult.data ?? []) as Array<any>;
  const now = Date.now();
  const liveSession = sessions.find((s) => !!s.live_room_id && s.status !== "ended") ?? null;
  const goLiveSoonSession = !liveSession
    ? sessions.find((s) => {
        if (s.live_room_id) return false;
        if (s.status !== "published") return false;
        const startMs = new Date(s.start_time).getTime();
        return now >= startMs - 15 * 60 * 1000 && now < startMs;
      })
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
        name: (p as any).display_name ?? "Creator",
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
        fromName: inviterMap[i.from_id]?.name ?? "Creator",
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
      coverImageUrl: profile?.cover_image_url ?? null,
      tagline: profile?.tagline ?? null,
      bio: profile?.bio ?? null,
      joinedAt: (profile as any)?.created_at ?? null,
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
  const userInitial = data.profile.displayName?.[0]?.toUpperCase() ?? "?";
  const userProp = {
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
  const tribePulse = {
    members: data.activePrograms.reduce((n, p) => n + (p.enrolledCount ?? 0), 0),
    newPosts: data.activePrograms.reduce((n, p) => n + (p.newPosts ?? 0), 0),
    pendingQuestions: data.activePrograms.reduce((n, p) => n + (p.pendingQuestions ?? 0), 0),
    experiences: data.activePrograms.length,
  };

  return (
    // overflow-x-clip (mobile only) guards against any stray child widening
    // the page — the cause of the "loads zoomed in" wobble on iOS Safari.
    // `clip` (not `hidden`) keeps vertical flow normal and doesn't break the
    // lg:sticky rail, which we re-enable at lg with overflow-x-visible.
    <div className="py-8 overflow-x-clip lg:overflow-x-visible">
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
          one building. The rail sticks beside the work stream on desktop;
          on mobile it's simply the top card of the stack. */}
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        <aside className="mb-8 lg:mb-0 lg:sticky lg:top-24">
          <ProfilePanel
            displayName={data.profile.displayName}
            avatarUrl={data.profile.avatarUrl}
            tagline={data.profile.tagline}
            bio={data.profile.bio}
            coverImageUrl={data.profile.coverImageUrl}
            joinedAt={data.profile.joinedAt}
            tribePulse={tribePulse}
            hasActivePrograms={activeCount > 0}
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

          {activeCount > 0 && (
            <Section label="Active now" count={activeCount}>
              <div className="space-y-5">
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
            </Section>
          )}

          {/* No active experience → the work stream lives here, in the
              column beside the profile. */}
          {activeCount === 0 && (
            <>
              {draftsCount > 0 && (
                <Section
                  label="Experience drafts"
                  count={draftsCount}
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
                <Section label="Archive" count={archiveCount}>
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
                    <CollabInvitations invites={data.pendingReceivedInvites} />
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
            <Section label="Experience drafts" count={draftsCount}>
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
            <Section label="Archive" count={archiveCount}>
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
                <CollabInvitations invites={data.pendingReceivedInvites} />
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
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
  children,
}: {
  label: string;
  count?: number;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section>
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
