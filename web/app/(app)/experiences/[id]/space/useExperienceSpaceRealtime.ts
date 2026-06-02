"use client";

/**
 * useExperienceSpaceRealtime — Bundle 5c.
 *
 * Keeps the Experience-Space store live. The locker room is mostly read-heavy;
 * the genuinely live structural events are:
 *   - app_session UPDATE  → a session going live / changing → applySessionUpdate
 *   - app_challenge_space_member INSERT/DELETE → tribe grew/shrank → reconcile
 * On channel recovery or tab-return we reconcile (one load_experience_space →
 * authoritative overwrite). The Tribe feed has its own realtime (TribeFeed).
 *
 * Built natively on the Bundle 3.5 pattern (useChannelHealth + reconcile).
 */

import { useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChannelHealth } from "@/lib/realtime/useChannelHealth";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { loadExperienceSpaceSnapshot } from "@/lib/experienceSpace/loadSnapshot";

export function useExperienceSpaceRealtime({
  challengeId,
  spaceId,
  knownSessionIds,
}: {
  challengeId: string;
  spaceId: string;
  knownSessionIds: string[];
}) {
  const currentUserId = useExperienceSpaceStore((s) => s.currentUserId);
  const reconcile = useExperienceSpaceStore((s) => s.reconcile);
  const setChannelStatus = useExperienceSpaceStore((s) => s.setChannelStatus);
  const applySessionUpdate = useExperienceSpaceStore((s) => s.applySessionUpdate);

  const reconcileNow = useCallback(async () => {
    const snap = await loadExperienceSpaceSnapshot(challengeId, currentUserId);
    if (snap) reconcile(snap);
  }, [challengeId, currentUserId, reconcile]);

  const { handleSubscribeStatus } = useChannelHealth({
    onStatus: setChannelStatus,
    onRecover: reconcileNow,
  });

  // Reconcile on tab-return (catches anything missed while away).
  useEffect(() => {
    if (typeof document === "undefined") return;
    function onVisible() {
      if (document.visibilityState === "visible") reconcileNow();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reconcileNow]);

  useEffect(() => {
    const supabase = createClient();
    const sessionIdSet = new Set(knownSessionIds);

    const channel = supabase
      .channel(`experience-space-${spaceId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_session" },
        (payload) => {
          const row = payload.new as { id?: string } | null;
          if (row?.id && sessionIdSet.has(row.id)) {
            applySessionUpdate(
              payload.new as Parameters<typeof applySessionUpdate>[0],
            );
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_challenge_space_member",
          filter: `space_id=eq.${spaceId}`,
        },
        () => reconcileNow(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "app_challenge_space_member",
          filter: `space_id=eq.${spaceId}`,
        },
        () => reconcileNow(),
      )
      .subscribe((status, err) => {
        handleSubscribeStatus(status);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // eslint-disable-next-line no-console
          console.warn("[useExperienceSpaceRealtime] subscription", status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId, knownSessionIds.join(",")]);
}
