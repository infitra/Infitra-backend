"use client";

/**
 * YouPanel — Bundle 5c (locker-room v2). The personalized header.
 *
 * "You in this experience": avatar + name, where you are in the journey (week
 * progress, or a pre-start countdown), a few experience-scoped stats, and
 * contextual quick actions (introduce yourself / join live / share / jump to
 * your next moment). Lives in the desktop side rail and at the top on mobile.
 *
 * Reads entirely from the store; week math + program phase reuse
 * lib/experienceSpace/weekJourney.
 */

import { useEffect, useState } from "react";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { buildWeekJourney, programStatus } from "@/lib/experienceSpace/weekJourney";
import { Avatar } from "./Avatar";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const RED = "#ef4444";
const INK = "#0F2229";

function fmtJoined(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function countdown(iso: string, now: number) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "now";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function YouPanel() {
  const viewer = useExperienceSpaceStore((s) => s.viewer);
  const experience = useExperienceSpaceStore((s) => s.experience);
  const programState = useExperienceSpaceStore((s) => s.programState);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const memberCount = useExperienceSpaceStore((s) => s.memberCount);
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const isMember = useExperienceSpaceStore((s) => s.isMember);
  const actionItems = useExperienceSpaceStore((s) => s.actionItems);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const model = buildWeekJourney(experience, programState, sessions, now);
  const status = programStatus(experience, now);
  const totalWeeks = model.totalWeeks;
  const currentWeek = model.currentWeek;
  const weeksCompleted = programState?.weeksCompleted ?? 0;

  const hero = model.heroSessionId
    ? sessions.find((s) => s.id === model.heroSessionId) ?? null
    : null;
  const introPending = isMember && actionItems.some((a) => a.kind === "intro");
  const joined = fmtJoined(viewer.joinedAt);
  const roleLabel = isCreator ? "Expert" : "Member";

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)" }}
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <Avatar src={viewer.avatar} name={viewer.name} size={46} ring={isCreator ? ORANGE : CYAN} />
        <div className="min-w-0">
          <p className="text-base font-black font-headline truncate" style={{ color: INK }}>{viewer.name}</p>
          <p className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>
            {roleLabel}
            {joined && <span style={{ color: "#cbd5e1" }}> · joined {joined}</span>}
          </p>
        </div>
      </div>

      {/* Where you are */}
      <div className="mt-4">
        {status.phase === "upcoming" ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              Starts in {status.startsInDays}d
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "#64748b" }} suppressHydrationWarning>
              Week 1 begins {new Date(experience.startDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </p>
          </>
        ) : status.phase === "complete" ? (
          <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
            Completed · {totalWeeks} weeks
          </p>
        ) : (
          <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: INK, fontWeight: 800 }}>
            Week {currentWeek} of {totalWeeks}
          </p>
        )}

        {/* Segmented progress */}
        <div className="flex gap-1 mt-2">
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const done = i < weeksCompleted;
            const current = status.phase === "active" && i === currentWeek - 1;
            return (
              <span
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: 5,
                  backgroundColor: done ? CYAN : current ? ORANGE : "rgba(15,34,41,0.08)",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat value={sessions.length} label="sessions" />
        <Stat value={viewer.postCount} label={viewer.postCount === 1 ? "post" : "posts"} />
        <Stat value={memberCount} label="in tribe" />
      </div>

      {/* Quick actions */}
      <div className="mt-4 space-y-1.5">
        {introPending && (
          <ActionRow href="#your-move" label="Introduce yourself" tone="orange" />
        )}
        {model.heroIsLive && hero ? (
          <ActionRow href={`/sessions/${hero.id}/live`} label="Join live now" tone="red" />
        ) : (
          hero && (
            <ActionRow
              href="#the-week"
              label={`Next: ${hero.title}`}
              meta={countdown(hero.startTime, now)}
              tone="plain"
            />
          )
        )}
        <ActionRow href="#tribe-composer" label="Share with the Tribe" tone="plain" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl py-2 px-1 text-center" style={{ backgroundColor: "#FAF7F1" }}>
      <p className="text-lg font-black font-headline leading-none" style={{ color: INK }}>{value}</p>
      <p className="text-[10px] mt-1 font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>{label}</p>
    </div>
  );
}

function ActionRow({
  href,
  label,
  meta,
  tone,
}: {
  href: string;
  label: string;
  meta?: string;
  tone: "orange" | "red" | "plain";
}) {
  const accent = tone === "orange" ? ORANGE : tone === "red" ? RED : "#475569";
  const bg =
    tone === "orange" ? "rgba(255,97,48,0.08)" : tone === "red" ? "rgba(239,68,68,0.08)" : "rgba(15,34,41,0.035)";
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors"
      style={{ backgroundColor: bg }}
    >
      {tone === "red" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: RED }} />
      )}
      <span className="text-[13px] font-black font-headline truncate flex-1" style={{ color: accent }}>{label}</span>
      {meta && (
        <span className="text-[11px] font-bold font-headline tabular-nums" style={{ color: "#94a3b8" }} suppressHydrationWarning>{meta}</span>
      )}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}
