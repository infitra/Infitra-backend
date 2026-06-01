/**
 * Workspace store — Bundle 3.5 Phase 1.
 *
 * The canonical client-side cache of the collaborate workspace's live
 * state. Today (Phase 1) it is pure plumbing: the store is created and
 * seeded from the server-rendered props but NOTHING reads from it yet —
 * every consumer component still reads its props as before. Subsequent
 * phases wire it in:
 *   - Phase 2: realtime handlers mutate this store directly (instead of
 *     calling router.refresh()); consumers switch to store selectors.
 *   - Phase 3: actor mutations become optimistic against this store.
 *   - Phase 4: channel health writes into the `ui` slice.
 *
 * Architecture rule (thin-frontend principle): this store is a CACHE, not
 * an authority. The database stays the source of truth — RLS / RPCs / DB
 * constraints enforce every business rule. The store only mirrors server
 * state for instant UI; on any dispute the server wins (reconciliation).
 *
 * The type surface mirrors WorkspaceEditor's Props exactly (Phase 2 will
 * make the editor import these as the canonical definitions). Defined here
 * — rather than imported from the app dir — so `lib` owns the shape and
 * the app components depend on `lib`, not the reverse.
 */

import { createStore, type StoreApi } from "zustand/vanilla";

// ---- Slice shapes (mirror WorkspaceEditor Props) ----

export interface WorkspaceWeeklyFocusEntry {
  week: number;
  theme: string;
}

export interface WorkspaceTopicOwnershipEntry {
  creator_id: string;
  topics: string[];
}

export interface WorkspaceActivityRow {
  id: string;
  actor_id: string;
  kind: string;
  payload: { field?: string; old?: unknown; new?: unknown } | null;
  created_at: string;
}

export interface WorkspaceChallenge {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  priceCents: number;
  capacity: number | null;
  status: string;
  imageUrl: string | null;
  contractId: string | null;
  promiseText: string | null;
  weeklyArc: WorkspaceWeeklyFocusEntry[];
  topicOwnership: WorkspaceTopicOwnershipEntry[];
  introPrompt: string | null;
  promiseEditedAt: string | null;
  promiseEditorName: string | null;
}

export interface WorkspaceProfile {
  id: string;
  name: string;
  avatar: string | null;
  tagline?: string | null;
  bio?: string | null;
  username?: string | null;
}

export interface WorkspaceCohost extends WorkspaceProfile {
  splitPercent: number;
}

export interface WorkspaceSessionCohost {
  id: string;
  name: string;
  avatar: string | null;
  splitPercent: number;
}

export interface WorkspaceSession {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  cohosts: WorkspaceSessionCohost[];
}

export interface WorkspacePendingInvite {
  id: string;
  toId: string;
  toName: string;
  toAvatar: string | null;
  toTagline?: string | null;
  toUsername?: string | null;
  splitPercent: number;
  message: string;
}

export interface WorkspaceContract {
  id: string;
  lockedAt: string;
  acceptances: string[];
  declines: { cohostId: string; comment: string | null }[];
}

export type WorkspaceChannelStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

/** UI-only slice — not server state. Phase 4 writes channel health here. */
export interface WorkspaceUiState {
  channelStatus: WorkspaceChannelStatus;
}

/** The full live-collab state surface. */
export interface WorkspaceState {
  challenge: WorkspaceChallenge;
  isOwner: boolean;
  currentUserId: string;
  ownerProfile: WorkspaceProfile;
  ownerSplit: number;
  cohosts: WorkspaceCohost[];
  sessions: WorkspaceSession[];
  pendingInvites: WorkspacePendingInvite[];
  contract: WorkspaceContract | null;
  activity: WorkspaceActivityRow[];
  profileMap: Record<string, { name: string; avatar: string | null }>;
  ui: WorkspaceUiState;
}

export interface WorkspaceActions {
  /**
   * Replace every server-derived slice in one shot. Used for the initial
   * seed and (during the Phase 2 migration) as the re-seed safety net when
   * a slice still propagates via router.refresh() → fresh props. The `ui`
   * slice is preserved — it is local-only, not server state.
   */
  seed: (next: Omit<WorkspaceState, "ui">) => void;

  // ---- Phase 2a: contract slice (lock / accept / decline) ----
  // Map raw realtime rows (snake_case) into the enriched `contract` slice.
  // Each guards against the active contract so stale/cross-contract events
  // are ignored. The backend remains the source of truth; these only mirror
  // confirmed DB inserts for instant UI (reconciliation/reseed corrects any
  // divergence).

  /** app_collaboration_contract INSERT → a fresh lock for this challenge. */
  applyContractLocked: (row: { id: string; locked_at: string }) => void;
  /** app_collaboration_acceptance INSERT → add a cohost's signature. */
  applyAcceptanceAdded: (row: { contract_id: string; cohost_id: string }) => void;
  /** app_collaboration_decline INSERT → record a cohost's change request. */
  applyDeclineAdded: (row: {
    contract_id: string;
    cohost_id: string;
    comment: string | null;
  }) => void;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

/**
 * Create a fresh workspace store seeded with the given initial state.
 *
 * IMPORTANT: this is a factory, NOT a module-level singleton. A singleton
 * would be shared across requests during SSR (state bleed between users).
 * `WorkspaceStoreProvider` creates exactly one instance per mount.
 */
export function createWorkspaceStore(
  initial: WorkspaceState,
): StoreApi<WorkspaceStore> {
  return createStore<WorkspaceStore>((set) => ({
    ...initial,
    seed: (next) => set(next),

    applyContractLocked: (row) =>
      set(() => ({
        contract: {
          id: row.id,
          lockedAt: row.locked_at,
          acceptances: [],
          declines: [],
        },
      })),

    applyAcceptanceAdded: (row) =>
      set((s) => {
        if (!s.contract || s.contract.id !== row.contract_id) return {};
        if (s.contract.acceptances.includes(row.cohost_id)) return {};
        return {
          contract: {
            ...s.contract,
            acceptances: [...s.contract.acceptances, row.cohost_id],
          },
        };
      }),

    applyDeclineAdded: (row) =>
      set((s) => {
        if (!s.contract || s.contract.id !== row.contract_id) return {};
        if (s.contract.declines.some((d) => d.cohostId === row.cohost_id)) {
          return {};
        }
        return {
          contract: {
            ...s.contract,
            declines: [
              ...s.contract.declines,
              { cohostId: row.cohost_id, comment: row.comment },
            ],
          },
        };
      }),
  }));
}
