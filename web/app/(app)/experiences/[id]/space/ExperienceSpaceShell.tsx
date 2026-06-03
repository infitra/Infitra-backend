"use client";

/**
 * ExperienceSpaceShell — Bundle 5c (locker-room v3).
 *
 * Reframed from a buyer-page replica into "inside the experience":
 *
 *   MASTHEAD — a slim context strip (cover thumb + title + creators + status),
 *   not a marketing hero. It orients, it doesn't sell.
 *
 *   YOUR HUB — the personal command center (where you are, your next moment,
 *   in-page navigation, the one action that matters). Desktop sticky rail / top
 *   on mobile.
 *
 *   THE WEEK → THE TRIBE — the content, in the main column.
 *
 *   PEOPLE — one combined Experts + Tribe card (the single home for "who"), so
 *   no fact repeats across zones.
 */

import Image from "next/image";
import { useMemo } from "react";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { programStatus } from "@/lib/experienceSpace/weekJourney";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import { WeekJourney } from "./WeekJourney";
import { YouPanel } from "./YouPanel";
import { Avatar } from "./Avatar";
import type { ExperienceSummary, ProgramState, SpaceCreator, TribeMember } from "@/lib/experienceSpace/store";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const CARD = {
  backgroundColor: "#FFFFFF",
  boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)",
} as const;

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
  const programState = useExperienceSpaceStore((s) => s.programState);
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

      {/* ── MASTHEAD — slim context strip ── */}
      <Masthead experience={experience} programState={programState} creators={creators} />

      {/* ── MOBILE: personal hub up top ── */}
      <div className="lg:hidden mb-6">
        <YouPanel />
      </div>

      {/* ── LOCKER ROOM: sticky rail + main ── */}
      <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-24">
          <YouPanel />
          <PeopleCard creators={creators} members={members} memberCount={memberCount} />
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

      {/* ── MOBILE: People at the bottom ── */}
      <div className="lg:hidden mt-6">
        <PeopleCard creators={creators} members={members} memberCount={memberCount} />
      </div>
    </div>
  );
}

function Masthead({
  experience,
  programState,
  creators,
}: {
  experience: ExperienceSummary;
  programState: ProgramState | null;
  creators: SpaceCreator[];
}) {
  const status = programStatus(experience);
  const totalWeeks = programState?.totalWeeks ?? experience.weeklyArc.length ?? 0;
  const currentWeek = programState?.currentWeek ?? 1;
  const chip =
    status.phase === "upcoming"
      ? { label: `Starts in ${status.startsInDays}d`, color: ORANGE }
      : status.phase === "complete"
        ? { label: "Completed", color: CYAN }
        : { label: `Week ${currentWeek} of ${totalWeeks}`, color: CYAN };

  return (
    <div className="rounded-2xl overflow-hidden flex items-stretch mb-6" style={CARD}>
      <div className="relative shrink-0 w-28 sm:w-44" style={{ backgroundColor: "#ECE7DD" }}>
        {experience.imageUrl && (
          <Image
            src={experience.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 112px, 176px"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-center">
        <h1
          className="font-black font-headline tracking-tight leading-[1.1]"
          style={{ color: "#0F2229", fontSize: "clamp(1.15rem, 3.4vw, 1.7rem)", letterSpacing: "-0.02em" }}
        >
          {experience.title}
        </h1>
        <div className="flex items-center gap-x-2.5 gap-y-1.5 mt-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {creators.map((c) => (
                <Avatar key={c.id} src={c.avatar} name={c.name} size={22} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
              ))}
            </div>
            <span className="text-[12px] sm:text-sm font-bold font-headline" style={{ color: "#475569" }}>
              <span style={{ color: "#94a3b8" }}>with </span>
              {creators.map((c) => c.name).join(" & ")}
            </span>
          </div>
          <span
            className="text-[10px] uppercase tracking-wider font-headline px-2 py-0.5 rounded-full"
            style={{ color: chip.color, backgroundColor: `${chip.color}14`, fontWeight: 800 }}
          >
            {chip.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function PeopleCard({
  creators,
  members,
  memberCount,
}: {
  creators: SpaceCreator[];
  members: TribeMember[];
  memberCount: number;
}) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: ORANGE, fontWeight: 800 }}>
        Your Experts
      </p>
      <div className="space-y-3.5">
        {creators.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <Avatar src={c.avatar} name={c.name} size={38} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
            <div className="min-w-0">
              <p className="text-sm font-black font-headline truncate" style={{ color: "#0F2229" }}>{c.name}</p>
              {c.tagline && <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{c.tagline}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="h-px my-4" style={{ backgroundColor: "rgba(15,34,41,0.07)" }} aria-hidden />

      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: CYAN, fontWeight: 800 }}>
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
          {memberCount > 8 && <p className="text-[11px] pt-1" style={{ color: "#94a3b8" }}>+{memberCount - 8} more</p>}
        </div>
      ) : (
        <p className="text-xs" style={{ color: "#94a3b8" }}>The Tribe will gather here.</p>
      )}
    </div>
  );
}
