/**
 * PublicProgramRhythm — "How it actually works" beat.
 *
 * Vertical week-by-week timeline. Each week: number + date range + theme
 * (from weekly_arc), followed by that week's sessions inline (image
 * thumb + title + time + duration).
 *
 * Buyer scans top-to-bottom and gets a concrete sense of: when each
 * session lands, what the focus is week by week, what's actually in
 * the program.
 *
 * Reads as marketing — generous spacing, no editing affordances, but
 * the visual rhythm mirrors the workspace's so creators recognize
 * their own design.
 */

interface SessionLite {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
}

interface Props {
  startDate: string;
  endDate: string;
  weeklyArc: Array<{ week: number; theme: string }>;
  sessions: SessionLite[];
}

function weekRange(startDate: string, weekNumber: number): { start: Date; end: Date } {
  const programStart = new Date(startDate + "T00:00:00");
  const start = new Date(programStart.getTime() + (weekNumber - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start, end };
}

function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function computeTotalWeeks(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
  const days = Math.floor((e.getTime() - s.getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

function sessionWeekNumber(startDate: string, totalWeeks: number, sessionIso: string): number {
  const programStart = new Date(startDate + "T00:00:00");
  const sStart = new Date(sessionIso);
  if (isNaN(programStart.getTime()) || isNaN(sStart.getTime())) return 1;
  const days = Math.floor((sStart.getTime() - programStart.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.max(1, Math.min(totalWeeks, Math.floor(days / 7) + 1));
}

function formatSessionDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function PublicProgramRhythm({
  startDate,
  endDate,
  weeklyArc,
  sessions,
}: Props) {
  const totalWeeks = computeTotalWeeks(startDate, endDate);
  if (totalWeeks === 0) return null;

  const sessionsByWeek = new Map<number, SessionLite[]>();
  for (const s of sessions) {
    const w = sessionWeekNumber(startDate, totalWeeks, s.start_time);
    if (!sessionsByWeek.has(w)) sessionsByWeek.set(w, []);
    sessionsByWeek.get(w)!.push(s);
  }
  for (const arr of sessionsByWeek.values()) {
    arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  return (
    <section
      className="px-6 lg:px-12 py-16 lg:py-24"
      style={{ backgroundColor: "rgba(15,34,41,0.025)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section eyebrow + heading */}
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-[0.25em] mb-3 text-center"
          style={{ color: "#94a3b8" }}
        >
          The Program
        </p>
        <h2
          className="text-3xl lg:text-4xl font-black font-headline tracking-tight text-center mb-3"
          style={{ color: "#0F2229" }}
        >
          {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"} of structure
        </h2>
        <p
          className="text-sm sm:text-base text-center mb-12 lg:mb-16 max-w-2xl mx-auto leading-relaxed"
          style={{ color: "#64748b" }}
        >
          {sessions.length} live {sessions.length === 1 ? "session" : "sessions"} woven
          into a {totalWeeks}-week rhythm. Each week has a focus and its own
          live moments.
        </p>

        {/* Weekly timeline */}
        <div className="space-y-10 lg:space-y-12">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
            const range = weekRange(startDate, weekNum);
            const focus = weeklyArc.find((f) => f.week === weekNum)?.theme;
            const weekSessions = sessionsByWeek.get(weekNum) ?? [];

            return (
              <div key={weekNum} className="flex gap-5 lg:gap-8">
                {/* Left rail: week number + range */}
                <div className="shrink-0 w-20 lg:w-28 pt-1">
                  <div
                    className="text-[11px] font-bold font-headline uppercase tracking-widest"
                    style={{ color: "#0891b2" }}
                  >
                    Week {weekNum}
                  </div>
                  <div
                    className="text-[11px] font-bold font-headline mt-1"
                    style={{ color: "#94a3b8" }}
                  >
                    {formatWeekRange(range.start, range.end)}
                  </div>
                </div>

                {/* Right side: theme + sessions */}
                <div className="flex-1 min-w-0">
                  {focus ? (
                    <h3
                      className="text-xl lg:text-2xl font-black font-headline tracking-tight leading-tight mb-4"
                      style={{ color: "#0F2229" }}
                    >
                      {focus}
                    </h3>
                  ) : (
                    <h3
                      className="text-xl lg:text-2xl font-bold font-headline tracking-tight leading-tight mb-4 italic"
                      style={{ color: "#94a3b8" }}
                    >
                      Focus coming
                    </h3>
                  )}

                  {weekSessions.length === 0 ? (
                    <p className="text-xs italic" style={{ color: "#94a3b8" }}>
                      No sessions this week
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {weekSessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-start gap-4 p-3 rounded-xl"
                          style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(15,34,41,0.06)",
                          }}
                        >
                          {s.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.image_url}
                              alt=""
                              className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg shrink-0 flex items-center justify-center"
                              style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/logo-mark.png" alt="" width={20} height={20} style={{ opacity: 0.18 }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pt-1">
                            <h4
                              className="text-sm lg:text-base font-black font-headline leading-tight"
                              style={{ color: "#0F2229" }}
                            >
                              {s.title}
                            </h4>
                            <p
                              className="text-[11px] lg:text-xs font-bold mt-1.5"
                              style={{ color: "#64748b" }}
                              suppressHydrationWarning
                            >
                              {formatSessionDay(s.start_time)} · {formatSessionTime(s.start_time)} · {formatDuration(s.duration_minutes)}
                            </p>
                            {s.description && s.description.trim() && (
                              <p
                                className="text-xs mt-2 leading-relaxed line-clamp-2"
                                style={{ color: "#475569" }}
                              >
                                {s.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
