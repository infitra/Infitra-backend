"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/(app)/dashboard/profile/ProfileEditForm";
import { UpcomingSessionsStrip } from "./UpcomingSessionsStrip";
import { BadgesSection } from "./BadgesSection";

interface Props {
  profile: { display_name: string; tagline: string | null; bio: string | null; avatar_url: string | null; cover_image_url: string | null };
  stats: { communityMembers: number; activeTribes: number; activeParticipants: number; sessionsCompleted: number; sessionsUpcoming: number; sessionsPublished: number; earningsCHF: string };
  sessions: { id: string; title: string; image_url: string | null; start_time: string; challengeName: string | null }[];
  badges: { badge_id: string; label: string; description: string | null; tier: string; color_hex: string | null; icon: string | null; awarded_at: string }[];
}

export function CreatorIdentitySection({ profile, stats, sessions, badges }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const initials = (profile.display_name ?? "?")[0].toUpperCase();

  return (
    <>
      <div className="rounded-2xl infitra-card overflow-hidden">
        {/* Cover — subtle background */}
        {profile.cover_image_url ? (
          <div className="h-36 md:h-44 relative">
            <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(254,254,255,0.95) 100%)" }} />
          </div>
        ) : (
          <div className="h-20 md:h-24" style={{ background: "linear-gradient(135deg, #0F2229 0%, rgba(8,145,178,0.3) 50%, rgba(255,97,48,0.2) 100%)" }} />
        )}

        <div className="px-6 md:px-8 pb-8 relative">
          {/* Avatar + identity row */}
          <div className="flex items-end gap-6 -mt-20 mb-5">
            {/* Dominant avatar */}
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-36 h-36 rounded-full object-cover shrink-0" style={{ border: "6px solid #FEFEFF", boxShadow: "0 8px 30px rgba(0,0,0,0.20)" }} />
            ) : (
              <div className="w-36 h-36 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,97,48,0.10)", border: "6px solid #FEFEFF", boxShadow: "0 8px 30px rgba(0,0,0,0.20)" }}>
                <span className="text-5xl font-black font-headline text-[#FF6130]">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black font-headline text-[#0F2229] tracking-tight">{profile.display_name}</h1>
                  {profile.tagline && <p className="text-sm text-[#64748b] mt-1 font-headline font-semibold">{profile.tagline}</p>}
                </div>
                <button onClick={() => setEditOpen(true)} className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] px-4 py-2 rounded-full shrink-0" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {profile.bio && <p className="text-sm text-[#94a3b8] mb-5 max-w-xl line-clamp-2">{profile.bio}</p>}

          {/* Stat cards — grouped, strong, clean */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Community */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#f0fdfa", border: "2px solid #99f6e4" }}>
              <p className="text-3xl font-black font-headline text-[#0891b2] leading-none">{stats.communityMembers}</p>
              <p className="text-xs font-bold font-headline text-[#0891b2]/70 mt-2">Community</p>
              <p className="text-[10px] text-[#0891b2]/50">members</p>
            </div>

            {/* Active engagement */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#fff7ed", border: "2px solid #fed7aa" }}>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black font-headline text-[#FF6130] leading-none">{stats.activeTribes}</span>
                <span className="text-sm font-bold font-headline text-[#FF6130]/50">/ {stats.activeParticipants}</span>
              </div>
              <p className="text-xs font-bold font-headline text-[#FF6130]/70 mt-2">Active Tribes</p>
              <p className="text-[10px] text-[#FF6130]/50">{stats.activeParticipants} participant{stats.activeParticipants !== 1 ? "s" : ""}</p>
            </div>

            {/* Sessions */}
            <div className="p-5 rounded-2xl" style={{ backgroundColor: "#f8fafc", border: "2px solid #e2e8f0" }}>
              <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">{stats.sessionsPublished}</p>
              <p className="text-xs font-bold font-headline text-[#64748b] mt-2">Sessions</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-emerald-600">✓ {stats.sessionsCompleted}</span>
                <span className="text-[10px] font-bold text-[#0891b2]">↑ {stats.sessionsUpcoming}</span>
              </div>
            </div>

            {/* Earnings */}
            <Link href="/dashboard/earnings" className="p-5 rounded-2xl group" style={{ backgroundColor: "#f8fafc", border: "2px solid #e2e8f0" }}>
              <p className="text-2xl font-black font-headline text-[#0F2229] leading-none group-hover:text-[#FF6130]">CHF {stats.earningsCHF}</p>
              <p className="text-xs font-bold font-headline text-[#64748b] mt-2">Earnings</p>
              <p className="text-[10px] text-[#FF6130] font-bold font-headline mt-1">View →</p>
            </Link>
          </div>

          {/* Sessions strip */}
          <UpcomingSessionsStrip sessions={sessions} />

          {/* Badges */}
          {badges.length > 0 && <div className="mt-5"><BadgesSection badges={badges} /></div>}
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
