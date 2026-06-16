import Link from "next/link";
import Image from "next/image";

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
  nextSession: { title: string; startTime: string; imageUrl: string | null } | null;
  newPosts: number;
  rated: boolean;
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

function Cover({ exp }: { exp: MeExperience }) {
  return (
    <div
      className="relative w-full overflow-hidden aspect-[5/4] lg:aspect-[3/2] xl:aspect-auto xl:w-[46%] xl:shrink-0 xl:min-h-[300px]"
      style={{ backgroundColor: INK }}
    >
      {exp.imageUrl ? (
        <Image src={exp.imageUrl} alt="" fill sizes="(max-width: 1280px) 100vw, 40vw" className="object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.40), rgba(8,145,178,0.40)), #0F2229" }}
        />
      )}
      <div
        className="absolute inset-x-0 top-0 h-16"
        style={{ background: "linear-gradient(180deg, rgba(15,34,41,0.30), rgba(15,34,41,0))" }}
        aria-hidden
      />
      <div className="absolute top-3 left-3">
        <StatusChip exp={exp} />
      </div>
    </div>
  );
}

// ─── NEXT moment (cream editorial card) ──────────────────────

function NextMoment({
  session,
  fallbackImage,
  timeZone,
}: {
  session: NonNullable<MeExperience["nextSession"]>;
  fallbackImage: string | null;
  timeZone?: string;
}) {
  const img = session.imageUrl ?? fallbackImage;
  return (
    <div className="flex items-center gap-4 rounded-xl p-3" style={{ backgroundColor: "#F6F2EA", border: "1px solid rgba(15,34,41,0.06)" }}>
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

// ─── Experts (your coaches) ──────────────────────────────────

function PersonBox({ name, avatar, role }: { name: string; avatar: string | null; role: "owner" | "cohost" }) {
  const isOwner = role === "owner";
  const color = isOwner ? ORANGE : CYAN;
  const bg = isOwner ? "rgba(255,97,48,0.04)" : "rgba(8,145,178,0.04)";
  const border = isOwner ? "rgba(255,97,48,0.12)" : "rgba(8,145,178,0.12)";
  const initial = (name?.[0] ?? "?").toUpperCase();
  const first = name?.split(" ")[0] || name || "Expert";
  return (
    <div className="flex items-center gap-2.5 p-2 rounded-xl min-w-0" style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
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
          {first}
        </p>
        <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color, fontWeight: 700 }}>
          {isOwner ? "OWNER" : "COHOST"}
        </p>
      </div>
    </div>
  );
}

function ExpertsRow({ experts }: { experts: MeExperience["experts"] }) {
  const shown = experts.slice(0, 2);
  if (!shown.length) return null;
  return (
    <div className={`grid gap-2.5 ${shown.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {shown.map((e) => (
        <PersonBox key={e.id} name={e.name} avatar={e.avatar} role={e.role} />
      ))}
    </div>
  );
}

// ─── Momentum — where you are + what's moving ────────────────

function Momentum({ exp }: { exp: MeExperience }) {
  const isLive = exp.stage === "live";
  const tw = totalWeeks(exp.startDate, exp.endDate);
  const cw = Math.min(currentWeek(exp.startDate), tw || 1);

  if (isLive && tw > 0) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: "#F8F6F0", border: "1px solid rgba(15,34,41,0.06)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>
            Week {cw} of {tw}
          </span>
          {exp.newPosts > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold font-headline px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(8,145,178,0.10)", color: CYAN }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CYAN }} />
              {exp.newPosts} new {exp.newPosts === 1 ? "post" : "posts"}
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.round((cw / tw) * 100)}%`, backgroundColor: CYAN }} />
        </div>
      </div>
    );
  }

  // Pre-launch — lead with the tribe activity (positive), not the long countdown
  // (the cover chip already carries the "starts in N days").
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.12)" }}>
      {exp.newPosts > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CYAN }} />
          <span className="text-[14px] font-black font-headline" style={{ color: CYAN }}>
            {exp.newPosts} new {exp.newPosts === 1 ? "post" : "posts"}
          </span>
          <span className="text-[12px]" style={{ color: "#64748b" }}>
            · your tribe&apos;s already active
          </span>
        </div>
      ) : (
        <p className="text-[12px] font-bold font-headline" style={{ color: "#0e7490" }}>
          Your tribe is forming — be one of the first in.
        </p>
      )}
    </div>
  );
}

// ─── Active card (side-by-side, like the creator hero) ───────

export function ParticipantExperienceCard({ exp, timeZone }: { exp: MeExperience; timeZone?: string }) {
  const spaceHref = exp.spaceId ? `/experiences/${exp.id}/space` : `/experiences/${exp.id}`;

  return (
    <article
      className="relative transition-shadow flex flex-col overflow-hidden rounded-3xl xl:flex-row"
      style={{ backgroundColor: "#FFFFFF", boxShadow: SOFT_SHADOW }}
    >
      <Cover exp={exp} />

      <div className="p-7 md:p-8 xl:flex-1 xl:justify-center flex flex-col min-w-0">
        <h2
          className="text-2xl md:text-3xl font-headline tracking-tight"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {exp.title || "Untitled experience"}
        </h2>

        {/* PEOPLE — your experts. */}
        {exp.experts.length > 0 && (
          <div className="mt-5">
            <ExpertsRow experts={exp.experts} />
          </div>
        )}

        {/* MOMENTUM — where you are + what's moving. */}
        <div className="mt-4">
          <Momentum exp={exp} />
        </div>

        {/* NEXT moment. */}
        {exp.nextSession && (
          <div className="mt-4">
            <NextMoment session={exp.nextSession} fallbackImage={exp.imageUrl} timeZone={timeZone} />
          </div>
        )}

        {/* DOOR — enter your space. */}
        <div className="mt-7">
          <Link
            href={spaceHref}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: CYAN, boxShadow: "0 6px 18px rgba(8,145,178,0.30), 0 2px 6px rgba(8,145,178,0.18)" }}
          >
            Enter your space →
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Completed card (compact, with the rate nudge) ───────────

export function CompletedExperienceCard({ exp }: { exp: MeExperience }) {
  const spaceHref = exp.spaceId ? `/experiences/${exp.id}/space` : `/experiences/${exp.id}`;
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

        <div className="mt-auto pt-4 flex items-center gap-3">
          {exp.rated ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-bold font-headline" style={{ color: "#475569" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={ORANGE} stroke={ORANGE} strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
              </svg>
              Rated
            </span>
          ) : (
            <Link
              href={spaceHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-black font-headline transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
              </svg>
              Rate this experience
            </Link>
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
