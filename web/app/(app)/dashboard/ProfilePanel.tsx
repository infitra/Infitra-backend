"use client";

import Link from "next/link";
import { CalendarButton } from "@/app/components/CalendarButton";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";
import { ProfileTrigger } from "@/app/components/ProfileModal";
import { useOverlay, railActionStyle } from "@/app/components/DashboardOverlay";
import {
  AgreementsPanel,
  EditProfilePanel,
  PeoplePanel,
  ReviewsPanel,
  type AgreementRow,
  type ExpertReview,
} from "@/app/components/AccountPanels";
import { STAT_ICONS, BRAND_ACCENT } from "@/app/components/StatCards";
import type { ProfileFacts } from "@/app/components/ProfileEditForm";
import type { ConnectionRow } from "@/app/components/ConnectionsGrid";

/**
 * ProfilePanel — the expert's management console (founder's second polish
 * round). Three jobs, in order:
 *
 *   NEEDS YOU     — what should have my focus right now: invitations, open
 *                   questions, agreements awaiting signature, and next
 *                   chapters ready to open (continuations). The console's
 *                   promise: you cannot miss anything important here.
 *   YOUR ACCOUNT  — two columns, one rule. LEFT is what is live right now
 *                   (orange, read-only status): active experiences, active
 *                   tribe members, sessions led. RIGHT is what it has added
 *                   up to (cyan, and every one is a door): tribe
 *                   connections → Your people, rating → all reviews,
 *                   earnings → the earnings page.
 *   QUICK ACTIONS — easy access; every secondary surface opens as an
 *                   overlay inside the dashboard.
 *
 * The old "Across your tribes" pulse is gone (legacy): its numbers live in
 * the stat cards and the per-experience cards now.
 */

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";
const TEAL = BRAND_ACCENT.teal;

