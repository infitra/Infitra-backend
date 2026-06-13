import Link from "next/link";
import { PrimaryActionPill } from "./PrimaryActionPill";

/**
 * ActiveProgramCard — a live experience as a *pulse of its Experience Space*:
 * the people (experts), then the tribe's heartbeat (members, new posts, waiting
 * questions, next session, progress) — what's actually moving — and one door in.
 * No brochure cover; the action lives inside the experience, this just pulls you
 * in. Two states: "warming up" (quiet) and "moving" (activity to act on).
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
      style={{ backgroundColor: `${accent}14`, color: accent, fontWeight: 800 }}
    >
      {s.live && (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
      )}
      {s.label}
    </span>
  );
}

// ─── People row (the experts) ────────────────────────────────

function PersonBox({
  avatar,
  initial,
  name,
  role,
  accent,
  density,
  dim = false,
}: {
  avatar: string | null;
  initial: string;
  name: string;
  role: string;
  accent: "orange" | "cyan";
  density: "hero" | "compact";
  dim?: boolean;
}) {
  const color = accent === "orange" ? "#FF6130" : "#0891b2";
  const bg = accent === "orange" ? "rgba(255,97,48,0.04)" : "rgba(8,145,178,0.04)";
  const border = accent === "orange" ? "rgba(255,97,48,0.12)" : "rgba(8,145,178,0.12)";
  const isHero = density === "hero";
  const avatarSize = isHero ? "w-10 h-10" : "w-8 h-8";
  const nameSize = isHero ? "text-sm" : "text-xs";
  const roleSize = isHero ? "text-[10px]" : "text-[9px]";
  return (
    <div
      className={`flex items-center gap-2.5 ${isHero ? "p-2.5" : "px-2.5 py-1.5"} rounded-2xl min-w-0`}
      style={{ backgroundColor: bg, border: `1px solid ${border}`, opacity: dim ? 0.55 : 1 }}
    >
      <span
        className={`shrink-0 ${avatarSize} rounded-full overflow-hidden inline-flex items-center justify-center`}
        style={{ border: `1.5px solid ${color}40`, backgroundColor: avatar ? "transparent" : `${color}20` }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className={`${nameSize} font-headline`} style={{ color, fontWeight: 700 }}>
            {initial}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className={`${nameSize} font-headline truncate`} style={{ color: "#0F2229", fontWeight: 700 }}>
          {firstName(name)}
        </p>
        <p className={`${roleSize} uppercase tracking-widest font-headline`} style={{ color, fontWeight: 700 }}>
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
  density = "hero",
}: {
  user: UserProfile;
  partner: Partner | null;
  isOwner: boolean;
  density?: "hero" | "compact";
}) {
  if (!partner) {
    return (
      <PersonBox
        avatar={user.avatar}
        initial={user.initial}
        name={user.name}
        role="OWNER"
        accent="orange"
        density={density}
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
      density={density}
    />
  );
  const partnerBox = (
    <PersonBox
      avatar={partner.avatar}
      initial={partner.name[0]?.toUpperCase() ?? "?"}
      name={partner.name}
      role={partner.pendingInvite ? "PENDING" : isOwner ? "COHOST" : "OWNER"}
      accent={isOwner ? "cyan" : "orange"}
      density={density}
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

// ─── The pulse — the Experience Space heartbeat ──────────────

function PulseStrip({ program }: { program: Program }) {
  const enrolled = program.enrolledCount ?? 0;
  const questions = program.pendingQuestions ?? 0;
  const posts = program.newPosts ?? 0;
  const next = program.nextSession;
  const isLive = program.stage === "published-live";
  const tw = totalWeeks(program.startDate, program.endDate);
  const cw = Math.min(currentWeek(program.startDate), tw || 1);
  const hasActivity = questions > 0 || posts > 0;

  return (
    <div
      className="rounded-2xl p-4 space-y-3.5"
      style={{ backgroundColor: "#F8F6F0", border: "1px solid rgba(15,34,41,0.06)" }}
    >
      {/* Tribe + progress */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold font-headline mb-1.5">
          <span style={{ color: "#0F2229" }}>
            {enrolled} in the tribe
          </span>
          <span style={{ color: "#94a3b8" }}>
            {isLive && tw > 0 ? `Week ${cw} of ${tw}` : "Pre-launch"}
          </span>
        </div>
        {isLive && tw > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round((cw / tw) * 100)}%`, backgroundColor: "#0891b2" }}
            />
          </div>
        )}
      </div>

      {/* Next moment */}
      {next && (
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] uppercase tracking-[0.16em] font-headline shrink-0"
            style={{ color: "#0891b2", fontWeight: 800 }}
          >
            Next
          </span>
          <span className="text-sm font-bold font-headline truncate flex-1" style={{ color: "#0F2229" }}>
            {next.title}
          </span>
          <span
            className="text-[12px] font-black font-headline tabular-nums shrink-0"
            style={{ color: "#0F2229" }}
            suppressHydrationWarning
          >
            {formatRelative(next.startTime)}
          </span>
        </div>
      )}

      {/* What's moving — or the warming-up state. */}
      {hasActivity ? (
        <div className="flex flex-wrap items-center gap-2">
          {questions > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-black font-headline px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(255,97,48,0.12)", color: "#c2410c" }}
            >
              {questions} waiting {questions === 1 ? "question" : "questions"}
            </span>
          )}
          {posts > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold font-headline px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(8,145,178,0.10)", color: "#0891b2" }}
            >
              {posts} new {posts === 1 ? "post" : "posts"}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>
          {enrolled > 0
            ? "Quiet in the tribe — drop in to spark it"
            : "Your tribe is forming — share to fill it"}
        </p>
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

export function ActiveProgramCard({ program, partner, user, density = "hero" }: Props) {
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
      className={`${isHero ? "rounded-3xl p-6 md:p-8" : "rounded-2xl p-5"} infitra-card-link transition-shadow flex flex-col`}
      style={{ border: "1px solid rgba(15,34,41,0.10)", backgroundColor: "#FFFFFF" }}
    >
      <StatusPill program={program} />

      <h2
        className={`${isHero ? "text-2xl md:text-3xl" : "text-lg md:text-xl"} font-headline tracking-tight mt-3`}
        style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {program.title || "Untitled"}
      </h2>

      {/* People — the experts lead. */}
      <div className="mt-4">
        <PartiesRow user={user} partner={partner} isOwner={program.isOwner} density={density} />
      </div>

      {/* The pulse — what's moving in the Experience Space. */}
      <div className="mt-5">
        <PulseStrip program={program} />
      </div>

      <div className="flex-1" />

      {/* One door in. Share + contract are quiet secondaries. */}
      <div className={`${isHero ? "mt-6" : "mt-5"} flex flex-wrap items-center gap-x-4 gap-y-2`}>
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
    </article>
  );
}
