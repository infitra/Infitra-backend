"use client";

/**
 * ExperienceHeader — Bundle 5c (locker-room Ship 1.3). The establishing shot.
 *
 * Direction B — a branded editorial band that joins the page's visual language:
 * a brand-gradient wash echoing the wave (cyan → cream → orange), a bold title,
 * the cover blended in via a soft responsive mask, and the status woven in.
 *
 * Ship 1.3 polish: bigger creator avatars + balanced spacing; the status is
 * anchored (vertically centred on the right) on desktop and a clean balanced row
 * on mobile; the cover is constrained to the top zone so opening a panel doesn't
 * stretch it. Below: Meet your Experts + Structure.
 */

import Image from "next/image";
import { useState } from "react";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { programStatus } from "@/lib/experienceSpace/weekJourney";
import { usePresence } from "./usePresence";
import { Avatar } from "./Avatar";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const DARKCYAN = "#0e7490";
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
  const startStr = isNaN(startDate.getTime()) ? null : startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const hasStructure = !!experience.promiseText || experience.weeklyArc.length > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 relative"
      style={{
        backgroundColor: "#FFFFFF",
        backgroundImage:
          "linear-gradient(118deg, rgba(8,145,178,0.15) 0%, rgba(156,240,255,0.07) 26%, rgba(255,255,255,0) 52%, rgba(255,140,90,0.08) 78%, rgba(255,97,48,0.16) 100%)",
        boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 10px 32px rgba(15,34,41,0.10)",
      }}
    >
      <style>{`
        .exp-cover {
          -webkit-mask-image: linear-gradient(to bottom, #000 64%, transparent);
          mask-image: linear-gradient(to bottom, #000 64%, transparent);
        }
        @media (min-width: 1024px) {
          .exp-cover {
            -webkit-mask-image: linear-gradient(to right, #000 68%, transparent);
            mask-image: linear-gradient(to right, #000 68%, transparent);
          }
        }
      `}</style>

      {/* TOP ZONE — cover (constrained here) + identity + status + pills */}
      <div className="relative">
        <div className="exp-cover relative w-full aspect-[5/4] lg:absolute lg:left-0 lg:top-0 lg:bottom-0 lg:w-[360px] lg:aspect-auto" style={{ backgroundColor: "#ECE7DD" }}>
          {experience.imageUrl && (
            <Image
              src={experience.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="object-cover"
            />
          )}
        </div>

        <div className="relative lg:pl-[340px]">
          <div className="relative p-5 lg:p-7">
            {/* Identity */}
            <div className="lg:pr-64">
              <h1
                className="font-black font-headline tracking-tight leading-[1.04]"
                style={{ color: INK, fontSize: "clamp(1.7rem, 3.4vw, 2.5rem)", letterSpacing: "-0.025em" }}
              >
                {experience.title}
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {creators.map((c) => (
                    <Avatar key={c.id} src={c.avatar} name={c.name} size={30} ring={c.role === "owner" ? ORANGE : "#9CF0FF"} />
                  ))}
                </div>
                <span className="text-sm font-bold font-headline" style={{ color: "#475569" }}>
                  <span style={{ color: "#94a3b8" }}>with </span>
                  {creators.map((c) => c.name).join(" & ")}
                </span>
              </div>
            </div>

            {/* Status — balanced row on mobile, anchored centre-right on desktop */}
            <div className="mt-5 lg:mt-0 lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:right-7 lg:w-56 lg:text-right flex items-center justify-between lg:block">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: "#94a3b8", fontWeight: 800 }}>{statusLabel}</p>
                <p
                  className="font-black font-headline leading-none mt-0.5"
                  style={{ color: statusColor, fontSize: "clamp(1.5rem, 3.2vw, 2rem)", letterSpacing: "-0.02em" }}
                  suppressHydrationWarning
                >
                  {statusValue}
                </p>
                {status.phase === "upcoming" && startStr && (
                  <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }} suppressHydrationWarning>Week 1 begins {startStr}</p>
                )}
              </div>
              <div className="flex items-center gap-2 lg:justify-end lg:mt-3 shrink-0">
                {present.length > 0 && (
                  <div className="flex -space-x-2">
                    {present.slice(0, 3).map((u) => (
                      <div key={u.id} className="relative">
                        <Avatar src={u.avatar} name={u.name} size={26} ring="#FFFFFF" bg={CYAN} />
                        <span
                          className="absolute bottom-0 right-0 rounded-full animate-pulse"
                          style={{ width: 8, height: 8, backgroundColor: DARKCYAN, border: "2px solid #FFFFFF" }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <span className="text-[11px] uppercase tracking-[0.14em] font-headline" style={{ color: "#64748b", fontWeight: 800 }}>Active now</span>
                <span className="text-sm font-black font-headline" style={{ color: INK }}>{present.length}</span>
              </div>
            </div>

            {/* Expand toggles */}
            <div className="flex flex-wrap gap-2 mt-5 lg:mt-7 lg:pr-64">
              <Toggle label="Meet your Experts" active={open === "experts"} onClick={() => toggle("experts")} />
              {hasStructure && <Toggle label="Structure" active={open === "structure"} onClick={() => toggle("structure")} />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded panels — below the top zone, so the cover never stretches into them */}
      {open === "experts" && (
        <div className="px-5 lg:px-7 pb-5 pt-1 space-y-4">
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
        <div className="px-5 lg:px-7 pb-5 pt-1">
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
      style={{ backgroundColor: active ? "rgba(8,145,178,0.12)" : "rgba(255,255,255,0.7)", color: active ? CYAN : "#475569", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}
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
