import Link from "next/link";
import Image from "next/image";
import { PrimaryActionPill } from "./PrimaryActionPill";
import { ShareButton } from "./ShareButton";
import { ReviewsDisclosure, type CardReview } from "./ReviewsDisclosure";
import { TribeConstellation, type TribeFace } from "@/app/components/TribeConstellation";

/**
 * ActiveProgramCard — a live experience. Two shapes, one component:
 *
 * THE TRIBE HERO (hero density, published) — a single vertical composition
 * that reads as a sentence: TITLE + status → the ORBIT of the tribe → the
 * DOOR at its threshold → a BAND with what is happening (next session
 * beside the live signals and reviews). Life floats on the page canvas
 * with a glow; only the band is carded. Same arrangement at every width,
 * which is what mobile already did.
 *
 * THE CLASSIC CARD (drafts at hero density, and every compact card) —
 * cover + content:
 *   PEOPLE    — the experts.
 *   SIGNALS   — live stats: tribe (+ growth), new posts, open questions.
 *   SESSION   — a cream, editorial card for the next session, with its image.
 *   DOOR      — one way in; share is the quiet secondary. The recorded
 *               agreement lives in Account settings, not on the card.
 * Side-by-side engages at xl; below xl it stacks (cover on top at the buyer
 * ratio). Compact density (tier-2 when 2+ are live) always stacks.
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
  /** Lineage-cumulative rating (vw_experience_review_stats), P6c. */
  reviewAvg?: number | null;
  reviewCount?: number;
  reviewsThisWeek?: number;
  reviews?: CardReview[];
  newPosts?: number;
  nextSession?: ProgramSession | null;
  sessions?: ProgramSession[];
  /** The upcoming next run in this lineage, folded into this card (it flips to
   *  become the active run once this one ends). */
  nextRun?: { id: string; title: string; startDate: string | null; stage: ProgramStage } | null;
  /** Capped member faces for the constellation (load_tribe_faces). */
  tribeFaces?: TribeFace[];
}

interface Partner {
  id?: string;
  name: string;
  avatar: string | null;
  pendingInvite: boolean;
}

interface UserProfile {
  id?: string;
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
const GROWTH = "#FF6130"; // growth deltas: brand orange, never green
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
          <span className="text-[10px] font-bold font-headline" style={{ color: GROWTH }}>
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
    // Softened (founder call, 17 Aug): no hard box around live numbers —
    // a faint tint and the thin dividers between cells carry the structure.
    <div className="flex rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(15,34,41,0.03)" }}>
      {cells}
    </div>
  );
}

// ─── LEGEND — margin notes beside the orbit (tribe hero) ─────
// Deliberately NOT a card: hairline-separated notes on the canvas, so the
// activity reads as annotations OF the constellation rather than a
// separate panel sitting next to it.

