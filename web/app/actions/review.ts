"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Participant → experience review. One rating per (challenge, reviewer); the
 * backend credits ALL creators (owner + co-hosts) via vw_expert_review_stats.
 * Idempotent (upsert), so editing re-submits.
 */
export async function submitExperienceReview(
  challengeId: string,
  rating: number,
  comment: string
): Promise<{ error?: string }> {
  if (!challengeId || rating < 1 || rating > 5) {
    return { error: "Tap a star to rate." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_experience_review", {
    p_challenge_id: challengeId,
    p_rating: rating,
    p_comment: comment.trim() || null,
  });
  if (error) return { error: error.message };
  return {};
}

/**
 * Creator → co-host collaboration review. Private to creators (RLS enforces
 * reviewer = self, both creators, shared work). Idempotent per (challenge,
 * reviewer, subject).
 */
export async function submitCollabReview(
  challengeId: string,
  subjectId: string,
  rating: number,
  comment: string
): Promise<{ error?: string }> {
  if (!challengeId || !subjectId || rating < 1 || rating > 5) {
    return { error: "Tap a star to rate." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("collab_review_create", {
    p_challenge: challengeId,
    p_subject: subjectId,
    p_rating: rating,
    p_comment: comment.trim() || null,
  });
  if (error) return { error: error.message };
  return {};
}
