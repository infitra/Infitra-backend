/**
 * Build the structured weeks array used as an intermediate shape for
 * the buyer page. Bundle 4.2.14: the flat SessionsCarousel flattens
 * this output and enriches each session with weekNumber + host. The
 * cohort-space UI (post-purchase, post-pilot) will likely consume the
 * full weeks shape directly when it ships.
 *
 * One entry per week from start_date through end_date. Each entry
 * carries: week number, date range string ("12 Jun – 18 Jun"),
 * optional theme (from weekly_arc), and the sessions that fall in
 * that week, sorted by start_time.
 *
 * Server-side only — pure data shaping, no JSX or hooks. Used by
 * both the public buyer page and the post-publish celebration page.
 */

export interface SessionLite {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
  /** Session host (creator who leads it). Bundle 4.2.14 surfaces this
   *  per-session on the buyer page so each session card can show who's
   *  leading it (avatar + name). */
  host_id: string | null;
}

export interface WeekEntry {
  weekNumber: number;
  weekRange: string;
  theme: string | null;
  sessions: SessionLite[];
}

export function buildWeeks(
  startDate: string,
  endDate: string,
  weeklyArc: Array<{ week: number; theme: string }>,
  sessions: SessionLite[],
  /** Viewer's IANA zone. This runs at SSR, where "local" is the server's
   *  UTC — pass the viewer_tz so a session near the viewer's midnight slots
   *  into the week its DISPLAYED date belongs to (a Swiss 19:00 CEST session
   *  is already "tomorrow 00:00" for a viewer in Asia). */
  timeZone?: string,
): WeekEntry[] {
  const totalWeeks = computeTotalWeeks(startDate, endDate);
  if (totalWeeks === 0) return [];

  const sessionsByWeek = new Map<number, SessionLite[]>();
  for (const s of sessions) {
    const w = sessionWeekNumber(startDate, totalWeeks, s.start_time, timeZone);
    if (!sessionsByWeek.has(w)) sessionsByWeek.set(w, []);
    sessionsByWeek.get(w)!.push(s);
  }
  for (const arr of sessionsByWeek.values()) {
    arr.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  return Array.from({ length: totalWeeks }, (_, i) => i + 1).map((n) => {
    const range = weekRange(startDate, n);
    return {
      weekNumber: n,
      weekRange: formatWeekRange(range.start, range.end),
      theme: weeklyArc.find((f) => f.week === n)?.theme ?? null,
      sessions: sessionsByWeek.get(n) ?? [],
    };
  });
}

// Weeks are a calendar concept in the VIEWER's timezone: the session rows
// render their dates in device time, so the bucket must be derived from the
// same local calendar date or the two disagree near midnight (a late-Sunday
// UTC instant that displays as Monday must also SLOT as Monday). Day
// arithmetic goes through the Date constructor rather than fixed 86400000
// steps so DST weeks stay aligned, and differences are rounded because two
// local midnights can sit 23h or 25h apart across a DST change.
function localDayOf(instant: Date, timeZone?: string): Date {
  if (timeZone) {
    try {
      // en-CA formats as YYYY-MM-DD.
      const key = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(instant);
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m - 1, d);
    } catch {
      // Unknown zone string: fall through to runtime-local.
    }
  }
  return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function computeTotalWeeks(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
  const days = daysBetween(s, e);
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function sessionWeekNumber(
  startDate: string,
  totalWeeks: number,
  sessionIso: string,
  timeZone?: string,
): number {
  const programStart = new Date(startDate + "T00:00:00");
  const sStart = new Date(sessionIso);
  if (isNaN(programStart.getTime()) || isNaN(sStart.getTime())) return 1;
  const days = daysBetween(programStart, localDayOf(sStart, timeZone));
  if (days < 0) return 1;
  return Math.max(1, Math.min(totalWeeks, Math.floor(days / 7) + 1));
}

export function weekRange(startDate: string, weekNumber: number) {
  const programStart = new Date(startDate + "T00:00:00");
  const start = addDays(programStart, (weekNumber - 1) * 7);
  const end = addDays(start, 6);
  return { start, end };
}

export function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}
