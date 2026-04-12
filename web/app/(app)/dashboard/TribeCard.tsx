"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface TribeData {
  id: string;
  title: string;
  coverImageUrl: string | null;
  memberCount: number;
  challengeTitle: string;
  challengeStatus: string;
  challengeStartDate: string | null;
  challengeEndDate: string | null;
  nextSessionTitle: string | null;
  nextSessionTime: string | null;
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

export function TribeCard({ tribe }: { tribe: TribeData }) {
  const now = new Date();
  const startDate = tribe.challengeStartDate ? new Date(tribe.challengeStartDate + "T00:00:00") : null;
  const endDate = tribe.challengeEndDate ? new Date(tribe.challengeEndDate + "T00:00:00") : null;

  const isActive = tribe.challengeStatus === "published" && startDate && endDate && now >= startDate && now <= endDate;
  const isUpcoming = tribe.challengeStatus === "published" && startDate && now < startDate;

  // Live countdown for upcoming
  const [countdown, setCountdown] = useState(isUpcoming && tribe.challengeStartDate ? formatCountdown(tribe.challengeStartDate) : "");
  useEffect(() => {
    if (!isUpcoming || !tribe.challengeStartDate) return;
    const iv = setInterval(() => setCountdown(formatCountdown(tribe.challengeStartDate!)), 60000);
    return () => clearInterval(iv);
  }, [isUpcoming, tribe.challengeStartDate]);

  return (
    <Link href={`/communities/challenge/${tribe.id}`} className="group block rounded-2xl overflow-hidden infitra-card-link">
      {/* Cover image or branded bar */}
      {tribe.coverImageUrl ? (
        <div className="h-28 relative">
          <img src={tribe.coverImageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
            <h3 className="text-base font-black font-headline text-white truncate group-hover:text-[#FF6130]">{tribe.title}</h3>
            {isActive && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
          </div>
        </div>
      ) : (
        <div className="h-1.5" style={{ background: isActive ? "linear-gradient(90deg, #10b981, #059669)" : "linear-gradient(90deg, #FF6130, rgba(255,97,48,0.2))" }} />
      )}

      <div className="p-5">
        {!tribe.coverImageUrl && (
          <h3 className="text-base font-black font-headline tracking-tight truncate text-[#0F2229] group-hover:text-[#FF6130] mb-2">{tribe.title}</h3>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          {isActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold font-headline uppercase tracking-wider text-emerald-600">Active</span>
            </>
          ) : isUpcoming ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#FF6130]" />
              <span className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]">Starts in {countdown}</span>
            </>
          ) : (
            <span className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#94a3b8]">Draft</span>
          )}
          <span className="text-[10px] text-[#94a3b8]">· {tribe.memberCount} member{tribe.memberCount !== 1 ? "s" : ""}</span>
        </div>

        {/* Challenge name */}
        <p className="text-xs text-[#64748b] truncate">{tribe.challengeTitle}</p>

        {/* Next session */}
        {tribe.nextSessionTitle && tribe.nextSessionTime && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2]" />
            <span className="text-[10px] text-[#0891b2] font-bold font-headline truncate">Next: {tribe.nextSessionTitle}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
