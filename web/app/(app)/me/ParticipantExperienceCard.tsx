import Link from "next/link";
import { RateExperienceButton } from "./RateExperienceButton";
import { TribeConstellation, type TribeFace } from "@/app/components/TribeConstellation";
import { LegendNote, TribeHeadcount, ActivityLine } from "@/app/components/ExperienceLegend";

/**
 * The participant's view of an experience they've joined — the symmetric
 * counterpart to the creator's ActiveProgramCard, rendered from the same
 * vocabulary (filling cover, cream "Next moment" card, soft shadow) but leaner:
 * a member doesn't host, so it's a *window into the tribe* —
 *   MOMENTUM  — where you are (progress bar) + what's moving (new posts).
 *   NEXT      — the next moment, with its image.
 *   DOOR      — Enter your space.
 * Completed experiences render compact, with a "Rate this experience" nudge.
 */

const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";
const RED = "#ef4444";
const MUTED = "#94a3b8";
const SOFT_SHADOW = "0 0 0 1px rgba(15,34,41,0.05), 0 10px 32px rgba(15,34,41,0.10)";

export interface MeExperience {
  id: string;
  title: string;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  spaceId: string | null;
  stage: "pre-launch" | "live" | "completed";
  experts: { id: string; name: string; avatar: string | null; role: "owner" | "cohost" }[];
  nextSession: {
    id: string;
    title: string;
    startTime: string;
    imageUrl: string | null;
    /** "live" (expert in the room) | "doors" (room open) | null (upcoming).
     *  A live session OWNS this slot — the one surface participants check
     *  on their phone must never show tomorrow while a room is open now. */
    liveState: "live" | "doors" | null;
  } | null;
  /** Capped member faces + total for the tribe constellation. */
  tribeFaces?: TribeFace[];
  memberTotal?: number;
  newPosts: number;
  rated: boolean;
  /** For a completed run whose lineage moved on: the joinable next/live run the
   *  viewer doesn't already hold. Drives the "this continued — rejoin" strip. */
  continuation: { id: string; startDate: string | null; isActive: boolean } | null;
}

// ─── Helpers ─────────────────────────────────────────────────

function totalWeeks(startIso: string | null, endIso: string | null): number {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso);
  const e = new Date(endIso);
  const days = Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.ceil(days / 7));
}

