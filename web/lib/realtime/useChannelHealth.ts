"use client";

/**
 * useChannelHealth — Bundle 3.5 Phase 4.
 *
 * Reusable Supabase Realtime channel-health tracker. Wrap a channel's
 * `.subscribe((status) => …)` callback with the returned
 * `handleSubscribeStatus(status)`. It:
 *   - maps the raw Supabase status to a friendly value (onStatus) for a UI
 *     "Reconnecting…" indicator, and
 *   - fires onRecover() when the channel returns SUBSCRIBED after having been
 *     degraded (CHANNEL_ERROR / TIMED_OUT / CLOSED) — the moment to reconcile
 *     any state that drifted while the socket was down.
 *
 * supabase-js already auto-reconnects the websocket; this only observes the
 * status transitions and triggers the catch-up. Reusable by Bundle 5 (cohort
 * space) and Bundle 8 (live session UI).
 */

import { useCallback, useRef } from "react";

export type ChannelHealthStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export function useChannelHealth(opts: {
  onStatus?: (status: ChannelHealthStatus) => void;
  onRecover?: () => void;
}): { handleSubscribeStatus: (raw: string) => void } {
  const { onStatus, onRecover } = opts;
  const degraded = useRef(false);

  const handleSubscribeStatus = useCallback(
    (raw: string) => {
      if (raw === "SUBSCRIBED") {
        onStatus?.("connected");
        if (degraded.current) {
          degraded.current = false;
          onRecover?.();
        }
      } else if (
        raw === "CHANNEL_ERROR" ||
        raw === "TIMED_OUT" ||
        raw === "CLOSED"
      ) {
        degraded.current = true;
        onStatus?.(raw === "CHANNEL_ERROR" ? "error" : "reconnecting");
      }
    },
    [onStatus, onRecover],
  );

  return { handleSubscribeStatus };
}
