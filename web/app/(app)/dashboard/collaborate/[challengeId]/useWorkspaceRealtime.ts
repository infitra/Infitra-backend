"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/lib/workspace/StoreProvider";
import { loadWorkspaceSnapshot } from "@/lib/workspace/loadSnapshot";
import { useChannelHealth } from "@/lib/realtime/useChannelHealth";

/**
 * Realtime sync for the workspace. One multiplexed Supabase channel
 * per workspace covering:
 *   - INSERT on app_workspace_activity (filtered by challenge_id)
 *     → kept locally as the activity array; consumed by RecentChangesExpander
 *       and SectionAttribution chips
 *   - UPDATE on app_challenge (filtered by id)
 *     → router.refresh() so the partner's field saves flow through props.
 *       Local-wins is enforced inside each field via useSyncedField.
 *   - INSERT/DELETE on app_challenge_session (filtered by challenge_id)
 *     → router.refresh() to pick up sessions added/removed by the partner
 *   - UPDATE on app_session (broad subscription, filtered client-side)
 *     → router.refresh() if the session id is in our list. Broad because
 *       app_session doesn't carry a challenge_id; the link is via the
 *       join table. For pilot scale (≤30 sessions/program × small N) the
 *       broadcast volume is trivial.
 *
 * Also dispatches the existing `workspace-activity` window event after
 * each Realtime tick so the chat (which listens for that event) refetches
 * its messages without needing its own subscription on this hook's channel.
 *
 * Returns the live activity row array and the router (in case callers
 * want to trigger a manual refresh).
 */

export interface ActivityRow {
  id: string;
  actor_id: string;
  kind: string;
  payload: { field?: string; old?: unknown; new?: unknown } | null;
  created_at: string;
}

interface Params {
  challengeId: string;
  initialActivity: ActivityRow[];
  knownSessionIds: string[];
  /** Current contract id (null when the challenge isn't locked yet).
   *  Used to filter acceptance/decline INSERT events client-side so
   *  the owner reacts only to responses for the active contract. */
  contractId?: string | null;
}

