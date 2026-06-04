"use client";

/**
 * YouPanel — Bundle 5c (locker-room Ship 1). Your console, in clear sections:
 *
 *   PROFILE     — avatar + name + role, with your Posts / Joined alongside.
 *   MOMENTUM    — where you are (countdown / week), the progress bar, next moment.
 *   ENGAGEMENT  — Share with your Tribe (+ Ask your Experts for participants;
 *                 creators only share — they ARE the experts).
 *   JUMP TO     — in-page nav, mobile only (the desktop rail is short enough).
 *
 * Colour discipline: cyan = Share/info/identity, orange = Ask/action, red = live.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { buildWeekJourney, programStatus } from "@/lib/experienceSpace/weekJourney";
import { Avatar } from "./Avatar";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const RED = "#ef4444";
const INK = "#0F2229";

/** Smooth-scroll to an in-page section WITHOUT putting a #hash in the URL
 *  (a lingering hash makes reload jump to that section instead of the top). */
function scrollToId(id: string) {
  if (typeof document !== "undefined") {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 8px 26px rgba(15,34,41,0.08)" }}
    >
      {/* ── PROFILE ── */}
      <div
        className="px-5 pt-5 pb-4"
        style={{ background: "linear-gradient(135deg, rgba(8,145,178,0.10), rgba(156,240,255,0.10) 70%, rgba(255,255,255,0))" }}
      >
        <div className="flex items-center gap-3">
          <Avatar src={viewer.avatar} name={viewer.name} size={58} ring={isCreator ? ORANGE : CYAN} />
          <div className="min-w-0">
            <p className="text-base font-black font-headline truncate" style={{ color: INK }}>{viewer.name}</p>
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>
              {isCreator ? "Expert" : "Member"}
            </p>
          </div>
        </div>
      </div>

      {/* ── MOMENTUM ── */}
      <Section label="Momentum">
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
              <span key={i} className="flex-1 rounded-full" style={{ height: 5, backgroundColor: done ? CYAN : current ? ORANGE : "rgba(15,34,41,0.08)" }} />
            );
          })}
        </div>

        {hero && (
          <a
            href={model.heroIsLive ? `/sessions/${hero.id}/live` : "#the-week"}
            onClick={(e) => { if (!model.heroIsLive) { e.preventDefault(); scrollToId("the-week"); } }}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-3.5"
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
      </Section>

      {/* ── ENGAGEMENT ── role-aware: a creator IS the expert, so "Ask your
          Experts" is nonsense for them — they only share (coach drops). */}
      <Section label="Engagement">
        <div className="space-y-2">
          <EngageBtn href="#tribe-composer" label="Share with your Tribe" color={CYAN} onClick={() => setComposeIntent("share")} />
          {!isCreator && (
            <EngageBtn href="#tribe-composer" label="Ask your Experts" color={ORANGE} onClick={() => setComposeIntent("question")} />
          )}
        </div>
      </Section>

      {/* ── JUMP TO (mobile only) ── */}
      <Section label="Jump to" mobileOnly>
        <div className="grid grid-cols-2 gap-2">
          <NavPill href="#the-week" label="The Week" />
          <NavPill href="#tribe" label="The Tribe" />
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children, mobileOnly }: { label: string; children: ReactNode; mobileOnly?: boolean }) {
  return (
    <div className={`px-5 py-4 ${mobileOnly ? "lg:hidden" : ""}`} style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: "#94a3b8", fontWeight: 800 }}>{label}</p>
      {children}
    </div>
  );
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); scrollToId(href.slice(1)); }}
      className="flex items-center justify-center gap-1 rounded-xl py-2.5 text-[12px] font-black font-headline"
      style={{ backgroundColor: "rgba(15,34,41,0.04)", color: "#475569" }}
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </a>
  );
}

function EngageBtn({ href, label, color, onClick }: { href: string; label: string; color: string; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); onClick?.(); scrollToId(href.slice(1)); }}
      className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-black font-headline transition-transform hover:scale-[1.01]"
      style={{ backgroundColor: `${color}14`, color, boxShadow: `inset 0 0 0 1.5px ${color}40` }}
    >
      {label}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}
