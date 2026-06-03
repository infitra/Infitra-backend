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

import { useMemo } from "react";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { ExperienceHeader } from "./ExperienceHeader";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import { WeekJourney } from "./WeekJourney";
import { YouPanel } from "./YouPanel";
import { ProgressCard } from "./ProgressCard";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

export function ExperienceSpaceShell({ seed }: { seed: ExperienceSpaceSeed }) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed)}>
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

  const introAction = actionItems.find((a) => a.kind === "intro");
  const showIntro = !!introAction && isMember;
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
          {showIntro && (
            <div id="your-move" className="scroll-mt-24">
              <IntroActionCard spaceId={spaceId} prompt={introAction!.introPrompt ?? "Introduce yourself to the Tribe."} />
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
