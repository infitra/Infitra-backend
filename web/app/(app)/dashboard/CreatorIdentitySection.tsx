"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/(app)/dashboard/profile/ProfileEditForm";

interface Props {
  profile: { display_name: string; tagline: string | null; bio: string | null; avatar_url: string | null; cover_image_url: string | null };
  stats: { communityMembers: number; activeTribes: number; activeParticipants: number; sessionsCompleted: number; sessionsUpcoming: number; sessionsPublished: number; earningsCHF: string };
  badges: { badge_id: string; label: string; description: string | null; tier: string; color_hex: string | null; icon: string | null; awarded_at: string }[];
}

const tierDots: Record<string, string> = {
  common: "#94a3b8",
  advanced: "#9CF0FF",
  rare: "#a78bfa",
  epic: "#FF6130",
  legendary: "#f59e0b",
  seasonal: "#34d399",
};

export function CreatorIdentitySection({ profile, stats, badges }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const initials = (profile.display_name ?? "?")[0].toUpperCase();
  const topBadges = badges.slice(0, 3);

  return (
    <>
      {/* ── HERO SECTION ────────────────────────────────── */}
      <div>
        {profile.cover_image_url && (
          <div className="rounded-t-2xl overflow-hidden mb-0">
            <div className="h-32 md:h-40 relative">
              <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className={`rounded-2xl infitra-card ${profile.cover_image_url ? "rounded-t-none" : ""}`}>
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-5 mb-5">
            {/* Avatar — thin gradient border, true to brand */}
            <div className="shrink-0 rounded-full p-[2px]" style={{ background: "#9CF0FF" }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover" style={{ border: "2px solid white" }} />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0F2229", border: "2px solid white" }}>
                  <span className="text-4xl md:text-5xl font-black font-headline text-white">{initials}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {/* Name + badges on same line */}
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-3xl md:text-4xl font-black font-headline text-[#0F2229] tracking-tight leading-none">
                      {profile.display_name}
                    </h1>
                    {/* Badge dots — compact, hover reveals label */}
                    {topBadges.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {topBadges.map((b) => {
                          const color = tierDots[b.tier] ?? tierDots.common;
                          return (
                            <span
                              key={b.badge_id}
                              className="relative group/badge"
                            >
                              <span
                                className="block w-3 h-3 rounded-full"
                                style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}
                              />
                              {/* Tooltip on hover */}
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg text-[10px] font-bold font-headline text-white whitespace-nowrap opacity-0 group-hover/badge:opacity-100 pointer-events-none" style={{ backgroundColor: "#0F2229", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                                {b.label}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {profile.tagline && (
                    <p className="text-lg font-semibold font-headline text-[#64748b] mt-2">
                      {profile.tagline}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] shrink-0"
                  style={{ border: "1px solid rgba(0,0,0,0.10)" }}
                >
                  Edit
                </button>
              </div>
              {profile.bio && (
                <p className="text-sm text-[#64748b] mt-3 max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-5 rounded-2xl infitra-card flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">{stats.communityMembers}</p>
                <p className="text-xs font-bold font-headline text-[#94a3b8] mt-2">Community Members</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl infitra-card">
              <div className="flex items-center justify-evenly">
                <div className="text-center">
                  <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">{stats.activeTribes}</p>
                  <p className="text-xs font-bold font-headline text-[#94a3b8] mt-2">Active Tribes</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black font-headline text-[#0F2229]/50 leading-none">{stats.activeParticipants}</p>
                  <p className="text-[10px] font-bold font-headline text-[#94a3b8] mt-1.5">Participants</p>
                </div>
              </div>
            </div>
            <div className="p-5 rounded-2xl infitra-card">
              <div className="flex items-center justify-evenly">
                <div className="text-center">
                  <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">{stats.sessionsPublished}</p>
                  <p className="text-xs font-bold font-headline text-[#94a3b8] mt-2">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black font-headline text-[#0F2229]/50 leading-none">{stats.sessionsCompleted}</p>
                  <p className="text-[10px] font-bold font-headline text-[#94a3b8] mt-1.5">Done</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-black font-headline text-[#0F2229]/50 leading-none">{stats.sessionsUpcoming}</p>
                  <p className="text-[10px] font-bold font-headline text-[#94a3b8] mt-1.5">Upcoming</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard/earnings" className="p-5 rounded-2xl infitra-card-link group">
              <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">
                {stats.earningsCHF}
              </p>
              <p className="text-xs font-bold font-headline text-[#94a3b8] mt-2">CHF Earned</p>
              <p className="text-[10px] text-[#FF6130] mt-0.5">View details →</p>
            </Link>
          </div>
        </div>
      </div>
      </div>

      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <ProfileEditForm
          displayName={profile.display_name}
          tagline={profile.tagline ?? ""}
          bio={profile.bio ?? ""}
          avatarUrl={profile.avatar_url}
          coverUrl={profile.cover_image_url}
          onSaved={() => { setTimeout(() => { setEditOpen(false); router.refresh(); }, 800); }}
        />
      </SlideOver>
    </>
  );
}
