"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Create a post in a challenge cohort space. Admin + active buyers
 * (enforced by RPC).
 *
 * The kind discriminator drives how the post renders in the cohort feed
 * (talk / intro / reflection / question). Bundle 5 ships the UI for these;
 * Bundle 2 just wires the server action so the params flow through.
 *
 * For kind='question' you must pass directedTo (an array of collaborator
 * ids); the RPC validates these are owner/cohost on the source challenge,
 * rejects self-tag, and emits question_for_you notifications.
 *
 * For kind='reflection' you must pass contextType='session' + contextId.
 * Submission of reflections via the action-bar prompt should use the
 * dedicated submit_session_reflection RPC instead — this generic path is
 * for cases where the caller composes a reflection-shaped post directly.
 */
export async function createChallengePost(
  spaceId: string,
  body: string,
  options?: {
    mediaUrl?: string | null;
    kind?: "talk" | "intro" | "intro_private" | "reflection" | "question";
    contextType?: "session" | null;
    contextId?: string | null;
    directedTo?: string[] | null;
    metadata?: Record<string, unknown>;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim() ?? "";
  const kind = options?.kind ?? "talk";

  // Body is required for all kinds except intro_private (where the
  // existence of the post itself carries meaning even with empty body).
  if (!trimmed && kind !== "intro_private") {
    return { error: "Post cannot be empty." };
  }
  if (trimmed.length > 5000) {
    return { error: "Post must be under 5000 characters." };
  }

  const rpcParams: Record<string, unknown> = {
    p_space: spaceId,
    p_body: trimmed,
  };
  if (options?.mediaUrl !== undefined) rpcParams.p_media_url = options.mediaUrl;
  if (options?.kind !== undefined) rpcParams.p_kind = options.kind;
  if (options?.contextType !== undefined) rpcParams.p_context_type = options.contextType;
  if (options?.contextId !== undefined) rpcParams.p_context_id = options.contextId;
  if (options?.directedTo !== undefined) rpcParams.p_directed_to = options.directedTo;
  if (options?.metadata !== undefined) rpcParams.p_metadata = options.metadata;

  const { data, error } = await supabase.rpc("create_challenge_post", rpcParams);

  if (error) return { error: error.message };
  return { success: true, postId: data };
}

/**
 * Comment on a challenge cohort post. Members only (enforced by RPC).
 *
 * Auto-promote behaviour: if the parent post is kind='question' and the
 * caller is in its directed_to array, the RPC sets is_coach_answer=true
 * on this comment AND emits a coach_answered_your_question notification
 * to the question's author. The caller doesn't have to do anything
 * special — the promotion is the affordance.
 */
export async function createChallengeComment(postId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim();
  if (!trimmed) return { error: "Comment cannot be empty." };
  if (trimmed.length > 2000)
    return { error: "Comment must be under 2000 characters." };

  const { data, error } = await supabase.rpc("create_challenge_comment", {
    p_post: postId,
    p_body: trimmed,
  });

  if (error) return { error: error.message };
  return { success: true, commentId: data };
}

/**
 * Edit your own challenge cohort comment. Author-only (enforced by RPC).
 * Stamps edited_at + edited_by; the cohort feed renders an "Edited" tag.
 *
 * Used by the directed Q&A flow when a coach wants to clarify their
 * canonical answer. Avoids the delete-and-re-comment hack.
 */
export async function updateChallengeComment(commentId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim();
  if (!trimmed) return { error: "Comment cannot be empty." };
  if (trimmed.length > 2000)
    return { error: "Comment must be under 2000 characters." };

  const { error } = await supabase.rpc("update_challenge_comment", {
    p_id: commentId,
    p_body: trimmed,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/** Toggle like on a challenge tribe post. */
export async function toggleChallengeLike(
  postId: string,
  isCurrentlyLiked: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = isCurrentlyLiked
    ? await supabase.rpc("unlike_challenge_post", { p_post: postId })
    : await supabase.rpc("like_challenge_post", { p_post: postId });

  if (error) return { error: error.message };
  return { success: true };
}
