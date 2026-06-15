import Link from "next/link";
import Image from "next/image";
import { PrimaryActionPill } from "./PrimaryActionPill";
import { MetricStrip, type Metric } from "./MetricStrip";

/**
 * ActiveProgramCard — a live experience, side-by-side.
 *
 * Hero density (the one live experience that holds the page): the cover sits on
 * the LEFT at the buyer-page ratio (5:4 mobile, 3:2 desktop — identical box
 * everywhere so the auto-crop is identical everywhere), and the content reads
 * down the RIGHT in clear clusters:
 *   PEOPLE       — the experts (who).
 *   LIVE-STATE   — ONE panel: a metric strip (members · new posts · waiting /
 *                  week) on top, then the next session as a row WITH its image
 *                  and date. Replaces the old floating chip + bare-stat box.
 *   DOOR         — one way in; share + contract are quiet secondaries.
 * Stage lives only on the cover chip (no duplicate "pre-launch" labels).
 *
 * Side-by-side engages at xl (where the cover's fixed ratio leaves room beside
 * the content); below xl the card stacks (cover on top). Compact density
 * (tier-2 when 2+ are live) always stacks.
 */

export type ProgramStage =
  | "drafting-solo"
  | "drafting-jointly"
  | "awaiting-signatures"
  | "published-pre-launch"
  | "published-live"
  | "completed";

interface ProgramSession {
  id: string;
  title: string;
  startTime: string;
  imageUrl: string | null;
  status: string;
}

interface Program {
  id: string;
  title: string;
  imageUrl: string | null;
  stage: ProgramStage;
  startDate: string | null;
  endDate: string | null;
  isOwner: boolean;
  spaceId?: string | null;
  enrolledCount?: number;
  earningsCents?: number;
  earningsCentsThisWeek?: number;
  newMembersThisWeek?: number;
  sessionsDoneThisWeek?: number;
  /** Experience-pulse signals (H5) — populated by the loader. */
  pendingQuestions?: number;
  newPosts?: number;
  nextSession?: ProgramSession | null;
  sessions?: ProgramSession[];
}

interface Partner {
  name: string;
  avatar: string | null;
  pendingInvite: boolean;
}

interface UserProfile {
  name: string;
  avatar: string | null;
  initial: string;
}

interface Props {
  program: Program | null;
  partner: Partner | null;
  user: UserProfile;
  density?: "hero" | "compact";
  /** Viewer's IANA timezone — for rendering the next session's date. */
  timeZone?: string;
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

function formatRelative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "past";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "now";
  if (totalMin < 60) return `in ${totalMin}m`;
  const totalHours = Math.round(totalMin / 60);
  if (totalHours < 24) return `in ${totalHours}h`;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

// Near sessions (≤7d) read as a countdown ("tomorrow", "in 5 days"); far ones
// show an absolute date in the viewer's zone ("3 Jan") — both more useful than,
// and not redundant with, the stage countdown already on the cover chip.
function nextWhen(iso: string, timeZone?: string): string {
  const days = daysUntil(iso);
  if (days !== null && days >= 0 && days <= 7) return formatRelative(iso);
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone });
  } catch {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
}

function firstName(name: string | null | undefined): string {
  if (!name) return "your collaborator";
  return name.split(" ")[0] || name;
}

function formatEndDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Hero selection (used by the dashboard page) ─────────────

export function pickHero<T extends Program>(programs: T[]): {
  hero: T | null;
  others: T[];
} {
  if (programs.length === 0) return { hero: null, others: [] };
  const score = (p: T): number => {
    if (p.nextSession) {
      const mins = (new Date(p.nextSession.startTime).getTime() - Date.now()) / 60000;
      if (mins > 0 && mins < 15) return 100;
      if (mins > 0 && mins < 24 * 60) return 80;
    }
    if (p.stage === "published-pre-launch" && p.startDate) {
      const days = daysUntil(p.startDate);
      if (days !== null && days <= 7 && (p.enrolledCount ?? 0) === 0) return 60;
    }
    return 0;
  };
  let heroIdx = 0;
  let heroScore = score(programs[0]);
  for (let i = 1; i < programs.length; i++) {
    const s = score(programs[i]);
    if (s > heroScore) {
      heroScore = s;
      heroIdx = i;
    }
  }
  return { hero: programs[heroIdx], others: programs.filter((_, i) => i !== heroIdx) };
}

