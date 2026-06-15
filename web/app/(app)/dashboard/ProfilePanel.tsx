"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SlideOver } from "@/app/components/SlideOver";
import { ProfileEditForm } from "@/app/components/ProfileEditForm";
import { CalendarButton } from "@/app/components/CalendarButton";
import { MetricStrip, type Metric } from "./MetricStrip";

/**
 * ProfilePanel — the "this is you" console in the dashboard's left rail.
 *
 * Same card grammar as the in-Space YouPanel (white card, tinted profile
 * header, labelled sections separated by hairlines, cyan/orange discipline)
 * so the dashboard and the inside-the-Space view share one spatial language:
 * "you" on the left, "what's happening" on the right. On desktop this sticks
 * in a 340px rail; on mobile it's the top card of the stack.
 *
 *   PROFILE         — avatar + greeting + tagline/bio + pilot footing.
 *   QUICK ACTIONS   — edit profile · export calendar.
 *   ACROSS YOUR     — a quiet global pulse summed from the live experiences
 *   TRIBES            (members · new posts · waiting questions). Signal only —
 *                     the action lives inside each Experience Space. Rendered
 *                     only when there's at least one active experience.
 */

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";

interface TribePulse {
  members: number;
  newPosts: number;
  pendingQuestions: number;
  experiences: number;
}

interface Props {
  displayName: string;
  avatarUrl: string | null;
  tagline: string | null;
  bio: string | null;
  /** Needed by the SlideOver edit form. */
  coverImageUrl: string | null;
  joinedAt: string | null;
  tribePulse: TribePulse;
  hasActivePrograms: boolean;
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function weeksSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

function pilotLine(joinedAt: string | null): string {
  const w = weeksSince(joinedAt);
  if (w === null) return "On the pilot";
  if (w === 0) return "On the pilot · just joined";
  if (w === 1) return "On the pilot · 1 week in";
  return `On the pilot · ${w} weeks in`;
}

const EDIT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const PLUS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
      <p
        className="text-[11px] uppercase tracking-[0.18em] font-headline mb-3"
        style={{ color: "#94a3b8", fontWeight: 800 }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function TribesPulse({ pulse }: { pulse: TribePulse }) {
  const { members, newPosts, pendingQuestions } = pulse;
  if (members === 0 && newPosts === 0 && pendingQuestions === 0) {
    return (
      <p className="text-[12px] font-bold font-headline" style={{ color: "#94a3b8" }}>
        Your tribes are forming — share to fill them
      </p>
    );
  }
  const metrics: Metric[] = [
    { value: members, label: members === 1 ? "member" : "members" },
    { value: newPosts, label: "new posts", accent: "cyan" },
  ];
  if (pendingQuestions > 0) {
    metrics.push({ value: pendingQuestions, label: "waiting", accent: "orange" });
  }
  return <MetricStrip metrics={metrics} />;
}

export function ProfilePanel({
  displayName,
  avatarUrl,
  tagline,
  bio,
  coverImageUrl,
  joinedAt,
  tribePulse,
  hasActivePrograms,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const firstName = displayName.split(" ")[0] || displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();
  const greeting = timeOfDayGreeting();

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 8px 26px rgba(15,34,41,0.08)",
        }}
      >
        {/* ── PROFILE ── tinted header, same beat as the in-Space YouPanel. */}
        <div
          className="px-5 pt-5 pb-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,145,178,0.10), rgba(156,240,255,0.10) 70%, rgba(255,255,255,0))",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-full p-[2px]" style={{ background: "#9CF0FF" }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover block"
                  style={{ border: "2px solid #FFFFFF" }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ border: "2px solid #FFFFFF", backgroundColor: "rgba(255,97,48,0.18)" }}
                >
                  <span className="text-xl font-headline" style={{ color: ORANGE, fontWeight: 700 }}>
                    {initial}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p
                className="text-lg font-headline tracking-tight truncate"
                style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}
                suppressHydrationWarning
              >
                {greeting}, {firstName}
              </p>
              <p
                className="text-[11px] uppercase tracking-widest font-headline"
                style={{ color: CYAN, fontWeight: 700 }}
                suppressHydrationWarning
              >
                {pilotLine(joinedAt)}
              </p>
            </div>
          </div>

          {tagline && (
            <p className="text-sm mt-3 line-clamp-1" style={{ color: "#475569", fontWeight: 600 }}>
              {tagline}
            </p>
          )}
          {bio && (
            <p
              className="text-[13px] mt-1.5 line-clamp-2"
              style={{ color: "#64748b", fontWeight: 400, lineHeight: 1.55 }}
            >
              {bio}
            </p>
          )}
        </div>

        {/* ── QUICK ACTIONS ── create leads (it's the primary creator act, and
            the only place it's reachable on mobile where the nav collapses). */}
        <Section label="Quick actions">
          <Link
            href="/dashboard/create"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[13px] font-black font-headline text-white transition-transform hover:scale-[1.01] mb-2"
            style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
          >
            {PLUS_ICON}
            New experience
          </Link>
          <button
            onClick={() => setEditOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[13px] font-black font-headline transition-colors mb-2"
            style={{
              color: "#475569",
              border: "1px solid rgba(15,34,41,0.12)",
              backgroundColor: "rgba(255,255,255,0.6)",
            }}
          >
            {EDIT_ICON}
            Edit profile
          </button>
          <CalendarButton href="/dashboard/calendar" label="Export calendar" block />
        </Section>

        {/* ── ACROSS YOUR TRIBES ── global pulse, only when something's live. */}
        {hasActivePrograms && (
          <Section label="Across your tribes">
            <TribesPulse pulse={tribePulse} />
          </Section>
        )}
      </div>

      <SlideOver open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <ProfileEditForm
          displayName={displayName}
          tagline={tagline ?? ""}
          bio={bio ?? ""}
          avatarUrl={avatarUrl}
          coverUrl={coverImageUrl}
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