export function useWorkspaceRealtime({
  challengeId,
  initialActivity,
  knownSessionIds,
  contractId,
}: Params): { activity: ActivityRow[] } {
  const [activity, setActivity] = useState<ActivityRow[]>(initialActivity);

  // Bundle 3.5 Phase 2a — contract slice mutators. These are stable
  // references (Zustand actions are defined once), so capturing them in the
  // channel effect below is safe; they never trigger a re-subscribe. The
  // partner-side contract events now mutate the store directly instead of
  // calling router.refresh() (which re-ran the page server component and
  // re-fetched ~10 queries per event).
  const applyContractLocked = useWorkspaceStore((s) => s.applyContractLocked);
  const applyAcceptanceAdded = useWorkspaceStore((s) => s.applyAcceptanceAdded);
  const applyDeclineAdded = useWorkspaceStore((s) => s.applyDeclineAdded);
  const applyContractCleared = useWorkspaceStore((s) => s.applyContractCleared);
  const applyChallengeUpdate = useWorkspaceStore((s) => s.applyChallengeUpdate);

  // Bundle 3.5 Phase 2c — structural refetch. Session/cohost/invite changes
  // can't be rebuilt from their raw payloads (no joined names/details), so on
  // such an event we re-pull the consolidated snapshot (one load_workspace
  // round-trip) and seed() it into the store — instead of router.refresh()'s
  // full-page re-render. seed() preserves the realtime-owned challenge +
  // contract slices. Debounced so a burst (e.g. add-session also inserts a
  // session-cohost) coalesces into a single fetch.
  const seed = useWorkspaceStore((s) => s.seed);
  const currentUserId = useWorkspaceStore((s) => s.currentUserId);
  const refetchTimer = useRef<number | null>(null);
  const refetch = useCallback(() => {
    if (refetchTimer.current !== null) window.clearTimeout(refetchTimer.current);
    refetchTimer.current = window.setTimeout(async () => {
      const snap = await loadWorkspaceSnapshot(challengeId, currentUserId);
      if (snap) seed(snap);
    }, 150);
  }, [challengeId, currentUserId, seed]);
  useEffect(
    () => () => {
      if (refetchTimer.current !== null) window.clearTimeout(refetchTimer.current);
    },
    [],
  );

  // Bundle 3.5 Phase 4 — reconciliation + channel health. reconcileNow() is an
  // AUTHORITATIVE full resync (overwrites contract + challenge too, unlike the
  // refetch/seed above) used when the realtime channel recovers or the tab
  // regains focus — healing any events missed while the socket was down. The
  // channel-health hook also drives the "Reconnecting…" pill via the store.
  const reconcile = useWorkspaceStore((s) => s.reconcile);
  const setChannelStatus = useWorkspaceStore((s) => s.setChannelStatus);
  const reconcileNow = useCallback(async () => {
    const snap = await loadWorkspaceSnapshot(challengeId, currentUserId);
    if (snap) reconcile(snap);
  }, [challengeId, currentUserId, reconcile]);
  // Track whether the realtime socket is currently degraded so we can fall
  // back to polling (below). Driven by the same status stream that feeds the
  // "Reconnecting…" pill.
  const [realtimeDegraded, setRealtimeDegraded] = useState(false);
  const { handleSubscribeStatus } = useChannelHealth({
    onStatus: (s) => {
      setChannelStatus(s);
      setRealtimeDegraded(s === "error" || s === "reconnecting");
    },
    onRecover: reconcileNow,
  });

  // Graceful degradation for realtime-hostile networks. On some participants'
  // devices (corporate firewalls, VPNs, WS-blocking extensions) the
  // postgres_changes WebSocket never stays connected even though plain HTTP is
  // fine — so the partner stops seeing changes until they manually reload.
  // While the channel is degraded, poll the consolidated snapshot so updates
  // still flow automatically. This adds NO second realtime channel — it's just
  // a periodic load_workspace fetch, and only while the socket is down; it
  // stops the moment the channel recovers (onRecover also fires one
  // authoritative sync). On a healthy connection nothing here runs.
  useEffect(() => {
    if (!realtimeDegraded) return;
    const t = window.setInterval(() => {
      reconcileNow();
    }, 10000);
    return () => window.clearInterval(t);
  }, [realtimeDegraded, reconcileNow]);

  // Keep local activity in sync with server-rendered initialActivity
  // when the page revalidates (e.g. router.refresh from another action).
  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  // Bundle 3.5 Phase 6: the v12.Y `workspace-contract-event` band-aid is
  // removed. Contract state now arrives via direct store mutation (the
  // app_collaboration_contract / acceptance / decline subscriptions →
  // applyContractLocked/Acceptance/Decline) and is backstopped by the Phase
  // 4 reconcile on reconnect / tab-return. The chat-system-message refresh
  // path is no longer needed (and WorkspaceChat no longer dispatches it).

  // Polish v12.Z: page-visibility refresh. The most reliable failure
  // mode for the cohost's lock-state propagation is a silently
  // dropped WebSocket — events fire on the DB, the broadcast goes
  // out, but the cohost's channel is in a stale CLOSED/TIMED_OUT
  // state from a tab being backgrounded or a network blip. Today
  // the subscribe callbacks log warnings but don't reconnect.
  //
  // When the user switches back to the tab (visibility -> 'visible')
  // we force a router.refresh() to catch up on anything missed
  // while we weren't watching. Cheap, near-zero cost when the user
  // is actively on the page (visibilitychange doesn't fire on
  // every render — only on actual focus transitions).
  useEffect(() => {
    if (typeof document === "undefined") return;
    function onVisible() {
      if (document.visibilityState === "visible") {
        // Phase 4: authoritative reconcile (one load_workspace + overwrite)
        // instead of router.refresh — catches anything missed while away.
        reconcileNow();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reconcileNow]);

  useEffect(() => {
    const supabase = createClient();
    const sessionIdSet = new Set(knownSessionIds);

    const channel = supabase
      .channel(`workspace-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_workspace_activity",
          filter: `challenge_id=eq.${challengeId}`,
        },
        (payload) => {
          const row = payload.new as ActivityRow;
          setActivity((prev) => {
            if (prev.some((r) => r.id === row.id)) return prev;
            return [row, ...prev].slice(0, 50);
          });
          // Wake any window-event listeners (chat, expander).
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("workspace-activity"));
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_challenge",
          filter: `id=eq.${challengeId}`,
        },
        (payload) => {
          const row = payload.new as { contract_id?: string | null } | null;
          if (!row) return;
          // Reopen signal: reactivate_drafting nulls contract_id (without
          // deleting the contract row), so a null contract_id here means
          // the workspace was reopened → clear the realtime-owned contract
          // slice. (The re-seed net preserves contract, so this UPDATE is
          // the only path that clears it.)
          if (row.contract_id == null) {
            applyContractCleared();
          }
          // Phase 2b: merge the partner's field edit straight into the
          // store's challenge slice — no router.refresh() (which re-ran the
          // whole page + ~10 queries per keystroke-save). useSyncedField
          // keeps locally-dirty fields from being overwritten for the actor.
          applyChallengeUpdate(
            payload.new as Parameters<typeof applyChallengeUpdate>[0],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_challenge_session",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_challenge_session",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_session",
        },
        (payload) => {
          // Broad subscription — filter client-side. Most events are
          // for sessions in other challenges; we ignore those.
          const row = payload.new as { id?: string } | null;
          if (row?.id && sessionIdSet.has(row.id)) {
            refetch();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_session",
        },
        (payload) => {
          // Session deleted — filter client-side by session id from OLD row.
          const row = payload.old as { id?: string } | null;
          if (row?.id && sessionIdSet.has(row.id)) {
            refetch();
          }
        },
      )
      // Session cohort changes — adding/removing a cohost from one session
      // needs to flow to every workspace participant in real time. Broad
      // subscription filtered client-side by session id (no challenge_id
      // column on this table; the link is via app_challenge_session).
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_session_cohost",
        },
        (payload) => {
          const row = payload.new as { session_id?: string } | null;
          if (row?.session_id && sessionIdSet.has(row.session_id)) {
            refetch();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_session_cohost",
        },
        (payload) => {
          const row = payload.old as { session_id?: string } | null;
          if (row?.session_id && sessionIdSet.has(row.session_id)) {
            refetch();
          }
        },
      )
      // Bundle 3 polish v2 — cohort and invite tables. The first creator's
      // view stayed on "Awaiting" after the partner accepted because we
      // weren't listening for INSERT on app_challenge_cohost. Now we are.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_challenge_cohost",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_challenge_cohost",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_challenge_cohost",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => refetch(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_collaboration_invite",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => refetch(),
      )
      // Polish v12.U.1: second propagation path for the lock event.
      // The primary path is app_challenge.contract_id UPDATE, but the
      // cohost was reportedly still able to edit for a window after
      // the owner locked. Subscribing to the contract INSERT itself
      // gives a more direct "a contract was just locked for this
      // challenge" signal — either event arriving triggers refresh.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_collaboration_contract",
        },
        (payload) => {
          // Broad subscription (target_id isn't filterable across
          // session+challenge variants) — filter client-side.
          // Phase 2a: mutate the store's contract slice instead of
          // router.refresh(). A fresh lock resets acceptances/declines.
          const row = payload.new as {
            id?: string;
            target_type?: string;
            target_id?: string;
            locked_at?: string;
          } | null;
          if (
            row?.target_type === "challenge" &&
            row?.target_id === challengeId &&
            row.id &&
            row.locked_at
          ) {
            applyContractLocked({ id: row.id, locked_at: row.locked_at });
          }
        },
      )
      // Polish v12.W: cohost accept / decline propagation. Without
      // this, the owner's banner stayed on "Locked agreement — under
      // review" after the cohost responded; only a refresh (or the
      // chat system message arriving) hinted that anything happened.
      // Broad subscription filtered client-side by `contractId` (the
      // currently-locked contract). Either INSERT triggers refresh —
      // the workspace's banner re-derives status from the freshly
      // pulled acceptance/decline rows.
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_collaboration_acceptance",
        },
        (payload) => {
          // Phase 2a: append the cohost's signature to the store's
          // contract slice. The mutator guards against the active
          // contract id, so the broad subscription stays correct.
          const row = payload.new as {
            contract_id?: string;
            cohost_id?: string;
          } | null;
          if (row?.contract_id && row?.cohost_id) {
            applyAcceptanceAdded({
              contract_id: row.contract_id,
              cohost_id: row.cohost_id,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_collaboration_decline",
        },
        (payload) => {
          // Phase 2a: record the cohost's change request in the store.
          const row = payload.new as {
            contract_id?: string;
            cohost_id?: string;
            comment?: string | null;
          } | null;
          if (row?.contract_id && row?.cohost_id) {
            applyDeclineAdded({
              contract_id: row.contract_id,
              cohost_id: row.cohost_id,
              comment: row.comment ?? null,
            });
          }
        },
      )
      .subscribe((status, err) => {
        // Phase 4: feed channel health → updates the "Reconnecting…" pill and
        // reconciles on recovery (SUBSCRIBED after a drop).
        handleSubscribeStatus(status);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // eslint-disable-next-line no-console
          console.warn("[useWorkspaceRealtime] subscription", status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // Re-subscribe if challengeId or session set changes
    // (the broad app_session listener relies on the latest sessionIdSet).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, knownSessionIds.join(","), contractId ?? ""]);

  return { activity };
}

/**
 * Field-level sync helper. Used by every auto-saving input in the
 * workspace editor.
 *
 * Behaviour:
 *   - Local input state initialised from server prop.
 *   - When server prop changes (partner saved + router.refresh), the
 *     hook adopts the new value IFF the user hasn't typed since they
 *     last saved (`!dirtyRef.current`). Otherwise it keeps local
 *     typing intact — local-wins.
 *   - `onLocalChange(v)` marks dirty + updates state.
 *   - `markSaved()` clears the dirty flag so the next prop change is
 *     allowed to flow through.
 */

export function useSyncedField<T>(
  propValue: T,
): [T, (v: T) => void, () => void] {
  const [value, setValue] = useState<T>(propValue);
  const dirtyRef = useRef(false);
  const lastPropRef = useRef<T>(propValue);

  useEffect(() => {
    if (propValue !== lastPropRef.current) {
      lastPropRef.current = propValue;
      if (!dirtyRef.current) {
        setValue(propValue);
      }
      // If dirty, keep local value; user wins until their blur saves.
    }
  }, [propValue]);

  function setLocal(v: T) {
    dirtyRef.current = true;
    setValue(v);
  }

  function markSaved() {
    dirtyRef.current = false;
  }

  return [value, setLocal, markSaved];
}
