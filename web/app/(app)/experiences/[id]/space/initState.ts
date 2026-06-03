import type { ExperienceSpaceState } from "@/lib/experienceSpace/store";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

/** Server seed → initial store state (stamps the local-only ui slice). */
export function initFromSeed(seed: ExperienceSpaceSeed): ExperienceSpaceState {
  return { ...seed, ui: { channelStatus: "idle", composeIntent: null } };
}
