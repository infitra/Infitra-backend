"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "today" | "week" | "month";

interface SessionItem {
  id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  live_room_id: string | null;
  challengeName: string | null;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayHeader(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return { start: monday, end: sunday };
}

export function ScheduleView({ sessions }: { sessions: SessionItem[] }) {
  const [tab, setTab] = useState<Tab>("week");

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { start: weekStart, end: weekEnd } = getWeekRange();

  const filtered = sessions.filter((s) => {
    const d = new Date(s.start_time);
    if (tab === "today") return isSameDay(d, now);
    if (tab === "week") return d >= weekStart && d < weekEnd;
    return true; // month — all sessions already scoped to this month
  });

  // Group by day for week/month view
  const grouped: Record<string, SessionItem[]> = {};
  for (const s of filtered) {
    const dayKey = new Date(s.start_time).toISOString().split("T")[0];
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(s);
  }
  const sortedDays = Object.keys(grouped).sort();

  const tabs: { key: Tab; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-headline transition-colors ${
              tab === t.key
                ? "bg-[#FF6130] text-white"
                : "text-[#9CF0FF]/40 hover:text-[#9CF0FF]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-[#9CF0FF]/30">
            No sessions{" "}
            {tab === "today"
              ? "today"
              : tab === "week"
                ? "this week"
                : "this month"}
            .
          </p>
        </div>
      ) : tab === "today" ? (
        /* Today: flat list sorted by time */
        <div className="space-y-2">
          {filtered.map((s) => (
            <SessionRow key={s.id} session={s} showDate={false} />
          ))}
        </div>
      ) : (
        /* Week/Month: grouped by day */
        <div className="space-y-4">
          {sortedDays.map((day) => (
            <div key={day}>
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-2">
                {formatDayHeader(day + "T00:00:00")}
              </p>
              <div className="space-y-1.5">
                {grouped[day].map((s) => (
                  <SessionRow key={s.id} session={s} showDate={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionRow({
  session,
  showDate,
}: {
  session: SessionItem;
  showDate: boolean;
}) {
  const isEnded = session.status === "ended";

  return (
    <Link
      href={`/dashboard/sessions/${session.id}`}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        isEnded
          ? "bg-[#0F2229]/50 border-[#9CF0FF]/5 opacity-50"
          : "bg-[#0F2229] border-[#9CF0FF]/10 hover:border-[#FF6130]/20"
      }`}
    >
      {/* Time */}
      <span className="text-xs font-bold text-[#9CF0FF]/50 font-headline w-12 shrink-0">
        {formatTime(session.start_time)}
      </span>

      {/* Dot */}
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${
          session.live_room_id
            ? "bg-red-500 animate-pulse"
            : isEnded
              ? "bg-[#9CF0FF]/15"
              : "bg-[#9CF0FF]/30"
        }`}
      />

      {/* Title + challenge badge */}
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <span className="text-sm font-bold text-white font-headline truncate">
          {session.title}
        </span>
        {session.challengeName && (
          <span className="shrink-0 text-[8px] font-bold text-[#FF6130]/50 bg-[#FF6130]/8 px-1.5 py-0.5 rounded-full font-headline truncate max-w-[120px]">
            {session.challengeName}
          </span>
        )}
      </div>

      {/* Duration */}
      <span className="text-[10px] text-[#9CF0FF]/25 shrink-0">
        {session.duration_minutes}m
      </span>
    </Link>
  );
}
