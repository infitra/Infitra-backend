"use client";

/**
 * ExperienceSpaceShell — Bundle 5c (alive revision).
 *
 * The participant locker room. Cover-image hero (the Experience feels like an
 * experience, not a form), translucent cards so the brand wave shows through,
 * session imagery in Next Moment, real avatars for the Tribe + creators, and a
 * self-contained intro Action Bar card (no "scroll to the feed" disconnect).
 */

import Image from "next/image";
import { useMemo, useState } from "react";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

export function ExperienceSpaceShell({ seed }: { seed: ExperienceSpaceSeed }) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed)}>
      <SpaceBody />
    </ExperienceSpaceStoreProvider>
  );
}

const GLASS = { backgroundColor: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 2px 16px rgba(15,34,41,0.05)" } as const;

function fmtDay(iso: string) { return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const m = Math.floor(ms / 60000);
  if (m < 0) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Avatar({ src, name, size = 28, ring }: { src: string | null; name: string; size?: number; ring?: string }) {
  const style = { width: size, height: size, ...(ring ? { border: `2px solid ${ring}` } : {}) };
  return src ? (
    <img src={src} alt={name} className="rounded-full object-cover" style={style} />
  ) : (
    <div className="rounded-full flex items-center justify-center text-white font-black" style={{ ...style, backgroundColor: ring ?? "#0891b2", fontSize: size * 0.4 }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function SpaceBody() {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const spaceId = useExperienceSpaceStore((s) => s.spaceId);
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const isMember = useExperienceSpaceStore((s) => s.isMember);
  const currentUserId = useExperienceSpaceStore((s) => s.currentUserId);
  const programState = useExperienceSpaceStore((s) => s.programState);
  const creators = useExperienceSpaceStore((s) => s.creators);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const members = useExperienceSpaceStore((s) => s.members);
  const memberCount = useExperienceSpaceStore((s) => s.memberCount);
  const actionItems = useExperienceSpaceStore((s) => s.actionItems);
  const channelStatus = useExperienceSpaceStore((s) => s.ui.channelStatus);

  const [programOpen, setProgramOpen] = useState(false);

  useExperienceSpaceRealtime({
    challengeId: experience.id,
    spaceId,
    knownSessionIds: useMemo(() => sessions.map((s) => s.id), [sessions]),
  });

  const liveSession = sessions.find((s) => !!s.liveRoomId && s.status !== "ended");
  const nextSession = sessions.filter((s) => !s.liveRoomId && s.status !== "ended" && new Date(s.startTime) > new Date())[0];
  const hot = liveSession ?? nextSession;
  const pastSessions = sessions.filter((s) => s.status === "ended");
  const introAction = actionItems.find((a) => a.kind === "intro");
  const degraded = channelStatus === "reconnecting" || channelStatus === "error";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {degraded && (
        <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold font-headline flex items-center gap-2" style={{ backgroundColor: "rgba(15,34,41,0.92)", color: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#FFB020" }} />
          Reconnecting…
        </div>
      )}

      {/* ── HERO: cover image banner ── */}
      <div className="rounded-3xl overflow-hidden mb-5 relative" style={{ boxShadow: "0 10px 40px rgba(15,34,41,0.12)" }}>
        <div className="relative" style={{ aspectRatio: "16/7", backgroundColor: "#ECE7DD" }}>
          {experience.imageUrl && (
            <Image src={experience.imageUrl} alt="" fill sizes="(max-width:1024px) 100vw, 1100px" className="object-cover" priority />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,34,41,0.85) 0%, rgba(15,34,41,0.35) 45%, rgba(15,34,41,0.1) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            {programState && (
              <p className="text-[11px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: "#9CF0FF", fontWeight: 800 }}>
                Week {programState.currentWeek} of {programState.totalWeeks}
                {programState.currentWeekTheme ? ` · ${programState.currentWeekTheme}` : ""}
              </p>
            )}
            <h1 className="font-black font-headline tracking-tight leading-tight text-white" style={{ fontSize: "clamp(1.6rem,4.5vw,2.6rem)", letterSpacing: "-0.02em", textShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
              {experience.title}
            </h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex -space-x-2">
                {creators.map((c) => <Avatar key={c.id} src={c.avatar} name={c.name} size={34} ring={c.role === "owner" ? "#FF6130" : "#9CF0FF"} />)}
              </div>
              <span className="text-sm font-bold font-headline text-white">{creators.map((c) => c.name).join(" · ")}</span>
              <span className="text-xs text-white/70">·</span>
              <span className="text-sm font-bold font-headline text-white">{memberCount} <span className="font-normal text-white/70">in the tribe</span></span>
              <button onClick={() => setProgramOpen((v) => !v)} className="ml-auto text-xs font-bold font-headline px-3 py-1.5 rounded-full" style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}>
                {programOpen ? "Hide program ▴" : "View program ▾"}
              </button>
            </div>
          </div>
        </div>
        {programOpen && (
          <div className="p-5 sm:p-7" style={{ backgroundColor: "rgba(255,255,255,0.85)" }}>
            {experience.promiseText && <p className="text-sm leading-relaxed mb-4" style={{ color: "#334155" }}>{experience.promiseText}</p>}
            {experience.weeklyArc.length > 0 && (
              <div className="space-y-1.5">
                {experience.weeklyArc.map((w) => (
                  <div key={w.week} className="flex gap-3 text-sm">
                    <span className="font-black font-headline shrink-0 w-16" style={{ color: programState && w.week === programState.currentWeek ? "#FF6130" : "#94a3b8" }}>Week {w.week}</span>
                    <span style={{ color: "#334155" }}>{w.theme}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── INTRO ACTION (self-contained) ── */}
      {introAction && isMember && (
        <IntroActionCard spaceId={spaceId} prompt={introAction.introPrompt ?? "Introduce yourself to the Tribe."} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* MAIN */}
        <div className="lg:col-span-2 space-y-5">
          {/* Next moment — with session image */}
          {hot && (
            <div className="rounded-2xl overflow-hidden" style={{ ...GLASS, ...(liveSession ? { border: "1px solid rgba(239,68,68,0.35)" } : {}) }}>
              <div className="flex items-stretch">
                <div className="relative shrink-0 w-28 sm:w-36" style={{ backgroundColor: "#ECE7DD" }}>
                  {hot.imageUrl && <Image src={hot.imageUrl} alt="" fill sizes="160px" className="object-cover" />}
                </div>
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                  <p className="text-[11px] uppercase tracking-widest font-headline mb-1.5" style={{ color: liveSession ? "#ef4444" : "#0891b2", fontWeight: 800 }}>
                    {liveSession ? "● Live now" : "Next moment"}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-black font-headline truncate" style={{ color: "#0F2229" }}>{hot.title}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{fmtDay(hot.startTime)} · {fmtTime(hot.startTime)} · {hot.durationMinutes} min · {hot.hostName}</p>
                    </div>
                    {liveSession ? (
                      <a href={`/sessions/${hot.id}/live`} className="px-5 py-2.5 rounded-full text-white text-sm font-black font-headline shrink-0" style={{ backgroundColor: "#ef4444", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}>Join →</a>
                    ) : (
                      <span className="text-2xl font-black font-headline shrink-0" style={{ color: "#FF6130" }}>{countdown(hot.startTime)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tribe feed */}
          <div>
            <p className="text-[11px] uppercase tracking-widest font-headline mb-3 flex items-center gap-2" style={{ color: "#475569", fontWeight: 800 }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#FF6130" }} /> Tribe
            </p>
            <TribeFeed spaceId={spaceId} currentUserId={currentUserId} canPost={isMember || isCreator} />
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={GLASS}>
            <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#0891b2", fontWeight: 800 }}>Your tribe · {memberCount}</p>
            {members.length > 0 ? (
              <div className="space-y-2.5">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar src={m.avatar} name={m.name} size={28} />
                    <span className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#94a3b8" }}>The tribe will gather here.</p>
            )}
          </div>

          {pastSessions.length > 0 && (
            <div className="rounded-2xl p-5" style={GLASS}>
              <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#475569", fontWeight: 800 }}>Past moments</p>
              <div className="space-y-2.5">
                {pastSessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: "#ECE7DD" }}>
                      {s.imageUrl && <Image src={s.imageUrl} alt="" fill sizes="40px" className="object-cover grayscale opacity-80" />}
                    </div>
                    <span className="text-sm font-bold font-headline truncate flex-1" style={{ color: "#0F2229" }}>{s.title}</span>
                    <span className="text-[11px] shrink-0" style={{ color: "#94a3b8" }}>{fmtDay(s.startTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
