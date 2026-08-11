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

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useBackdropClose } from "@/app/components/useBackdropClose";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { ExperienceHeader } from "./ExperienceHeader";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import { ReactivateCard, ContinueStrip } from "./ViewOnlyBanner";
import { Antechamber } from "./Antechamber";
import { ProfileModalHost } from "@/app/components/ProfileModal";
import { SpaceMaterialsProvider } from "./SpaceMaterials";
import type { MaterialRow } from "@/app/(app)/dashboard/collaborate/[challengeId]/SessionMaterials";
import { PrePulseCard } from "./PrePulseCard";
import { ReflectionCard, ReflectionForm } from "./ReflectionCard";
import { WeekJourney } from "./WeekJourney";
import { YouPanel, type CreatorContinuation } from "./YouPanel";
import { ProgressCard } from "./ProgressCard";
import { ReviewCard } from "./ReviewCard";
import { CollabReviewCard } from "./CollabReviewCard";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";
import type { CreatorStats } from "@/lib/experienceSpace/store";

type ReviewState = {
  open: boolean;
  hasExperienceReview: boolean;
  reviewedSubjectIds: string[];
};

export function ExperienceSpaceShell({
  seed,
  initialCreatorStats,
  materials,
  reviewState,
  continuation,
  reflectSessionId,
}: {
  seed: ExperienceSpaceSeed;
  initialCreatorStats?: CreatorStats | null;
  reviewState?: ReviewState;
  continuation?: CreatorContinuation | null;
  materials?: MaterialRow[];
  /** Leave→reflection loop: the live room's Leave button lands here with
   *  ?reflect=<sessionId>, and the reflection opens as a MODAL — one motion
   *  from leaving the room to "how was it?", not a card to be discovered. */
  reflectSessionId?: string | null;
}) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed, initialCreatorStats ?? null)}>
      <ProfileModalHost>
        <SpaceMaterialsProvider materials={materials ?? []}>
          <SpaceBody reviewState={reviewState} continuation={continuation} />
          <ReflectionLoopModal reflectSessionId={reflectSessionId ?? null} />
        </SpaceMaterialsProvider>
      </ProfileModalHost>
    </ExperienceSpaceStoreProvider>
  );
}

/**
 * The reflection asked IN the moment of leaving. State lives in the URL
 * (?reflect=), so realtime snapshot reconciles can remount anything below
 * without killing it — the same lesson every other modal here learned.
 * Dismissal strips the param via router.replace, so back/refresh don't
 * re-ask. Creators never see it (they END sessions, they don't reflect).
 *
 * Visuals: the ONE overlay grammar (DashboardOverlay's panel) — portal to
 * body, solid #FAF9F6 panel, white header with the orange tick + close.
 * The rail card's translucent gradient is canvas treatment; floated raw it
 * just bled the page through (founder screenshot, 11 Aug).
 */
