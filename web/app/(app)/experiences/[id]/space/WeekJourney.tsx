"use client";

/**
 * WeekJourney — Bundle 5c. THE centerpiece of the Experience Space.
 *
 * "WEEK 1 OF 6 · FOUNDATION & MOMENTUM" rendered as the carrying highlight of
 * the locker room: a big editorial week heading, a progress rail that shows
 * where you are in the journey (done ● / now ◉ / ahead ○) and lets you peek
 * other weeks, and the selected week's sessions rendered as a journey — the
 * next moment elevated (countdown, or Join when live), the rest shown as
 * done ✓ / upcoming. Reuses the buyer carousel's editorial language adapted
 * for an enrolled participant.
 *
 * Data comes entirely from the Experience-Space store (sessions, programState,
 * experience.weeklyArc); week bucketing reuses lib/challenges/buildWeeks math
 * via lib/experienceSpace/weekJourney.
 */

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import {
  buildWeekJourney,
  programStatus,
  sessionStateFor,
  type SessionState,
  type WeekBucket,
  type WeekJourneyModel,
} from "@/lib/experienceSpace/weekJourney";
import type { SpaceSession } from "@/lib/experienceSpace/store";
import { sessionTeamLabel } from "@/lib/experienceSpace/store";
import { SessionDetailModal } from "@/app/components/SessionDetailModal";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const RED = "#ef4444";
const INK = "#0F2229";

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function fmtDur(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function countdown(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "now";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function WeekJourney() {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const programState = useExperienceSpaceStore((s) => s.programState);
  const sessions = useExperienceSpaceStore((s) => s.sessions);

  // Tapping any session card opens the read-only detail popup (same modal the
  // buyer carousel + Tribe posts use) — no navigation out to a session page.
  const [detail, setDetail] = useState<SpaceSession | null>(null);

  // A slow tick keeps countdowns + live/next states fresh without a re-render storm.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const model = useMemo(
    () => buildWeekJourney(experience, programState, sessions, now),
    [experience, programState, sessions, now],
  );
  const status = programStatus(experience, now);

  // Default to the week that holds the next moment (so the highlight is on
  // screen at load); else the calendar-current week. Chosen once.
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const m = buildWeekJourney(experience, programState, sessions);
    if (m.heroSessionId) {
      const w = m.weeks.find((wk) => wk.sessions.some((s) => s.id === m.heroSessionId));
      if (w) return w.weekNumber;
    }
    return m.currentWeek;
  });

  const selected =
    model.weeks.find((w) => w.weekNumber === selectedWeek) ??
    model.weeks.find((w) => w.weekNumber === model.currentWeek) ??
    model.weeks[0];

  if (!selected) return null;

  return (
    <section
      id="the-week"
      aria-label="Your week"
      className="rounded-3xl overflow-hidden scroll-mt-24"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow:
          "0 0 0 1px rgba(15,34,41,0.05), 0 2px 6px rgba(15,34,41,0.04), 0 18px 50px rgba(15,34,41,0.10)",
      }}
    >
      {/* ── Header: the carrying highlight ── */}
      <div
        className="px-5 sm:px-8 pt-7 sm:pt-9 pb-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,97,48,0.06), rgba(156,240,255,0.05) 60%, rgba(255,255,255,0) 100%)",
        }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.22em] font-headline mb-2"
          style={{ color: "#94a3b8", fontWeight: 800 }}
        >
          The journey
        </p>
        <h2
          className="font-black font-headline uppercase leading-[1.02]"
          style={{
            color: INK,
            fontSize: "clamp(1.9rem, 6.5vw, 3rem)",
            letterSpacing: "-0.025em",
          }}
        >
          Week {selected.weekNumber}{" "}
          <span style={{ color: "#cbd5e1" }}>of {model.totalWeeks}</span>
        </h2>
        {selected.theme && selected.theme.trim() && (
          <p
            className="font-black font-headline uppercase mt-1.5"
            style={{
              color: ORANGE,
              fontSize: "clamp(0.95rem, 3.2vw, 1.25rem)",
              letterSpacing: "0.02em",
            }}
          >
            {selected.theme.trim()}
          </p>
        )}
        <p className="text-[12px] mt-2" style={{ color: "#94a3b8" }} suppressHydrationWarning>
          {selected.range}
          {selected.status === "current" && status.hasStarted && (
            <span style={{ color: CYAN, fontWeight: 700 }}> · this week</span>
          )}
          {selected.status === "current" && !status.hasStarted && (
            <span style={{ color: CYAN, fontWeight: 700 }}> · starts in {status.startsInDays}d</span>
          )}
        </p>
      </div>

      {/* ── Progress rail ── */}
      <div className="px-4 sm:px-7 pb-5">
        <WeekRail
          model={model}
          selectedWeek={selected.weekNumber}
          onSelect={setSelectedWeek}
        />
      </div>

      <div className="h-px mx-5 sm:mx-7" style={{ backgroundColor: "rgba(8,145,178,0.16)" }} aria-hidden />

      {/* ── The selected week's sessions, as a journey ── */}
      <div className="px-4 sm:px-7 py-6 space-y-3.5">
        {selected.sessions.length === 0 ? (
          <div
            className="rounded-2xl py-8 px-5 text-center"
            style={{ backgroundColor: "#FAF7F1", border: "1px dashed rgba(15,34,41,0.12)" }}
          >
            <p className="text-sm font-bold font-headline" style={{ color: "#64748b" }}>
              No live moment this week
            </p>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
              The Tribe space is yours — keep the momentum going below.
            </p>
          </div>
        ) : (
          selected.sessions.map((s) => (
            <WeekSessionCard
              key={s.id}
              session={s}
              state={sessionStateFor(s, model, now)}
              now={now}
              onOpen={() => setDetail(s)}
            />
          ))
        )}
      </div>

      <SessionDetailModal
        open={!!detail}
        onClose={() => setDetail(null)}
        session={detail ? {
          id: detail.id, title: detail.title, startTime: detail.startTime,
          durationMinutes: detail.durationMinutes, hostId: detail.hostId,
          hostName: detail.hostName, hostAvatar: detail.hostAvatar,
          imageUrl: detail.imageUrl, description: detail.description, cohosts: detail.cohosts,
        } : null}
      />
    </section>
  );
}