interface Props {
  displayName: string;
  avatarUrl: string | null;
  tagline: string | null;
  bio: string | null;
  profileFacts: Record<string, unknown>;
  viewerId: string;
  joinedAt: string | null;
  agreements: AgreementRow[];
  connections: ConnectionRow[];
  reviews: ExpertReview[];
  isFoundingExpert: boolean;
  /** Creator cut for the calendar month to date. */
  earningsMonthCents: number;
  needsYou: {
    invitations: number;
    /** One row PER experience with open questions: each deep-links into that
     *  space with the feed pre-filtered to "Open for you" (?focus=questions).
     *  An alert that doesn't land on its action is worse than no alert. */
    openQuestions: Array<{ id: string; title: string; count: number }>;
    awaitingSignatures: number;
    /** Completed experiences the caller OWNS whose lineage has no next run
     *  yet. Each is a concrete opportunity, so each gets its own row with a
     *  title and a link straight to the action. */
    nextChapters: Array<{ id: string; title: string; spaceId: string | null }>;
  };
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

/**
 * One row of the focus stack: a count badge OR an icon, the action in plain
 * words, and an optional context line naming WHAT it is about (an
 * instruction without its subject sends people nowhere).
 */
function AttentionRow({
  count,
  icon,
  label,
  detail,
  href,
  accent,
}: {
  count?: number;
  icon?: React.ReactNode;
  label: string;
  detail?: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-transform hover:-translate-y-0.5"
      style={{ backgroundColor: `${accent}0D`, boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <span
        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black font-headline shrink-0 text-white"
        style={{ backgroundColor: accent }}
      >
        {icon ?? count}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-bold font-headline leading-tight" style={{ color: INK }}>
          {label}
        </span>
        {detail && (
          <span className="block text-[10.5px] truncate leading-tight mt-0.5" style={{ color: "#64748b" }}>
            {detail}
          </span>
        )}
      </span>
      <span className="text-[11px] font-black shrink-0" style={{ color: accent }}>→</span>
    </Link>
  );
}

export function ProfilePanel({
  displayName,
  avatarUrl,
  tagline,
  bio,
  profileFacts,
  viewerId,
  joinedAt,
  agreements,
  connections,
  reviews,
  isFoundingExpert,
  earningsMonthCents,
  needsYou,
}: Props) {
  const openOverlay = useOverlay();
  const firstName = displayName.split(" ")[0] || displayName;
  const initial = (firstName[0] ?? "?").toUpperCase();
  const greeting = timeOfDayGreeting();

  const attention: React.ReactNode[] = [];
  if (needsYou.invitations > 0) {
    attention.push(
      <AttentionRow
        key="inv"
        count={needsYou.invitations}
        label={needsYou.invitations === 1 ? "collaboration invitation" : "collaboration invitations"}
        href="#invitations"
        accent={ORANGE}
      />,
    );
  }
  for (const q of needsYou.openQuestions) {
    attention.push(
      <AttentionRow
        key={`q-${q.id}`}
        count={q.count}
        label={q.count === 1 ? "question waiting on you" : "questions waiting on you"}
        detail={q.title}
        href={`/experiences/${q.id}/space?focus=questions`}
        accent={CYAN}
      />,
    );
  }
  if (needsYou.awaitingSignatures > 0) {
    attention.push(
      <AttentionRow
        key="sig"
        count={needsYou.awaitingSignatures}
        label={needsYou.awaitingSignatures === 1 ? "agreement awaiting signature" : "agreements awaiting signature"}
        href="#drafts"
        accent={TEAL}
      />,
    );
  }
  // One row PER opportunity, named, linking straight to the action: the
  // completed run's space, where the Next chapter console (Prepare next
  // run) lives. A fast track that dead-ends is worse than no fast track.
  for (const nc of needsYou.nextChapters) {
    attention.push(
      <AttentionRow
        key={`next-${nc.id}`}
        icon={<span className="scale-[0.8] flex">{STAT_ICONS.flame}</span>}
        label="Ready to run again"
        detail={nc.title}
        href={`/experiences/${nc.id}/space`}
        accent={ORANGE}
      />,
    );
  }

  const railBtn =
    "flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-[13px] font-black font-headline transition-colors hover:bg-[rgba(15,34,41,0.03)]";

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 8px 26px rgba(15,34,41,0.08)",
        }}
      >
        {/* ── PROFILE ── */}
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
              {isFoundingExpert ? (
                <FoundingExpertBadge className="mt-1" />
              ) : (
                <p
                  className="text-[11px] uppercase tracking-widest font-headline"
                  style={{ color: CYAN, fontWeight: 700 }}
                  suppressHydrationWarning
                >
                  {pilotLine(joinedAt)}
                </p>
              )}
            </div>
          </div>

          {tagline && (
            <p className="text-sm mt-3 line-clamp-1" style={{ color: "#475569", fontWeight: 600 }}>
              {tagline}
            </p>
          )}

          {/* The profile block carries ONE door into the full profile (where
              the numbers live) — instead of that door hiding in Quick
              actions. The "on the pilot · N weeks in" line is gone (founder
              call, 18 Aug): pilot tenure is not something you act on, and it
              was spending the height that money deserves. */}
          <ProfileTrigger profileId={viewerId} className="w-full mt-3">
            <span
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-[13px] font-black font-headline transition-transform hover:-translate-y-0.5"
              style={{
                color: CYAN,
                backgroundColor: "rgba(255,255,255,0.75)",
                boxShadow: `inset 0 0 0 1.5px ${CYAN}33`,
              }}
            >
              Show full profile
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </ProfileTrigger>

          {/* EARNINGS — a real card, because this is the number an expert
              opens the dashboard for. Centred and chevroned to match the
              profile door directly above it; carries more weight than that
              door through the filled tint and the 20px figure. */}
          <Link
            href="/dashboard/earnings"
            className="mt-2 flex flex-col items-center rounded-xl px-4 py-2.5 transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "rgba(8,145,178,0.12)", boxShadow: `inset 0 0 0 1.5px ${CYAN}4D` }}
          >
            <span className="flex items-center gap-1.5">
              <span className="shrink-0" style={{ color: CYAN }}>{STAT_ICONS.coins}</span>
              <span className="text-[20px] font-black font-headline leading-none tabular-nums" style={{ color: INK }}>
                CHF {(earningsMonthCents / 100).toFixed(0)}
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
            <span className="text-[10.5px] mt-1" style={{ color: "#64748b", fontWeight: 600 }}>
              earned this month
            </span>
          </Link>
        </div>

        {/* ── NEEDS YOU ── the focus stack; only when something does. */}
        {attention.length > 0 && (
          <Section label="Needs you">
            <div className="space-y-2">{attention}</div>
          </Section>
        )}

        {/* ── QUICK ACTIONS ── the console is now purely who-you-are +
            what-needs-you + what-you-can-do (founder call, 18 Aug). The
            numbers moved to the profile, which already carried the same
            proof band. Same button design as before, half-width in pairs so
            the block costs a third of the height it did. "View my profile"
            is gone from here: its door is the profile block above. */}
        <Section label="Quick actions">
          <Link
            href="/dashboard/create"
            className="lg:hidden flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-[13px] font-black font-headline text-white transition-transform hover:scale-[1.01] mb-1.5"
            style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
          >
            {PLUS_ICON}
            New experience
          </Link>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => openOverlay("edit-profile")} className={railBtn} style={railActionStyle}>
              {EDIT_ICON}
              Edit profile
            </button>
            <button type="button" onClick={() => openOverlay("settings")} className={railBtn} style={railActionStyle}>
              Agreements
            </button>
          </div>
          <div className="mt-1.5">
            <CalendarButton href="/dashboard/calendar" label="Export calendar" block />
          </div>
        </Section>
      </div>

      {/* The overlays this rail opens. */}
      <EditProfilePanel
        displayName={displayName}
        tagline={tagline ?? ""}
        bio={bio ?? ""}
        avatarUrl={avatarUrl}
        isCreator
        initialFacts={profileFacts as ProfileFacts}
      />
      <AgreementsPanel agreements={agreements} />
      <PeoplePanel connections={connections} isExpert />
      <ReviewsPanel reviews={reviews} />
    </>
  );
}
