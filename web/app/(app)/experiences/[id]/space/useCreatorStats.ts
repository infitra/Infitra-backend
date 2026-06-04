"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CreatorStats = { pending: number; reflections: number };

/**
 * Creator-console stats, kept live.
 *
 * Fetches load_experience_creator_stats once, then re-fetches (debounced) only
 * on the events that can move "pending questions": a new question post, or a
 * new comment (a possible coach answer). Likes/talks/etc. are ignored.
 *
 * Cost is deliberately near-zero: the channel is multiplexed over the page's
 * EXISTING Realtime websocket (no new connection), and we only re-query on
 * those rare events — so the marginal cost is an occasional small COUNT. We let
 * the server recompute the exact number rather than replicate the coach-answer
 * auto-promotion logic on the client (which would be fragile). Also refreshes
 * on tab-return to catch anything missed while the tab was hidden.
 */
export function useCreatorStats(
  isCreator: boolean,
  challengeId: string | undefined,
): CreatorStats | null {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNow = useCallback(async () => {
    if (!challengeId) return;
    const supabase = createClient();
    const { data } = await supabase.rpc("load_experience_creator_stats", {
      p_challenge_id: challengeId,
    });
    const d = data as
      | { authorized?: boolean; pending_questions?: number; recent_reflections?: number }
      | null;
    if (d?.authorized) {
      setStats({
        pending: d.pending_questions ?? 0,
        reflections: d.recent_reflections ?? 0,
      });
    }
  }, [challengeId]);

  const fetchDebounced = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void fetchNow();
    }, 600);
  }, [fetchNow]);

  useEffect(() => {
    if (!isCreator || !challengeId) return;
    void fetchNow();

    const supabase = createClient();
    const channel = supabase
      .channel(`creator-stats-${challengeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "app_challenge_post" },
        (payload) => {
          const row = payload.new as { kind?: string } | null;
          // Only questions can change the pending count.
          if (row?.kind === "question") fetchDebounced();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "app_challenge_comment" },
        () => {
          // A comment may be the coach answer that clears a question.
          fetchDebounced();
        },
      )
      .subscribe();

    function onVisible() {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchNow();
      }
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, [isCreator, challengeId, fetchNow, fetchDebounced]);

  return stats;
}
