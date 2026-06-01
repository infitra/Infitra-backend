"use client";

/**
 * loadWorkspaceSnapshot — Bundle 3.5 Phase 2c.
 *
 * Client-side fetch of the consolidated workspace snapshot (the same
 * load_workspace RPC the server page uses). Structural realtime events
 * (session/cohost/invite changes) call this and seed() the result into the
 * store — one round-trip instead of router.refresh()'s full-page re-render.
 *
 * Returns the server-derived slices (WorkspaceServerSeed); the store's seed()
 * preserves the realtime-owned challenge + contract slices, so this only
 * refreshes the structural slices (sessions, cohosts, invites, splits,
 * profiles, activity).
 */

import { createClient } from "@/lib/supabase/client";
import type { WorkspaceServerSeed } from "./initFromServerProps";

interface RawSnapshot {
  authorized?: boolean;
  is_owner?: boolean;
  owner_split?: number;
  challenge?: WorkspaceServerSeed["challenge"];
  owner_profile?: WorkspaceServerSeed["ownerProfile"];
  cohosts?: WorkspaceServerSeed["cohosts"];
  sessions?: WorkspaceServerSeed["sessions"];
  pending_invites?: WorkspaceServerSeed["pendingInvites"];
  contract?: WorkspaceServerSeed["contract"];
  activity?: WorkspaceServerSeed["activity"];
  profile_map?: WorkspaceServerSeed["profileMap"];
}

export async function loadWorkspaceSnapshot(
  challengeId: string,
  currentUserId: string,
): Promise<WorkspaceServerSeed | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("load_workspace", {
    p_challenge_id: challengeId,
  });
  const ws = data as RawSnapshot | null;
  if (error || !ws || !ws.authorized || !ws.challenge) return null;

  return {
    challenge: ws.challenge,
    isOwner: ws.is_owner ?? false,
    currentUserId,
    ownerProfile: ws.owner_profile ?? { id: currentUserId, name: "Owner", avatar: null },
    ownerSplit: ws.owner_split ?? 100,
    cohosts: ws.cohosts ?? [],
    sessions: ws.sessions ?? [],
    pendingInvites: ws.pending_invites ?? [],
    contract: ws.contract ?? null,
    activity: ws.activity ?? [],
    profileMap: ws.profile_map ?? {},
  };
}
