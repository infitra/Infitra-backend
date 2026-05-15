"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SectionAttribution } from "./SectionAttribution";
import type { ActivityRow } from "./useWorkspaceRealtime";

/**
 * Program Rhythm — combined Weekly Focus + Sessions slotted under each
 * week. Replaces the two scattered sections from Bundle 3 v1.
 *
 * Sessions are slotted by their start_time into the week range
 * (start_date + (weekNum-1)*7 .. +7). The number of weeks is derived
 * from the challenge's start_date / end_date — same math as the
 * vw_challenge_program_state view.
 *
 * Render-prop pattern: this component owns the *structure* (week rows,
 * focus inputs, "+ Add session in Week N" buttons), the parent owns the
 * *session card* render (preserves all the existing add/edit/cohost
 * logic without massively duplicating it here).
 */

export interface WeeklyFocusEntry {
  week: number;
  theme: string;
}

interface SessionLite {
  id: string;
  startTime: string; // ISO
}

interface Props {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  weeklyFocus: WeeklyFocusEntry[];
  sessions: SessionLite[];

  canEdit: boolean;
  /** Auto-save callback fired on theme blur. */
  onFocusCommit: (weekNum: number, theme: string) => void;
  /** Render a session card (parent owns this — keeps existing logic). */
  renderSessionCard: (sessionId: string) => ReactNode;
  /** "+ Add session in Week N" — parent opens its add form pre-filled. */
  onAddSessionForWeek?: (weekNum: number, suggestedDate: Date) => void;
  /** Disable "+ Add session" while the chat says someone is adding one,
   *  or while a local add is in flight. */
  addingSessionDisabled?: boolean;

  activity: ActivityRow[];
  profileMap: Record<string, { name: string; avatar: string | null }>;
}

const RHYTHM_ATTRIBUTION_FIELDS = [
  "weekly_focus",
  "weekly_arc", // legacy field name from earlier Bundle 3
  "session_added",
  "session_edited",
  "session_removed",
];

const MAX_THEME_LENGTH = 80;

