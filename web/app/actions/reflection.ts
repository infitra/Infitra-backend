"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Post-Session Reflection — free text + the same two-axis pulse asked before
 * the session (mood + energy, 0-10). Creates a kind='reflection' post via
 * submit_session_reflection; the RPC enforces attendance, and stamps the
 * author's own BEFORE values into the post metadata so the feed can render
 * the pair ("Mood 8 (+3) · Energy 4 (-3)") with zero joins.
 */
export async function submitSessionReflection(
  sessionId: string,
  body: string,
  energyAfter: number | null,
  moodAfter: number | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim() ?? "";
  if (!trimmed && energyAfter == null && moodAfter == null) {
    return { error: "Add a few words or set your pulse." };
  }
  if (trimmed.length > 5000) {
    return { error: "Reflection must be under 5000 characters." };
  }
  for (const v of [energyAfter, moodAfter]) {
    if (v != null && (!Number.isInteger(v) || v < 0 || v > 10)) {
      return { error: "Pulse values must be between 0 and 10." };
    }
  }

  const { data, error } = await supabase.rpc("submit_session_reflection", {
    p_session_id: sessionId,
    p_body: trimmed,
    p_energy_after: energyAfter,
    p_mood_after: moodAfter,
  });

  if (error) return { error: error.message };
  return { success: true, postId: data as string };
}
