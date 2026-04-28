import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GreetingRow } from "./GreetingRow";
import { ActiveProgramCard, type ProgramStage } from "./ActiveProgramCard";
import { PilotPulse } from "./PilotPulse";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home — INFITRA" };

/**
 * Pilot dashboard — Phase 3a Bundle 1.
 *
 * Shape: greeting → pulse → active program. That's it (Bundles 2/3
 * will add the next-session card, buyer activity, and earnings strip).
 *
 * The old dashboard had 9 sections and ran ~12 sequential awaits to
 * populate a generic "any-creator at any-stage" surface. For pilot
 * creators — each running ONE active joint challenge — that surface
 * was emotionally flat (vanity zeroes, three places sessions appeared,
 * creator-tribe community feed irrelevant). This rewrite focuses
 * ruthlessly on the joint program as the central focus, with a
 * single action card on top when something needs doing.
 *
 * Data loading is consolidated into loadPilotDashboard() with all
 * queries parallelized via Promise.all.
 */

// ─── Data shape ─────────────────────────────────────────────

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

/**
 * Score a challenge for "most active right now" — higher = more
 * deserving of being THE program shown on the dashboard. Pilot
 * creators have one program but the function still has to make
 * a decision when there are stale drafts from before the pilot.
 */
function challengeActivenessRank(ch: ChallengeRow): number {
  const today = new Date().toISOString().split("T")[0];
  if (ch.status === "published") {
    if (ch.start_date && ch.end_date && today >= ch.start_date && today <= ch.end_date) {
      return 100; // currently live — highest priority
    }
    if (ch.start_date && today < ch.start_date) {
      return 80; // pre-launch
    }
    return 40; // published, completed
  }
  if (ch.status === "draft") {
    return 60; // drafting — beats completed but loses to live/pre-launch
  }
  return 10;
}

// ─── Data loader ────────────────────────────────────────────

