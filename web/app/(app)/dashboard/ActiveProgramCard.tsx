import Link from "next/link";
import Image from "next/image";
import { PrimaryActionPill } from "./PrimaryActionPill";
import { ShareButton } from "./ShareButton";

/**
 * ActiveProgramCard — a live experience, side-by-side.
 *
 * Hero density: the cover fills the LEFT column (no dead space — the content is
 * taller than a fixed-ratio cover would be, so it fills like the Space header
 * does); the content reads down the RIGHT:
 *   PEOPLE    — the experts.
 *   SIGNALS   — live stats: tribe (+ growth), new posts, open questions. Colour
 *               + dots + deltas so it reads as movement, not a static table.
 *   SESSION   — a cream, editorial card for the next session, with its image.
 *   DOOR      — one way in; share + contract are quiet secondaries.
 * Stage lives only on the cover chip. Soft shadow matches the Experience Space.
 *
 * Side-by-side engages at xl; below xl the card stacks (cover on top at the
 * buyer ratio). Compact density (tier-2 when 2+ are live) always stacks.
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
  /** Viewer's IANA timezone — for rendering the next session's date/time. */
  timeZone?: string;
}

const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE_TXT = "#c2410c";
const GREEN = "#1D9E75";
const MUTED = "#94a3b8";
const SOFT_SHADOW = "0 0 0 1px rgba(15,34,41,0.05), 0 10px 32px rgba(15,34,41,0.10)";

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

// Editorial date+time for the session card. Today/tomorrow read as words;
// everything else is an absolute date in the viewer's zone ("Sun, 3 Jan · 19:00").
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
  const accent = s.live ? "#ef4444" : CYAN;
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

