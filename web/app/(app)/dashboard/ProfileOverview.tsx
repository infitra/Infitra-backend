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

export type ProgramStageForOverview =
  | "drafting-solo"
  | "drafting-jointly"
  | "awaiting-signatures"
  | "published-pre-launch"
  | "published-live"
  | "completed";

interface Props {
  profile: {
    displayName: string;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    tagline: string | null;
    bio: string | null;
  };
  stats: {
    earningsCents: number;
    sessionsDelivered: number;
    activePrograms: number;
    enrolledMembers: number;
  };
  activeProgram: {
    title: string;
    stage: ProgramStageForOverview;
    startDate: string | null;
    endDate: string | null;
    partnerName: string | null;
  } | null;
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

function programStatusLabel(
  stage: ProgramStageForOverview,
  startDate: string | null,
  endDate: string | null,
): { value: string; sub: string | null } {
  if (stage === "published-live" && startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    const totalWeeks = Math.max(
      1,
      Math.ceil((e.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000)),
    );
    const cw = Math.max(
      1,
      Math.floor((today.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
    );
    return { value: `Week ${cw}/${totalWeeks}`, sub: "Live" };
  }
  if (stage === "published-pre-launch") return { value: "—", sub: "Pre-launch" };
  if (stage === "drafting-solo") return { value: "Draft", sub: "Awaiting partner" };
  if (stage === "drafting-jointly") return { value: "Draft", sub: "In workspace" };
  if (stage === "awaiting-signatures") return { value: "Lock", sub: "Signing" };
  if (stage === "completed") return { value: "—", sub: "Completed" };
  return { value: "—", sub: null };
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

export function ProfileOverview({ profile, stats, activeProgram }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const greeting = timeOfDayGreeting();
  const firstName = profile.displayName.split(" ")[0] || profile.displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();

  const programStatus = activeProgram
    ? programStatusLabel(activeProgram.stage, activeProgram.startDate, activeProgram.endDate)
    : { value: "0", sub: "Start one" };

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden infitra-card"
        style={{ border: "1px solid rgba(15,34,41,0.08)" }}
      >
        {/* Cover band — substantive but not dominating */}
        <div
          className="relative h-24 md:h-32 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,97,48,0.45) 0%, rgba(8,145,178,0.45) 100%), #0F2229",
          }}
        >
          {profile.coverImageUrl ? (
            <img
              src={profile.coverImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          {/* Subtle bottom fade so the avatar+content has a visual landing */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 100%)",
            }}
          />
        </div>

        {/* Body — avatar overlaps the cover */}
        <div className="px-6 md:px-8 pb-6 md:pb-8">
          <div className="flex items-start gap-5 -mt-10 md:-mt-12 mb-5">
            {/* Avatar with white ring against the cover */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                  style={{
                    border: "4px solid #FFFFFF",
                    boxShadow: "0 6px 20px rgba(15,34,41,0.18)",
                  }}
                />
              ) : (
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                  style={{
                    border: "4px solid #FFFFFF",
                    backgroundColor: "rgba(255,97,48,0.18)",
                    boxShadow: "0 6px 20px rgba(15,34,41,0.18)",
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

            <div className="flex-1 min-w-0 pt-12 md:pt-14">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-xs uppercase tracking-widest font-headline mb-1"
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

          {/* Stats row — pilot-relevant only */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              value={formatMoney(stats.earningsCents)}
              label="Earned"
              href="/dashboard/earnings"
              accent="#FF6130"
              sub="View →"
            />
            <StatCard
              value={programStatus.value}
              label={activeProgram ? "Program" : "Programs"}
              sub={programStatus.sub}
              accent={activeProgram?.stage === "published-live" ? "#15803d" : "#0891b2"}
            />
            <StatCard
              value={String(stats.sessionsDelivered)}
              label="Sessions Delivered"
            />
            <StatCard
              value={String(stats.enrolledMembers)}
              label="Enrolled Members"
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
