"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/(app)/dashboard/profile/ProfileEditForm";
import { UpcomingSessionsStrip } from "./UpcomingSessionsStrip";
import { BadgesSection } from "./BadgesSection";

interface Props {
  profile: { display_name: string; tagline: string | null; bio: string | null; avatar_url: string | null; cover_image_url: string | null };
  stats: { communityMembers: number; activeTribes: number; activeParticipants: number; sessionsCompleted: number; earningsCHF: string };
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
        {/* Cover */}
        {profile.cover_image_url ? (
          <div className="h-40 md:h-52 relative">
            <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
          </div>
        ) : (
          <div className="h-24 md:h-32" style={{ background: "linear-gradient(135deg, #0F2229 0%, rgba(8,145,178,0.3) 50%, rgba(255,97,48,0.2) 100%)" }} />
        )}

        <div className="px-6 md:px-8 pb-6 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-3">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover bg-white" style={{ border: "4px solid #FEFEFF", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.10)", border: "4px solid #FEFEFF", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
                <span className="text-3xl font-black font-headline text-[#FF6130]">{initials}</span>
              </div>
            )}
          </div>

          {/* Name + edit */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black font-headline text-[#0F2229] tracking-tight">{profile.display_name}</h1>
              {profile.tagline && <p className="text-sm md:text-base text-[#64748b] mt-1 font-headline font-semibold">{profile.tagline}</p>}
              {profile.bio && <p className="text-sm text-[#94a3b8] mt-2 max-w-xl line-clamp-2">{profile.bio}</p>}
            </div>
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] px-4 py-2 rounded-full shrink-0"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-6" style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "16px" }}>
            {[
              { label: "Community", value: String(stats.communityMembers), color: "#0891b2" },
              { label: "Active Tribes", value: String(stats.activeTribes), color: "#FF6130" },
              { label: "Active Users", value: String(stats.activeParticipants), color: "#FF6130" },
              { label: "Sessions Done", value: String(stats.sessionsCompleted), color: "#0F2229" },
              { label: "Earnings", value: `CHF ${stats.earningsCHF}`, color: "#0F2229" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xl font-black font-headline leading-none" style={{ color }}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#94a3b8] mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Sessions strip */}
          <UpcomingSessionsStrip sessions={sessions} />

          {/* Badges */}
          {badges.length > 0 && <div className="mt-4"><BadgesSection badges={badges} /></div>}
        </div>
      </div>

      {/* Edit SlideOver */}
      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <ProfileEditForm
          displayName={profile.display_name}
          tagline={profile.tagline ?? ""}
          bio={profile.bio ?? ""}
          avatarUrl={profile.avatar_url}
          coverUrl={profile.cover_image_url}
          onSaved={() => {
            setTimeout(() => {
              setEditOpen(false);
              router.refresh();
            }, 800);
          }}
        />
      </SlideOver>
    </>
  );
}
