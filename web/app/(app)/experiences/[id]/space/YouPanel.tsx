"use client";

/**
 * YouPanel — Bundle 5c (locker-room v4). The personal command center.
 *
 * Action-first: identity → where you are → your next moment → the ONE thing to
 * do → quick nav → light personal stats. Colour discipline: orange is reserved
 * for the single primary action (and red for live); everything else is cyan /
 * ink so the hub reads calm and the action pops.
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
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const isMember = useExperienceSpaceStore((s) => s.isMember);
  const actionItems = useExperienceSpaceStore((s) => s.actionItems);
  const setComposeIntent = useExperienceSpaceStore((s) => s.setComposeIntent);

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

  const hero = model.heroSessionId ? sessions.find((s) => s.id === model.heroSessionId) ?? null : null;
  const introPending = isMember && actionItems.some((a) => a.kind === "intro");
  const joined = fmtJoined(viewer.joinedAt);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 8px 26px rgba(15,34,41,0.08)" }}
    >
      {/* Identity — calm branded band (cyan-forward) */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ background: "linear-gradient(135deg, rgba(8,145,178,0.10), rgba(156,240,255,0.10) 70%, rgba(255,255,255,0))" }}
      >
        <div className="flex items-center gap-3">
          <Avatar src={viewer.avatar} name={viewer.name} size={48} ring={isCreator ? ORANGE : CYAN} />
          <div className="min-w-0">
            <p className="text-base font-black font-headline truncate" style={{ color: INK }}>{viewer.name}</p>
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>
              {isCreator ? "Expert" : "Member"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1">
        {/* Where you are */}
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: status.phase === "upcoming" ? CYAN : INK, fontWeight: 800 }}>
            {status.phase === "upcoming"
              ? `Starts in ${status.startsInDays}d`
              : status.phase === "complete"
                ? `Completed · ${totalWeeks} weeks`
                : `Week ${currentWeek} of ${totalWeeks}`}
          </p>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalWeeks }).map((_, i) => {
              const done = i < weeksCompleted;
              const current = status.phase === "active" && i === currentWeek - 1;
              return (
                <span
                  key={i}
                  className="flex-1 rounded-full"
                  style={{ height: 5, backgroundColor: done ? CYAN : current ? INK : "rgba(15,34,41,0.08)" }}
                />
              );
            })}
          </div>
        </div>

        {/* Next moment */}
        {hero && (
          <a
            href={model.heroIsLive ? `/sessions/${hero.id}/live` : "#the-week"}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-4"
            style={{ backgroundColor: model.heroIsLive ? "rgba(239,68,68,0.08)" : "#FAF7F1" }}
          >
            {model.heroIsLive && <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: RED }} />}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: model.heroIsLive ? RED : CYAN, fontWeight: 800 }}>
                {model.heroIsLive ? "Live now" : "Next moment"}
              </p>
              <p className="text-[13px] font-black font-headline truncate" style={{ color: INK }}>{hero.title}</p>
            </div>
            <span className="text-[12px] font-black font-headline tabular-nums shrink-0" style={{ color: model.heroIsLive ? RED : INK }} suppressHydrationWarning>
              {model.heroIsLive ? "Join" : countdown(hero.startTime, now)}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={model.heroIsLive ? RED : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        )}

        {/* Actions */}
        <div className="mt-3 space-y-2">
          {introPending ? (
            <PrimaryAction href="#your-move" label="Introduce yourself" variant="solid" />
          ) : (
            <PrimaryAction
              href="#tribe-composer"
              label="Engage with your Tribe"
              variant="solid"
              onClick={() => setComposeIntent("share")}
            />
          )}
          <PrimaryAction
            href="#tribe-composer"
            label="Ask your Experts"
            variant="tint"
            onClick={() => setComposeIntent("question")}
          />
        </div>

        {/* Jump-to navigation */}
        <p className="text-[10px] uppercase tracking-[0.16em] font-headline mt-5 mb-2" style={{ color: "#94a3b8", fontWeight: 800 }}>
          Jump to
        </p>
        <div className="grid grid-cols-2 gap-2">
          <NavPill href="#the-week" label="The Week" />
          <NavPill href="#tribe" label="The Tribe" />
        </div>

        {/* Personal stats */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Stat value={String(viewer.postCount)} label={viewer.postCount === 1 ? "post" : "posts"} />
          <Stat value={joined ?? "—"} label="joined" />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl py-2 px-2 text-center" style={{ backgroundColor: "#FAF7F1" }}>
      <p className="text-base font-black font-headline leading-none" style={{ color: INK }} suppressHydrationWarning>{value}</p>
      <p className="text-[10px] mt-1 font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>{label}</p>
    </div>
  );
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-1 rounded-xl py-2.5 text-[12px] font-black font-headline transition-colors"
      style={{ backgroundColor: "rgba(15,34,41,0.04)", color: "#475569" }}
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </a>
  );
}

function PrimaryAction({
  href,
  label,
  variant,
  onClick,
}: {
  href: string;
  label: string;
  variant: "solid" | "tint";
  onClick?: () => void;
}) {
  const solid = variant === "solid";
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-black font-headline transition-transform hover:scale-[1.01]"
      style={
        solid
          ? { backgroundColor: ORANGE, color: "#fff", boxShadow: "0 4px 14px rgba(255,97,48,0.32)" }
          : { backgroundColor: "rgba(255,97,48,0.08)", color: ORANGE }
      }
    >
      {label}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={solid ? "#fff" : ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}
