"use client";

/**
 * ExperienceHeader — Bundle 5c (locker-room Ship 1.1).
 *
 * Three intentional zones that fill the width instead of smearing sparse info
 * across a bar:
 *   COVER     — the experience image (a left panel on desktop, a banner on mobile).
 *   IDENTITY  — title + creators (the anchor).
 *   STATUS    — a right-hand panel grouping the countdown + live "Active now",
 *               so the right side has purpose (no dead space).
 * Below: the on-demand expandables — Meet your Experts + Structure.
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

  const statusLabel = status.phase === "upcoming" ? "Starts in" : status.phase === "complete" ? "Wrapped" : "You're in";
  const statusValue =
    status.phase === "upcoming"
      ? `${status.startsInDays} ${status.startsInDays === 1 ? "day" : "days"}`
      : status.phase === "complete"
        ? "Completed"
        : `Week ${currentWeek} of ${totalWeeks}`;
  const statusColor = status.phase === "upcoming" ? ORANGE : status.phase === "complete" ? CYAN : INK;
  const startDate = new Date(experience.startDate + "T00:00:00");
  const startStr = isNaN(startDate.getTime()) ? null : startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const hasStructure = !!experience.promiseText || experience.weeklyArc.length > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)" }}
    >
      {/* Three zones */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Cover */}
        <div className="relative w-full lg:w-56 shrink-0 aspect-[16/7] lg:aspect-auto" style={{ backgroundColor: "#ECE7DD" }}>
          {experience.imageUrl && (
            <Image
              src={experience.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 224px"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="object-cover"
            />
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0 p-5 flex flex-col justify-center">
          <h1
            className="font-black font-headline tracking-tight leading-[1.1]"
            style={{ color: INK, fontSize: "clamp(1.25rem, 2.6vw, 1.8rem)", letterSpacing: "-0.02em" }}
          >
            {experience.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex -space-x-1.5">
              {creators.map((c) => (
                <Avatar key={c.id} src={c.avatar} name={c.name} size={22} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
              ))}
            </div>
            <span className="text-[13px] sm:text-sm font-bold font-headline" style={{ color: "#475569" }}>
              <span style={{ color: "#94a3b8" }}>with </span>
              {creators.map((c) => c.name).join(" & ")}
            </span>
          </div>
        </div>

        {/* Status panel */}
        <div
          className="shrink-0 lg:w-64 p-5 flex flex-col justify-center gap-4"
          style={{ borderTop: "1px solid rgba(15,34,41,0.06)", backgroundColor: "#FCFAF6" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: "#94a3b8", fontWeight: 800 }}>{statusLabel}</p>
            <p
              className="font-black font-headline leading-none mt-0.5"
              style={{ color: statusColor, fontSize: "clamp(1.4rem, 3.4vw, 1.9rem)", letterSpacing: "-0.02em" }}
              suppressHydrationWarning
            >
              {statusValue}
            </p>
            {status.phase === "upcoming" && startStr && (
              <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }} suppressHydrationWarning>Week 1 begins {startStr}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {present.length > 0 && (
              <div className="flex -space-x-2">
                {present.slice(0, 4).map((u) => (
                  <Avatar key={u.id} src={u.avatar} name={u.name} size={24} ring="#FCFAF6" />
                ))}
              </div>
            )}
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GREEN }} />
            <span className="text-[11px] uppercase tracking-[0.14em] font-headline" style={{ color: "#94a3b8", fontWeight: 800 }}>Active now</span>
            <span className="text-sm font-black font-headline ml-auto" style={{ color: INK }}>{present.length}</span>
          </div>
        </div>
      </div>

      {/* Expand toggles */}
      <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <Toggle label="Meet your Experts" active={open === "experts"} onClick={() => toggle("experts")} />
        {hasStructure && <Toggle label="Structure" active={open === "structure"} onClick={() => toggle("structure")} />}
      </div>

      {open === "experts" && (
        <div className="px-5 pb-5 pt-1 space-y-4">
          {creators.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar src={c.avatar} name={c.name} size={44} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
              <div className="min-w-0">
                <p className="text-sm font-black font-headline" style={{ color: INK }}>
                  {c.name}
                  <span className="ml-2 text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{c.role === "owner" ? "Lead" : "Co-host"}</span>
                </p>
                {c.tagline && <p className="text-[12px] font-bold font-headline mt-0.5" style={{ color: CYAN }}>{c.tagline}</p>}
                {c.bio && <p className="text-[13px] leading-relaxed mt-1" style={{ color: "#475569" }}>{c.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {open === "structure" && (
        <div className="px-5 pb-5 pt-1">
          {experience.promiseText && (
            <p className="text-[14px] leading-relaxed" style={{ color: "#334155" }}>{experience.promiseText}</p>
          )}
          {experience.weeklyArc.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {experience.weeklyArc.map((w) => (
                <div key={w.week} className="flex gap-3 text-[13px]">
                  <span className="font-black font-headline shrink-0 w-14" style={{ color: w.week === currentWeek ? ORANGE : "#94a3b8" }}>Wk {w.week}</span>
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
      style={{ backgroundColor: active ? "rgba(8,145,178,0.10)" : "rgba(15,34,41,0.04)", color: active ? CYAN : "#475569" }}
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
