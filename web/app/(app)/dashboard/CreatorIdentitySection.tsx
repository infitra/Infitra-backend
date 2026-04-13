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

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: "rgba(148,163,184,0.10)", text: "#64748b", border: "rgba(148,163,184,0.25)" },
  advanced: { bg: "rgba(8,145,178,0.08)", text: "#0891b2", border: "rgba(8,145,178,0.20)" },
  rare: { bg: "rgba(139,92,246,0.08)", text: "#7c3aed", border: "rgba(139,92,246,0.20)" },
  epic: { bg: "rgba(255,97,48,0.06)", text: "#FF6130", border: "rgba(255,97,48,0.15)" },
  legendary: { bg: "rgba(245,158,11,0.08)", text: "#d97706", border: "rgba(245,158,11,0.20)" },
  seasonal: { bg: "rgba(16,185,129,0.08)", text: "#059669", border: "rgba(16,185,129,0.20)" },
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
          {/* Avatar + Name + Tagline + Badges — all in one row */}
          <div className="flex items-start gap-5 mb-5">
            {/* Avatar — cyan-to-orange gradient border */}
            <div className="shrink-0 rounded-full p-[3px]" style={{ background: "linear-gradient(135deg, #9CF0FF, #0891b2 40%, #FF6130)" }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover" style={{ border: "3px solid white" }} />
              ) : (
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0F2229", border: "3px solid white" }}>
                  <span className="text-4xl md:text-5xl font-black font-headline text-white">{initials}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black font-headline text-[#0F2229] tracking-tight leading-none">
                    {profile.display_name}
                  </h1>
                  {profile.tagline && (
                    <p className="text-lg font-semibold font-headline text-[#64748b] mt-2">
                      {profile.tagline}
                    </p>
                  )}

                  {/* Badges inline — up to 3 */}
                  {topBadges.length > 0 && (
                    <div className="flex items-center gap-2 mt-3">
                      {topBadges.map((b) => {
                        const colors = tierColors[b.tier] ?? tierColors.common;
                        return (
                          <span
                            key={b.badge_id}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold font-headline"
                            style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                          >
                            {b.label}
                          </span>
                        );
                      })}
                    </div>
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

          {/* Stats — translucent, wave-influenced */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { value: String(stats.communityMembers), label: "Community", sub: "members" },
              { value: `${stats.activeTribes}`, label: "Active Tribes", sub: `${stats.activeParticipants} participants` },
              { value: String(stats.sessionsPublished), label: "Sessions", sub: `${stats.sessionsCompleted} done · ${stats.sessionsUpcoming} next` },
            ].map(({ value, label, sub }) => (
              <div key={label} className="p-5 rounded-2xl infitra-card">
                <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">{value}</p>
                <p className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider mt-2">{label}</p>
                <p className="text-[10px] text-[#94a3b8] mt-0.5">{sub}</p>
              </div>
            ))}
            <Link href="/dashboard/earnings" className="p-5 rounded-2xl infitra-card-link group">
              <p className="text-3xl font-black font-headline text-[#0F2229] leading-none">
                {stats.earningsCHF}
              </p>
              <p className="text-xs font-bold font-headline text-[#94a3b8] uppercase tracking-wider mt-2">CHF Earned</p>
              <p className="text-[10px] text-[#FF6130] mt-0.5">View details →</p>
            </Link>
          </div>
        </div>
      </div>
      </div>

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
