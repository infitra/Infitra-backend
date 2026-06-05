import type { CreatorStats, ExperienceSpaceState } from "@/lib/experienceSpace/store";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

/** Server seed → initial store state (stamps the local-only ui slice).
 *  creatorStats is fetched separately (creators only) and seeded here so the
 *  console renders its numbers on first paint, with no client round-trip. */
export function initFromSeed(
  seed: ExperienceSpaceSeed,
  creatorStats: CreatorStats | null = null,
): ExperienceSpaceState {
  return {
    ...seed,
    ui: {
      channelStatus: "idle",
      composeIntent: null,
      creatorStats,
      feedActivity: 0,
    },
  };
}
