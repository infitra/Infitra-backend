"use client";

/**
 * ExperienceHeader — Bundle 5c (locker-room v4).
 *
 * A slim "you're inside this" context strip (cover thumb + title + creators +
 * status) that EXPANDS on demand: Meet your Experts (full profiles), The Tribe
 * (roster), About (the promise + weekly arc). This is the single home for the
 * "who / what" reference info — so it no longer dangles as a card at the bottom
 * of the page on mobile. Orientation, not a sales hero.
 */

import Image from "next/image";
import { useState } from "react";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { programStatus } from "@/lib/experienceSpace/weekJourney";
import { Avatar } from "./Avatar";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";

type Panel = "experts" | "tribe" | "about";

export function ExperienceHeader() {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const programState = useExperienceSpaceStore((s) => s.programState);
  const creators = useExperienceSpaceStore((s) => s.creators);
  const members = useExperienceSpaceStore((s) => s.members);
  const memberCount = useExperienceSpaceStore((s) => s.memberCount);

  const [open, setOpen] = useState<Panel | null>(null);
  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));

  const status = programStatus(experience);
  const totalWeeks = programState?.totalWeeks ?? experience.weeklyArc.length ?? 0;
  const currentWeek = programState?.currentWeek ?? 1;
  const chip =
    status.phase === "upcoming"
      ? `Starts in ${status.startsInDays}d`
      : status.phase === "complete"
        ? "Completed"
        : `Week ${currentWeek} of ${totalWeeks}`;

  const hasAbout = !!experience.promiseText || experience.weeklyArc.length > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)" }}
    >
      {/* Slim strip */}
      <div className="flex items-stretch">
        <div className="relative shrink-0 w-24 sm:w-40" style={{ backgroundColor: "#ECE7DD" }}>
          {experience.imageUrl && (
            <Image
              src={experience.imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 96px, 160px"
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
            style={{ color: INK, fontSize: "clamp(1.1rem, 3vw, 1.65rem)", letterSpacing: "-0.02em" }}
          >
            {experience.title}
          </h1>
          <div className="flex items-center gap-x-2.5 gap-y-1.5 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {creators.map((c) => (
                  <Avatar key={c.id} src={c.avatar} name={c.name} size={20} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
                ))}
              </div>
              <span className="text-[12px] sm:text-sm font-bold font-headline" style={{ color: "#475569" }}>
                <span style={{ color: "#94a3b8" }}>with </span>
                {creators.map((c) => c.name).join(" & ")}
              </span>
            </div>
            <span
              className="text-[10px] uppercase tracking-wider font-headline px-2 py-0.5 rounded-full"
              style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800 }}
            >
              {chip}
            </span>
          </div>
        </div>
      </div>

      {/* Expand toggles */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-5 pb-4 pt-3" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <Toggle label="Meet your Experts" active={open === "experts"} onClick={() => toggle("experts")} />
        <Toggle label={`The Tribe · ${memberCount}`} active={open === "tribe"} onClick={() => toggle("tribe")} />
        {hasAbout && <Toggle label="About" active={open === "about"} onClick={() => toggle("about")} />}
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="px-4 sm:px-5 pb-5 pt-1">
          {open === "experts" && (
            <div className="space-y-4">
              {creators.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar src={c.avatar} name={c.name} size={44} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
                  <div className="min-w-0">
                    <p className="text-sm font-black font-headline" style={{ color: INK }}>
                      {c.name}
                      <span className="ml-2 text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                        {c.role === "owner" ? "Lead" : "Co-host"}
                      </span>
                    </p>
                    {c.tagline && <p className="text-[12px] font-bold font-headline mt-0.5" style={{ color: CYAN }}>{c.tagline}</p>}
                    {c.bio && <p className="text-[13px] leading-relaxed mt-1" style={{ color: "#475569" }}>{c.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {open === "tribe" && (
            members.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar src={m.avatar} name={m.name} size={30} />
                    <span className="text-sm font-bold font-headline truncate" style={{ color: INK }}>{m.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "#94a3b8" }}>The Tribe will gather here.</p>
            )
          )}

          {open === "about" && (
            <div>
              {experience.promiseText && (
                <p className="text-[14px] leading-relaxed" style={{ color: "#334155" }}>{experience.promiseText}</p>
              )}
              {experience.weeklyArc.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {experience.weeklyArc.map((w) => (
                    <div key={w.week} className="flex gap-3 text-[13px]">
                      <span className="font-black font-headline shrink-0 w-14" style={{ color: w.week === currentWeek ? CYAN : "#94a3b8" }}>
                        Wk {w.week}
                      </span>
                      <span style={{ color: "#475569" }}>{w.theme}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-black font-headline transition-colors"
      style={{
        backgroundColor: active ? "rgba(8,145,178,0.10)" : "rgba(15,34,41,0.04)",
        color: active ? CYAN : "#475569",
      }}
    >
      {label}
      <svg
        width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke={active ? CYAN : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: active ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
