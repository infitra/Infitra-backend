"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChannelHealth } from "@/lib/realtime/useChannelHealth";

/**
 * Keeps a SERVER-rendered LiveSessionBanner honest. Renders nothing.
 *
 * The doors→live flip is decided by app_session.started_at, stamped by
 * issue_join_token when the expert first joins. That is server data written
 * AFTER the page rendered, so a server component can never learn it: on
 * 13 Aug the participant's phone sat on "Doors open" through the whole
 * session and only a hard refresh corrected it.
 *
 * A timer cannot fix this (started_at is not derivable client-side) and
 * polling would re-run a dozen queries per tick on a phone. One realtime
 * subscription fires only on the ~3 writes that matter across a session
 * window: precreate stamps live_room_id, the expert's join stamps
 * started_at, the sweep stamps status='ended'.
 */
export function LiveMomentWatcher({ sessionIds }: { sessionIds: string[] }) {
  const router = useRouter();
  const key = sessionIds.join(",");

  const refresh = useCallback(() => router.refresh(), [router]);
  const { handleSubscribeStatus } = useChannelHealth({ onRecover: refresh });

  // iOS suspends the socket when the phone locks, so events during a lock
  // are simply missed. Catching up on return is the net that matters most
  // on the surface people check from their pocket.
  useEffect(() => {
    if (typeof document === "undefined") return;
    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  useEffect(() => {
    if (!key) return;
    const watched = new Set(key.split(","));
    const supabase = createClient();

    const channel = supabase
      .channel("me-live-moment")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "app_session" },
        (payload) => {
          const row = payload.new as { id?: string } | null;
          if (row?.id && watched.has(row.id)) refresh();
        },
      )
      .subscribe(handleSubscribeStatus);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, refresh, handleSubscribeStatus]);

  return null;
}