// ─── Cover ───────────────────────────────────────────────────
// Stacks on top (buyer ratio 5:4 / 3:2) below xl; fills the left column at xl
// so the card never carries dead space beneath a fixed-ratio cover.
function Cover({ program, density }: { program: Program; density: "hero" | "compact" }) {
  const isHero = density === "hero";
  return (
    <div
      className={`relative w-full overflow-hidden aspect-[5/4] lg:aspect-[3/2] ${
        isHero ? "xl:aspect-auto xl:w-[46%] xl:shrink-0 xl:min-h-[300px]" : ""
      }`}
      style={{ backgroundColor: INK }}
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
  const color = accent === "orange" ? "#FF6130" : CYAN;
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
        <p className="text-sm font-headline truncate" style={{ color: INK, fontWeight: 700 }}>
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
      <PersonBox avatar={user.avatar} initial={user.initial} name={user.name} role="OWNER" accent="orange" />
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

// ─── SIGNALS — live stats that read as movement ──────────────

function SignalCell({
  value,
  delta,
  label,
  accent = "ink",
  dot = false,
  first = false,
}: {
  value: string | number;
  delta?: string;
  label: string;
  accent?: "ink" | "cyan" | "orange";
  dot?: boolean;
  first?: boolean;
}) {
  const color = accent === "cyan" ? CYAN : accent === "orange" ? ORANGE_TXT : INK;
  return (
    <div
      className="flex-1 text-center px-1.5 py-3"
      style={{ borderLeft: first ? undefined : "1px solid rgba(15,34,41,0.08)" }}
    >
      <div className="flex items-center justify-center gap-1">
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
        <span className="text-lg font-black font-headline leading-none tabular-nums" style={{ color }}>
          {value}
        </span>
        {delta && (
          <span className="text-[10px] font-bold font-headline" style={{ color: GREEN }}>
            {delta}
          </span>
        )}
      </div>
      <div className="text-[11px] mt-1" style={{ color: accent === "orange" ? ORANGE_TXT : MUTED }}>
        {label}
      </div>
    </div>
  );
}

function SignalStrip({ program }: { program: Program }) {
  const enrolled = program.enrolledCount ?? 0;
  const newMembers = program.newMembersThisWeek ?? 0;
  const posts = program.newPosts ?? 0;
  const questions = program.pendingQuestions ?? 0;
  const isLive = program.stage === "published-live";
  const tw = totalWeeks(program.startDate, program.endDate);
  const cw = Math.min(currentWeek(program.startDate), tw || 1);

  const cells: React.ReactNode[] = [
    <SignalCell
      key="tribe"
      first
      value={enrolled}
      delta={newMembers > 0 ? `+${newMembers}` : undefined}
      label="in the tribe"
    />,
    <SignalCell key="posts" value={posts} label="new posts" accent="cyan" dot={posts > 0} />,
  ];
  if (questions > 0) {
    cells.push(
      <SignalCell key="q" value={questions} label="open questions" accent="orange" dot />,
    );
  } else if (isLive && tw > 0) {
    cells.push(<SignalCell key="week" value={`${cw}/${tw}`} label="week" />);
  }

  return (
    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(15,34,41,0.10)" }}>
      {cells}
    </div>
  );
}

// ─── SESSION — cream editorial card, image-forward ───────────

function SessionCard({
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
    <div
      className="flex items-center gap-4 rounded-xl p-3"
      style={{ backgroundColor: "#F6F2EA", border: "1px solid rgba(15,34,41,0.06)" }}
    >
      <div className="relative w-28 h-[78px] rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: "#22424a" }}>
        {img ? (
          <Image src={img} alt="" fill sizes="112px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CF0FF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
          Next moment
        </p>
        <p className="text-[15px] font-bold font-headline truncate mt-0.5" style={{ color: INK }}>
          {session.title}
        </p>
        <p className="text-[12px] font-medium mt-1" style={{ color: "#64748b" }} suppressHydrationWarning>
          {sessionWhen(session.startTime, timeZone)}
        </p>
      </div>
    </div>
  );
}

// ─── Empty state (no program yet) ────────────────────────────

function EmptyState({ user }: { user: UserProfile }) {
  return (
    <div
      className="rounded-3xl p-8 md:p-10"
      style={{ backgroundColor: "#FFFFFF", boxShadow: SOFT_SHADOW }}
    >
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
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
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
        color: CYAN,
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

  const enrolled = program.enrolledCount ?? 0;
  const warmingUp =
    enrolled === 0 && (program.newPosts ?? 0) === 0 && (program.pendingQuestions ?? 0) === 0;

  return (
    <article
      className={`relative transition-shadow flex flex-col overflow-hidden ${
        isHero ? "rounded-3xl xl:flex-row" : "rounded-2xl"
      }`}
      style={{ backgroundColor: "#FFFFFF", boxShadow: SOFT_SHADOW }}
    >
      {/* Share the card — copies the public buyer-page link. Top-right corner. */}
      {showShare && <ShareButton challengeId={program.id} />}

      {/* The face — cover + overlaid status. */}
      <Cover program={program} density={density} />

      <div className={`${isHero ? "p-7 md:p-8 xl:flex-1 xl:justify-center" : "p-5"} flex flex-col min-w-0`}>
        <h2
          className={`${isHero ? "text-2xl md:text-3xl xl:pr-12" : "text-lg md:text-xl pr-12"} font-headline tracking-tight`}
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {program.title || "Untitled"}
        </h2>

        {/* PEOPLE — the experts. */}
        <div className="mt-5">
          <PartiesRow user={user} partner={partner} isOwner={program.isOwner} />
        </div>

        {/* SIGNALS — live stats, or the warming-up line. */}
        <div className="mt-5">
          {warmingUp ? (
            <div
              className="rounded-xl p-3.5 text-[12px] font-bold font-headline"
              style={{ border: "1px solid rgba(15,34,41,0.10)", color: MUTED }}
            >
              Your tribe is forming — share to fill it
            </div>
          ) : (
            <SignalStrip program={program} />
          )}
        </div>

        {/* SESSION — cream editorial card with the session image. */}
        {program.nextSession && (
          <div className="mt-4">
            <SessionCard session={program.nextSession} fallbackImage={program.imageUrl} timeZone={timeZone} />
          </div>
        )}

        {/* DOOR — Open Experience Space (heaviest) + View contract. Share is
            the top-right icon now, so the bottom stays to two clean actions. */}
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
          <PrimaryActionPill label={doorLabel} kind="navigate" href={doorHref} variant="filled" />
          <SecondaryActions program={program} />
        </div>
      </div>
    </article>
  );
}
