"use client";

/**
 * YouPanel — your console in the locker room, role-aware.
 *
 * PARTICIPANT:
 *   PROFILE     — avatar + name + role.
 *   MOMENTUM    — where you are (countdown / week) + progress bar + next moment.
 *   ENGAGEMENT  — Share with your Tribe / Ask your Experts.
 *
 * CREATOR (Expert) — a command center, not a journey tracker:
 *   PROFILE     — avatar + name + Expert.
 *   COHORT      — program status + tribe size + next session you host.
 *   NEEDS YOU   — directed questions waiting on you (the action), reflections
 *                 to read. Numbers from load_experience_creator_stats.
 *   ENGAGEMENT  — Share with your Tribe (coach drop). No "Ask" — they ARE the expert.
 *
 * Colour discipline: cyan = Share/info/identity, orange = Ask/action/attention,
 * red = live.
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
  const memberCount = useExperienceSpaceStore((s) => s.memberCount);
  const setComposeIntent = useExperienceSpaceStore((s) => s.setComposeIntent);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Creator-only at-a-glance numbers — server-seeded on first paint and
  // refreshed live by the Shell (off the feed's existing realtime channel).
  // Just read it here; no client fetch in the panel.
  const stats = useExperienceSpaceStore((s) => s.ui.creatorStats);

  const model = buildWeekJourney(experience, programState, sessions, now);
  const status = programStatus(experience, now);
  const totalWeeks = model.totalWeeks;
  const currentWeek = model.currentWeek;
  const weeksCompleted = programState?.weeksCompleted ?? 0;
  const hero = model.heroSessionId ? sessions.find((s) => s.id === model.heroSessionId) ?? null : null;

  const statusLine =
    status.phase === "upcoming"
      ? `Starts in ${status.startsInDays}d`
      : status.phase === "complete"
        ? `Completed · ${totalWeeks} weeks`
        : `Week ${currentWeek} of ${totalWeeks}`;

  const heroHref = model.heroIsLive
    ? isCreator
      ? `/dashboard/sessions/${hero?.id}/live`
      : `/sessions/${hero?.id}/live`
    : "#the-week";

  const HeroMoment = hero ? (
    <a
      href={heroHref}
      onClick={(e) => { if (!model.heroIsLive) { e.preventDefault(); scrollToId("the-week"); } }}
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-3.5"
      style={{ backgroundColor: model.heroIsLive ? "rgba(239,68,68,0.08)" : "#FAF7F1" }}
    >
      {model.heroIsLive && <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: RED }} />}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: model.heroIsLive ? RED : CYAN, fontWeight: 800 }}>
          {model.heroIsLive ? "Live now" : isCreator ? "You host next" : "Next moment"}
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
  ) : null;

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

      {isCreator ? (
        <>
          {/* ── TRIBE ── members in a card (matching the other blocks), program
              timing as quiet context, then the session you host. */}
          <Section label="Tribe">
            <div className="rounded-xl px-3.5 py-3" style={{ backgroundColor: "#FAF7F1" }}>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-headline leading-none" style={{ color: INK }}>{memberCount}</span>
                <span className="text-[12px] uppercase tracking-wider font-headline" style={{ color: "#94a3b8", fontWeight: 800 }}>
                  {memberCount === 1 ? "Member" : "Members"}
                </span>
              </div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-headline mt-1.5" style={{ color: "#94a3b8", fontWeight: 700 }}>
                {statusLine}
              </p>
            </div>
            {HeroMoment}
          </Section>

          {/* ── NEEDS YOU ── */}
          <Section label="Needs you">
            {stats && stats.pending > 0 ? (
              <a
                href="#tribe"
                onClick={(e) => { e.preventDefault(); scrollToId("tribe"); }}
                className="flex items-center gap-2 rounded-xl px-3.5 py-3 transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: "rgba(255,97,48,0.10)", boxShadow: `inset 0 0 0 1.5px ${ORANGE}40` }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>Waiting on you</p>
                  <p className="text-[15px] font-black font-headline" style={{ color: ORANGE }}>
                    {stats.pending} {stats.pending === 1 ? "question" : "questions"}
                  </p>
                </div>
                <span className="text-[11px] font-black font-headline shrink-0" style={{ color: ORANGE }}>Answer</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            ) : (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-3" style={{ backgroundColor: "rgba(8,145,178,0.07)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span className="text-[12px] font-bold font-headline" style={{ color: "#475569" }}>
                  {stats ? "All questions answered" : "Checking your tribe…"}
                </span>
              </div>
            )}

            {stats && stats.reflections > 0 && (
              <a
                href="#tribe"
                onClick={(e) => { e.preventDefault(); scrollToId("tribe"); }}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mt-2 transition-transform hover:scale-[1.01]"
                style={{ backgroundColor: "rgba(8,145,178,0.08)", boxShadow: `inset 0 0 0 1.5px ${CYAN}33` }}
              >
                <span className="text-[12px] font-black font-headline flex-1" style={{ color: CYAN }}>
                  {stats.reflections} new {stats.reflections === 1 ? "reflection" : "reflections"} to read
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            )}
          </Section>

          {/* ── ENGAGEMENT ── creators only share (they ARE the experts). */}
          <Section label="Engagement">
            <EngageBtn href="#tribe-composer" label="Share with your Tribe" color={CYAN} onClick={() => setComposeIntent("share")} />
          </Section>
        </>
      ) : (
        <>
          {/* ── MOMENTUM ── */}
          <Section label="Momentum">
            <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: status.phase === "upcoming" ? CYAN : INK, fontWeight: 800 }}>
              {statusLine}
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
            {HeroMoment}
          </Section>

          {/* ── ENGAGEMENT ── */}
          <Section label="Engagement">
            <div className="space-y-2">
              <EngageBtn href="#tribe-composer" label="Share with your Tribe" color={CYAN} onClick={() => setComposeIntent("share")} />
              <EngageBtn href="#tribe-composer" label="Ask your Experts" color={ORANGE} onClick={() => setComposeIntent("question")} />
            </div>
          </Section>

          {/* ── YOUR CALENDAR ── one-tap .ics of this experience's sessions. */}
          <Section label="Your calendar">
            <a
              href={`/experiences/${experience.id}/calendar`}
              download
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-black font-headline transition-transform hover:scale-[1.01]"
              style={{ backgroundColor: `${CYAN}14`, color: CYAN, boxShadow: `inset 0 0 0 1.5px ${CYAN}40` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              Add sessions to calendar
            </a>
          </Section>
        </>
      )}

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
