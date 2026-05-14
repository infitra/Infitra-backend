"use client";

import { useMemo } from "react";
import { EditedAttribution } from "@/app/components/EditedAttribution";

/**
 * The Weekly Arc — one short theme line per program week. Number of weeks
 * is derived from the challenge's start_date / end_date (matches the
 * vw_challenge_program_state computation: ceil((end - start) / 7) + 1).
 *
 * When dates change, the row count reshapes automatically; existing
 * theme strings keep their week index (so "Build base" stays Week 1
 * even if you push end_date out by another two weeks).
 *
 * Saved as part of the larger handleSave action in WorkspaceEditor.
 * Value shape: [{ week: 1, theme: "Build base" }, ...].
 */

export interface WeeklyArcEntry {
  week: number;
  theme: string;
}

interface Props {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  value: WeeklyArcEntry[];
  onChange: (value: WeeklyArcEntry[]) => void;
  canEdit: boolean;
  editedAt: string | null;
  editorName: string | null;
}

const MAX_THEME_LENGTH = 80;

function computeTotalWeeks(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

function formatWeekRange(startDate: string, weekNumber: number): string {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return "";
  const weekStart = new Date(start.getTime() + (weekNumber - 1) * 7 * 86400000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

export function WeeklyArcEditor({
  startDate,
  endDate,
  value,
  onChange,
  canEdit,
  editedAt,
  editorName,
}: Props) {
  const totalWeeks = useMemo(
    () => computeTotalWeeks(startDate, endDate),
    [startDate, endDate]
  );

  // Build the full row set on every render — value may be partial
  // (loaded as empty for a brand-new challenge, or has fewer entries
  // than total weeks because dates were extended). Render is always
  // 1..totalWeeks; missing entries render with empty theme.
  // No reshape effect — that would mark isDirty=true on initial render
  // before the user has touched anything. Instead, on edit we emit the
  // full row set (preserving existing themes + the user's change).
  function setThemeAt(weekNumber: number, theme: string) {
    const fullRows: WeeklyArcEntry[] = [];
    for (let week = 1; week <= totalWeeks; week++) {
      if (week === weekNumber) {
        fullRows.push({ week, theme });
      } else {
        const existing = value.find((v) => v.week === week);
        fullRows.push({ week, theme: existing?.theme ?? "" });
      }
    }
    onChange(fullRows);
  }

  if (totalWeeks === 0) {
    return (
      <div className="rounded-2xl infitra-card p-6">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider mb-3">
          Weekly Arc
        </h3>
        <p className="text-sm italic" style={{ color: "#94a3b8" }}>
          Set the program dates above to author weekly themes.
        </p>
      </div>
    );
  }

  // Render a row per week — even if `value` is briefly out of sync
  // (the reshape effect will catch up). This keeps the visual stable
  // during date edits.
  const rows: WeeklyArcEntry[] = [];
  for (let week = 1; week <= totalWeeks; week++) {
    const entry = value.find((v) => v.week === week);
    rows.push({ week, theme: entry?.theme ?? "" });
  }

  return (
    <div className="rounded-2xl infitra-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black font-headline text-[#94a3b8] uppercase tracking-wider">
          Weekly Arc
        </h3>
        <span
          className="text-[10px] font-bold font-headline uppercase tracking-wider"
          style={{ color: "#94a3b8" }}
        >
          {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}
        </span>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#64748b" }}>
        One short theme per week. Sets the frame for the cohort space when
        each week becomes current.
      </p>

      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.week} className="flex items-center gap-3">
            <div
              className="shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl"
              style={{
                backgroundColor: "rgba(8,145,178,0.08)",
                border: "1px solid rgba(8,145,178,0.18)",
                minWidth: 92,
              }}
            >
              <span
                className="text-[10px] font-bold font-headline uppercase tracking-wider"
                style={{ color: "#0891b2" }}
              >
                Week {row.week}
              </span>
              <span
                className="text-[10px] mt-0.5"
                style={{ color: "#94a3b8" }}
              >
                {formatWeekRange(startDate, row.week)}
              </span>
            </div>
            {canEdit ? (
              <input
                type="text"
                value={row.theme}
                onChange={(e) => setThemeAt(row.week, e.target.value)}
                maxLength={MAX_THEME_LENGTH}
                placeholder={
                  row.week === 1
                    ? "e.g. Build base"
                    : row.week === 2
                    ? "e.g. Push"
                    : "Theme…"
                }
                className="flex-1 rounded-xl p-2.5 text-sm font-bold font-headline focus:outline-none"
                style={{
                  border: "1px solid rgba(15,34,41,0.12)",
                  color: "#0F2229",
                }}
              />
            ) : row.theme ? (
              <p
                className="flex-1 text-sm font-bold font-headline"
                style={{ color: "#0F2229" }}
              >
                {row.theme}
              </p>
            ) : (
              <p
                className="flex-1 text-sm italic"
                style={{ color: "#94a3b8" }}
              >
                No theme yet
              </p>
            )}
          </div>
        ))}
      </div>

      <EditedAttribution editedAt={editedAt} editorName={editorName} />
    </div>
  );
}
