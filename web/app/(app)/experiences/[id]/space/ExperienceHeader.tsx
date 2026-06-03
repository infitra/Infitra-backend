"use client";

/**
 * ExperienceHeader — Bundle 5c (locker-room v5).
 *
 * Slim "you're inside this" strip + a prominent status (the countdown to
 * kickoff, or the current week) + a live "Active now" presence indicator, then
 * two on-demand expandables: Meet your Experts (profiles) and Structure (the
 * weekly arc + promise). Orientation, not a sales hero.
 */

import Image from "next/image";
import { useState } from "react";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { programStatus } from "@/lib/experienceSpace/weekJourney";
import { usePresence } from "./usePresence";
import { Avatar } from "./Avatar";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const GREEN = "#22c55e";
const INK = "#0F2229";

type Panel = "experts" | "structure";

export function ExperienceHeader() {
  const experience = useExperienceSpaceStore((s) => s.experience);
  const programState = useExperienceSpaceStore((s) => s.programState);
  const creators = useExperienceSpaceStore((s) => s.creators);
  const viewer = useExperienceSpaceStore((s) => s.viewer);
  const spaceId = useExperienceSpaceStore((s) => s.spaceId);

  const present = usePresence(spaceId, viewer);
  const [open, setOpen] = useState<Panel | null>(null);
  const toggle = (p: Panel) => setOpen((cur) => (cur === p ? null : p));

  const status = programStatus(experience);
  const totalWeeks = programState?.totalWeeks ?? experience.weeklyArc.length ?? 0;
  const currentWeek = programState?.currentWeek ?? 1;

  const statusLabel =
    status.phase === "upcoming" ? "Starts in" : status.phase === "complete" ? "Wrapped" : "You're in";
  const statusValue =
    status.phase === "upcoming"
      ? `${status.startsInDays} ${status.startsInDays === 1 ? "day" : "days"}`
      : status.phase === "complete"
        ? "Completed"
        : `Week ${currentWeek} of ${totalWeeks}`;
  const statusColor = status.phase === "upcoming" ? ORANGE : status.phase === "complete" ? CYAN : INK;
  const startDate = new Date(experience.startDate + "T00:00:00");
  const startStr = isNaN(startDate.getTime())
    ? null
    : startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const hasStructure = !!experience.promiseText || experience.weeklyArc.length > 0;

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
          <div className="flex items-center gap-1.5 mt-2">
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
        </div>
      </div>

      {/* Prominent status + live presence */}
      <div
        className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5"
        style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: "#94a3b8", fontWeight: 800 }}>
            {statusLabel}
          </p>
          <p
            className="font-black font-headline leading-none mt-0.5"
            style={{ color: statusColor, fontSize: "clamp(1.25rem, 4vw, 1.7rem)", letterSpacing: "-0.02em" }}
            suppressHydrationWarning
          >
            {statusValue}
          </p>
          {status.phase === "upcoming" && startStr && (
            <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }} suppressHydrationWarning>
              Week 1 begins {startStr}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {present.length > 0 && (
            <div className="flex -space-x-2">
              {present.slice(0, 4).map((u) => (
                <Avatar key={u.id} src={u.avatar} name={u.name} size={26} ring="#FFFFFF" />
              ))}
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] font-headline flex items-center gap-1 justify-end" style={{ color: "#94a3b8", fontWeight: 800 }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
              Active now
            </p>
            <p className="text-sm font-black font-headline" style={{ color: INK }}>{present.length}</p>
          </div>
        </div>
      </div>

      {/* Expand toggles */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-5 pb-4 pt-3" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <Toggle label="Meet your Experts" active={open === "experts"} onClick={() => toggle("experts")} />
        {hasStructure && <Toggle label="Structure" active={open === "structure"} onClick={() => toggle("structure")} />}
      </div>

      {/* Expanded panel */}
      {open === "experts" && (
        <div className="px-4 sm:px-5 pb-5 pt-1 space-y-4">
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

      {open === "structure" && (
        <div className="px-4 sm:px-5 pb-5 pt-1">
          {experience.promiseText && (
            <p className="text-[14px] leading-relaxed" style={{ color: "#334155" }}>{experience.promiseText}</p>
          )}
          {experience.weeklyArc.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {experience.weeklyArc.map((w) => (
                <div key={w.week} className="flex gap-3 text-[13px]">
                  <span className="font-black font-headline shrink-0 w-14" style={{ color: w.week === currentWeek ? ORANGE : "#94a3b8" }}>
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
