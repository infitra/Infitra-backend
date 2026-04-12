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
  challengePriceCents: number;
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
  const today = now.toISOString().split("T")[0];
  const isActive = tribe.challengeStatus === "published" && tribe.challengeStartDate && tribe.challengeEndDate && today >= tribe.challengeStartDate && today <= tribe.challengeEndDate;
  const isUpcoming = tribe.challengeStatus === "published" && tribe.challengeStartDate && today < tribe.challengeStartDate;

  const [countdown, setCountdown] = useState(isUpcoming && tribe.challengeStartDate ? formatCountdown(tribe.challengeStartDate) : "");
  useEffect(() => {
    if (!isUpcoming || !tribe.challengeStartDate) return;
    const iv = setInterval(() => setCountdown(formatCountdown(tribe.challengeStartDate!)), 60000);
    return () => clearInterval(iv);
  }, [isUpcoming, tribe.challengeStartDate]);

  const priceCHF = tribe.challengePriceCents > 0 ? `CHF ${(tribe.challengePriceCents / 100).toFixed(0)}` : null;

  return (
    <Link
      href={`/communities/challenge/${tribe.id}`}
      className="shrink-0 w-72 md:w-80 block rounded-2xl overflow-hidden group"
      style={{
        backgroundColor: isActive ? "#1a0a00" : "#FEFEFF",
        border: isActive ? "2px solid #FF6130" : isUpcoming ? "1px solid rgba(8,145,178,0.20)" : "1px solid rgba(0,0,0,0.06)",
        boxShadow: isActive
          ? "0 0 30px rgba(255,97,48,0.15), 0 4px 16px rgba(0,0,0,0.10)"
          : "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Cover or accent */}
      {tribe.coverImageUrl ? (
        <div className="h-32 relative">
          <img src={tribe.coverImageUrl} alt="" className="w-full h-full object-cover" style={isActive ? { opacity: 0.7 } : undefined} />
          <div className="absolute inset-0" style={{ background: isActive ? "linear-gradient(to bottom, transparent 20%, #1a0a00 100%)" : "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className={`text-base font-black font-headline tracking-tight truncate ${isActive ? "text-[#FF6130]" : "text-white"} group-hover:text-[#FF6130]`}>{tribe.title}</h3>
          </div>
        </div>
      ) : (
        <div className="h-2" style={{ background: isActive ? "linear-gradient(90deg, #FF6130, rgba(255,97,48,0.4))" : isUpcoming ? "linear-gradient(90deg, #0891b2, rgba(8,145,178,0.3))" : "linear-gradient(90deg, #e2e8f0, #f1f5f9)" }} />
      )}

      <div className="p-4">
        {!tribe.coverImageUrl && (
          <h3 className={`text-base font-black font-headline tracking-tight truncate mb-2 ${isActive ? "text-[#FF6130]" : "text-[#0F2229]"} group-hover:text-[#FF6130]`}>{tribe.title}</h3>
        )}

        {/* Status + members + price */}
        <div className="flex items-center flex-wrap gap-2 mb-2">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-headline text-white" style={{ backgroundColor: "#FF6130" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              ACTIVE
            </span>
          ) : isUpcoming ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-headline text-white" style={{ backgroundColor: "#0891b2" }}>
              ⏱ {countdown}
            </span>
          ) : null}
          <span className={`text-xs font-bold ${isActive ? "text-white/60" : "text-[#94a3b8]"}`}>
            {tribe.memberCount} member{tribe.memberCount !== 1 ? "s" : ""}
          </span>
          {priceCHF && (
            <span className={`text-xs font-bold font-headline ${isActive ? "text-[#FF6130]" : "text-[#0F2229]"}`}>{priceCHF}</span>
          )}
        </div>

        {/* Challenge name */}
        <p className={`text-xs truncate ${isActive ? "text-white/40" : "text-[#64748b]"}`}>{tribe.challengeTitle}</p>

        {/* Next session */}
        {tribe.nextSessionTitle && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2]" />
            <span className={`text-[10px] font-bold font-headline truncate ${isActive ? "text-[#9CF0FF]" : "text-[#0891b2]"}`}>
              Next: {tribe.nextSessionTitle}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