function ReflectionLoopModal({ reflectSessionId }: { reflectSessionId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const close = () => router.replace(pathname, { scroll: false });
  const backdrop = useBackdropClose(close);

  const session = reflectSessionId ? sessions.find((s) => s.id === reflectSessionId) : undefined;
  if (!session || isCreator || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,34,41,0.45)" }}
      {...backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={`Reflect on ${session.title}`}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "#FAF9F6",
          maxHeight: "min(86vh, 760px)",
          boxShadow: "0 24px 60px rgba(15,34,41,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(15,34,41,0.08)", backgroundColor: "#FFFFFF" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "#FF6130" }} />
              <h2
                className="text-lg font-headline font-black tracking-tight truncate"
                style={{ color: "#0F2229", letterSpacing: "-0.02em" }}
              >
                How was it?
              </h2>
            </div>
            <p className="text-[12px] mt-1 ml-[14px]" style={{ color: "#64748b" }}>
              {session.title}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(15,34,41,0.06)] shrink-0"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <ReflectionForm sessionId={session.id} onDone={close} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SpaceBody({ reviewState, continuation }: { reviewState?: ReviewState; continuation?: CreatorContinuation | null }) {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const spaceId = useExperienceSpaceStore((s) => s.spaceId);
  const viewer = useExperienceSpaceStore((s) => s.viewer);
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const isMember = useExperienceSpaceStore((s) => s.isMember);
  const canPost = useExperienceSpaceStore((s) => s.canPost);
  const viewerState = useExperienceSpaceStore((s) => s.viewerState);
  const viewerRunStart = useExperienceSpaceStore((s) => s.viewerRunStart);
  const joinableRuns = useExperienceSpaceStore((s) => s.joinableRuns);
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
  // The server only emits the intro action when the viewer can post in the
  // ACTIVE run (can_post) and isn't a creator — so a future-run buyer isn't
  // prompted until their chapter goes live (case 3). Presence is the gate.
  const showIntro = !!introAction;
  // Engagement check-ins (Bundle 6/7) — server-gated to sessions the viewer
  // attends, so no extra membership check needed here.
  const pulseActions = actionItems.filter((a) => a.kind === "pre_pulse" && a.sessionId);
  const reflectionActions = actionItems.filter((a) => a.kind === "reflection" && a.sessionId);
  // H3c review prompts — gated post-experience (experience_review_open).
  const reviewOpen = !!reviewState?.open;
  const reviewedSubjectIds = reviewState?.reviewedSubjectIds ?? [];
  const showExperienceReview =
    reviewOpen && isMember && !isCreator && !reviewState?.hasExperienceReview;
  const coHostsToReview =
    reviewOpen && isCreator
      ? creators.filter(
          (c) => c.id !== viewer.id && !reviewedSubjectIds.includes(c.id),
        )
      : [];
  const degraded = channelStatus === "reconnecting" || channelStatus === "error";
  // Threshold viewers don't get the normal room. UPCOMING → a focused antechamber
  // (nothing of the current cohort). ENDED → the live room strongly frosted +
  // inert behind a centered re-activate card. ACTIVE member with a future run →
  // a subtle "continue" nudge (below, inside the room).
  const futureRun = joinableRuns.find((r) => !r.isActive) ?? null;

  // Upcoming: a future-run buyer while a prior run is still live. Focused wait.
  if (viewerState === "upcoming") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Antechamber experience={experience} runStart={viewerRunStart} creators={creators} />
      </div>
    );
  }

  // Ended: this viewer's run wrapped and the lineage moved on. The live room is
  // rendered strongly frosted + non-interactive as a backdrop; a centered
  // re-activate card owns the screen so it's unmistakable you're outside this
  // run — it keeps going without you unless you rejoin.
  if (viewerState === "ended") {
    return (
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-[80vh]">
        <div className="opacity-[0.28] blur-[3px] pointer-events-none select-none" aria-hidden="true">
          <ExperienceHeader />
          <div className="mt-6 space-y-6">
            <WeekJourney />
            <TribeFeed spaceId={spaceId} viewer={viewer} canPost={false} creators={creators} />
          </div>
        </div>
        <div className="absolute inset-0 z-10 flex items-start justify-center px-4 pt-[6vh] sm:pt-[9vh] pointer-events-none">
          <ReactivateCard experience={experience} joinableRuns={joinableRuns} creators={creators} sessionCount={sessions.length} />
        </div>
      </div>
    );
  }

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

      {/* ── ACTIVE member with a published future run: subtle continue nudge ── */}
      {viewerState === "active" && futureRun && (
        <div className="mb-6">
          <ContinueStrip run={futureRun} />
        </div>
      )}

      {/* ── MOBILE: personal hub + progress up top ── */}
      <div className="lg:hidden mb-6 space-y-4">
        <YouPanel continuation={continuation} />
        <ProgressCard />
      </div>

      {/* ── LOCKER ROOM: sticky hub rail + main content ── */}
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-24">
          <YouPanel continuation={continuation} />
          <ProgressCard />
        </aside>

        <main className="space-y-6 min-w-0">
          {(showIntro || pulseActions.length > 0 || reflectionActions.length > 0 || showExperienceReview || coHostsToReview.length > 0) && (
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
              {showExperienceReview && (
                <ReviewCard challengeId={experience.id} experienceTitle={experience.title} />
              )}
              {coHostsToReview.length > 0 && (
                <CollabReviewCard
                  challengeId={experience.id}
                  experienceTitle={experience.title}
                  coHosts={coHostsToReview.map((c) => ({ id: c.id, name: c.name }))}
                />
              )}
              {showIntro && (
                <IntroActionCard spaceId={spaceId} prompt={introAction!.introPrompt ?? "Introduce yourself to the Tribe."} />
              )}
            </div>
          )}
          <div className="space-y-6">
            <WeekJourney />
            <div id="tribe" className="scroll-mt-24">
              <TribeFeed spaceId={spaceId} viewer={viewer} canPost={canPost} creators={creators} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