function LegendNote({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="border-t first:border-t-0 py-3.5 first:pt-0 last:pb-0"
      style={{ borderColor: "rgba(15,34,41,0.08)" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.16em] font-headline mb-1"
        style={{ color: CYAN, fontWeight: 800 }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

/** The legend's headline: the headcount as a real numeral. It leads the
 *  notes because it is the reading of the picture beside it — and under the
 *  orbit it was competing with the CTA for the same centred axis. */
function TribeHeadcount({ memberTotal }: { memberTotal: number }) {
  if (memberTotal === 0) {
    return (
      <p className="text-[15px] font-bold font-headline" style={{ color: MUTED }}>
        Still forming
      </p>
    );
  }
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-[28px] font-black font-headline leading-none tabular-nums" style={{ color: INK }}>
        {memberTotal}
      </span>
      <span className="text-[13px]" style={{ color: "#64748b", fontWeight: 600 }}>
        {memberTotal === 1 ? "person has joined" : "people have joined"}
      </span>
    </p>
  );
}

/** One "· 2 new posts" activity line. Renders nothing at zero — a legend of
 *  zeroes is noise, and the caller shows a quiet line when all are zero. */
function ActivityLine({
  value,
  singular,
  plural,
  color,
  emphasise,
}: {
  value: number;
  singular: string;
  plural: string;
  color: string;
  emphasise?: boolean;
}) {
  if (!value) return null;
  return (
    <p className="flex items-center gap-1.5 text-[13px] leading-relaxed">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="font-black font-headline tabular-nums" style={{ color: emphasise ? color : INK }}>
        {value}
      </span>
      <span style={{ color: emphasise ? color : "#64748b", fontWeight: 600 }}>
        {value === 1 ? singular : plural}
      </span>
    </p>
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
            Team up with a complementary expert: design one live experience together,
            sell it as one product, split revenue as you agree.
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
            Invite your expert partner →
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
  // Founder's call: a published experience card carries ONE action — the door
  // into the experience. The recorded agreement is a governance artifact, not
  // an operational CTA; it lives in Account settings › My agreements. The
  // pre-publish "Review terms" stays, because that IS the live next step.
  if (postPublish) return null;
  const href = `/dashboard/collaborate/${program.id}`;
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
      Review terms
    </Link>
  );
}

// The next run in this lineage, folded into the active run's card — one lineage,
// one card. Links to the next run's public page (to preview / share).
function NextRunChip({ nextRun }: { nextRun: NonNullable<Program["nextRun"]> }) {
  return (
    <Link
      href={`/experiences/${nextRun.id}`}
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-colors hover:bg-[#0891b2]/[0.06]"
      style={{ backgroundColor: "rgba(8,145,178,0.07)", boxShadow: "inset 0 0 0 1px rgba(8,145,178,0.20)" }}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
        Next run
      </span>
      <span className="text-[12px] font-bold font-headline" style={{ color: INK }} suppressHydrationWarning>
        starts {formatEndDate(nextRun.startDate)}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
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
  // A published experience always has a space (its own, or the lineage's for a
  // continuation run). Link straight to /space and let load_experience_space
  // resolve it across the lineage — pre-resolving by source_challenge_id misses
  // continuation runs and wrongly bounces them to the buyer page.
  const doorHref = isDraftStage
    ? `/dashboard/collaborate/${program.id}`
    : `/experiences/${program.id}/space`;
  const doorLabel = isDraftStage ? "Open workspace" : "Open Experience Space";
  const showShare =
    program.stage === "published-pre-launch" || program.stage === "published-live";

  const enrolled = program.enrolledCount ?? 0;
  const showTribe = isHero && !isDraftStage;
  const experts = [
    { id: user.id ?? "", name: user.name, avatar: user.avatar },
    ...(partner?.id ? [{ id: partner.id, name: partner.name, avatar: partner.avatar }] : []),
  ].filter((e) => !!e.id);
  const warmingUp =
    enrolled === 0 && (program.newPosts ?? 0) === 0 && (program.pendingQuestions ?? 0) === 0;

  // ── THE TRIBE HERO ─────────────────────────────────────────────────
  // ONE composition, not two objects sharing a border (founder call,
  // 17 Aug). It reads top to bottom as a sentence: the experience NAMES
  // itself → you see WHO is in it → you step inside → then what is
  // happening. Life floats on the page canvas with a glow instead of a
  // container; only the data band is carded.
  //
  // The door sits at the circle's THRESHOLD, not in its centre: the inner
  // ring is 26% of the orbit, so a CTA fits at desktop size but not at
  // mobile (~166px inner circle vs a ~200px pill) — centring it would
  // force two behaviours, and the centre is the experts' semantic seat.
  //
  // This is also the order mobile already stacked in, so both widths now
  // run ONE arrangement instead of two that drift apart.
  if (showTribe) {
    return (
      // ONE surface (founder call, 18 Aug). The uncaged version floated:
      // the legend stranded at the page edge, the count fighting the CTA,
      // and no boundary telling you where the door was. A single card is
      // NOT a walk-back to the caged original — that failure was TWO boxes
      // with a seam down the middle. Here the card is the stage floor: the
      // glow lives inside it, the legend belongs to it, and it makes the
      // hero and the console read as siblings (same radius, same shadow,
      // one row).
      <article
        className="relative rounded-3xl p-6 md:p-8 overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", boxShadow: SOFT_SHADOW }}
      >
        <header className="relative z-10 text-center px-2">
          <StatusPill program={program} />
          <h2
            className="mt-2.5 text-2xl md:text-3xl font-headline tracking-tight"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {program.title || "Untitled"}
          </h2>
        </header>

        {/* ORBIT + LEGEND. The activity has no box of its own — hairline
            notes on the card's own surface, so the numbers read as
            annotations OF the tribe. The split is 1.4fr/1fr, not 2fr/1fr:
            at a third of the row the legend was too narrow to hold any
            presence, which is what made it read as marginalia. Two columns
            at xl only; at lg the console already takes 340px of the row. */}
        <div className="relative z-10 mt-5 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-center">
          <div className="relative flex justify-center">
            {/* The glow bleeds past this column and is clipped by the card's
                own rounded edge, so the orbit sits in light rather than in a
                box — the card is a stage floor, not a cage. */}
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
              experts={experts}
              members={program.tribeFaces ?? []}
              memberTotal={enrolled}
              viewerId={user.id ?? null}
              maxWidth={400}
              className="z-10"
            />
          </div>

          <div className="px-1">
            {warmingUp ? (
              <>
                <LegendNote label="Your tribe">
                  <TribeHeadcount memberTotal={enrolled} />
                </LegendNote>
                <LegendNote label="Getting started">
                  <p className="text-[13px]" style={{ color: MUTED, fontWeight: 600 }}>
                    Share your page to fill the circle
                  </p>
                </LegendNote>
              </>
            ) : (
              <div className="flex flex-col">
                {/* The headcount leads the legend: it is the reading of the
                    picture, and under the orbit it was competing with the
                    CTA for the same centred axis. */}
                <LegendNote label="Your tribe">
                  <TribeHeadcount memberTotal={enrolled} />
                </LegendNote>

                {program.nextSession && (
                  <LegendNote label="Next moment">
                    <p className="text-[16px] font-bold font-headline leading-snug" style={{ color: INK }}>
                      {program.nextSession.title}
                    </p>
                    <p className="text-[13px] font-medium mt-1" style={{ color: "#64748b" }} suppressHydrationWarning>
                      {sessionWhen(program.nextSession.startTime, timeZone)}
                    </p>
                  </LegendNote>
                )}

                <LegendNote label="This week">
                  {(program.newPosts ?? 0) === 0 &&
                  (program.pendingQuestions ?? 0) === 0 &&
                  (program.newMembersThisWeek ?? 0) === 0 ? (
                    <p className="text-[13px]" style={{ color: MUTED, fontWeight: 600 }}>
                      Quiet so far
                    </p>
                  ) : (
                    <>
                      <ActivityLine
                        value={program.newMembersThisWeek ?? 0}
                        singular="new member"
                        plural="new members"
                        color={GROWTH}
                      />
                      <ActivityLine
                        value={program.newPosts ?? 0}
                        singular="new post"
                        plural="new posts"
                        color={CYAN}
                      />
                      <ActivityLine
                        value={program.pendingQuestions ?? 0}
                        singular="open question"
                        plural="open questions"
                        color={ORANGE_TXT}
                        emphasise
                      />
                    </>
                  )}
                </LegendNote>

                {(program.reviewCount ?? 0) > 0 && (
                  <LegendNote label="Reviews">
                    <ReviewsDisclosure
                      avg={Number(program.reviewAvg ?? 0)}
                      count={program.reviewCount ?? 0}
                      thisWeek={program.reviewsThisWeek ?? 0}
                      reviews={program.reviews ?? []}
                      experienceTitle={program.title}
                      flush
                    />
                  </LegendNote>
                )}
              </div>
            )}
          </div>
        </div>

        {/* THE DOOR — the card's footer, centred and alone on its axis. */}
        <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3">
          <PrimaryActionPill label={doorLabel} kind="navigate" href={doorHref} variant="filled" />
          {showShare && <ShareButton challengeId={program.id} inline />}
        </div>

        {program.nextRun && (
          <div className="relative z-10 mt-4 flex justify-center">
            <NextRunChip nextRun={program.nextRun} />
          </div>
        )}
      </article>
    );
  }

  // ── DRAFTS (hero density) + every COMPACT card ─────────────────────
  // A draft has no tribe yet, and compact is a tier-2 treatment, so both
  // keep the classic cover + content card.
  return (
    <article
      className={`relative transition-shadow flex flex-col overflow-hidden ${
        isHero ? "rounded-3xl xl:flex-row" : "rounded-2xl"
      }`}
      style={{ backgroundColor: "#FFFFFF", boxShadow: SOFT_SHADOW }}
    >
      {/* Share the card — copies the public buyer-page link. Top-right corner. */}
      {showShare && !isHero && <ShareButton challengeId={program.id} />}

      <Cover program={program} density={density} />

      <div className={`${isHero ? "p-7 md:p-8 xl:flex-1 xl:justify-center" : "p-5"} flex flex-col min-w-0`}>
        <h2
          className={`${isHero ? "text-2xl md:text-3xl xl:pr-12" : "text-lg md:text-xl pr-12"} font-headline tracking-tight`}
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {program.title || "Untitled"}
        </h2>

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
            <>
              <SignalStrip program={program} />
              {(program.reviewCount ?? 0) > 0 && (
                <div className="mt-2.5">
                  <ReviewsDisclosure
                    avg={Number(program.reviewAvg ?? 0)}
                    count={program.reviewCount ?? 0}
                    thisWeek={program.reviewsThisWeek ?? 0}
                    reviews={program.reviews ?? []}
                    experienceTitle={program.title}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* SESSION — cream editorial card with the session image. */}
        {program.nextSession && (
          <div className="mt-4">
            <SessionCard session={program.nextSession} fallbackImage={program.imageUrl} timeZone={timeZone} />
          </div>
        )}

        {/* DOOR — one action on a published card: Open Experience Space.
            Share is the top-right icon; the agreement moved to settings. */}
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-3">
          <PrimaryActionPill label={doorLabel} kind="navigate" href={doorHref} variant="filled" />
          {showShare && <ShareButton challengeId={program.id} inline />}
          <SecondaryActions program={program} />
        </div>

        {program.nextRun && (
          <div className="mt-4">
            <NextRunChip nextRun={program.nextRun} />
          </div>
        )}
      </div>
    </article>
  );
}
