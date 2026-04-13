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
      {/* ── HERO SECTION ────────────────────────────────── */}
      <div className="rounded-2xl infitra-card overflow-visible">
        {/* Cover image — clipped separately so avatar can overflow */}
        <div className="rounded-t-2xl overflow-hidden">
          {profile.cover_image_url ? (
            <div className="h-48 md:h-60 relative">
              <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #FEFEFF 100%)" }} />
            </div>
          ) : (
            <div className="h-28 md:h-36" style={{ background: "linear-gradient(135deg, #0F2229 0%, rgba(8,145,178,0.4) 40%, rgba(255,97,48,0.3) 70%, #0F2229 100%)" }} />
          )}
        </div>

        <div className="px-8 md:px-10 pb-10">
          {/* Avatar — large, overlapping */}
          <div className="-mt-16 md:-mt-20 mb-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover" style={{ border: "6px solid #FEFEFF", boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }} />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF6130", border: "6px solid #FEFEFF", boxShadow: "0 8px 30px rgba(0,0,0,0.18)" }}>
                <span className="text-5xl md:text-6xl font-black font-headline text-white">{initials}</span>
              </div>
            )}
          </div>

          {/* Name + tagline — BOLD */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black font-headline text-[#0F2229] tracking-tight leading-none">
                {profile.display_name}
              </h1>
              {profile.tagline && (
                <p className="text-lg md:text-xl font-semibold font-headline text-[#FF6130] mt-2">
                  {profile.tagline}
                </p>
              )}
              {profile.bio && (
                <p className="text-base text-[#64748b] mt-3 max-w-2xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="px-5 py-2.5 rounded-full text-sm font-bold font-headline text-[#0F2229] shrink-0 self-start"
              style={{ border: "2px solid rgba(0,0,0,0.10)" }}
            >
              Edit Profile
            </button>
          </div>

          {/* Stats — clean, on-brand, unified */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { value: String(stats.communityMembers), label: "Community", sub: "members" },
              { value: `${stats.activeTribes}`, label: "Active Tribes", sub: `${stats.activeParticipants} participants` },
              { value: String(stats.sessionsPublished), label: "Sessions", sub: `${stats.sessionsCompleted} done · ${stats.sessionsUpcoming} next` },
            ].map(({ value, label, sub }) => (
              <div key={label} className="p-5 rounded-2xl" style={{ backgroundColor: "#0F2229" }}>
                <p className="text-3xl font-black font-headline text-white leading-none">{value}</p>
                <p className="text-xs font-bold font-headline text-[#FF6130] mt-2">{label}</p>
                <p className="text-[10px] text-[#9CF0FF]/60 mt-0.5">{sub}</p>
              </div>
            ))}
            <Link href="/dashboard/earnings" className="p-5 rounded-2xl group" style={{ backgroundColor: "#0F2229" }}>
              <p className="text-3xl font-black font-headline text-[#FF6130] leading-none group-hover:text-white">
                {stats.earningsCHF}
              </p>
              <p className="text-xs font-bold font-headline text-white mt-2">CHF Earned</p>
              <p className="text-[10px] text-[#9CF0FF]/60 mt-0.5 group-hover:text-[#FF6130]">View details →</p>
            </Link>
          </div>
        </div>
      </div>

      {/* ── UPCOMING SESSIONS ─────────────────────────────── */}
      {sessions.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight">
              Upcoming Sessions
            </h2>
            <Link href="/dashboard/sessions" className="text-xs font-bold font-headline text-[#FF6130]">
              All Sessions →
            </Link>
          </div>
          <UpcomingSessionsStrip sessions={sessions} />
        </div>
      )}

      {/* ── BADGES ────────────────────────────────────────── */}
      {badges.length > 0 && (
        <div className="mt-6">
          <BadgesSection badges={badges} />
        </div>
      )}

      {/* ── EDIT SLIDEOVER ────────────────────────────────── */}
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