/* ── Progress rail ─────────────────────────────────────────────────────
 * Nodes 1..N. Calendar progress is the dot styling (done = cyan filled,
 * current = orange + glow, ahead = hollow). The week you're VIEWING gets an
 * ink ring + bold label, so selection reads independently of progress.
 */
function WeekRail({
  model,
  selectedWeek,
  onSelect,
}: {
  model: WeekJourneyModel;
  selectedWeek: number;
  onSelect: (n: number) => void;
}) {
  const n = model.totalWeeks;
  // Fraction of the baseline filled cyan = progress up to (and including) the
  // current week node. With justify-between, node i sits at i/(n-1).
  const fillPct = n <= 1 ? 0 : ((model.currentWeek - 1) / (n - 1)) * 100;

  return (
    <div className="relative pt-1">
      {/* Labels */}
      <div className="flex items-end justify-between mb-2 px-1">
        {model.weeks.map((w) => {
          const sel = w.weekNumber === selectedWeek;
          return (
            <span
              key={w.weekNumber}
              className="text-[10px] sm:text-[11px] font-headline uppercase tracking-[0.16em] transition-colors"
              style={{
                color: sel ? INK : w.status === "future" ? "#cbd5e1" : "#94a3b8",
                fontWeight: sel ? 900 : 700,
              }}
            >
              W{w.weekNumber}
            </span>
          );
        })}
      </div>

      {/* Dots + connecting line */}
      <div className="relative h-7 flex items-center">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[2px]"
          style={{ left: "0.875rem", right: "0.875rem", backgroundColor: "rgba(203,213,225,0.7)" }}
          aria-hidden
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[2px] rounded-full"
          style={{
            left: "0.875rem",
            width: `calc(${fillPct / 100} * (100% - 1.75rem))`,
            backgroundColor: "rgba(8,145,178,0.55)",
          }}
          aria-hidden
        />
        <div className="relative flex items-center justify-between w-full">
          {model.weeks.map((w) => (
            <RailDot
              key={w.weekNumber}
              week={w}
              selected={w.weekNumber === selectedWeek}
              onSelect={() => onSelect(w.weekNumber)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RailDot({
  week,
  selected,
  onSelect,
}: {
  week: WeekBucket;
  selected: boolean;
  onSelect: () => void;
}) {
  const isCurrent = week.status === "current";
  const isDone = week.status === "done";
  const size = isCurrent ? 16 : 11;
  const fill = isCurrent ? ORANGE : isDone ? CYAN : "#FFFFFF";

  const shadow = selected
    ? "0 0 0 2px #FFFFFF, 0 0 0 4px #0F2229"
    : isCurrent
      ? "0 0 0 5px rgba(255,97,48,0.20), 0 1px 3px rgba(15,34,41,0.10)"
      : "0 1px 2px rgba(15,34,41,0.06)";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Week ${week.weekNumber}${isCurrent ? " (this week)" : ""}${selected ? " (viewing)" : ""}`}
      aria-current={selected ? "true" : undefined}
      className="relative flex items-center justify-center w-7 h-7 rounded-full transition-transform hover:scale-110 active:scale-95"
    >
      <span
        className="block rounded-full transition-all"
        style={{
          width: size,
          height: size,
          backgroundColor: fill,
          border: week.status === "future" ? "2px solid #cbd5e1" : "none",
          boxShadow: shadow,
        }}
      />
    </button>
  );
}

/* ── Session cards ─────────────────────────────────────────────────────
 * Two treatments: the "next moment" (next / live) is an elevated hero card;
 * done / upcoming use a quieter agenda row.
 */
function WeekSessionCard({
  session,
  state,
  now,
  onOpen,
}: {
  session: SpaceSession;
  state: SessionState;
  now: number;
  onOpen: () => void;
}) {
  if (state === "next" || state === "live") {
    return <HeroSessionCard session={session} live={state === "live"} now={now} onOpen={onOpen} />;
  }
  return <AgendaSessionRow session={session} done={state === "done"} onOpen={onOpen} />;
}

function HeroSessionCard({
  session,
  live,
  now,
  onOpen,
}: {
  session: SpaceSession;
  live: boolean;
  now: number;
  onOpen: () => void;
}) {
  const accent = live ? RED : ORANGE;
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="rounded-2xl overflow-hidden flex items-stretch cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: `0 0 0 1.5px ${accent}, 0 10px 30px ${live ? "rgba(239,68,68,0.18)" : "rgba(255,97,48,0.16)"}`,
      }}
    >
      <div className="relative shrink-0 w-28 sm:w-40" style={{ backgroundColor: "#ECE7DD" }}>
        {session.imageUrl ? (
          <Image src={session.imageUrl} alt="" fill sizes="160px" loading="eager" decoding="async" className="object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(156,240,255,0.4), rgba(255,97,48,0.2))" }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
        <p
          className="text-[11px] uppercase tracking-[0.18em] font-headline flex items-center gap-1.5"
          style={{ color: accent, fontWeight: 800 }}
        >
          {live && (
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: RED }} />
          )}
          {live ? "Live now" : "Next moment"}
        </p>
        <h3
          className="font-black font-headline tracking-tight mt-1.5 leading-tight"
          style={{ color: INK, fontSize: "clamp(1.1rem, 3.6vw, 1.4rem)", letterSpacing: "-0.015em" }}
        >
          {session.title}
        </h3>
        <p className="text-xs mt-1.5" style={{ color: "#64748b" }} suppressHydrationWarning>
          {fmtDay(session.startTime)} · {fmtTime(session.startTime)} · {fmtDur(session.durationMinutes)} · {sessionTeamLabel(session)}
        </p>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3.5">
          {live ? (
            <a
              href={`/sessions/${session.id}/live`}
              onClick={(e) => e.stopPropagation()}
              className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: RED, boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}
            >
              Join the room →
            </a>
          ) : (
            <>
              <span className="text-[11px] uppercase tracking-wider font-headline" style={{ color: "#94a3b8", fontWeight: 700 }}>
                Starts in
              </span>
              <span
                className="text-2xl sm:text-3xl font-black font-headline tabular-nums"
                style={{ color: ORANGE, letterSpacing: "-0.01em" }}
                suppressHydrationWarning
              >
                {countdown(session.startTime, now)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AgendaSessionRow({ session, done, onOpen }: { session: SpaceSession; done: boolean; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className="rounded-2xl overflow-hidden flex items-stretch transition-transform hover:-translate-y-0.5 cursor-pointer"
      style={{
        backgroundColor: "#FAF7F1",
        boxShadow: "0 0 0 1px rgba(15,34,41,0.05)",
        opacity: done ? 0.72 : 1,
      }}
    >
      <div className="relative shrink-0 w-20 sm:w-24" style={{ backgroundColor: "#ECE7DD" }}>
        {session.imageUrl ? (
          <Image
            src={session.imageUrl}
            alt=""
            fill
            sizes="96px"
            loading="lazy"
            decoding="async"
            className="object-cover"
            style={done ? { filter: "grayscale(1)" } : undefined}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(156,240,255,0.3), rgba(255,97,48,0.12))" }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0 py-3 px-4 flex flex-col justify-center">
        <p
          className="text-[10px] uppercase tracking-[0.18em] font-headline"
          style={{ color: done ? "#94a3b8" : CYAN, fontWeight: 700 }}
          suppressHydrationWarning
        >
          {fmtDay(session.startTime)} · {fmtTime(session.startTime)}
        </p>
        <h4
          className="font-black font-headline tracking-tight mt-0.5 truncate"
          style={{ color: done ? "#64748b" : INK, fontSize: "clamp(0.95rem, 3vw, 1.05rem)" }}
        >
          {session.title}
        </h4>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>{sessionTeamLabel(session)}</p>
      </div>

      <div className="shrink-0 self-center pr-4 pl-2">
        {done ? (
          <span className="flex items-center gap-1 text-[11px] font-black font-headline uppercase tracking-wider" style={{ color: CYAN }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Done
          </span>
        ) : (
          <span className="text-[10px] font-black font-headline uppercase tracking-[0.15em]" style={{ color: "#cbd5e1" }}>
            Upcoming
          </span>
        )}
      </div>
    </div>
  );
}
