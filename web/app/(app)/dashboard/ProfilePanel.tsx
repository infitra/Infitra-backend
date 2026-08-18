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
  /** Experiences running or about to run. */
  activeExperiences: number;
  /** Members across currently ACTIVE experiences — "moving now". */
  activeMembers: number;
  /** Everyone who has EVER joined one of their experiences. */
  tribeConnections: number;
  avgRating: number;
  totalReviews: number;
  sessionsLed: number;
  earningsWeekCents: number;
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

/** One micro-stat in the glance card: value on top, 9px caps label under.
 *  Cyan value = a door (overlay or link); ink value = a plain reading. */
function GlanceCell({
  value,
  label,
  onClick,
  href,
}: {
  value: string;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const interactive = !!onClick || !!href;
  const inner = (
    <>
      <span
        className="block text-[15px] font-black font-headline leading-tight tabular-nums"
        style={{ color: interactive ? CYAN : INK }}
      >
        {value}
      </span>
      <span
        className="block text-[9px] uppercase tracking-[0.12em] font-headline mt-0.5 truncate"
        style={{ color: "#94a3b8", fontWeight: 700 }}
      >
        {label}
      </span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="min-w-0 rounded-lg py-1 transition-colors hover:bg-[rgba(8,145,178,0.06)]">
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="min-w-0 rounded-lg py-1 transition-colors hover:bg-[rgba(8,145,178,0.06)]">
        {inner}
      </button>
    );
  }
  return <span className="min-w-0 py-1">{inner}</span>;
}

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
  activeExperiences,
  activeMembers,
  tribeConnections,
  avgRating,
  totalReviews,
  sessionsLed,
  earningsWeekCents,
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
        </div>

        {/* ── NEEDS YOU ── the focus stack; only when something does. */}
        {attention.length > 0 && (
          <Section label="Needs you">
            <div className="space-y-2">{attention}</div>
          </Section>
        )}

        {/* ── AT A GLANCE ── compressed from six tiles, but every label now
            says WHICH population and WHICH period it counts (founder call,
            17 Aug: "members" and "sessions" alone were ambiguous — active
            vs lifetime). 2x2 so the labels fit on one line at 340px. */}
        <Section label="At a glance">
          <div className="rounded-xl px-3.5 py-3" style={{ backgroundColor: "rgba(8,145,178,0.05)" }}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <GlanceCell value={`${activeMembers}`} label="active members" />
              <GlanceCell value={`${sessionsLed}`} label="sessions led" />
              <GlanceCell
                value={totalReviews > 0 ? `★ ${avgRating.toFixed(1)}` : "—"}
                label={totalReviews > 0 ? `${totalReviews} ${totalReviews === 1 ? "review" : "reviews"}` : "no reviews yet"}
                onClick={totalReviews > 0 ? () => openOverlay("reviews") : undefined}
              />
              <GlanceCell
                value={`CHF ${(earningsWeekCents / 100).toFixed(0)}`}
                label="earned this week"
                href="/dashboard/earnings"
              />
            </div>

            {/* CONNECTIONS gets its own weighted row (founder call): everyone
                who has ever been in one of your experiences is the platform's
                glue — the people you can invite into the next one. */}
            <button
              type="button"
              onClick={() => openOverlay("people")}
              className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 mt-3 text-left transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "rgba(8,145,178,0.10)", boxShadow: `inset 0 0 0 1.5px ${CYAN}33` }}
            >
              <span className="shrink-0" style={{ color: CYAN }}>{STAT_ICONS.people}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-black font-headline leading-tight" style={{ color: CYAN }}>
                  {tribeConnections} tribe connections
                </span>
                <span className="block text-[10.5px] leading-tight mt-0.5" style={{ color: "#64748b" }}>
                  everyone you have run with · meet your people
                </span>
              </span>
              <span className="text-[11px] font-black shrink-0" style={{ color: CYAN }}>→</span>
            </button>

            <p className="text-[11px] font-bold font-headline mt-2.5" style={{ color: "#94a3b8" }}>
              {activeExperiences} active {activeExperiences === 1 ? "experience" : "experiences"}
            </p>
          </div>
        </Section>

        {/* ── QUICK ACTIONS ── back to the full-width stack (founder call,
            17 Aug: the chip row was too quiet — worth the extra height),
            just tighter than the original. */}
        <Section label="Quick actions">
          <Link
            href="/dashboard/create"
            className="lg:hidden flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 px-4 text-[13px] font-black font-headline text-white transition-transform hover:scale-[1.01] mb-1.5"
            style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
          >
            {PLUS_ICON}
            New experience
          </Link>
          <button type="button" onClick={() => openOverlay("edit-profile")} className={`${railBtn} mb-1.5`} style={railActionStyle}>
            {EDIT_ICON}
            Edit profile
          </button>
          <ProfileTrigger profileId={viewerId} className="w-full mb-1.5">
            <span className={railBtn} style={railActionStyle}>
              View my profile
            </span>
          </ProfileTrigger>
          <button type="button" onClick={() => openOverlay("settings")} className={`${railBtn} mb-1.5`} style={railActionStyle}>
            My recorded agreements
          </button>
          <CalendarButton href="/dashboard/calendar" label="Export calendar" block />
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
