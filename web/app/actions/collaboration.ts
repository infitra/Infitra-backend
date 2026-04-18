"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ── Collaboration Invite Flow ───────────────────────────

/**
 * Start a new collaboration: create draft + invite 1 or more creators.
 * Returns the challenge_id so the sender can be redirected to the workspace.
 */
export async function sendCollabInvites(params: {
  title?: string;
  message: string;
  invitees: { toId: string; splitPercent: number }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (params.invitees.length === 0) return { error: "Select at least one creator." };
  if (!params.message.trim()) return { error: "Please write a message." };

  const { data, error } = await supabase.rpc("send_collab_invites_with_draft", {
    p_from: user.id,
    p_title: params.title ?? "",
    p_message: params.message,
    p_invitees: params.invitees.map((i) => ({
      to_id: i.toId,
      split_percent: i.splitPercent,
    })),
  });

  if (error) return { error: error.message };
  return { ok: true, challengeId: data };
}

/**
 * Invite an additional collaborator to an existing workspace.
 * Only the challenge owner can call this.
 */
export async function sendAdditionalCollabInvite(params: {
  challengeId: string;
  toId: string;
  message: string;
  splitPercent: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase.rpc("send_additional_collab_invite", {
    p_challenge_id: params.challengeId,
    p_from: user.id,
    p_to: params.toId,
    p_message: params.message,
    p_split_percent: params.splitPercent,
  });

  if (error) return { error: error.message };
  return { ok: true, inviteId: data };
}

/** Recipient marks invite as "interested". Single RPC — creates draft + DM + cohost atomically. */
export async function acceptCollabInvite(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase.rpc("accept_collab_invite", {
    p_invite_id: inviteId,
    p_actor: user.id,
  });

  if (error) return { error: error.message };

  // data = challenge_id
  redirect(`/dashboard/collaborate/${data}`);
}

/** Recipient declines the invite. Single UPDATE with RLS. */
export async function declineCollabInvite(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_collaboration_invite")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("to_id", user.id)
    .eq("status", "pending");

  if (error) return { error: error.message };
  return { ok: true };
}

// ── Contract Flow ───────────────────────────────────────

/** Owner locks the collaboration contract. Single RPC — snapshot built server-side. */
export async function lockTerms(challengeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase.rpc("lock_challenge_contract", {
    p_challenge_id: challengeId,
    p_actor: user.id,
  });

  if (error) return { error: error.message };
  return { ok: true, contractId: data };
}

/** Cohost confirms (accepts) the locked contract terms. Existing RPC. */
export async function confirmTerms(contractId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("respond_to_contract", {
    p_contract_id: contractId,
    p_actor: user.id,
    p_response: "accept",
  });

  if (error) return { error: error.message };
  return { ok: true };
}

/** Cohost declines (requests changes) with optional comment. Existing RPC. */
export async function requestChanges(contractId: string, comment?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("respond_to_contract", {
    p_contract_id: contractId,
    p_actor: user.id,
    p_response: "decline",
    p_comment: comment ?? null,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

/** Owner reactivates drafting after a decline. Existing RPC. */
export async function reactivateDrafting(challengeId: string, contractId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.rpc("reactivate_drafting", {
    p_target_type: "challenge",
    p_target_id: challengeId,
    p_actor: user.id,
    p_contract_id: contractId,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

// ── Cohost Management (single mutations, RLS-protected) ─

/** Add a cohost to a draft challenge. */
export async function addCohost(challengeId: string, cohostId: string, splitPercent: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_challenge_cohost")
    .insert({ challenge_id: challengeId, cohost_id: cohostId, split_percent: splitPercent });

  if (error) return { error: error.message };
  return { ok: true };
}

/** Update a cohost's split percentage. */
export async function updateCohostSplit(challengeId: string, cohostId: string, splitPercent: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_challenge_cohost")
    .update({ split_percent: splitPercent })
    .eq("challenge_id", challengeId)
    .eq("cohost_id", cohostId);

  if (error) return { error: error.message };
  return { ok: true };
}

/** Remove a cohost from a draft challenge. */
export async function removeCohost(challengeId: string, cohostId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_challenge_cohost")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("cohost_id", cohostId);

  if (error) return { error: error.message };
  return { ok: true };
}

// ── Session Cohost Management (RLS enforces session host only) ──

/**
 * Add a cohost to a session. Must be a challenge cohost per backend rules.
 * split_percent is NULL for challenge-bundled sessions (revenue governed by
 * challenge contract). The backend trigger validates 1-99 + sum<=100 only
 * for standalone sessions.
 */
export async function addSessionCohost(sessionId: string, cohostId: string, splitPercent: number | null = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_session_cohost")
    .insert({ session_id: sessionId, cohost_id: cohostId, split_percent: splitPercent });

  if (error) return { error: error.message };
  return { ok: true };
}

/** Remove a cohost from a session. */
export async function removeSessionCohost(sessionId: string, cohostId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_session_cohost")
    .delete()
    .eq("session_id", sessionId)
    .eq("cohost_id", cohostId);

  if (error) return { error: error.message };
  return { ok: true };
}

// ── Tribe Cover (single mutation, RLS-protected) ────────

/** Update the creator's tribe cover image. */
export async function updateTribeCover(coverUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_creator_space")
    .update({ cover_image_url: coverUrl })
    .eq("creator_id", user.id);

  if (error) return { error: error.message };
  return { ok: true };
}

// ── DM Messages (single mutation, RLS-protected) ────────

/** Send a message in a DM conversation. Uses dm_send RPC (SECURITY DEFINER). */
export async function sendDmMessage(conversationId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (!body.trim()) return { error: "Message cannot be empty." };

  const { error } = await supabase.rpc("dm_send", {
    p_conversation_id: conversationId,
    p_body: body.trim(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}
