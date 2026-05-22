/**
 * PublicProgramRhythm — Bundle 4.2 rewrite.
 *
 * Vertical cyan-spine timeline. The week markers are punctuation along
 * a continuous line — the spine itself reads as the program's
 * continuous presence (the cohort space, always alive), with live
 * moments highlighted as the points where the cohort comes together.
 *
 * The previous version treated weeks as a 2-column "left rail / right
 * content" grid with no continuous visual connection between weeks. That
 * read as "stacked weeks" — list-like, no flow, no momentum. The new
 * spine treatment reads as a journey: your eye travels down the cyan
 * line, picking up themes and session cards along the way.
 *
 * Always-on signaling:
 *   - Spine is SOLID cyan throughout (not dashed in-between).
 *     Visual metaphor: continuity, not absence.
 *   - Small orange "ALWAYS ON · cohort space" tag at the top of the
 *     spine pins the always-on dimension once.
 *   - Section subtitle says it in words: "Live coaching weaves into
 *     your week. Between sessions, your cohort stays alive."
 *   - The dedicated selling of always-on lives in the next block
 *     (PublicBeyondLiveBlock), not repeated here.
 *
 * First week's marker is orange (#FF6130) instead of cyan — "start here"
 * visual signal. All subsequent week markers are cyan.
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
  /** Optional cover image — Bundle 4.2.1: moved here from the hero.
   *  Renders as a cinematic chapter-cover band at the top of the
   *  Journey section, introducing the program's experiential arc.
   *  Falls back gracefully to nothing when no image is set. */
  coverImageUrl?: string | null;
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
  coverImageUrl,
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
    arr.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Cover image as cinematic chapter band — Bundle 4.2.1. Moved
            from the hero to here, where it introduces the program's
            experiential arc instead of competing with the creator
            portraits up top. 16:9 contained, rounded, subtle elevation. */}
        {coverImageUrl && (
          <div
            className="relative overflow-hidden mb-12 lg:mb-16"
            style={{
              aspectRatio: "16 / 9",
              borderRadius: "1.5rem",
              boxShadow:
                "0 1px 2px rgba(15,34,41,0.04), 0 12px 40px rgba(15,34,41,0.08)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {/* Section header */}
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3 text-center"
          style={{ color: "#FF6130" }}
        >
          The Journey
        </p>
        <h2
          className="text-3xl lg:text-5xl font-black font-headline tracking-tight text-center mb-4"
          style={{ color: "#0F2229", letterSpacing: "-0.02em" }}
        >
          {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}, week by week
        </h2>
        <p
          className="text-sm sm:text-base text-center mb-16 lg:mb-20 max-w-xl mx-auto leading-relaxed"
          style={{ color: "#475569" }}
        >
          Live coaching weaves into your week. Between sessions, your
          cohort stays alive.
        </p>

        {/* The spine itself + content. Spine is positioned via absolute
            inside a relative container; content uses padding-left to
            clear it. */}
        <div className="relative">
          {/* The cyan spine — solid line from top of first week marker
              to bottom of last. Sits at left 16px (mobile) / 24px (desktop).
              Single element with responsive `left`. Always-on tag pinned
              at the top of the spine. */}
          <div
            className="absolute top-12 bottom-4 w-[3px] rounded-full left-4 lg:left-6"
            style={{ backgroundColor: "#9CF0FF" }}
            aria-hidden
          />

          {/* Always-on tag — pinned at the top of the spine */}
          <div className="relative pl-10 lg:pl-16 mb-10 lg:mb-14">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold font-headline uppercase tracking-[0.2em]"
              style={{
                backgroundColor: "rgba(255,97,48,0.10)",
                color: "#c2410c",
                border: "1px solid rgba(255,97,48,0.20)",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#FF6130" }}
              />
              Always on · cohort space
            </span>
          </div>

          {/* Weeks */}
          <div className="space-y-12 lg:space-y-16">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
              const range = weekRange(startDate, weekNum);
              const focus = weeklyArc.find((f) => f.week === weekNum)?.theme;
              const weekSessions = sessionsByWeek.get(weekNum) ?? [];
              const isFirst = weekNum === 1;

              return (
                <div key={weekNum} className="relative pl-10 lg:pl-16">
                  {/* Week marker — orange for first week ("start here"
                      signal), cyan for the rest. Centered on the spine
                      via responsive left positioning. Single element. */}
                  <div
                    className="absolute w-4 h-4 rounded-full left-[9px] lg:left-[17px] top-2"
                    style={{
                      backgroundColor: isFirst ? "#FF6130" : "#9CF0FF",
                      border: "3px solid #F2EFE8",
                      boxShadow: isFirst
                        ? "0 0 0 1px rgba(255,97,48,0.30), 0 2px 8px rgba(255,97,48,0.25)"
                        : "0 0 0 1px rgba(8,145,178,0.20)",
                    }}
                    aria-hidden
                  />

                  {/* Week label */}
                  <div
                    className="text-[11px] font-bold font-headline uppercase tracking-[0.2em] mb-2"
                    style={{ color: "#0891b2" }}
                  >
                    Week {weekNum} <span style={{ color: "#cbd5e1" }}>·</span>{" "}
                    <span style={{ color: "#94a3b8" }}>
                      {formatWeekRange(range.start, range.end)}
                    </span>
                  </div>

                  {/* Week theme as chapter heading. If empty, fall back
                      to "Week N" — never leave a bare row. */}
                  <h3
                    className="font-black font-headline tracking-tight leading-[1.05] mb-6 lg:mb-7"
                    style={{
                      color: "#0F2229",
                      fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {focus && focus.trim() ? focus : `Week ${weekNum}`}
                  </h3>

                  {/* Sessions for this week */}
                  {weekSessions.length > 0 && (
                    <div className="space-y-3">
                      {weekSessions.map((s) => (
                        <SessionCard key={s.id} session={s} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SessionCard({ session }: { session: SessionLite }) {
  return (
    <div
      className="flex items-start gap-4 p-3.5 rounded-2xl"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(15,34,41,0.06)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.03)",
      }}
    >
      {session.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.image_url}
          alt=""
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg shrink-0 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(156,240,255,0.40), rgba(255,97,48,0.20))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" width={20} height={20} style={{ opacity: 0.35 }} />
        </div>
      )}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4
          className="text-sm lg:text-base font-black font-headline leading-tight"
          style={{ color: "#0F2229" }}
        >
          {session.title}
        </h4>
        <p
          className="text-[11px] lg:text-xs font-bold mt-1.5"
          style={{ color: "#64748b" }}
          suppressHydrationWarning
        >
          {formatSessionDay(session.start_time)}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {formatSessionTime(session.start_time)}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {formatDuration(session.duration_minutes)}
        </p>
        {session.description && session.description.trim() && (
          <p
            className="text-xs mt-2 leading-relaxed line-clamp-2"
            style={{ color: "#475569" }}
          >
            {session.description}
          </p>
        )}
      </div>
    </div>
  );
}
