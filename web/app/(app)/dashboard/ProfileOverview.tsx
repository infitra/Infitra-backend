"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/components/ProfileEditForm";

/**
 * Profile Overview — the personal anchor on top of the pilot dashboard.
 *
 * Replaces the previous one-line GreetingRow because the dashboard
 * needed more substance and a clearer "this is your home" signal.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────┐
 *   │ [cover image — 96-128px band]          [Edit]  │
 *   │                                                 │
 *   │ [Avatar]  Display Name                          │
 *   │  80px     Tagline                               │
 *   │           Bio (1-2 lines)                       │
 *   │                                                 │
 *   │ ┌────────┬────────┬────────┬────────┐          │
 *   │ │ Stat 1 │ Stat 2 │ Stat 3 │ Stat 4 │          │
 *   │ └────────┴────────┴────────┴────────┘          │
 *   └─────────────────────────────────────────────────┘
 *
 * Stats are pilot-relevant only — earnings, current program status,
 * sessions delivered, members enrolled. No vanity stats (community
 * member count of zero, badges, etc).
 */

interface Props {
  profile: {
    displayName: string;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    tagline: string | null;
    bio: string | null;
  };
  /**
   * Lifetime/identity stats only — these are the "who you are as a
   * creator" numbers. Program-specific data (Week N/M, this program's
   * enrolled count) lives on the ActiveProgramCard so the dashboard
   * doesn't show the same number twice.
   */
  stats: {
    earningsCents: number;
    sessionsDelivered: number;
    enrolledMembers: number;
  };
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}


interface StatCardProps {
  value: string;
  label: string;
  sub?: string | null;
  href?: string;
  accent?: string;
}

function StatCard({ value, label, sub, href, accent }: StatCardProps) {
  const inner = (
    <>
      <div className="flex items-baseline gap-2">
        <p
          className="text-2xl md:text-3xl font-headline leading-none tracking-tight"
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {value}
        </p>
        {sub ? (
          <p
            className="text-[10px] uppercase tracking-widest font-headline"
            style={{ color: accent ?? "#94a3b8", fontWeight: 700 }}
          >
            {sub}
          </p>
        ) : null}
      </div>
      <p
        className="text-[11px] uppercase tracking-widest font-headline mt-1.5"
        style={{ color: "#94a3b8", fontWeight: 700 }}
      >
        {label}
      </p>
    </>
  );

  const styleProps: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(15,34,41,0.08)",
  };

  if (href) {
    return (
      <Link
        href={href}
        className="block p-4 rounded-2xl transition-colors hover:bg-white/80"
        style={styleProps}
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="p-4 rounded-2xl" style={styleProps}>
      {inner}
    </div>
  );
}

export function ProfileOverview({ profile, stats }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const greeting = timeOfDayGreeting();
  const firstName = profile.displayName.split(" ")[0] || profile.displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();
  const hasCover = !!profile.coverImageUrl;

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden infitra-card"
        style={{ border: "1px solid rgba(15,34,41,0.08)" }}
      >
        {/* Cover band — only when an actual cover image exists. No
            fabricated gradient placeholder; if there's no cover, there's
            no cover. */}
        {hasCover ? (
          <div className="relative h-24 md:h-32 overflow-hidden bg-[#0F2229]">
            <img
              src={profile.coverImageUrl as string}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Soft bottom fade so the overlapping avatar has a visual landing */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 100%)",
              }}
            />
          </div>
        ) : null}

        {/* Body. Avatar overlaps the cover when present; otherwise the
            avatar sits inline at the top of the body. */}
        <div className={hasCover ? "px-6 md:px-8 pb-6 md:pb-8" : "p-6 md:p-8"}>
          <div
            className={`flex items-start gap-5 mb-5 ${hasCover ? "-mt-10 md:-mt-12" : ""}`}
          >
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                  style={{
                    border: hasCover ? "4px solid #FFFFFF" : "1px solid rgba(15,34,41,0.10)",
                    boxShadow: hasCover
                      ? "0 6px 20px rgba(15,34,41,0.18)"
                      : "0 4px 12px rgba(15,34,41,0.08)",
                  }}
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                  style={{
                    border: hasCover ? "4px solid #FFFFFF" : "1px solid rgba(15,34,41,0.10)",
                    backgroundColor: "rgba(255,97,48,0.18)",
                    boxShadow: hasCover
                      ? "0 6px 20px rgba(15,34,41,0.18)"
                      : "0 4px 12px rgba(15,34,41,0.08)",
                  }}
                >
                  <span
                    className="text-3xl font-headline"
                    style={{ color: "#FF6130", fontWeight: 700 }}
                  >
                    {initial}
                  </span>
                </div>
              )}
            </div>

            <div className={`flex-1 min-w-0 ${hasCover ? "pt-12 md:pt-14" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[11px] uppercase tracking-widest font-headline mb-1"
                    style={{ color: "#94a3b8", fontWeight: 700 }}
                  >
                    {greeting}, {firstName}
                  </p>
                  <h1
                    className="text-2xl md:text-3xl font-headline tracking-tight leading-none"
                    style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    {profile.displayName || firstName}
                  </h1>
                  {profile.tagline ? (
                    <p
                      className="text-sm md:text-base mt-2"
                      style={{ color: "#475569", fontWeight: 600 }}
                    >
                      {profile.tagline}
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => setEditOpen(true)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-headline transition-colors"
                  style={{
                    color: "#475569",
                    border: "1px solid rgba(15,34,41,0.10)",
                    backgroundColor: "rgba(255,255,255,0.55)",
                    fontWeight: 700,
                  }}
                >
                  Edit profile
                </button>
              </div>
              {profile.bio ? (
                <p
                  className="text-sm mt-3 max-w-2xl leading-relaxed"
                  style={{ color: "#64748b" }}
                >
                  {profile.bio}
                </p>
              ) : null}
            </div>
          </div>

          {/* Lifetime stats — three numbers that capture "you as a creator".
              Program-specific data (Week N/M, this program's enrolled count)
              lives on the ActiveProgramCard so we never show the same data
              twice. */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              value={formatMoney(stats.earningsCents)}
              label="Earned · lifetime"
              href="/dashboard/earnings"
              accent="#FF6130"
              sub="View →"
            />
            <StatCard
              value={String(stats.sessionsDelivered)}
              label="Sessions delivered"
            />
            <StatCard
              value={String(stats.enrolledMembers)}
              label="Members"
            />
          </div>
        </div>
      </div>

      <SlideOver
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
      >
        <ProfileEditForm
          displayName={profile.displayName}
          tagline={profile.tagline ?? ""}
          bio={profile.bio ?? ""}
          avatarUrl={profile.avatarUrl}
          coverUrl={profile.coverImageUrl}
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
