"use client";

/**
 * ExperienceSpaceShell — Bundle 5c (4-zone editorial revision).
 *
 * The participant locker room, composed as a single editorial column with one
 * deliberate hierarchy instead of stacked cards on a background:
 *
 *   ① Cover band     — clean cover image, with the title + creators + Tribe
 *                       presence as an editorial text block BELOW the image.
 *   ② Your Move      — the bold intro directive (members who haven't introduced).
 *   ③ The Week       — THE centerpiece (WeekJourney): "WEEK 1 OF 6 · THEME",
 *                       progress rail, next moment elevated, the week as a journey.
 *                       Runs wider than the rest to carry the page.
 *   ④ Tribe feed     — the living conversation.
 */

import Image from "next/image";
import { useMemo } from "react";
import { ExperienceSpaceStoreProvider, useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { useExperienceSpaceRealtime } from "./useExperienceSpaceRealtime";
import { initFromSeed } from "./initState";
import { TribeFeed } from "./TribeFeed";
import { IntroActionCard } from "./IntroActionCard";
import { WeekJourney } from "./WeekJourney";
import type { ExperienceSpaceSeed } from "@/lib/experienceSpace/mapSnapshot";

export function ExperienceSpaceShell({ seed }: { seed: ExperienceSpaceSeed }) {
  return (
    <ExperienceSpaceStoreProvider initialState={initFromSeed(seed)}>
      <SpaceBody />
    </ExperienceSpaceStoreProvider>
  );
}

function Avatar({ src, name, size = 28, ring }: { src: string | null; name: string; size?: number; ring?: string }) {
  const style = { width: size, height: size, ...(ring ? { border: `2px solid ${ring}` } : { border: "2px solid #fff" }) };
  return src ? (
    <img src={src} alt={name} className="rounded-full object-cover" style={style} />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-black"
      style={{ ...style, backgroundColor: ring ?? "#0891b2", fontSize: size * 0.4 }}
    >
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
  const degraded = channelStatus === "reconnecting" || channelStatus === "error";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

      {/* ── ① COVER BAND — image clean, text below ── */}
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{ aspectRatio: "16 / 7", backgroundColor: "#ECE7DD", boxShadow: "0 12px 40px rgba(15,34,41,0.14)" }}
        >
          {experience.imageUrl && (
            <Image
              src={experience.imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="object-cover"
            />
          )}
        </div>

        <div className="mt-5 mb-7">
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
            <p className="text-[15px] sm:text-base leading-relaxed mt-3" style={{ color: "#475569" }}>
              {experience.promiseText}
            </p>
          )}

          {/* Identity + Tribe presence */}
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

      {/* ── ② YOUR MOVE — bold intro directive ── */}
      {introAction && isMember && (
        <div className="max-w-2xl mx-auto mb-7">
          <IntroActionCard spaceId={spaceId} prompt={introAction.introPrompt ?? "Introduce yourself to the Tribe."} />
        </div>
      )}

      {/* ── ③ THE WEEK — the carrying centerpiece (runs wider) ── */}
      <div className="mb-9">
        <WeekJourney />
      </div>

      {/* ── ④ TRIBE FEED — the living conversation ── */}
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline mb-3 flex items-center gap-2" style={{ color: "#475569", fontWeight: 800 }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#FF6130" }} />
          The Tribe
        </p>
        <TribeFeed spaceId={spaceId} currentUserId={currentUserId} canPost={isMember || isCreator} />
      </div>
    </div>
  );
}
