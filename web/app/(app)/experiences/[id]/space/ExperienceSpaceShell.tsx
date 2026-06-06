"use client";

/**
 * ExperienceSpaceShell — Bundle 5c (locker-room v4).
 *
 *   HEADER — slim, expandable context strip (Experts / Tribe / About on demand).
 *   YOUR HUB — the personal command center (desktop sticky rail / top on mobile).
 *   THE WEEK → THE TRIBE — the content, in the main column.
 *
 * Width matches the dashboard (max-w-7xl). Reference info ("who/what") lives in
 * the header's expandables, so there's no separate People card to misplace.
 */

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { ExperienceHeader } from "./ExperienceHeader";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import { PrePulseCard } from "./PrePulseCard";
import { ReflectionCard } from "./ReflectionCard";
import { WeekJourney } from "./WeekJourney";
import { YouPanel } from "./YouPanel";
import { ProgressCard } from "./ProgressCard";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";
import type { CreatorStats } from "@/lib/experienceSpace/store";

export function ExperienceSpaceShell({
  seed,
  initialCreatorStats,
}: {
  seed: ExperienceSpaceSeed;
  initialCreatorStats?: CreatorStats | null;
}) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed, initialCreatorStats ?? null)}>
      <SpaceBody />
    </ExperienceSpaceStoreProvider>
  );
}

function SpaceBody() {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const spaceId = useExperienceSpaceStore((s) => s.spaceId);
  const viewer = useExperienceSpaceStore((s) => s.viewer);
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const isMember = useExperienceSpaceStore((s) => s.isMember);
  const creators = useExperienceSpaceStore((s) => s.creators);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const actionItems = useExperienceSpaceStore((s) => s.actionItems);
  const channelStatus = useExperienceSpaceStore((s) => s.ui.channelStatus);

  useExperienceSpaceRealtime({
    challengeId: experience.id,
    spaceId,
    knownSessionIds: useMemo(() => sessions.map((s) => s.id), [sessions]),
  });

  // Creator console numbers: server-seeded on first paint (ui.creatorStats),
  // then refreshed whenever the feed's EXISTING realtime channel ticks
  // feedActivity (a new question / comment). No second subscription — just one
  // cheap re-COUNT on real activity. Single fetch here so both YouPanel
  // instances (mobile + desktop rail) share it.
  const feedActivity = useExperienceSpaceStore((s) => s.ui.feedActivity);
  const hasSeededStats = useExperienceSpaceStore((s) => s.ui.creatorStats !== null);
  const setCreatorStats = useExperienceSpaceStore((s) => s.setCreatorStats);
  useEffect(() => {
    if (!isCreator) return;
    // First run with server-seeded numbers already present → don't re-query.
    if (feedActivity === 0 && hasSeededStats) return;
    let alive = true;
    const supabase = createClient();
    supabase
      .rpc("load_experience_creator_stats", { p_challenge_id: experience.id })
      .then(({ data }) => {
        const d = data as
          | { authorized?: boolean; pending_questions?: number; recent_reflections?: number }
          | null;
        if (alive && d?.authorized) {
          setCreatorStats({
            pending: d.pending_questions ?? 0,
            reflections: d.recent_reflections ?? 0,
          });
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedActivity, isCreator, experience.id, setCreatorStats]);

  // A lingering #hash (from an in-page jump) makes the browser scroll to that
  // section on reload. Strip it on mount and start at the top.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    }
  }, []);

  const introAction = actionItems.find((a) => a.kind === "intro");
  const showIntro = !!introAction && isMember;
  // Engagement check-ins (Bundle 6/7) — server-gated to sessions the viewer
  // attends, so no extra membership check needed here.
  const pulseActions = actionItems.filter((a) => a.kind === "pre_pulse" && a.sessionId);
  const reflectionActions = actionItems.filter((a) => a.kind === "reflection" && a.sessionId);
  const canPost = isMember || isCreator;
  const degraded = channelStatus === "reconnecting" || channelStatus === "error";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

      {/* ── HEADER — slim, expandable ── */}
      <ExperienceHeader />

      {/* ── MOBILE: personal hub + progress up top ── */}
      <div className="lg:hidden mb-6 space-y-4">
        <YouPanel />
        <ProgressCard />
      </div>

      {/* ── LOCKER ROOM: sticky hub rail + main content ── */}
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-24">
          <YouPanel />
          <ProgressCard />
        </aside>

        <main className="space-y-6 min-w-0">
          {(showIntro || pulseActions.length > 0 || reflectionActions.length > 0) && (
            <div id="your-move" className="scroll-mt-24 space-y-4">
              {/* Time-sensitive first: pulse (session imminent) → reflection
                  (just ended) → intro (ongoing onboarding). */}
              {pulseActions.map((a) => (
                <PrePulseCard
                  key={`pulse-${a.sessionId}`}
                  sessionId={a.sessionId as string}
                  sessionTitle={a.sessionTitle ?? "your next session"}
                  startTime={a.startTime}
                />
              ))}
              {reflectionActions.map((a) => (
                <ReflectionCard
                  key={`refl-${a.sessionId}`}
                  sessionId={a.sessionId as string}
                  sessionTitle={a.sessionTitle ?? "that session"}
                />
              ))}
              {showIntro && (
                <IntroActionCard spaceId={spaceId} prompt={introAction!.introPrompt ?? "Introduce yourself to the Tribe."} />
              )}
            </div>
          )}
          <WeekJourney />
          <div id="tribe" className="scroll-mt-24">
            <TribeFeed spaceId={spaceId} viewer={viewer} canPost={canPost} creators={creators} />
          </div>
        </main>
      </div>
    </div>
  );
}