function currentWeek(startIso: string | null): number {
  if (!startIso) return 1;
  const s = new Date(startIso);
  s.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((t.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function sessionWhen(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  let time: string;
  try {
    time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
  } catch {
    time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  const days = daysUntil(iso);
  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  let date: string;
  try {
    date = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone });
  } catch {
    date = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }
  return `${date} · ${time}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Status chip (overlays the cover) ────────────────────────

function statusLabel(exp: MeExperience): { label: string; live: boolean } {
  if (exp.stage === "completed") return { label: "Completed", live: false };
  if (exp.stage === "live") {
    const cw = currentWeek(exp.startDate);
    const tw = totalWeeks(exp.startDate, exp.endDate);
    return { label: tw > 0 ? `Live · Week ${cw} of ${tw}` : "Live", live: true };
  }
  const d = daysUntil(exp.startDate);
  if (d === null) return { label: "Starting soon", live: false };
  if (d <= 0) return { label: "Starts today", live: false };
  if (d === 1) return { label: "Starts tomorrow", live: false };
  return { label: `Starts in ${d} days`, live: false };
}

function StatusChip({ exp }: { exp: MeExperience }) {
  const s = statusLabel(exp);
  const accent = s.live ? "#ef4444" : CYAN;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] font-headline"
      style={{ backgroundColor: "rgba(255,255,255,0.92)", color: accent, fontWeight: 800 }}
    >
      {s.live && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />}
      {s.label}
    </span>
  );
}

// ─── Active card — ONE composition (mirrors the expert hero) ─
//
// Title and status crown it, the tribe orbits in the middle with the legend
// reading it beside, and the door sits centred at the foot. Same grammar as
// the expert dashboard so the product reads as one building from either
// side; the CONTENT is the participant's: where you are in the journey, what
// is next, what your tribe has been doing.
//
// The live moment is promoted to the PRIMARY door rather than living inside
// a note. When a room is open, "Join the room" is the biggest thing on the
// card, which is what it should be.

export function ParticipantExperienceCard({
  exp,
  timeZone,
  viewerId,
}: {
  exp: MeExperience;
  timeZone?: string;
  viewerId?: string;
}) {
  // Always /space — load_experience_space resolves the space across the lineage
  // (a continuation run shares the source's space, so it has no own spaceId).
  const spaceHref = `/experiences/${exp.id}/space`;
  const live = exp.nextSession?.liveState === "live";
  const joinable = !!exp.nextSession && exp.nextSession.liveState !== null;
  const joinAccent = live ? RED : ORANGE;

  const tw = totalWeeks(exp.startDate, exp.endDate);
  const cw = Math.min(currentWeek(exp.startDate), tw || 1);
  const showProgress = exp.stage === "live" && tw > 0;

  return (
    <article
      className="relative rounded-3xl p-6 md:p-8 overflow-hidden flex flex-col lg:flex-1"
      style={{ backgroundColor: "#FFFFFF", boxShadow: SOFT_SHADOW }}
    >
      <header className="relative z-10 text-center px-2">
        <StatusChip exp={exp} />
        <h2
          className="mt-2.5 text-2xl md:text-3xl font-headline tracking-tight"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {exp.title || "Untitled experience"}
        </h2>
      </header>

      <div className="relative z-10 mt-5 grid gap-7 lg:flex-1 lg:content-center xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-center">
        <div className="relative flex justify-center">
          {/* The glow bleeds past this column and is clipped by the card's
              own rounded edge, so the orbit sits in light, not in a box. */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              inset: "-18%",
              background:
                "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(8,145,178,0.14) 0%, rgba(255,97,48,0.07) 55%, transparent 76%)",
            }}
          />
          <TribeConstellation
            experts={exp.experts.map((e) => ({ id: e.id, name: e.name, avatar: e.avatar }))}
            members={exp.tribeFaces ?? []}
            memberTotal={exp.memberTotal ?? 0}
            viewerId={viewerId ?? null}
            maxWidth={400}
            className="z-10"
          />
        </div>

        <div className="px-1">
          <LegendNote label="Your tribe">
            <TribeHeadcount memberTotal={exp.memberTotal ?? 0} />
          </LegendNote>

          {showProgress && (
            <LegendNote label="Where you are">
              <p className="text-[16px] font-bold font-headline leading-snug" style={{ color: INK }}>
                Week {cw} of {tw}
              </p>
              <div
                className="h-1.5 rounded-full overflow-hidden mt-2"
                style={{ backgroundColor: "rgba(15,34,41,0.08)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round((cw / tw) * 100)}%`, backgroundColor: CYAN }}
                />
              </div>
            </LegendNote>
          )}

          {exp.nextSession && (
            <LegendNote label={live ? "Live now" : exp.nextSession.liveState === "doors" ? "Doors open" : "Next moment"}>
              <p className="text-[16px] font-bold font-headline leading-snug" style={{ color: INK }}>
                {exp.nextSession.title}
              </p>
              <p
                className="text-[13px] font-medium mt-1"
                style={{ color: joinable ? joinAccent : "#64748b", fontWeight: joinable ? 700 : 500 }}
                suppressHydrationWarning
              >
                {joinable ? "Your experts are waiting" : sessionWhen(exp.nextSession.startTime, timeZone)}
              </p>
            </LegendNote>
          )}

          <LegendNote label="Your tribe this week">
            {exp.newPosts > 0 ? (
              <ActivityLine
                value={exp.newPosts}
                singular="new post"
                plural="new posts"
                color={CYAN}
              />
            ) : (
              <p className="text-[13px]" style={{ color: MUTED, fontWeight: 600 }}>
                {exp.stage === "pre-launch" ? "Your tribe is forming" : "Quiet so far"}
              </p>
            )}
          </LegendNote>
        </div>
      </div>

      {/* THE DOOR — an open room outranks everything else on this card. */}
      <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3">
        {joinable && exp.nextSession ? (
          <>
            <Link
              href={`/sessions/${exp.nextSession.id}/live`}
              className="inline-flex items-center justify-center px-7 py-3 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: joinAccent,
                boxShadow: live
                  ? "0 6px 18px rgba(239,68,68,0.35)"
                  : "0 6px 18px rgba(255,97,48,0.32)",
              }}
            >
              Join the room →
            </Link>
            <Link
              href={spaceHref}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-black font-headline transition-colors hover:bg-[rgba(15,34,41,0.04)]"
              style={{ color: CYAN, boxShadow: `inset 0 0 0 1.5px ${CYAN}40` }}
            >
              Your experience
            </Link>
          </>
        ) : (
          <Link
            href={spaceHref}
            className="inline-flex items-center justify-center px-7 py-3 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: ORANGE, boxShadow: "0 6px 18px rgba(255,97,48,0.32), 0 2px 6px rgba(255,97,48,0.20)" }}
          >
            Enter your experience →
          </Link>
        )}
      </div>
    </article>
  );
}

