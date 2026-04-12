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
          <div className="flex items-end gap-5 -mt-14 mb-5">
            {/* Large avatar */}
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-28 h-28 rounded-full object-cover shrink-0" style={{ border: "5px solid #FEFEFF", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
            ) : (
              <div className="w-28 h-28 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,97,48,0.10)", border: "5px solid #FEFEFF", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                <span className="text-4xl font-black font-headline text-[#FF6130]">{initials}</span>
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

          {/* Stat cards — grouped by meaning */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Community */}
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.15)" }}>
              <p className="text-2xl font-black font-headline text-[#0891b2]">{stats.communityMembers}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#0891b2]/70">Community Members</p>
            </div>

            {/* Active engagement — duo */}
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,97,48,0.06)", border: "1px solid rgba(255,97,48,0.15)" }}>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-headline text-[#FF6130]">{stats.activeTribes}</span>
                <span className="text-xs font-bold text-[#FF6130]/50">tribes</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black font-headline text-[#FF6130]/70">{stats.activeParticipants}</span>
                <span className="text-[10px] font-bold text-[#FF6130]/40">active people</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#FF6130]/50 mt-1">Active Engagement</p>
            </div>

            {/* Sessions */}
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
              <p className="text-2xl font-black font-headline text-[#0F2229]">{stats.sessionsPublished}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#94a3b8]">Sessions Published</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-emerald-600 font-bold">{stats.sessionsCompleted} done</span>
                <span className="text-[10px] text-[#0891b2] font-bold">{stats.sessionsUpcoming} upcoming</span>
              </div>
            </div>

            {/* Earnings */}
            <Link href="/dashboard/earnings" className="px-4 py-3 rounded-xl group" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
              <p className="text-2xl font-black font-headline text-[#0F2229] group-hover:text-[#FF6130]">CHF {stats.earningsCHF}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#94a3b8]">Total Earnings</p>
              <p className="text-[10px] text-[#FF6130] font-bold mt-1">View details →</p>
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
