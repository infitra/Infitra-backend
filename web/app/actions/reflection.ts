"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Post-Session Reflection — free text + optional energy-after (0-10). Creates a
 * kind='reflection' post in the Tribe feed via submit_session_reflection (the
 * RPC enforces the caller attended + the session has ended, and requires at
 * least one of body / energy). Returns the new post id.
 */
export async function submitSessionReflection(
  sessionId: string,
  body: string,
  energyAfter: number | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = body?.trim() ?? "";
  if (!trimmed && energyAfter == null) {
    return { error: "Add a few words or set your energy." };
  }
  if (trimmed.length > 5000) {
    return { error: "Reflection must be under 5000 characters." };
  }
  if (energyAfter != null && (!Number.isInteger(energyAfter) || energyAfter < 0 || energyAfter > 10)) {
    return { error: "Energy must be between 0 and 10." };
  }

  const { data, error } = await supabase.rpc("submit_session_reflection", {
    p_session_id: sessionId,
    p_body: trimmed,
    p_energy_after: energyAfter,
  });

  if (error) return { error: error.message };
  return { success: true, postId: data as string };
}
