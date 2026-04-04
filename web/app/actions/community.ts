"use server";

import { createClient } from "@/lib/supabase/server";

/** Create a post in a creator community. Creator-only (enforced by RPC). */
export async function createCreatorPost(spaceId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim();
  if (!trimmed || trimmed.length < 1)
    return { error: "Post cannot be empty." };
  if (trimmed.length > 5000)
    return { error: "Post must be under 5000 characters." };

  const { data, error } = await supabase.rpc("create_creator_post", {
    p_space: spaceId,
    p_body: trimmed,
  });

  if (error) return { error: error.message };
  return { success: true, postId: data };
}

/** Create a post in a challenge tribe. Admin + active buyers (enforced by RPC). */
export async function createChallengePost(spaceId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim();
  if (!trimmed || trimmed.length < 1)
    return { error: "Post cannot be empty." };
  if (trimmed.length > 5000)
    return { error: "Post must be under 5000 characters." };

  const { data, error } = await supabase.rpc("create_challenge_post", {
    p_space: spaceId,
    p_body: trimmed,
  });

  if (error) return { error: error.message };
  return { success: true, postId: data };
}

/** Comment on a creator community post. Members only (enforced by RPC). */
export async function createCreatorComment(postId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim();
  if (!trimmed) return { error: "Comment cannot be empty." };
  if (trimmed.length > 2000)
    return { error: "Comment must be under 2000 characters." };

  const { data, error } = await supabase.rpc("create_creator_comment", {
    p_post: postId,
    p_body: trimmed,
  });

  if (error) return { error: error.message };
  return { success: true, commentId: data };
}

/** Comment on a challenge tribe post. Members only (enforced by RPC). */
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

/** Toggle like on a creator community post. */
export async function toggleCreatorLike(
  postId: string,
  isCurrentlyLiked: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = isCurrentlyLiked
    ? await supabase.rpc("unlike_creator_post", { p_post: postId })
    : await supabase.rpc("like_creator_post", { p_post: postId });

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
