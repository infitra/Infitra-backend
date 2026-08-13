"use client";

/**
 * DailyRoom — the ONLY frontend file that imports @daily-co/daily-js.
 *
 * This is the provider seam's inner half: LiveRoomEmbed owns everything
 * provider-neutral (token flow, top bar, Leave/End, error and ended states,
 * the reflection redirect) and mounts this component when the token
 * endpoint says provider === "daily". A future LiveKitRoom drops in beside
 * it; nothing outside this file changes when the provider does.
 *
 * What the iframe could never give us, this wires up:
 *   · the INFITRA theme (orange actions, dark-teal stage, cream chrome)
 *   · in-room telemetry — joined / camera failures / fatal errors reach
 *     the shell as callbacks instead of dying inside a sealed box
 *   · ejection detection — end_session now really closes the Daily room,
 *     so every remaining client hears "ejected"/"exp-room" and the shell
 *     can route participants into the reflection loop
 */

import { useEffect, useRef } from "react";
import Daily, { type DailyCall } from "@daily-co/daily-js";

/** Brand theme for Daily Prebuilt. Dark-teal main stage (the brand's dark
 *  surface), cream/white chrome, orange for every primary action. */
const INFITRA_THEME = {
  colors: {
    accent: "#FF6130",
    accentText: "#FFFFFF",
    background: "#F2EFE8",
    backgroundAccent: "#FFFFFF",
    baseText: "#0F2229",
    border: "#E2DDD2",
    mainAreaBg: "#0C262E",
    mainAreaBgAccent: "#0F2229",
    mainAreaText: "#FFFFFF",
    supportiveText: "#475569",
  },
};

export function DailyRoom({
  roomUrl,
  onJoined,
  onEnded,
  onFatalError,
  onCameraError,
}: {
  roomUrl: string;
  /** Actually inside the call (media connected) — not just token-issued. */
  onJoined: () => void;
  /** The room itself closed under us (expert ended the session, or the
   *  room hit its expiry). NOT fired for the user's own Leave. */
  onEnded: () => void;
  /** Unrecoverable in-room failure; message is human-readable. */
  onFatalError: (message: string) => void;
  /** Camera/mic trouble — Daily shows its own recovery UI; we only log. */
  onCameraError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let frame: DailyCall | null = null;

    (async () => {
      // Daily allows ONE instance per page. Dev strict-mode double-mounts
      // and fast re-navigation both leave a live instance behind — destroy
      // it before creating ours, or createFrame throws.
      const existing = Daily.getCallInstance();
      if (existing) await existing.destroy();
      if (cancelled) return;

      frame = Daily.createFrame(el, {
        showLeaveButton: false, // our top bar owns Leave/End
        showFullscreenButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
        },
        theme: INFITRA_THEME,
      });

      frame
        .on("joined-meeting", () => onJoined())
        .on("camera-error", (ev) => onCameraError(ev?.errorMsg?.errorMsg ?? "camera error"))
        .on("error", (ev) => {
          const kind = ev?.error?.type;
          // The room closing under us is an ENDING, not a failure: an
          // expert pressed End (end_session deletes the room → everyone
          // ejected) or the room hit its expiry clock.
          if (kind === "ejected" || kind === "exp-room" || kind === "end-of-life") {
            onEnded();
          } else {
            onFatalError(ev?.errorMsg ?? "connection failed");
          }
        });

      frame.join({ url: roomUrl });
    })();

    return () => {
      cancelled = true;
      frame?.destroy();
    };
    // Callbacks are stable enough for the room's lifetime; re-joining on
    // every parent render would tear the call down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl]);

  return <div ref={containerRef} className="flex-1 w-full min-h-0" />;
}