async function loadPilotDashboard(userId: string) {
  const supabase = await createClient();

  // Phase A: kick off all base queries in parallel.
  const [
    profileResult,
    ownedResult,
    cohostJoinsResult,
    receivedInvitesResult,
    upcomingSessionsResult,
  ] = await Promise.all([
    supabase
      .from("app_profile")
      .select("display_name, avatar_url, role")
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
  const ownedChallenges: ChallengeRow[] = (ownedResult.data ?? []) as ChallengeRow[];
  // Join may come back as object or single-element array
  const cohostChallenges: ChallengeRow[] = (cohostJoinsResult.data ?? [])
    .map((j: any) => (Array.isArray(j.app_challenge) ? j.app_challenge[0] : j.app_challenge))
    .filter(Boolean) as ChallengeRow[];

  const allChallenges: Array<ChallengeRow & { isOwner: boolean }> = [
    ...ownedChallenges.map((c) => ({ ...c, isOwner: true })),
    ...cohostChallenges.map((c) => ({ ...c, isOwner: false })),
  ];

  // Pick the most-active challenge as THE program.
  const sortedByActiveness = [...allChallenges].sort(
    (a, b) => challengeActivenessRank(b) - challengeActivenessRank(a),
  );
  const activeChallenge = sortedByActiveness[0] ?? null;

  // Phase B: based on active challenge, fetch its partner + contract state in parallel.
  let partner: {
    id: string;
    name: string;
    avatar: string | null;
    pendingInvite: boolean;
  } | null = null;
  let contractLockedAt: string | null = null;

  if (activeChallenge) {
    // Run pending-invite + contract queries in parallel; partner-resolution
    // depends on the owner-vs-cohost branch and may need a follow-up query.
    const pendingPartnerInvitePromise = supabase
      .from("app_collaboration_invite")
      .select("to_id")
      .eq("challenge_id", activeChallenge.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    const contractPromise = activeChallenge.contract_id
      ? supabase
          .from("app_collaboration_contract")
          .select("locked_at")
          .eq("id", activeChallenge.contract_id)
          .single()
      : Promise.resolve({ data: null, error: null });

    const ownerCohostPromise = activeChallenge.isOwner
      ? supabase
          .from("app_challenge_cohost")
          .select("cohost_id")
          .eq("challenge_id", activeChallenge.id)
          .limit(1)
          .maybeSingle()
      : supabase
          .from("app_profile")
          .select("id, display_name, avatar_url")
          .eq("id", activeChallenge.owner_id)
          .single();

    const [pendingPartnerInviteResult, contractResult, partnerOrCohostResult] =
      await Promise.all([pendingPartnerInvitePromise, contractPromise, ownerCohostPromise]);

    contractLockedAt = (contractResult.data as any)?.locked_at ?? null;

    if (activeChallenge.isOwner) {
      const cohostId = (partnerOrCohostResult.data as any)?.cohost_id ?? null;
      const pendingToId = (pendingPartnerInviteResult.data as any)?.to_id ?? null;

      if (cohostId) {
        const { data: pp } = await supabase
          .from("app_profile")
          .select("display_name, avatar_url")
          .eq("id", cohostId)
          .single();
        partner = {
          id: cohostId,
          name: pp?.display_name ?? "Partner",
          avatar: pp?.avatar_url ?? null,
          pendingInvite: false,
        };
      } else if (pendingToId) {
        const { data: pp } = await supabase
          .from("app_profile")
          .select("display_name, avatar_url")
          .eq("id", pendingToId)
          .single();
        partner = {
          id: pendingToId,
          name: pp?.display_name ?? "Partner",
          avatar: pp?.avatar_url ?? null,
          pendingInvite: true,
        };
      }
    } else {
      const ownerProfile = partnerOrCohostResult.data as any;
      if (ownerProfile) {
        partner = {
          id: ownerProfile.id,
          name: ownerProfile.display_name ?? "Partner",
          avatar: ownerProfile.avatar_url,
          pendingInvite: false,
        };
      }
    }
  }

  // Pulse signals: live and go-live-soon sessions
  const sessions = (upcomingSessionsResult.data ?? []) as Array<{
    id: string;
    title: string;
    start_time: string;
    status: string;
    live_room_id: string | null;
  }>;

  const now = Date.now();
  const liveSession =
    sessions.find((s) => !!s.live_room_id && s.status !== "ended") ?? null;
  const goLiveSoonSession = !liveSession
    ? sessions.find((s) => {
        if (s.live_room_id) return false;
        if (s.status !== "published") return false;
        const startMs = new Date(s.start_time).getTime();
        return now >= startMs - 15 * 60 * 1000 && now < startMs;
      })
    : null;

  // Pending received invites (shape for CollabInvitations).
  // Supabase typed-result inference doesn't unwrap the joined
  // app_challenge cleanly, so we go through `any[]` to read the join.
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
      // app_challenge join may come back as object or single-element array
      // depending on PostgREST inference. Normalize to object.
      const ch = Array.isArray(i.app_challenge) ? i.app_challenge[0] : i.app_challenge;
      const rawTitle = ch?.title ?? "";
      const isMeaningfulTitle =
        !!rawTitle && rawTitle !== "Untitled Collaboration" && rawTitle !== "Untitled Challenge";
      pendingReceivedInvites.push({
        id: i.id,
        fromName: inviterMap[i.from_id]?.name ?? "Creator",
        fromAvatar: inviterMap[i.from_id]?.avatar ?? null,
        fromTagline: inviterMap[i.from_id]?.tagline ?? null,
        message: i.message,
        splitPercent: i.initial_split_percent ?? 0,
        createdAt: i.created_at,
        challengeTitle: isMeaningfulTitle ? rawTitle : null,
        challengeImageUrl: ch?.image_url ?? null,
      });
    }
  }

  // Compute stage now that we know contract + partner state
  const programStage: ProgramStage | null = activeChallenge
    ? computeStage(activeChallenge, partner?.pendingInvite ?? false, contractLockedAt)
    : null;

  return {
    profile: {
      displayName: profile?.display_name ?? "",
      avatarUrl: profile?.avatar_url ?? null,
      role: (profile?.role ?? "creator") as "creator" | "participant",
    },
    activeProgram: activeChallenge && programStage
      ? {
          id: activeChallenge.id,
          title: activeChallenge.title,
          imageUrl: activeChallenge.image_url,
          stage: programStage,
          startDate: activeChallenge.start_date,
          endDate: activeChallenge.end_date,
          isOwner: activeChallenge.isOwner,
        }
      : null,
    partner,
    pendingReceivedInvites,
    liveSession: liveSession
      ? { id: liveSession.id, title: liveSession.title }
      : null,
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

  const data = await loadPilotDashboard(user.id);

  const userInitial = data.profile.displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="py-8 max-w-4xl mx-auto">
      {/* Layer 0 — Greeting (one line, no card) */}
      <GreetingRow
        name={data.profile.displayName}
        programTitle={data.activeProgram?.title ?? null}
        partnerName={data.partner?.name ?? null}
        startDate={data.activeProgram?.startDate ?? null}
        endDate={data.activeProgram?.endDate ?? null}
        stage={data.activeProgram?.stage ?? "none"}
      />

      {/* Layer A — Pulse (action surface, conditional) */}
      <PilotPulse
        liveSession={data.liveSession}
        goLiveSoonSession={data.goLiveSoonSession}
        pendingReceivedInvites={data.pendingReceivedInvites}
      />

      {/* Layer B — Active Program (the focal hero) */}
      <ActiveProgramCard
        program={data.activeProgram}
        partner={data.partner}
        user={{ avatar: data.profile.avatarUrl, initial: userInitial }}
      />
    </div>
  );
}