// ─── Status pill ─────────────────────────────────────────────

function statusFor(program: Program): { label: string; live: boolean } {
  switch (program.stage) {
    case "published-live": {
      const cw = currentWeek(program.startDate);
      const tw = totalWeeks(program.startDate, program.endDate);
      return { label: tw > 0 ? `Live · Week ${cw} of ${tw}` : "Live", live: true };
    }
    case "published-pre-launch": {
      const d = daysUntil(program.startDate);
      if (d === null) return { label: "Pre-launch", live: false };
      if (d <= 0) return { label: "Launches today", live: false };
      if (d === 1) return { label: "Launches tomorrow", live: false };
      return { label: `Launches in ${d} days`, live: false };
    }
    case "completed":
      return {
        label: program.endDate ? `Wrapped up · ${formatEndDate(program.endDate)}` : "Wrapped up",
        live: false,
      };
    default:
      return { label: "Drafting", live: false };
  }
}

function StatusPill({ program }: { program: Program }) {
  const s = statusFor(program);
  const accent = s.live ? "#ef4444" : "#0891b2";
  return (
    <span
      className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.16em] font-headline"
      style={{ backgroundColor: "rgba(255,255,255,0.92)", color: accent, fontWeight: 800 }}
    >
      {s.live && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
      )}
      {s.label}
    </span>
  );
}

// ─── Cover (editorial anchor) ────────────────────────────────
// A FIXED ratio everywhere — 5:4 mobile, 3:2 desktop — identical to the buyer
// page and the Experience Space header, so object-cover crops the photo the
// same way in all three places. Hero stacks below xl; side-by-side at xl with
// the cover top-aligned (self-start) so its ratio never gets stretched.
function Cover({ program, density }: { program: Program; density: "hero" | "compact" }) {
  const isHero = density === "hero";
  return (
    <div
      className={`relative w-full overflow-hidden aspect-[5/4] lg:aspect-[3/2] ${
        isHero ? "xl:w-[52%] xl:shrink-0 xl:self-start" : ""
      }`}
      style={{ backgroundColor: "#0F2229" }}
    >
      {program.imageUrl ? (
        <Image
          src={program.imageUrl}
          alt=""
          fill
          sizes="(max-width: 1280px) 100vw, 40vw"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,97,48,0.40), rgba(8,145,178,0.40)), #0F2229",
          }}
        />
      )}
      {/* Scrim so the overlaid pill stays legible on any photo. */}
      <div
        className="absolute inset-x-0 top-0 h-16"
        style={{ background: "linear-gradient(180deg, rgba(15,34,41,0.30), rgba(15,34,41,0))" }}
        aria-hidden
      />
      <div className="absolute top-3 left-3">
        <StatusPill program={program} />
      </div>
    </div>
  );
}

// ─── People (the experts) ────────────────────────────────────

function PersonBox({
  avatar,
  initial,
  name,
  role,
  accent,
  dim = false,
}: {
  avatar: string | null;
  initial: string;
  name: string;
  role: string;
  accent: "orange" | "cyan";
  dim?: boolean;
}) {
  const color = accent === "orange" ? "#FF6130" : "#0891b2";
  const bg = accent === "orange" ? "rgba(255,97,48,0.04)" : "rgba(8,145,178,0.04)";
  const border = accent === "orange" ? "rgba(255,97,48,0.12)" : "rgba(8,145,178,0.12)";
  return (
    <div
      className="flex items-center gap-2.5 p-2 rounded-xl min-w-0"
      style={{ backgroundColor: bg, border: `1px solid ${border}`, opacity: dim ? 0.55 : 1 }}
    >
      <span
        className="shrink-0 w-9 h-9 rounded-full overflow-hidden inline-flex items-center justify-center"
        style={{ border: `1.5px solid ${color}40`, backgroundColor: avatar ? "transparent" : `${color}20` }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-headline" style={{ color, fontWeight: 700 }}>
            {initial}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-headline truncate" style={{ color: "#0F2229", fontWeight: 700 }}>
          {firstName(name)}
        </p>
        <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color, fontWeight: 700 }}>
          {role}
        </p>
      </div>
    </div>
  );
}

