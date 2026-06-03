"use client";

/**
 * ExperienceSpaceShell — Bundle 5c (locker-room v2).
 *
 * One responsive locker room rather than a stack of cards:
 *
 *   COVER BAND (full width) — the experience identity (image, title, creators,
 *   Tribe presence).
 *
 *   DESKTOP (lg+): a sticky LEFT RAIL (you + experts + tribe) beside a MAIN
 *   column (your move → the week → the tribe feed) — a real "room", using the
 *   width instead of a narrow centred column.
 *
 *   MOBILE: everything stacks — cover → YOU → your move → the week → the feed.
 *   (Experts/Tribe live in the cover's facepile on mobile, so the rail cards
 *   are desktop-only.)
 */

import Image from "next/image";
import { useMemo } from "react";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import { WeekJourney } from "./WeekJourney";
import { YouPanel } from "./YouPanel";
import { Avatar } from "./Avatar";
import type { SpaceCreator, TribeMember } from "@/lib/experienceSpace/store";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

export function ExperienceSpaceShell({ seed }: { seed: ExperienceSpaceSeed }) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed)}>
      <SpaceBody />
    </ExperienceSpaceStoreProvider>
  );
}

const CARD = {
  backgroundColor: "#FFFFFF",
  boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)",
} as const;

function SpaceBody() {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const spaceId = useExperienceSpaceStore((s) => s.spaceId);
  const viewer = useExperienceSpaceStore((s) => s.viewer);
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);
  const isMember = useExperienceSpaceStore((s) => s.isMember);
  const creators = useExperienceSpaceStore((s) => s.creators);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const members = useExperienceSpaceStore((s) => s.members);
  const memberCount = useExperienceSpaceStore((s) => s.memberCount);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

      {/* ── COVER BAND — experience identity (full width) ── */}
      <div className="mb-6">
        <div
          className="rounded-3xl overflow-hidden relative aspect-[16/9] sm:aspect-[24/9]"
          style={{ backgroundColor: "#ECE7DD", boxShadow: "0 12px 40px rgba(15,34,41,0.14)" }}
        >
          {experience.imageUrl && (
            <Image
              src={experience.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="object-cover"
            />
          )}
        </div>

        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.2em] font-headline mb-2" style={{ color: "#0891b2", fontWeight: 800 }}>
            Experience space
          </p>
          <h1
            className="font-black font-headline tracking-tight leading-[1.05]"
            style={{ color: "#0F2229", fontSize: "clamp(1.7rem, 5vw, 2.6rem)", letterSpacing: "-0.025em" }}
          >
            {experience.title}
          </h1>
          {experience.promiseText && (
            <p className="text-[15px] sm:text-base leading-relaxed mt-3 max-w-2xl" style={{ color: "#475569" }}>
              {experience.promiseText}
            </p>
          )}
          <div className="flex items-center gap-x-4 gap-y-2 mt-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {creators.map((c) => (
                  <Avatar key={c.id} src={c.avatar} name={c.name} size={32} ring={c.role === "owner" ? "#FF6130" : "#9CF0FF"} />
                ))}
              </div>
              <span className="text-sm font-black font-headline" style={{ color: "#0F2229" }}>
                {creators.map((c) => c.name).join(" & ")}
              </span>
            </div>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "#cbd5e1" }} aria-hidden />
            <div className="flex items-center gap-2">
              {members.length > 0 && (
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((m) => (
                    <Avatar key={m.id} src={m.avatar} name={m.name} size={28} />
                  ))}
                </div>
              )}
              <span className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>
                {memberCount} <span className="font-normal" style={{ color: "#64748b" }}>in the Tribe</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE: personalized YOU header (rail is desktop-only) ── */}
      <div className="lg:hidden mb-6">
        <YouPanel />
      </div>

      {/* ── LOCKER ROOM: sticky rail + main ── */}
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-24">
          <YouPanel />
          <ExpertsCard creators={creators} />
          <TribeCard members={members} memberCount={memberCount} />
        </aside>

        <main className="space-y-6 min-w-0">
          {showIntro && (
            <div id="your-move" className="scroll-mt-24">
              <IntroActionCard spaceId={spaceId} prompt={introAction!.introPrompt ?? "Introduce yourself to the Tribe."} />
            </div>
          )}
          <WeekJourney />
          <TribeFeed spaceId={spaceId} viewer={viewer} canPost={canPost} creators={creators} />
        </main>
      </div>
    </div>
  );
}

function ExpertsCard({ creators }: { creators: SpaceCreator[] }) {
  if (creators.length === 0) return null;
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: "#FF6130", fontWeight: 800 }}>
        Your Experts
      </p>
      <div className="space-y-3.5">
        {creators.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <Avatar src={c.avatar} name={c.name} size={38} ring={c.role === "owner" ? "#FF6130" : "#9CF0FF"} />
            <div className="min-w-0">
              <p className="text-sm font-black font-headline truncate" style={{ color: "#0F2229" }}>{c.name}</p>
              {c.tagline && <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{c.tagline}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TribeCard({ members, memberCount }: { members: TribeMember[]; memberCount: number }) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: "#0891b2", fontWeight: 800 }}>
        The Tribe · {memberCount}
      </p>
      {members.length > 0 ? (
        <div className="space-y-2.5">
          {members.slice(0, 8).map((m) => (
            <div key={m.id} className="flex items-center gap-2.5">
              <Avatar src={m.avatar} name={m.name} size={28} />
              <span className="text-sm font-bold font-headline truncate" style={{ color: "#0F2229" }}>{m.name}</span>
            </div>
          ))}
          {memberCount > 8 && (
            <p className="text-[11px] pt-1" style={{ color: "#94a3b8" }}>+{memberCount - 8} more</p>
          )}
        </div>
      ) : (
        <p className="text-xs" style={{ color: "#94a3b8" }}>The Tribe will gather here.</p>
      )}
    </div>
  );
}