function computeTotalWeeks(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
  const days = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

function weekRange(startDate: string, weekNumber: number): { start: Date; end: Date } {
  const programStart = new Date(startDate);
  const start = new Date(programStart.getTime() + (weekNumber - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start, end };
}

function formatRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function getWeekForSession(
  startDate: string,
  totalWeeks: number,
  sessionStart: string,
): number {
  const programStart = new Date(startDate);
  const sStart = new Date(sessionStart);
  if (isNaN(programStart.getTime()) || isNaN(sStart.getTime())) return 1;
  const days = Math.floor(
    (sStart.getTime() - programStart.getTime()) / 86400000,
  );
  if (days < 0) return 1;
  return Math.max(1, Math.min(totalWeeks, Math.floor(days / 7) + 1));
}

export function ProgramRhythmSection({
  startDate,
  endDate,
  weeklyFocus,
  sessions,
  canEdit,
  onFocusCommit,
  renderSessionCard,
  onAddSessionForWeek,
  addingSessionDisabled,
  activity,
  profileMap,
}: Props) {
  const totalWeeks = useMemo(
    () => computeTotalWeeks(startDate, endDate),
    [startDate, endDate],
  );

  // Group sessions by week
  const sessionsByWeek = useMemo(() => {
    const map = new Map<number, SessionLite[]>();
    for (const s of sessions) {
      const w = getWeekForSession(startDate, totalWeeks, s.startTime);
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(s);
    }
    // Sort each week's sessions by time
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return map;
  }, [sessions, startDate, totalWeeks]);

  const totalSessions = sessions.length;

  if (totalWeeks === 0) {
    return (
      <div className="rounded-2xl infitra-card p-6">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider mb-3">
          Program Rhythm
        </h3>
        <p className="text-sm italic" style={{ color: "#94a3b8" }}>
          Set the program dates above to build the weekly structure.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl infitra-card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
          Program Rhythm
        </h3>
        <span
          className="text-[10px] font-bold font-headline uppercase tracking-wider"
          style={{ color: "#94a3b8" }}
        >
          {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"} · {totalSessions}{" "}
          {totalSessions === 1 ? "session" : "sessions"}
        </span>
      </div>
      <p className="text-xs mb-5 leading-relaxed" style={{ color: "#64748b" }}>
        One short focus per week + the live sessions that land in it.
        Sessions slot into their week automatically based on the date you
        set.
      </p>

      <div className="space-y-4">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
          const range = weekRange(startDate, weekNum);
          const focus = weeklyFocus.find((f) => f.week === weekNum)?.theme ?? "";
          const weekSessions = sessionsByWeek.get(weekNum) ?? [];
          return (
            <WeekRow
              key={weekNum}
              weekNum={weekNum}
              range={range}
              focus={focus}
              sessionIds={weekSessions.map((s) => s.id)}
              canEdit={canEdit}
              onFocusCommit={(theme) => onFocusCommit(weekNum, theme)}
              renderSessionCard={renderSessionCard}
              onAddSession={
                onAddSessionForWeek
                  ? () => onAddSessionForWeek(weekNum, range.start)
                  : undefined
              }
              addingSessionDisabled={addingSessionDisabled}
            />
          );
        })}
      </div>

      <SectionAttribution
        fields={RHYTHM_ATTRIBUTION_FIELDS}
        activity={activity}
        profiles={profileMap}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// WeekRow — one block per program week. Focus input auto-saves on
// blur; sessions render via parent's render-prop; "+ Add session"
// button calls back to parent with a suggested date in this week.
// ─────────────────────────────────────────────────────────────────

function WeekRow({
  weekNum,
  range,
  focus,
  sessionIds,
  canEdit,
  onFocusCommit,
  renderSessionCard,
  onAddSession,
  addingSessionDisabled,
}: {
  weekNum: number;
  range: { start: Date; end: Date };
  focus: string;
  sessionIds: string[];
  canEdit: boolean;
  onFocusCommit: (theme: string) => void;
  renderSessionCard: (sessionId: string) => ReactNode;
  onAddSession?: () => void;
  addingSessionDisabled?: boolean;
}) {
  // Local-wins sync: useState only inits once, so without this the
  // partner's focus edit never appears in the input. Adopt prop value
  // when it changes AND the user isn't currently typing (dirty flag).
  const [focusLocal, setFocusLocal] = useState(focus);
  const focusDirty = useRef(false);
  const lastFocusProp = useRef(focus);
  useEffect(() => {
    if (focus !== lastFocusProp.current) {
      lastFocusProp.current = focus;
      if (!focusDirty.current) setFocusLocal(focus);
    }
  }, [focus]);

  return (
    <div
      className="rounded-xl"
      style={{
        backgroundColor: "rgba(255,255,255,0.5)",
        border: "1px solid rgba(15,34,41,0.06)",
      }}
    >
      {/* Week header — focus input, week label */}
      <div
        className="flex items-center gap-3 p-3"
        style={{ borderBottom: sessionIds.length > 0 ? "1px solid rgba(15,34,41,0.04)" : undefined }}
      >
        <div
          className="shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-lg"
          style={{
            backgroundColor: "rgba(8,145,178,0.08)",
            border: "1px solid rgba(8,145,178,0.18)",
            minWidth: 100,
          }}
        >
          <span
            className="text-[10px] font-bold font-headline uppercase tracking-wider"
            style={{ color: "#0891b2" }}
          >
            Week {weekNum}
          </span>
          <span className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
            {formatRange(range.start, range.end)}
          </span>
        </div>

        {canEdit ? (
          <input
            type="text"
            value={focusLocal}
            onChange={(e) => {
              focusDirty.current = true;
              setFocusLocal(e.target.value);
            }}
            onBlur={() => {
              const next = focusLocal.trim();
              if (next !== focus) onFocusCommit(next);
              setFocusLocal(next);
              focusDirty.current = false;
            }}
            maxLength={MAX_THEME_LENGTH}
            placeholder={
              weekNum === 1
                ? "Weekly focus — e.g. Foundations"
                : "Weekly focus…"
            }
            className="flex-1 rounded-lg p-2 text-sm font-bold font-headline focus:outline-none"
            style={{
              border: "1px solid rgba(15,34,41,0.10)",
              color: "#0F2229",
              backgroundColor: "white",
            }}
          />
        ) : focus ? (
          <p className="flex-1 text-sm font-bold font-headline" style={{ color: "#0F2229" }}>
            {focus}
          </p>
        ) : (
          <p className="flex-1 text-sm italic" style={{ color: "#94a3b8" }}>
            No focus set
          </p>
        )}
      </div>

      {/* Sessions in this week + add button */}
      <div className="p-3 pt-2 space-y-2">
        {sessionIds.map((id) => (
          <div key={id}>{renderSessionCard(id)}</div>
        ))}
        {canEdit && onAddSession && (
          <button
            type="button"
            onClick={onAddSession}
            disabled={addingSessionDisabled}
            className="w-full text-left text-xs font-bold font-headline px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{
              border: "1px dashed rgba(255,97,48,0.3)",
              color: "#FF6130",
              backgroundColor: "transparent",
            }}
          >
            + Add session in Week {weekNum}
          </button>
        )}
        {sessionIds.length === 0 && !canEdit && (
          <p
            className="text-[11px] italic px-3 py-1.5"
            style={{ color: "#94a3b8" }}
          >
            No sessions yet
          </p>
        )}
      </div>
    </div>
  );
}