function PartiesRow({
  user,
  partner,
  isOwner,
}: {
  user: UserProfile;
  partner: Partner | null;
  isOwner: boolean;
}) {
  if (!partner) {
    return (
      <PersonBox
        avatar={user.avatar}
        initial={user.initial}
        name={user.name}
        role="OWNER"
        accent="orange"
      />
    );
  }
  const userBox = (
    <PersonBox
      avatar={user.avatar}
      initial={user.initial}
      name={user.name}
      role={isOwner ? "OWNER" : "COHOST"}
      accent={isOwner ? "orange" : "cyan"}
    />
  );
  const partnerBox = (
    <PersonBox
      avatar={partner.avatar}
      initial={partner.name[0]?.toUpperCase() ?? "?"}
      name={partner.name}
      role={partner.pendingInvite ? "PENDING" : isOwner ? "COHOST" : "OWNER"}
      accent={isOwner ? "cyan" : "orange"}
      dim={partner.pendingInvite}
    />
  );
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {isOwner ? userBox : partnerBox}
      {isOwner ? partnerBox : userBox}
    </div>
  );
}

// ─── NEXT session row (inside the live-state panel) ──────────

function NextSessionRow({
  session,
  fallbackImage,
  timeZone,
}: {
  session: ProgramSession;
  fallbackImage: string | null;
  timeZone?: string;
}) {
  const img = session.imageUrl ?? fallbackImage;
  return (
    <div className="flex items-center gap-3 p-2.5">
      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: "#22424a" }}>
        {img ? (
          <Image src={img} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CF0FF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.14em] font-headline" style={{ color: "#0891b2", fontWeight: 800 }}>
          Next session
        </p>
        <p className="text-[13px] font-bold font-headline truncate" style={{ color: "#0F2229" }}>
          {session.title}
        </p>
      </div>
      <span
        className="text-[12px] font-bold font-headline shrink-0 pr-1 tabular-nums"
        style={{ color: "#0F2229" }}
        suppressHydrationWarning
      >
        {nextWhen(session.startTime, timeZone)}
      </span>
    </div>
  );
}

// ─── LIVE-STATE panel — one structured unit (metrics + next) ──

function LiveStatePanel({ program, timeZone }: { program: Program; timeZone?: string }) {
  const enrolled = program.enrolledCount ?? 0;
  const questions = program.pendingQuestions ?? 0;
  const posts = program.newPosts ?? 0;
  const next = program.nextSession;
  const isLive = program.stage === "published-live";
  const tw = totalWeeks(program.startDate, program.endDate);
  const cw = Math.min(currentWeek(program.startDate), tw || 1);

  if (enrolled === 0 && posts === 0 && questions === 0 && !next) {
    return (
      <div
        className="rounded-xl p-3.5 text-[12px] font-bold font-headline"
        style={{ backgroundColor: "#F8F6F0", border: "1px solid rgba(15,34,41,0.06)", color: "#94a3b8" }}
      >
        Your tribe is forming — share to fill it
      </div>
    );
  }

  const metrics: Metric[] = [
    { value: enrolled, label: enrolled === 1 ? "member" : "members" },
    { value: posts, label: "new posts", accent: "cyan" },
  ];
  if (questions > 0) {
    metrics.push({ value: questions, label: "waiting", accent: "orange" });
  } else if (isLive && tw > 0) {
    metrics.push({ value: `${cw}/${tw}`, label: "week" });
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(15,34,41,0.08)", backgroundColor: "#F8F6F0" }}
    >
      <MetricStrip metrics={metrics} framed={false} />
      {next && (
        <div style={{ borderTop: "1px solid rgba(15,34,41,0.08)", backgroundColor: "#FFFFFF" }}>
          <NextSessionRow session={next} fallbackImage={program.imageUrl} timeZone={timeZone} />
        </div>
      )}
    </div>
  );
}

// ─── Empty state (no program yet) ────────────────────────────

