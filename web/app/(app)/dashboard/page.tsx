import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveProgramCard, pickHero, type ProgramStage } from "./ActiveProgramCard";
import { OtherProgramCard } from "./OtherProgramCard";
import { TopAlert } from "./TopAlert";
import { CollabInvitations } from "./CollabInvitations";
import { IdentityStrip } from "./IdentityStrip";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home — INFITRA" };

/**
 * Pilot dashboard — programs hub.
 *
 * Composition:
 *   [TopAlert when live or going-live]
 *   [Identity strip — thin top bar with name + status + edit]
 *
 *   ACTIVE PROGRAMS zone — adaptive layout:
 *     0 active: invite hero (if pending) OR "start your first" empty hero
 *     1 active: full-width hero card (rich treatment — insights + next
 *               session + multiple actions)
 *     2 active: side-by-side cards, equal weight, compact treatment
 *     3+ active: 3-col grid of compact cards
 *
 *   OTHER PROGRAMS — compact grid below, drafts/awaiting/completed
 *
 *   INVITATIONS — full-width section if has active program + invite
 *
 * Notification bell (in top nav) carries the ambient "what's
 * happened" feed: collab events, partner DM/workspace activity,
 * system updates. Insights here on the dashboard are the operational
 * deltas (new members, sessions done, earnings this week).
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

  return (
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

      {/* Personal touchstone — greeting, name, the user's footing.
          Below it: a hairline divider. The greeting is the "this is
          you" beat; everything below is "your programs" — the divider
          marks the transition. */}
      <IdentityStrip
        displayName={data.profile.displayName}
        avatarUrl={data.profile.avatarUrl}
        tagline={data.profile.tagline}
        bio={data.profile.bio}
        coverImageUrl={data.profile.coverImageUrl}
        joinedAt={data.profile.joinedAt}
      />
      <div
        className="mt-8 mb-12 h-px"
        style={{ backgroundColor: "rgba(15,34,41,0.08)" }}
        aria-hidden
      />

      {/* Section zones — each carries a quiet uppercase label so the
          page reads as one document with consistent rhythm. The label
          + count vocabulary is shared by all three zones (active,
          other, invitations). */}
      <div className="space-y-12">
        {/* ACTIVE NOW — hero + tier-2, or empty state */}
        {activeCount === 0 && !hasInvites && (
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
                />
              )}
              {tier2.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tier2.map((p) => (
                    <ActiveProgramCard
                      key={p.id}
                      program={p}
                      partner={p.partner}
                      user={userProp}
                      density="compact"
                    />
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* CHALLENGE DRAFTS — pre-publish (drafting + awaiting-signatures) */}
        {draftsCount > 0 && (
          <Section
            label="Challenge drafts"
            count={draftsCount}
            action={{ label: "+ Start new", href: "/dashboard/create" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drafts.map((p) => (
                <OtherProgramCard key={p.id} program={p} />
              ))}
            </div>
          </Section>
        )}

        {/* ARCHIVE — completed programs, navigable but not promoted */}
        {archiveCount > 0 && (
          <Section label="Archive" count={archiveCount}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {archive.map((p) => (
                <OtherProgramCard key={p.id} program={p} />
              ))}
            </div>
          </Section>
        )}

        {/* + Start new — quiet inline CTA when there are no drafts to
            label. Sits in the same position as a Section, sans heading. */}
        {draftsCount === 0 && activeCount > 0 && (
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
              + Start a new program
            </Link>
          </div>
        )}

        {/* COLLABORATION INVITATIONS — collab requests waiting on the user */}
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
    </div>
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