// ─── Completed card (compact, with the rate nudge) ───────────

export function CompletedExperienceCard({ exp }: { exp: MeExperience }) {
  const spaceHref = `/experiences/${exp.id}/space`;
  const dateRange = `${shortDate(exp.startDate)} → ${shortDate(exp.endDate)}`;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 20px rgba(15,34,41,0.08)" }}
    >
      <div
        className="relative w-full aspect-[3/2]"
        style={{
          backgroundColor: INK,
          backgroundImage: exp.imageUrl ? `url(${exp.imageUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!exp.imageUrl && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.35), rgba(8,145,178,0.35)), #0F2229" }}
          />
        )}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] font-headline"
          style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#475569", fontWeight: 800 }}
        >
          Completed
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-bold font-headline tracking-tight truncate" style={{ color: INK }}>
          {exp.title || "Untitled experience"}
        </h3>
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          {dateRange}
        </p>

        {/* CONTINUATION — the lineage moved on. A bold call back in (→ the ended
            re-activate card in the space, which resolves to the live/next run). */}
        {exp.continuation && (
          <Link
            href={`/experiences/${exp.continuation.id}/space`}
            className="mt-4 block rounded-xl p-3.5 transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, rgba(255,97,48,0.15), rgba(255,97,48,0.06))",
              boxShadow: "0 0 0 1px rgba(255,97,48,0.28)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.16em] font-headline flex items-center gap-1.5" style={{ color: ORANGE, fontWeight: 800 }}>
              {exp.continuation.isActive && <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ORANGE }} />}
              {exp.continuation.isActive ? "Continues · live now" : "This continues"}
            </p>
            <p className="text-[15px] font-black font-headline leading-snug mt-1" style={{ color: INK }} suppressHydrationWarning>
              {exp.continuation.isActive
                ? "Your tribe is live — don't miss it"
                : `The next run starts ${shortDate(exp.continuation.startDate)}`}
            </p>
            <span
              className="inline-flex items-center gap-1.5 mt-2.5 px-4 py-2 rounded-full text-white text-[12px] font-black font-headline"
              style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}
            >
              Jump back in →
            </span>
          </Link>
        )}

        <div className="mt-auto pt-4 flex items-center gap-3">
          {exp.rated ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-bold font-headline" style={{ color: "#475569" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={ORANGE} stroke={ORANGE} strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
              </svg>
              Rated
            </span>
          ) : (
            <RateExperienceButton challengeId={exp.id} experienceTitle={exp.title} />
          )}
          <Link
            href={spaceHref}
            className="ml-auto text-xs font-bold font-headline transition-colors hover:text-[#0F2229]"
            style={{ color: "#64748b" }}
          >
            Open space →
          </Link>
        </div>
      </div>
    </div>
  );
}
