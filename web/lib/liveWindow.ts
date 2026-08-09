/**
 * The ONE clock for session liveness — shared by every surface that renders
 * a live badge or a Join door (space week journey, YouPanel, dashboard rail).
 *
 * Three states, in truth order:
 *   "live"  — an EXPERT is in the room (started_at set by issue_join_token
 *             on host/cohost first join). The only state allowed to say
 *             "Live now".
 *   "doors" — the room exists (precreated at T-15 or host-created) but no
 *             expert has entered yet. Joinable, honest: "Doors open".
 *   "none"  — no room, or the session's window has passed.
 *
 * The closing edge mirrors the two backstops exactly:
 *   · Daily room expiry  (sessionRoomExp: start + max(dur,15) + 1h, eject)
 *   · the DB sweep       (app_sweep_overdue_sessions, same formula)
 * so the UI can never advertise a door after the room behind it is dead —
 * even in the up-to-5-minute lag before the sweep flips status to 'ended'.
 */

export type SessionLiveState = "live" | "doors" | "none";

export interface LiveWindowSession {
  startTime: string;
  durationMinutes: number | null;
  status: string;
  liveRoomId: string | null;
  startedAt?: string | null;
}

/** Epoch ms after which the room is gone — keep in lockstep with
 *  sessionRoomExp (functions/live_provider) and the DB sweep. */
export function roomClosesAtMs(startTime: string, durationMinutes: number | null): number {
  const start = new Date(startTime).getTime();
  const durationMs = Math.max(durationMinutes ?? 60, 15) * 60_000;
  return start + durationMs + 60 * 60_000;
}

export function sessionLiveState(s: LiveWindowSession, now: number = Date.now()): SessionLiveState {
  if (!s.liveRoomId || s.status === "ended") return "none";
  if (now > roomClosesAtMs(s.startTime, s.durationMinutes)) return "none";
  return s.startedAt ? "live" : "doors";
}
