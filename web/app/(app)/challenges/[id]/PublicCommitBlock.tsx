/**
 * PublicCommitBlock — the commit beat.
 *
 * Price prominent, what's included as a quiet inventory, primary CTA
 * (Join), and time-commitment confirmation framing ("This program runs
 * Mon 22 May → Sun 25 Jun") so the buyer reconfirms the dates before
 * committing.
 *
 * Auth-aware:
 *  - Anonymous: "Sign in to join" → /login?returnTo=...
 *  - Authenticated buyer (not yet purchased): Stripe checkout via
 *    PurchaseButton
 *  - Already purchased: status badge + link to cohort space
 *  - Creator (owner/cohost): preview-mode badge, no CTA
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface Props {
  challengeId: string;
  title: string;
  priceCents: number;
  currency: string;
  startDate: string;
  endDate: string;
  sessionCount: number;
  creatorCount: number;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}

function formatPrice(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  return `${currency} ${amount}`;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function weeksBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function PublicCommitBlock({
  challengeId,
  title,
  priceCents,
  currency,
  startDate,
  endDate,
  sessionCount,
  creatorCount,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const weeks = weeksBetween(startDate, endDate);
  const price = formatPrice(priceCents, currency);

  return (
    <section
      className="px-6 lg:px-12 py-16 lg:py-24"
      style={{
        // Transparent at the top so the (app) layout's cream + wave
        // background shines through; warms toward the orange CTA at
        // the bottom. Page integrates into the INFITRA shell instead
        // of covering it with a solid bg.
        background:
          "linear-gradient(180deg, rgba(242,239,232,0) 0%, rgba(255,97,48,0.05) 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Time-commitment confirmation — sets the buyer mood for committing */}
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-[0.25em] mb-3 text-center"
          style={{ color: "#94a3b8" }}
        >
          Are you in?
        </p>
        <h2
          className="text-3xl lg:text-4xl font-black font-headline tracking-tight text-center mb-5"
          style={{ color: "#0F2229" }}
        >
          {title}
        </h2>
        <p
          className="text-base lg:text-lg text-center mb-12 leading-relaxed"
          style={{ color: "#475569" }}
        >
          This program runs{" "}
          <span className="font-bold" style={{ color: "#0F2229" }}>
            {formatLongDate(startDate)} → {formatLongDate(endDate)}
          </span>
          . Block out the {sessionCount}{" "}
          {sessionCount === 1 ? "session" : "sessions"} on your calendar so
          you can show up live.
        </p>

        {/* Price + inventory + CTA card */}
        <div
          className="rounded-3xl p-8 lg:p-10"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(15,34,41,0.08)",
            boxShadow:
              "0 4px 14px rgba(15,34,41,0.04), 0 16px 48px rgba(15,34,41,0.06)",
          }}
        >
          {/* Price */}
          <div className="text-center mb-6">
            <div
              className="text-5xl lg:text-6xl font-black font-headline tracking-tight"
              style={{ color: "#0F2229" }}
            >
              {price}
            </div>
            <p
              className="text-[11px] font-bold font-headline uppercase tracking-[0.18em] mt-2"
              style={{ color: "#94a3b8" }}
            >
              For the full {weeks}-{weeks === 1 ? "week" : "week"} program
            </p>
          </div>

          {/* What's included */}
          <ul
            className="space-y-3 mb-8 max-w-sm mx-auto"
            style={{ color: "#0F2229" }}
          >
            <IncludedLine>
              {sessionCount} live {sessionCount === 1 ? "session" : "sessions"} over {weeks}{" "}
              {weeks === 1 ? "week" : "weeks"}
            </IncludedLine>
            <IncludedLine>
              {creatorCount} {creatorCount === 1 ? "coach" : "coaches"} co-leading the program
            </IncludedLine>
            <IncludedLine>Cohort space + accountability throughout</IncludedLine>
          </ul>

          {/* CTA — auth-aware */}
          {isCreator ? (
            <div className="text-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold font-headline"
                style={{
                  backgroundColor: "rgba(255,97,48,0.10)",
                  color: "#c2410c",
                  border: "1px solid rgba(255,97,48,0.20)",
                }}
              >
                <span>👀</span>
                <span>Preview — you&apos;re a coach on this program</span>
              </div>
            </div>
          ) : hasPurchased ? (
            <div className="text-center">
              <Link
                href={`/communities/challenge/${challengeId}`}
                className="inline-block px-6 py-3.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.01]"
                style={{
                  backgroundColor: "#0891b2",
                  boxShadow: "0 4px 14px rgba(8,145,178,0.30)",
                }}
              >
                You&apos;re in — open challenge space →
              </Link>
            </div>
          ) : isAuthenticated ? (
            <PurchaseButton
              kind="challenge"
              targetId={challengeId}
              label={`Join — ${price}`}
            />
          ) : (
            <div className="text-center">
              <Link
                href={`/login?returnTo=/challenges/${challengeId}`}
                className="inline-block w-full py-3.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.01]"
                style={{
                  backgroundColor: "#FF6130",
                  boxShadow:
                    "0 6px 20px rgba(255,97,48,0.40), 0 2px 6px rgba(255,97,48,0.20)",
                }}
              >
                Sign in to join
              </Link>
              <p
                className="text-[11px] mt-3"
                style={{ color: "#94a3b8" }}
              >
                Quick sign-up, then complete checkout
              </p>
            </div>
          )}
        </div>

        {/* Quiet trust strip below the card */}
        <p
          className="text-[11px] text-center mt-6"
          style={{ color: "#94a3b8" }}
        >
          Live coaching · two coaches collaborating · group experience
        </p>
      </div>
    </section>
  );
}

function IncludedLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full"
        style={{ backgroundColor: "rgba(255,97,48,0.12)", color: "#FF6130" }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
