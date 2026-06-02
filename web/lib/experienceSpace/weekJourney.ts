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
  formatWeekRange,
} from "@/lib/challenges/buildWeeks";
import type { ExperienceSummary, ProgramState, SpaceSession } from "./store";

export type SessionState = "done" | "live" | "next" | "upcoming";

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
  heroIsLive: boolean;
}

function isLive(s: SpaceSession): boolean {
  return !!s.liveRoomId && s.status !== "ended";
}

/** The session that owns the "next moment" highlight, across the whole program. */
function pickHeroSession(sessions: SpaceSession[], now: number): SpaceSession | null {
  const live = sessions.find(isLive);
  if (live) return live;
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
        range: formatWeekRange(r.start, r.end),
        sessions: byWeek.get(n) ?? [],
        status: n < currentWeek ? "done" : n === currentWeek ? "current" : "future",
      };
    },
  );

  const hero = pickHeroSession(sessions, now);

  return {
    weeks,
    totalWeeks,
    currentWeek,
    heroSessionId: hero?.id ?? null,
    heroIsLive: hero ? isLive(hero) : false,
  };
}

/** Per-session state within its week, given the chosen hero. */
export function sessionStateFor(
  session: SpaceSession,
  model: WeekJourneyModel,
  now: number = Date.now(),
): SessionState {
  if (session.id === model.heroSessionId) {
    return model.heroIsLive ? "live" : "next";
  }
  if (isLive(session)) return "live";
  const started = new Date(session.startTime).getTime() <= now;
  if (session.status === "ended" || started) return "done";
  return "upcoming";
}
