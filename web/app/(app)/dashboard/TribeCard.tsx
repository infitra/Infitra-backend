"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface TribeSession {
  id: string;
  title: string;
  image_url: string | null;
  start_time: string;
}

interface TribeData {
  id: string;
  title: string;
  coverImageUrl: string | null;
  memberCount: number;
  challengeTitle: string;
  challengeStatus: string;
  challengeStartDate: string | null;
  challengeEndDate: string | null;
  challengePriceCents: number;
  nextSessions: TribeSession[];
}

function formatCountdown(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr + "T00:00:00");
  const diffMs = d.getTime() - now.getTime();
  const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffH = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (diffD > 0) return `${diffD}d ${diffH}h`;
  if (diffH > 0) return `${diffH}h`;
  return "Soon";
}

function formatSessionTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffD = Math.floor(diffH / 24);
  if (diffH < 0) return "Now";
  if (diffH < 1) return `In ${Math.floor(diffMs / 60000)}m`;
  if (diffH < 24) return `In ${diffH}h`;
  if (diffD === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function TribeCard({ tribe, fullWidth = false }: { tribe: TribeData; fullWidth?: boolean }) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const isActive = tribe.challengeStatus === "published" && tribe.challengeStartDate && tribe.challengeEndDate && today >= tribe.challengeStartDate && today <= tribe.challengeEndDate;
  const isUpcoming = tribe.challengeStatus === "published" && tribe.challengeStartDate && today < tribe.challengeStartDate;

  const [countdown, setCountdown] = useState(isUpcoming && tribe.challengeStartDate ? formatCountdown(tribe.challengeStartDate) : "");
  useEffect(() => {
    if (!isUpcoming || !tribe.challengeStartDate) return;
    const iv = setInterval(() => setCountdown(formatCountdown(tribe.challengeStartDate!)), 60000);
    return () => clearInterval(iv);
  }, [isUpcoming, tribe.challengeStartDate]);

  return (
    <div className={`rounded-2xl overflow-hidden infitra-card-link group ${isActive ? "tribe-active-glow" : ""} ${fullWidth ? "w-full" : "shrink-0 w-80 md:w-96"}`}
      style={{
        border: isUpcoming && !isActive ? "1px solid rgba(156,240,255,0.30)" : undefined,
      }}
    >
      {/* Cover image or branded fallback */}
      <Link href={`/communities/challenge/${tribe.id}`} className="block">
        <div className="h-44 relative">
          {tribe.coverImageUrl ? (
            <>
              <img src={tribe.coverImageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, rgba(0,0,0,0.65) 100%)" }} />
            </>
          ) : (
            <>
              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229 0%, #1a3340 40%, #2a1508 100%)" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
                <img src="/logo-mark.png" alt="" width={48} height={48} />
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
            </>
          )}

          {/* Status badge — top left */}
          <div className="absolute top-3 left-3">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold font-headline" style={{ backgroundColor: "#9CF0FF", color: "#064e5c", backdropFilter: "blur(8px)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#064e5c" }} />
                ACTIVE
              </span>
            ) : isUpcoming ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold font-headline" style={{ backgroundColor: "rgba(156,240,255,0.85)", color: "#064e5c", backdropFilter: "blur(8px)" }}>
                Starts in {countdown}
              </span>
            ) : null}
          </div>

          {/* Member count — top right */}
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-headline text-white" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              {tribe.memberCount} member{tribe.memberCount !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Title + challenge name — bottom */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-lg font-black font-headline tracking-tight text-white leading-tight group-hover:text-[#FF6130]">
              {tribe.title}
            </h3>
            <p className="text-[11px] font-headline text-white/60 mt-0.5 truncate">{tribe.challengeTitle}</p>
          </div>
        </div>
      </Link>

      {/* Embedded next sessions — prominent, action-oriented */}
      <div className="p-4">
        {tribe.nextSessions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#94a3b8] mb-1">Next Sessions</p>
            {tribe.nextSessions.slice(0, 2).map((sess) => {
              const sessUrgent = (new Date(sess.start_time).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
              return (
                <Link
                  key={sess.id}
                  href={`/dashboard/sessions/${sess.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl group/sess"
                  style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(15,34,41,0.06)" }}
                >
                  {sess.image_url ? (
                    <img src={sess.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
                      <img src="/logo-mark.png" alt="" width={16} height={16} style={{ opacity: 0.12 }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black font-headline text-[#0F2229] truncate group-hover/sess:text-[#FF6130]">{sess.title}</p>
                    <p className={`text-xs font-bold font-headline mt-0.5 ${sessUrgent ? "text-[#FF6130]" : "text-[#94a3b8]"}`}>
                      {formatSessionTime(sess.start_time)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span
                      className="px-3 py-1.5 rounded-full text-[10px] font-black font-headline"
                      style={{
                        backgroundColor: sessUrgent ? "#FF6130" : "#9CF0FF",
                        color: sessUrgent ? "#ffffff" : "#064e5c",
                      }}
                    >
                      {sessUrgent ? "Soon" : "View"}
                    </span>
                  </div>
                </Link>
              );
            })}
            {tribe.nextSessions.length > 2 && (
              <Link href={`/communities/challenge/${tribe.id}`} className="block text-center text-xs font-bold font-headline text-[#FF6130] hover:text-[#0F2229] py-1">
                +{tribe.nextSessions.length - 2} more →
              </Link>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#94a3b8] text-center py-3">No upcoming sessions</p>
        )}
      </div>
    </div>
  );
}
