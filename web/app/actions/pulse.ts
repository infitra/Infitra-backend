"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Pre-Session Pulse — the two-axis check-in (2026-08-17 design):
 *   mood    "How do you feel?"   up = good, carries the verdict
 *   energy  "How's your tank?"   a state, not a score
 * Same two questions are asked again in the reflection, so the pair is
 * subtractable ("what the hour did to you"). Upserts via submit_pre_pulse
 * (one response per session+user; expert taps are silently ignored so the
 * cohort metric stays participant-pure). Individual values stay private;
 * only the cohort aggregate is surfaced (sessions[].prePulse) unless the
 * participant later posts a reflection carrying their own pair.
 */
export async function submitPrePulse(sessionId: string, mood: number, energy: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  for (const v of [mood, energy]) {
    if (!Number.isInteger(v) || v < 0 || v > 10) {
      return { error: "Pick values between 0 and 10." };
    }
  }

  const { error } = await supabase.rpc("submit_pre_pulse", {
    p_session_id: sessionId,
    p_mood: mood,
    p_energy: energy,
  });

  if (error) return { error: error.message };
  return { success: true };
}

/** The participant's own pulse for a session (RLS: own row only). Used by
 *  the reflection form to preview the before-values that will ride the post,
 *  and by the room door to skip the ask when already answered. */
export async function getMyPrePulse(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("app_session_pre_pulse_response")
    .select("mood, value")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { mood: data.mood as number | null, energy: data.value as number | null };
}
