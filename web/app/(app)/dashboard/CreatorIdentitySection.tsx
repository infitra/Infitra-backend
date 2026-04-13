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
      <div>
        {/* Optional cover image — separate from the card, above it */}
        {profile.cover_image_url && (
          <div className="rounded-t-2xl overflow-hidden mb-0">
            <div className="h-32 md:h-40 relative">
              <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className={`rounded-2xl infitra-card ${profile.cover_image_url ? "rounded-t-none" : ""}`}>
        <div className="p-6 md:p-8">
          {/* Avatar + Name + Tagline — all in one row */}
          <div className="flex items-start gap-5 mb-5">
            {/* Avatar — top left, prominent */}
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover shrink-0" style={{ border: "4px solid #FF6130", boxShadow: "0 4px 20px rgba(255,97,48,0.15)" }} />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#FF6130", border: "4px solid #FF6130" }}>
                <span className="text-4xl md:text-5xl font-black font-headline text-white">{initials}</span>
              </div>
            )}

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black font-headline text-[#0F2229] tracking-tight leading-none">
                    {profile.display_name}
                  </h1>
                  {profile.tagline && (
                    <p className="text-lg font-semibold font-headline text-[#FF6130] mt-2">
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
