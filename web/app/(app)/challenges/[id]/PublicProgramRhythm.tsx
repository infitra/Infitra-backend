/**
 * PublicProgramRhythm — Bundle 4.2.3 (carousel-based).
 *
 * Section 1's second beat. The vertical cyan spine was a "list of weeks"
 * stretched too far vertically — the journey metaphor didn't land. This
 * version is a compact horizontal carousel: one week per slide, with
 * a "journey track" pagination indicator beneath that finally embodies
 * the spine in a form that works (compact, glanceable, the buyer's
 * position is explicit).
 *
 * The carousel is a client component (WeeklyJourneyCarousel) because it
 * needs auto-rotate + scroll-snap state. This wrapper stays server-side
 * so the data fetching and CTA logic don't need to ship to the client.
 *
 * First CTA — "I'm in" — sits at the end of this section as the natural
 * decision moment after the buyer has watched the journey unfold.
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";
import { WeeklyJourneyCarousel } from "./WeeklyJourneyCarousel";

interface SessionLite {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
}

interface Props {
  challengeId: string;
  spaceId: string | null;
  startDate: string;
  endDate: string;
  weeklyArc: Array<{ week: number; theme: string }>;
  sessions: SessionLite[];
  priceCents: number;
  currency: string;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}

function weekRange(startDate: string, weekNumber: number): { start: Date; end: Date } {
  const programStart = new Date(startDate + "T00:00:00");
  const start = new Date(programStart.getTime() + (weekNumber - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start, end };
}

function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function computeTotalWeeks(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
  const days = Math.floor((e.getTime() - s.getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

function sessionWeekNumber(startDate: string, totalWeeks: number, sessionIso: string): number {
  const programStart = new Date(startDate + "T00:00:00");
  const sStart = new Date(sessionIso);
  if (isNaN(programStart.getTime()) || isNaN(sStart.getTime())) return 1;
  const days = Math.floor((sStart.getTime() - programStart.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.max(1, Math.min(totalWeeks, Math.floor(days / 7) + 1));
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(0)}`;
}

export function PublicProgramRhythm({
  challengeId,
  spaceId,
  startDate,
  endDate,
  weeklyArc,
  sessions,
  priceCents,
  currency,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const totalWeeks = computeTotalWeeks(startDate, endDate);
  if (totalWeeks === 0) return null;

  // Bucket sessions by week + sort within each week
  const sessionsByWeek = new Map<number, SessionLite[]>();
  for (const s of sessions) {
    const w = sessionWeekNumber(startDate, totalWeeks, s.start_time);
    if (!sessionsByWeek.has(w)) sessionsByWeek.set(w, []);
    sessionsByWeek.get(w)!.push(s);
  }
  for (const arr of sessionsByWeek.values()) {
    arr.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  // Build the weeks array the carousel consumes
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).map((n) => {
    const range = weekRange(startDate, n);
    return {
      weekNumber: n,
      weekRange: formatWeekRange(range.start, range.end),
      theme: weeklyArc.find((f) => f.week === n)?.theme ?? null,
      sessions: sessionsByWeek.get(n) ?? [],
    };
  });

  const priceLabel = formatPrice(priceCents, currency);

  return (
    <section className="px-4 lg:px-12 pt-10 lg:pt-14 pb-16 lg:pb-24">
      <div className="max-w-2xl mx-auto">
        <WeeklyJourneyCarousel weeks={weeks} />

        {/* First CTA — the decision moment after the journey has played.
            Anchors the end of section 1. */}
        <div className="mt-12 lg:mt-16 flex justify-center">
          <FirstCTA
            challengeId={challengeId}
            spaceId={spaceId}
            priceLabel={priceLabel}
            isAuthenticated={isAuthenticated}
            hasPurchased={hasPurchased}
            isCreator={isCreator}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * First CTA — auth-aware. Lives at the end of section 1 as the
 * decision moment after card + carousel.
 */
function FirstCTA({
  challengeId,
  spaceId,
  priceLabel,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: {
  challengeId: string;
  spaceId: string | null;
  priceLabel: string;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}) {
  if (isCreator) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold font-headline"
        style={{
          backgroundColor: "rgba(255,97,48,0.10)",
          color: "#c2410c",
          border: "1px solid rgba(255,97,48,0.20)",
        }}
      >
        <span>👀</span>
        <span>Preview — you&apos;re an Expert on this program</span>
      </div>
    );
  }

  if (hasPurchased) {
    return (
      <Link
        href={spaceId ? `/communities/challenge/${spaceId}` : "/me"}
        className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01]"
        style={{
          backgroundColor: "#0891b2",
          boxShadow:
            "0 6px 20px rgba(8,145,178,0.30), 0 2px 6px rgba(8,145,178,0.20)",
        }}
      >
        You&apos;re in — open your tribe space →
      </Link>
    );
  }

  if (isAuthenticated) {
    return (
      <PurchaseButton
        kind="challenge"
        targetId={challengeId}
        label={`I'm in — ${priceLabel} →`}
        className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01] disabled:opacity-70 bg-[#FF6130] shadow-[0_6px_20px_rgba(255,97,48,0.40),0_2px_6px_rgba(255,97,48,0.20)]"
      />
    );
  }

  return (
    <Link
      href={`/login?intent=buy:challenge:${challengeId}&returnTo=/challenges/${challengeId}`}
      className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01]"
      style={{
        backgroundColor: "#FF6130",
        boxShadow:
          "0 6px 20px rgba(255,97,48,0.40), 0 2px 6px rgba(255,97,48,0.20)",
      }}
    >
      I&apos;m in — {priceLabel} →
    </Link>
  );
}