function EmptyState({ user }: { user: UserProfile }) {
  return (
    <div className="rounded-3xl p-8 md:p-10 infitra-card" style={{ border: "1px solid rgba(255,97,48,0.20)" }}>
      <p
        className="text-[10px] uppercase tracking-[0.25em] font-headline mb-4"
        style={{ color: "#FF6130", fontWeight: 700 }}
      >
        Start your first experience
      </p>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center -space-x-3 shrink-0">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt=""
              className="w-14 h-14 rounded-full object-cover relative z-10"
              style={{ border: "3px solid #FFFFFF", boxShadow: "0 4px 12px rgba(255,97,48,0.18)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center relative z-10"
              style={{
                border: "3px solid #FFFFFF",
                backgroundColor: "rgba(255,97,48,0.18)",
                boxShadow: "0 4px 12px rgba(255,97,48,0.18)",
              }}
            >
              <span className="text-base font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>
                {user.initial}
              </span>
            </div>
          )}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ border: "3px dashed rgba(255,97,48,0.45)", backgroundColor: "rgba(255,97,48,0.04)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6130" strokeWidth={2.2} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className="text-2xl md:text-3xl font-headline tracking-tight mb-2"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Build an experience with another expert.
          </h2>
          <p className="text-sm md:text-base mb-5" style={{ color: "#64748b" }}>
            Co-create one live experience with a complementary creator, sell it as one
            product, split revenue cleanly.
          </p>
          <Link
            href="/dashboard/create"
            className="inline-block px-6 py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: "#FF6130",
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            Invite a creator →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Contract chip (post-publish → contract view) ────────────

function showsContract(stage: ProgramStage): boolean {
  return (
    stage === "awaiting-signatures" ||
    stage === "published-pre-launch" ||
    stage === "published-live" ||
    stage === "completed"
  );
}

function SecondaryActions({ program }: { program: Program }) {
  if (!showsContract(program.stage)) return null;
  const postPublish =
    program.stage === "published-pre-launch" ||
    program.stage === "published-live" ||
    program.stage === "completed";
  const href = postPublish
    ? `/dashboard/collaborate/${program.id}/contract`
    : `/dashboard/collaborate/${program.id}`;
  return (
    <Link
      href={href}
      className="text-[11px] uppercase tracking-widest font-headline px-3 py-1.5 rounded-full transition-colors hover:bg-[#0F2229]/[0.05]"
      style={{
        color: "#0891b2",
        border: "1px solid rgba(8,145,178,0.25)",
        fontWeight: 700,
        backgroundColor: "rgba(255,255,255,0.85)",
      }}
    >
      {postPublish ? "View contract" : "Review terms"}
    </Link>
  );
}

// ─── Main ────────────────────────────────────────────────────

export function ActiveProgramCard({ program, partner, user, density = "hero", timeZone }: Props) {
  if (!program) {
    return <EmptyState user={user} />;
  }

  const isHero = density === "hero";
  const isDraftStage =
    program.stage === "drafting-solo" ||
    program.stage === "drafting-jointly" ||
    program.stage === "awaiting-signatures";
  const spaceHref = program.spaceId
    ? `/experiences/${program.id}/space`
    : `/experiences/${program.id}`;
  const doorHref = isDraftStage ? `/dashboard/collaborate/${program.id}` : spaceHref;
  const doorLabel = isDraftStage ? "Open workspace" : "Open Experience Space";
  const showShare =
    program.stage === "published-pre-launch" || program.stage === "published-live";

  return (
    <article
      className={`infitra-card-link transition-shadow flex flex-col overflow-hidden ${
        isHero ? "rounded-3xl xl:flex-row" : "rounded-2xl"
      }`}
      style={{ border: "1px solid rgba(15,34,41,0.10)", backgroundColor: "#FFFFFF" }}
    >
      {/* The face — cover + overlaid status. */}
      <Cover program={program} density={density} />

      <div className={`${isHero ? "p-6 md:p-7 xl:flex-1 xl:justify-center" : "p-5"} flex flex-col min-w-0`}>
        <h2
          className={`${isHero ? "text-2xl md:text-3xl" : "text-lg md:text-xl"} font-headline tracking-tight`}
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {program.title || "Untitled"}
        </h2>

        {/* PEOPLE — the experts. */}
        <div className="mt-4">
          <PartiesRow user={user} partner={partner} isOwner={program.isOwner} />
        </div>

        {/* LIVE-STATE — one structured panel: metrics + next session. */}
        <div className="mt-3.5">
          <LiveStatePanel program={program} timeZone={timeZone} />
        </div>

        {/* DOOR — one way in. Share + contract are quiet secondaries. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <PrimaryActionPill label={doorLabel} kind="navigate" href={doorHref} variant="filled" />
          {showShare && (
            <Link
              href={`/experiences/${program.id}`}
              className="text-xs md:text-sm font-headline transition-colors hover:text-[#0F2229]"
              style={{ color: "#475569", fontWeight: 600 }}
            >
              Share →
            </Link>
          )}
          <div className="flex-1" />
          <SecondaryActions program={program} />
        </div>
      </div>
    </article>
  );
}
