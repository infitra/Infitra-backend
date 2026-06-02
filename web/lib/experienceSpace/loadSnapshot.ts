"use client";

/**
 * loadExperienceSpaceSnapshot — Bundle 5b.
 *
 * Client-side fetch of the consolidated Experience-Space snapshot (the same
 * load_experience_space RPC the server page uses). Used by the realtime
 * reconcile (reconnect / tab-return) to heal drift in one round-trip.
 */

import { createClient } from "@/lib/supabase/client";
import { mapSnapshot, type RawExperienceSpaceSnapshot, type ExperienceSpaceSeed } from "./mapSnapshot";

export async function loadExperienceSpaceSnapshot(
  challengeId: string,
  currentUserId: string,
): Promise<ExperienceSpaceSeed | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("load_experience_space", {
    p_challenge_id: challengeId,
  });
  if (error) return null;
  return mapSnapshot(data as RawExperienceSpaceSnapshot | null, currentUserId);
}
