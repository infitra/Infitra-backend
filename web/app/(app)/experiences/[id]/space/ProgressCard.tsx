"use client";

/**
 * ProgressCard — Bundle 5c (locker-room v5). Your real progress in this
 * experience, connected under the hub.
 *
 * Pre-start there's nothing attended yet, so it shows a "get ready" state
 * (sessions ahead). Once the program is running it shows a real attendance ring
 * (attended past sessions / past sessions), what's still ahead, and how far
 * through the program you are. Data from vw_my_challenges_progress via the
 * store's `progress` slice (attended/completion fields are entitlement, not
 * turnout — we use attendance + upcoming + program-progress).
 */

import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { programStatus } from "@/lib/experienceSpace/weekJourney";

const CYAN = "#0891b2";
const INK = "#0F2229";

export function ProgressCard() {
  const progress = useExperienceSpaceStore((s) => s.progress);
  const experience = useExperienceSpaceStore((s) => s.experience);
  if (!progress) return null;

  const status = programStatus(experience);
  const preStart = status.phase === "upcoming" || progress.pastSessions === 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-3" style={{ color: CYAN, fontWeight: 800 }}>
        Your progress
      </p>

      {preStart ? (
        <div>
          <p className="font-black font-headline leading-none" style={{ color: INK, fontSize: "1.5rem" }}>
            {progress.upcomingSessions || progress.totalSessions}
            <span className="text-sm font-bold ml-1.5" style={{ color: "#94a3b8" }}>sessions ahead</span>
          </p>
          <p className="text-[12px] leading-relaxed mt-2" style={{ color: "#64748b" }}>
            Your attendance builds when Week 1 begins — show up live to track your streak.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Ring pct={progress.attendancePercent} />
          <div className="min-w-0">
            <p className="text-sm font-black font-headline" style={{ color: INK }}>
              {progress.attendedPastSessions} of {progress.pastSessions} attended
            </p>
            <p className="text-[12px] mt-1" style={{ color: "#64748b" }}>
              {progress.upcomingSessions} ahead · {progress.progressPercent}% through
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ECE7DD" strokeWidth="3.2" />
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke={CYAN}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={`${clamped} 100`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black font-headline tabular-nums" style={{ color: INK }}>{clamped}%</span>
      </div>
    </div>
  );
}
