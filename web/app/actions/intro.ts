"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Submit a participant's intro to an Experience's cohort feed (shares with the
 * tribe — a public 'intro' post). Backed by the shipped submit_intro_post RPC,
 * which resolves the space, validates enrollment, and enforces one intro per
 * person per Experience.
 *
 * Used by the post-purchase "first moves" card. At that moment the buyer's
 * membership may not be written yet (stripe webhook still in flight), so the
 * RPC can raise 'not enrolled'. We surface that as { deferred: true } rather
 * than a hard error — the caller just lets the in-space intro prompt (driven
 * by vw_action_items_for_user, which shows when no intro post exists) catch it
 * the moment they walk into the space. Same object, second entry point.
 */
export async function submitIntro(challengeId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim();
  if (!trimmed) return { error: "Intro cannot be empty." };
  if (trimmed.length > 2000) {
    return { error: "Intro must be under 2000 characters." };
  }

  const { data, error } = await supabase.rpc("submit_intro_post", {
    p_challenge_id: challengeId,
    p_body: trimmed,
    p_share_with_cohort: true,
  });

  if (error) {
    // Not enrolled yet (webhook pending) or already introduced — defer to the
    // in-space prompt rather than blocking the buyer's path into the Experience.
    return { deferred: true as const, error: error.message };
  }
  return { success: true as const, postId: data as string };
}
