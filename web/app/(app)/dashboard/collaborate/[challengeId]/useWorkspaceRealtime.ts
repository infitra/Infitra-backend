"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
}

export function useWorkspaceRealtime({
  challengeId,
  initialActivity,
  knownSessionIds,
}: Params): { activity: ActivityRow[] } {
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityRow[]>(initialActivity);

  // Keep local activity in sync with server-rendered initialActivity
  // when the page revalidates (e.g. router.refresh from another action).
  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

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
        () => {
          // Server props rebuild → fields re-render with partner's saves.
          // useSyncedField inside each editor keeps locally-dirty fields
          // from being overwritten.
          router.refresh();
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
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_challenge_session",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => router.refresh(),
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
            router.refresh();
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
            router.refresh();
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
            router.refresh();
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
            router.refresh();
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
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_challenge_cohost",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_challenge_cohost",
          filter: `challenge_id=eq.${challengeId}`,
        },
        (payload) => {
          // TEMP polish v11 diag: log split UPDATE events to confirm
          // realtime delivery on the cohost side. Remove once we
          // verify the chain.
          // eslint-disable-next-line no-console
          console.log("[realtime] app_challenge_cohost UPDATE", {
            new: payload.new,
            old: payload.old,
            time: new Date().toISOString(),
          });
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "app_collaboration_invite",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => router.refresh(),
      )
      .subscribe((status, err) => {
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
  }, [challengeId, knownSessionIds.join(",")]);

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
