"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Pre-Session Pulse — a single 0-10 readiness value for an upcoming session.
 * Upserts via the submit_pre_pulse RPC (one response per (session, user); the
 * RPC enforces attendance). Individual values stay private; only the cohort
 * aggregate is surfaced (load_experience_space sessions[].prePulse).
 */
export async function submitPrePulse(sessionId: string, value: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  if (!Number.isInteger(value) || value < 0 || value > 10) {
    return { error: "Pick a value between 0 and 10." };
  }

  const { error } = await supabase.rpc("submit_pre_pulse", {
    p_session_id: sessionId,
    p_value: value,
  });

  if (error) return { error: error.message };
  return { success: true };
}
