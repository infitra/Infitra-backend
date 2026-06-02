"use client";

/**
 * ExperienceSpaceShell — Bundle 5c.
 *
 * The participant locker room. Provider on the outside; an inner <SpaceBody>
 * (inside the provider) runs the realtime subscription and reads the store.
 * Layout: hero (current week) → action bar (intro) → next moment + Tribe feed
 * → tribe members + past moments. The full program sits behind "view program ▾".
 */

import { useMemo, useState } from "react";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { TribeFeed } from "./TribeFeed";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

export function ExperienceSpaceShell({ seed }: { seed: ExperienceSpaceSeed }) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed)}>
      <SpaceBody />
    </ExperienceSpaceStoreProvider>
  );
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function countdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const m = Math.floor(ms / 60000);
  if (m < 0) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
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
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold font-headline flex items-center gap-2"
          style={{ backgroundColor: "rgba(15,34,41,0.92)", color: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}
        >
          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#FFB020" }} />
          Reconnecting…
        </div>
      )}

      {/* ── HERO: current week + experience + creators ── */}
      <div className="rounded-3xl p-6 sm:p-8 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(15,34,41,0.07)" }}>
        {programState && (
          <p className="text-[11px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: "#0891b2", fontWeight: 800 }}>
            Week {programState.currentWeek} of {programState.totalWeeks}
            {programState.currentWeekTheme ? ` · ${programState.currentWeekTheme}` : ""}
          </p>
        )}
        <h1 className="font-black font-headline tracking-tight leading-tight" style={{ color: "#0F2229", fontSize: "clamp(1.6rem,4.5vw,2.4rem)", letterSpacing: "-0.02em" }}>
          {experience.title}
        </h1>

        <div className="flex items-center gap-4 flex-wrap mt-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {creators.map((c) =>
                c.avatar ? (
                  <img key={c.id} src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid #fff" }} />
                ) : (
                  <div key={c.id} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: c.role === "owner" ? "#FF6130" : "#0891b2", border: "2px solid #fff" }}>
                    {c.name[0]}
                  </div>
                ),
              )}
            </div>
            <span className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>
              {creators.map((c) => c.name).join(" · ")}
            </span>
          </div>
          <div className="h-5 w-px" style={{ backgroundColor: "rgba(15,34,41,0.1)" }} />
          <span className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>
            {memberCount} <span className="font-normal text-xs" style={{ color: "#64748b" }}>in the tribe</span>
          </span>
          <button
            onClick={() => setProgramOpen((v) => !v)}
            className="ml-auto text-xs font-bold font-headline px-3 py-1.5 rounded-full transition-colors"
            style={{ color: "#0891b2", border: "1px solid rgba(8,145,178,0.3)" }}
          >
            {programOpen ? "Hide program ▴" : "View program ▾"}
          </button>
        </div>

        {/* Program expander */}
        {programOpen && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }}>
            {experience.promiseText && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#334155" }}>{experience.promiseText}</p>
            )}
            {experience.weeklyArc.length > 0 && (
              <div className="space-y-1.5">
                {experience.weeklyArc.map((w) => (
                  <div key={w.week} className="flex gap-3 text-sm">
                    <span className="font-black font-headline shrink-0 w-16" style={{ color: programState && w.week === programState.currentWeek ? "#FF6130" : "#94a3b8" }}>
                      Week {w.week}
                    </span>
                    <span style={{ color: "#334155" }}>{w.theme}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ACTION BAR: intro ── */}
      {introAction && isMember && (
        <div className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "rgba(255,97,48,0.06)", border: "1px solid rgba(255,97,48,0.25)" }}>
          <p className="text-[11px] uppercase tracking-widest font-headline mb-1" style={{ color: "#FF6130", fontWeight: 800 }}>Your move</p>
          <p className="text-sm font-bold font-headline mb-3" style={{ color: "#0F2229" }}>
            {introAction.introPrompt ?? "Introduce yourself to the Tribe."}
          </p>
          {/* Submission wired with the kind-aware TribeFeed (intro post). */}
          <p className="text-xs" style={{ color: "#94a3b8" }}>Post your intro in the Tribe feed below.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* MAIN: next moment + tribe feed */}
        <div className="lg:col-span-2 space-y-5">
          {/* Next moment */}
          {hot && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: liveSession ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.7)", border: `1px solid ${liveSession ? "rgba(239,68,68,0.3)" : "rgba(15,34,41,0.07)"}` }}>
              <p className="text-[11px] uppercase tracking-widest font-headline mb-2" style={{ color: liveSession ? "#ef4444" : "#0891b2", fontWeight: 800 }}>
                {liveSession ? "● Live now" : "Next moment"}
              </p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-lg font-black font-headline" style={{ color: "#0F2229" }}>{hot.title}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{fmtDay(hot.startTime)} · {fmtTime(hot.startTime)} · {hot.durationMinutes} min · {hot.hostName}</p>
                </div>
                {liveSession ? (
                  <a href={`/sessions/${hot.id}/live`} className="px-5 py-2.5 rounded-full text-white text-sm font-black font-headline shrink-0" style={{ backgroundColor: "#ef4444", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}>
                    Join →
                  </a>
                ) : (
                  <span className="text-2xl font-black font-headline" style={{ color: "#FF6130" }}>{countdown(hot.startTime)}</span>
                )}
              </div>
            </div>
          )}

          {/* Tribe feed */}
          <div>
            <p className="text-[11px] uppercase tracking-widest font-headline mb-3 flex items-center gap-2" style={{ color: "#475569", fontWeight: 800 }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF6130" }} /> Tribe
            </p>
            <TribeFeed
              spaceId={spaceId}
              currentUserId={currentUserId}
              canPost={isMember || isCreator}
              isCreator={isCreator}
              introPrompt={introAction?.introPrompt ?? experience.introPrompt}
              hasPostedIntro={!introAction}
            />
          </div>
        </div>

        {/* SIDEBAR: tribe members + past moments */}
        <div className="space-y-5">
          <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(15,34,41,0.07)" }}>
            <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#0891b2", fontWeight: 800 }}>Your tribe · {memberCount}</p>
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 py-1 px-2 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
                    {m.avatar ? (
                      <img src={m.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: "#0891b2" }}>{m.name[0]}</div>
                    )}
                    <span className="text-[11px] font-bold font-headline" style={{ color: "#0F2229" }}>{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#94a3b8" }}>The tribe will gather here.</p>
            )}
          </div>

          {pastSessions.length > 0 && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(15,34,41,0.07)" }}>
              <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#475569", fontWeight: 800 }}>Past moments</p>
              <div className="space-y-2">
                {pastSessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span style={{ color: "#94a3b8" }}>✓</span>
                    <span className="font-bold font-headline truncate" style={{ color: "#0F2229" }}>{s.title}</span>
                    <span className="text-[11px] ml-auto shrink-0" style={{ color: "#94a3b8" }}>{fmtDay(s.startTime)}</span>
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
