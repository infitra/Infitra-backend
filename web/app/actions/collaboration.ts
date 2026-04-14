"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ── Collaboration Invite Flow ───────────────────────────

/** Send a collaboration invite to another creator. */
export async function sendCollabInvite(
  toId: string,
  message: string,
  initialSplitPercent: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (toId === user.id) return { error: "Cannot invite yourself." };
  if (initialSplitPercent < 0 || initialSplitPercent > 100) return { error: "Split must be between 0 and 100." };
  if (!message.trim()) return { error: "Please write a message." };

  // Verify target is a creator
  const { data: target } = await supabase
    .from("app_profile")
    .select("id, role, display_name")
    .eq("id", toId)
    .single();

  if (!target || target.role !== "creator") return { error: "Can only invite creators." };

  // Create the invite
  const { data: invite, error } = await supabase
    .from("app_collaboration_invite")
    .insert({
      from_id: user.id,
      to_id: toId,
      message: message.trim(),
      initial_split_percent: initialSplitPercent,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Send notification
  await supabase.from("app_notification").insert({
    recipient_id: toId,
    type: "collab_invite",
    payload: { invite_id: invite.id, from_id: user.id },
  });

  return { ok: true, inviteId: invite.id };
}

/** Recipient marks invite as "interested" — creates draft + DM + cohost link. */
export async function acceptCollabInvite(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Fetch the invite
  const { data: invite, error: fetchErr } = await supabase
    .from("app_collaboration_invite")
    .select("*")
    .eq("id", inviteId)
    .eq("to_id", user.id)
    .eq("status", "pending")
    .single();

  if (fetchErr || !invite) return { error: "Invite not found or already responded." };

  // 1. Create draft challenge (owned by the inviter)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const endDate = new Date(nextWeek);
  endDate.setDate(endDate.getDate() + 28);
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const { data: challenge, error: chErr } = await supabase
    .from("app_challenge")
    .insert({
      title: "Untitled Collaboration",
      start_date: fmt(nextWeek),
      end_date: fmt(endDate),
      price_cents: 0,
      currency: "CHF",
      owner_id: invite.from_id,
    })
    .select("id")
    .single();

  if (chErr) return { error: chErr.message };

  // 2. Add the invitee as cohost with the agreed split
  const { error: cohostErr } = await supabase
    .from("app_challenge_cohost")
    .insert({
      challenge_id: challenge.id,
      cohost_id: user.id,
      split_percent: invite.initial_split_percent,
    });

  if (cohostErr) return { error: cohostErr.message };

  // 3. Create DM conversation
  const { data: convo, error: dmErr } = await supabase
    .from("app_dm_conversation")
    .insert({ created_by: invite.from_id })
    .select("id")
    .single();

  if (dmErr) return { error: dmErr.message };

  // Add both as members
  await supabase.from("app_dm_member").insert([
    { conversation_id: convo.id, user_id: invite.from_id },
    { conversation_id: convo.id, user_id: user.id },
  ]);

  // Send first message (the original invite message)
  await supabase.from("app_dm_message").insert({
    conversation_id: convo.id,
    author_id: invite.from_id,
    body: invite.message,
  });

  // 4. Update invite with challenge + DM references
  await supabase
    .from("app_collaboration_invite")
    .update({
      status: "interested",
      responded_at: new Date().toISOString(),
      challenge_id: challenge.id,
      dm_conversation_id: convo.id,
    })
    .eq("id", inviteId);

  // 5. Notify the inviter
  await supabase.from("app_notification").insert({
    recipient_id: invite.from_id,
    type: "collab_accepted",
    payload: {
      invite_id: inviteId,
      from_id: user.id,
      challenge_id: challenge.id,
    },
  });

  redirect(`/dashboard/collaborate/${challenge.id}`);
}

/** Recipient declines the invite. */
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

/** Owner locks the collaboration contract for a challenge. */
export async function lockTerms(challengeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Build snapshot from current state
  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("title, price_cents, currency, owner_id")
    .eq("id", challengeId)
    .single();

  if (!challenge) return { error: "Challenge not found." };
  if (challenge.owner_id !== user.id) return { error: "Only the owner can lock terms." };

  const { data: cohosts } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id, split_percent")
    .eq("challenge_id", challengeId);

  const snapshot = {
    title: challenge.title,
    price_cents: challenge.price_cents,
    currency: challenge.currency,
    owner_id: challenge.owner_id,
    cohosts: (cohosts ?? []).map((c: any) => ({
      cohost_id: c.cohost_id,
      split_percent: c.split_percent,
    })),
  };

  const { data, error } = await supabase.rpc("lock_contract", {
    p_target_type: "challenge",
    p_target_id: challengeId,
    p_actor: user.id,
    p_snapshot_json: snapshot,
  });

  if (error) return { error: error.message };
  return { ok: true, contractId: data };
}

/** Cohost confirms (accepts) the locked contract terms. */
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

/** Cohost declines (requests changes) with optional comment. */
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

/** Owner reactivates drafting after a decline — unlocks for changes. */
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

// ── Cohost Management ───────────────────────────────────

/** Add a cohost to a draft challenge. */
export async function addCohost(challengeId: string, cohostId: string, splitPercent: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("app_challenge_cohost")
    .insert({
      challenge_id: challengeId,
      cohost_id: cohostId,
      split_percent: splitPercent,
    });

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

// ── Tribe Cover ─────────────────────────────────────────

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

// ── DM Messages (for workspace chat) ────────────────────

/** Send a message in a DM conversation. */
export async function sendDmMessage(conversationId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (!body.trim()) return { error: "Message cannot be empty." };

  const { error } = await supabase.from("app_dm_message").insert({
    conversation_id: conversationId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  return { ok: true };
}
