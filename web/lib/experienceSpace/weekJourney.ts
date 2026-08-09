/**
 * Week-journey model — Bundle 5c.
 *
 * Pure data shaping for the Experience-Space WEEK centerpiece. Buckets the
 * store's SpaceSession[] into program weeks using the SAME week-number math as
 * the buyer page (lib/challenges/buildWeeks) so a session lands in the same week
 * on both surfaces, then layers the participant-only semantics the locker room
 * needs: which week is "now", which single session is the next moment (live or
 * soonest upcoming), and each session's state (done / live / next / upcoming).
 *
 * No hooks, no JSX — safe to import from the client WeekJourney component.
 */

import {
  computeTotalWeeks,
  sessionWeekNumber,
  weekRange,
} from "@/lib/challenges/buildWeeks";

/** Week range WITH year (e.g. "3 Jan – 9 Jan 2027") — the locker room shows full
 *  dates so a future program never reads as the past. Scoped here so the buyer
 *  page's year-less ranges are untouched. */
function fmtRangeWithYear(start: Date, end: Date): string {
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    });
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${fmt(start, !sameYear)} – ${fmt(end, true)}`;
}
import type { ExperienceSummary, ProgramState, SpaceSession } from "./store";
import { sessionLiveState, type SessionLiveState } from "@/lib/liveWindow";

export type SessionState = "done" | "live" | "doors" | "next" | "upcoming";

export interface WeekBucket {
  weekNumber: number;
  theme: string | null;
  /** "12 Jun – 18 Jun" — dates only, viewer-agnostic. */
  range: string;
  sessions: SpaceSession[];
  /** Position relative to the program's current week. */
  status: "done" | "current" | "future";
}

export interface WeekJourneyModel {
  weeks: WeekBucket[];
  totalWeeks: number;
  /** 1-based, clamped to [1, totalWeeks]. */
  currentWeek: number;
  /** The single "next moment" — live now, else soonest upcoming. */
  heroSessionId: string | null;
  /** "live" (expert in the room) | "doors" (room open, expert not yet in)
   *  | null (hero is merely upcoming). The lie this replaces: a bare
   *  boolean that called an empty precreated room "Live now" and, with no
   *  clock, kept saying it days after the room had expired. */
  heroLiveState: Exclude<SessionLiveState, "none"> | null;
  /** Back-compat convenience: heroLiveState === "live". */
  heroIsLive: boolean;
}

/** The session that owns the "next moment" highlight, across the whole program. */
function pickHeroSession(sessions: SpaceSession[], now: number): SpaceSession | null {
  // An expert already in a room outranks an open-but-empty room.
  const live = sessions.find((s) => sessionLiveState(s, now) === "live");
  if (live) return live;
  const doors = sessions.find((s) => sessionLiveState(s, now) === "doors");
  if (doors) return doors;
  const upcoming = sessions
    .filter((s) => s.status !== "ended" && new Date(s.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return upcoming[0] ?? null;
}

export function buildWeekJourney(
  experience: ExperienceSummary,
  programState: ProgramState | null,
  sessions: SpaceSession[],
  now: number = Date.now(),
): WeekJourneyModel {
  const totalWeeks =
    programState?.totalWeeks ||
    computeTotalWeeks(experience.startDate, experience.endDate) ||
    1;

  // Current week: trust the authoritative program-state view; otherwise derive
  // from where "now" falls in the program. Clamp into range.
  const derivedWeek = sessionWeekNumber(
    experience.startDate,
    totalWeeks,
    new Date(now).toISOString(),
  );
  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, programState?.currentWeek || derivedWeek),
  );

  // Bucket sessions by week (same math as the buyer page).
  const byWeek = new Map<number, SpaceSession[]>();
  for (const s of sessions) {
    const w = sessionWeekNumber(experience.startDate, totalWeeks, s.startTime);
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(s);
  }
  for (const arr of byWeek.values()) {
    arr.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }

  const themeFor = (n: number) =>
    experience.weeklyArc.find((w) => w.week === n)?.theme ?? null;

  const weeks: WeekBucket[] = Array.from({ length: totalWeeks }, (_, i) => i + 1).map(
    (n) => {
      const r = weekRange(experience.startDate, n);
      return {
        weekNumber: n,
        theme: themeFor(n),
        range: fmtRangeWithYear(r.start, r.end),
        sessions: byWeek.get(n) ?? [],
        status: n < currentWeek ? "done" : n === currentWeek ? "current" : "future",
      };
    },
  );

  const hero = pickHeroSession(sessions, now);
  const heroState = hero ? sessionLiveState(hero, now) : "none";

  return {
    weeks,
    totalWeeks,
    currentWeek,
    heroSessionId: hero?.id ?? null,
    heroLiveState: heroState === "none" ? null : heroState,
    heroIsLive: heroState === "live",
  };
}

export interface ProgramStatus {
  phase: "upcoming" | "active" | "complete";
  /** Whole days until the program starts (0 once it has). */
  startsInDays: number;
  hasStarted: boolean;
}

/**
 * Where the program sits on the calendar — so the UI can say "starts in 12
 * days" instead of mislabelling a not-yet-started program as "this week"
 * (program_state floors current week to 1 before kickoff).
 */
export function programStatus(
  experience: ExperienceSummary,
  now: number = Date.now(),
): ProgramStatus {
  const start = new Date(experience.startDate + "T00:00:00").getTime();
  const endParsed = new Date(experience.endDate + "T00:00:00").getTime();
  // Treat the program as running through the end of the last day.
  const end = isNaN(endParsed) ? start : endParsed + 86_400_000;

  if (!isNaN(start) && now < start) {
    return {
      phase: "upcoming",
      startsInDays: Math.max(1, Math.ceil((start - now) / 86_400_000)),
      hasStarted: false,
    };
  }
  if (!isNaN(end) && now > end) {
    return { phase: "complete", startsInDays: 0, hasStarted: true };
  }
  return { phase: "active", startsInDays: 0, hasStarted: true };
}

/** Per-session state within its week, given the chosen hero. */
export function sessionStateFor(
  session: SpaceSession,
  model: WeekJourneyModel,
  now: number = Date.now(),
): SessionState {
  if (session.id === model.heroSessionId) {
    return model.heroLiveState ?? "next";
  }
  // A non-hero session can still be live/doors (two rooms at once).
  const liveState = sessionLiveState(session, now);
  if (liveState !== "none") return liveState;
  const started = new Date(session.startTime).getTime() <= now;
  if (session.status === "ended" || started) return "done";
  return "upcoming";
}
