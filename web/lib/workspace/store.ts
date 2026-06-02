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
   * Re-seed the server-derived slices from fresh props (the Phase 2
   * migration safety net for slices still on router.refresh()). The `ui`
   * slice is preserved (local-only), and — critically — so is `contract`:
   * the contract slice is now realtime-owned, and props can arrive STALE
   * (an out-of-order router.refresh delivering a pre-lock snapshot). If
   * re-seed overwrote contract it would revert a locked workspace back to
   * draft (the bug seen in 2a's first deploy). Contract transitions arrive
   * only via realtime: applyContractLocked / Acceptance / Decline / Cleared.
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
  /**
   * Reopen → clear the contract slice. reactivate_drafting nulls
   * app_challenge.contract_id (it does NOT delete the contract row), so the
   * reopen signal is the app_challenge UPDATE with contract_id = null.
   */
  applyContractCleared: () => void;

  // ---- Phase 2b: challenge field-edit slice ----
  /**
   * app_challenge UPDATE → merge the raw row into the `challenge` slice
   * (snake_case → camelCase). This replaces router.refresh() on every
   * partner field edit. promiseEditorName is resolved from the profileMap
   * (promise_edited_by is always the owner or a cohost, both in the map).
   * Per-field local-wins for the actor still lives in useSyncedField.
   */
  applyChallengeUpdate: (row: {
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    price_cents: number;
    capacity: number | null;
    status: string;
    image_url: string | null;
    contract_id: string | null;
    promise_text: string | null;
    weekly_arc: WorkspaceWeeklyFocusEntry[] | null;
    topic_ownership: WorkspaceTopicOwnershipEntry[] | null;
    intro_prompt: string | null;
    promise_edited_at: string | null;
    promise_edited_by: string | null;
  }) => void;

  // ---- Phase 4: reconciliation + channel health ----
  /**
   * Authoritative full overwrite — replaces EVERY server-derived slice,
   * INCLUDING the realtime-owned challenge + contract. Unlike seed() (which
   * preserves those to dodge stale-prop clobber during normal operation),
   * reconcile() is only called after a reconnect / tab-return with a snapshot
   * that was JUST fetched, so it is the source of truth and heals any events
   * missed while the channel was down.
   */
  reconcile: (next: Omit<WorkspaceState, "ui">) => void;
  /** Channel health → drives the "Reconnecting…" pill. */
  setChannelStatus: (status: WorkspaceChannelStatus) => void;
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
    // Preserve the realtime-owned slices across re-seeds (see the interface
    // doc above): `contract` (Phase 2a) and `challenge` (Phase 2b) are driven
    // by realtime mutators, so a stale prop re-seed must not clobber them.
    // `ui` is preserved automatically (not in `next`).
    seed: (next) =>
      set((s) => ({ ...next, challenge: s.challenge, contract: s.contract })),

    // Authoritative resync — overwrites everything (challenge + contract
    // included). `ui` is preserved (not in `next`).
    reconcile: (next) => set(next),

    setChannelStatus: (status) =>
      set((s) => ({ ui: { ...s.ui, channelStatus: status } })),

    applyContractCleared: () => set(() => ({ contract: null })),

    applyChallengeUpdate: (row) =>
      set((s) => ({
        challenge: {
          ...s.challenge,
          title: row.title,
          description: row.description,
          startDate: row.start_date,
          endDate: row.end_date,
          priceCents: row.price_cents,
          capacity: row.capacity,
          status: row.status,
          imageUrl: row.image_url,
          contractId: row.contract_id,
          promiseText: row.promise_text,
          weeklyArc: row.weekly_arc ?? [],
          topicOwnership: row.topic_ownership ?? [],
          introPrompt: row.intro_prompt,
          promiseEditedAt: row.promise_edited_at,
          promiseEditorName: row.promise_edited_by
            ? (s.profileMap[row.promise_edited_by]?.name ?? null)
            : null,
        },
      })),

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
