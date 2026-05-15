"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Auto-save state machine for the workspace editor.
 *
 * Each `runSave` call gets a monotonically increasing sequence number.
 * Only the LATEST in-flight call is allowed to flip the status — earlier
 * responses arriving out of order are discarded. This is the core defense
 * against the slow-mobile-connection race where a stale "Saved" status
 * could otherwise overwrite a more recent "Saving..." or error.
 *
 * Returned status:
 *   idle  — nothing happening
 *   saving — at least one save in flight (status will not flip down)
 *   saved — most recent save succeeded
 *   error — most recent save failed; runSave returns the error message
 *
 * Auto-clears `saved` after 3s back to `idle` for visual quietude.
 */

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

type SaveResult = { error?: string } | undefined | null;

export function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const sequenceRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSave = useCallback(async <T extends SaveResult>(
    saveFn: () => Promise<T>,
  ): Promise<T> => {
    sequenceRef.current += 1;
    const mySeq = sequenceRef.current;

    // Cancel any pending "back to idle" transition — a new save is starting.
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setStatus({ kind: "saving" });

    try {
      const result = await saveFn();

      // Only flip status if this is still the latest call.
      if (mySeq !== sequenceRef.current) return result;

      const errorMessage = result?.error;
      if (errorMessage) {
        setStatus({ kind: "error", message: errorMessage });
      } else {
        setStatus({ kind: "saved", at: Date.now() });
        idleTimerRef.current = setTimeout(() => {
          // Only fade if no later save has fired since.
          if (mySeq === sequenceRef.current) {
            setStatus({ kind: "idle" });
          }
        }, 3000);
      }
      return result;
    } catch (e) {
      if (mySeq !== sequenceRef.current) throw e;
      const message = e instanceof Error ? e.message : "Unknown error";
      setStatus({ kind: "error", message });
      throw e;
    }
  }, []);

  return { status, runSave };
}
