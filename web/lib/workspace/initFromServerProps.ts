/**
 * initFromServerProps — Bundle 3.5 Phase 1.
 *
 * Converts the workspace's server-rendered props into the initial store
 * state. The prop names already match the store slice names (the store
 * shape was modelled on WorkspaceEditor's Props), so this is essentially
 * an assembly step that also stamps the local-only `ui` slice.
 *
 * Kept as a standalone pure function (no React) so it can be unit-reasoned
 * about and reused by reconciliation (Phase 4), which rebuilds the same
 * server-derived slices from a fresh fetch.
 */

import type { WorkspaceState } from "./store";

/** The server-derived slices the workspace page already resolves. */
export type WorkspaceServerSeed = Omit<WorkspaceState, "ui">;

export function initWorkspaceState(seed: WorkspaceServerSeed): WorkspaceState {
  return {
    ...seed,
    ui: { channelStatus: "idle" },
  };
}
