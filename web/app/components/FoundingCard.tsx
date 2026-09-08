import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, v9 on 8 Sep). Rendered on the
 * landing row, on /founding-network, in the network, live next to the join
 * form and on the arrival stage; the same shape everywhere.
 *
 * A personal, professional card for collaborations in INFITRA's register,
 * built like the posts: cream paper, the real brand waves as the hero band
 * on top, fading into cream where the content sits. A round portrait with a
 * white ring lies on the waves; the name sits beside it. The two answers are pastel panels
 * with filled tags, side by side. The background is a light table: gradient
 * icon tiles, thin dividers, muted labels. A studio fills the same three
 * background slots with its own meanings: track record, team, recognition.
 * Fed by load_founding_community(): explicit public-safe columns, never an
 * email.
 */
export interface FoundingMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  username: string | null;
  entity_type: "expert" | "studio";
  is_founding_expert: boolean;
  brings: string | null;
  seeks: string | null;
  link_url?: string | null;
  facts: { city?: string | null };
  credentials: { kind: string; title: string; org: string | null; year: number | null; year_end: number | null }[];
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const CYAN_BRIGHT = "#9CF0FF";
const MUTED = "#475569";
const HAIR = "rgba(15,34,41,0.08)";

const KIND_ORDER = ["experience", "education", "certification"] as const;
const KIND_LABEL: Record<"expert" | "studio", Record<(typeof KIND_ORDER)[number], string>> = {
  expert: { experience: "Experience", education: "Education", certification: "Certifications" },
  studio: { experience: "Track record", education: "Team", certification: "Recognition" },
};

/** "instagram.com/handle" or "site.ch/page": the link as people read it. */
export function linkLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    return (host + (path && path !== "/" ? path : "")).slice(0, 48);
  } catch {
    return url;
  }
}

const CREAM = "#F2EFE8";

const WAVE_STOPS = (
  <>
    <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.92" />
    <stop offset="35%" stopColor={CYAN_BRIGHT} stopOpacity="0.62" />
    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.40" />
    <stop offset="65%" stopColor={ORANGE} stopOpacity="0.62" />
    <stop offset="100%" stopColor={ORANGE} stopOpacity="0.92" />
  </>
);

/**
 * The INFITRA waves, verbatim from the post templates and the app background
 * (WaveFlowingBackground.tsx): three diagonal bands, lower-left to upper-
 * right, cyan-bright to orange, the back one blurred in CSS. Fitted with
 * "xMidYMid slice" so the bands sweep through instead of ending in frame.
 * Static: cards live in grids. The container masks them out towards the
 * bottom so the hero fades into cream where the content sits.
 */
function CardWaves({ id }: { id: string }) {
  const svg = "absolute inset-0 w-full h-full";
  return (
    <>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={svg} style={{ filter: "blur(20px)" }} aria-hidden>
        <defs>
          <linearGradient id={`${id}-1`} x1="0%" y1="100%" x2="100%" y2="0%">
            {WAVE_STOPS}
          </linearGradient>
        </defs>
        <path
          d="M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z"
          fill={`url(#${id}-1)`}
        />
      </svg>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={svg} aria-hidden>
        <defs>
          <linearGradient id={`${id}-2`} x1="0%" y1="100%" x2="100%" y2="0%">
            {WAVE_STOPS}
          </linearGradient>
        </defs>
        <path
          d="M -300 1500 C 150 1180, 500 1330, 850 980 C 1200 620, 1550 800, 1950 -300 L 1950 -1000 C 1550 -50, 1200 -250, 850 100 C 500 460, 150 250, -300 720 Z"
          fill={`url(#${id}-2)`}
        />
      </svg>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className={svg} aria-hidden>
        <defs>
          <linearGradient id={`${id}-3`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="1" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="100%" stopColor={ORANGE} stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z"
          fill={`url(#${id}-3)`}
        />
      </svg>
    </>
  );
}

function AnswerIcon({ kind, color }: { kind: "brings" | "seeks"; color: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2.1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "brings") {
    // The person: head and shoulders
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
      </svg>
    );
  }
  // The complement: two circles meeting, the overlap is the point
  return (
    <svg {...common}>
      <circle cx="8.5" cy="12" r="6" />
      <circle cx="15.5" cy="12" r="6" />
    </svg>
  );
}

function Answer({
  kind,
  label,
  text,
  accent,
}: {
  kind: "brings" | "seeks";
  label: string;
  text: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 pt-3.5 pb-4 flex flex-col gap-3"
      style={{ backgroundColor: "rgba(255,255,255,0.82)", border: `1px solid ${accent}22`, boxShadow: "0 1px 2px rgba(15,34,41,0.03)" }}
    >
      {/* The icon, and the label coming out of it */}
      <div className="flex items-center">
        <span
          className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent, boxShadow: "0 0 0 3px #FFFFFF" }}
        >
          <AnswerIcon kind={kind} color="#FFFFFF" />
        </span>
        <span
          className="-ml-3 pl-5 pr-3 py-1 rounded-full text-[10px] font-black font-headline uppercase tracking-[0.12em] text-white whitespace-nowrap"
          style={{ backgroundColor: accent }}
        >
          {label}
        </span>
      </div>
      <p className="text-[15px] leading-snug" style={{ color: INK }}>
        {text}
      </p>
    </div>
  );
}

export function FoundingCard({
  m,
  compact = false,
  solid = false,
  editHref,
}: {
  m: FoundingMember;
  compact?: boolean;
  /** Kept for callers; the card is cream paper everywhere. */
  solid?: boolean;
  /** The owner's own card: a whisper of a link in the top-right corner. */
  editHref?: string;
}) {
  void solid;
  const name = m.display_name ?? "Founding member";
  const initial = (name[0] ?? "?").toUpperCase();
  const isStudio = m.entity_type === "studio";
  const entity = isStudio ? "studio" : "expert";
  const creds = (m.credentials ?? []).slice(0, compact ? 3 : 8);
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    label: KIND_LABEL[entity][kind],
    items: creds.filter((c) => c.kind === kind),
  })).filter((g) => g.items.length > 0);
  const labels = isStudio
    ? { brings: "What we bring", seeks: "What would complement our offer" }
    : { brings: "My expertise", seeks: "What would complement my work" };
  const pad = compact ? "px-5" : "px-6";
  const portrait = compact ? 116 : 168;
  const accent = isStudio ? CYAN : ORANGE;

  return (
    <article
      className="rounded-[28px] flex flex-col h-full relative overflow-hidden"
      style={{
        backgroundColor: CREAM,
        border: "1px solid rgba(15,34,41,0.07)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.03), 0 18px 48px rgba(15,34,41,0.10)",
        // Safari lets blurred children escape a rounded overflow clip; a mask
        // forces the clip onto its own layer. Chrome is unaffected.
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        isolation: "isolate",
      }}
    >
      {/* The hero: the brand waves on top, fading into cream where the content sits */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden rounded-t-[28px]"
        style={{
          height: compact ? 300 : 340,
          maskImage: "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 42%, rgba(0,0,0,0) 100%)",
        }}
      >
        <CardWaves id={`fc-${m.id.slice(0, 8)}`} />
      </div>
      {editHref && (
        <a
          href={editHref}
          className="absolute top-5 right-5 z-10 px-3 py-1 rounded-full text-[11px] font-bold font-headline uppercase tracking-[0.14em] hover:bg-white"
          style={{ color: "rgba(15,34,41,0.62)", backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(15,34,41,0.14)" }}
        >
          Edit
        </a>
      )}

      {/* The person */}
      <div className={`relative ${pad} pt-6 flex ${compact ? "flex-col items-start gap-4" : "items-center gap-6"}`}>
        <div
          className="rounded-full shrink-0"
          style={{
            width: portrait,
            height: portrait,
            padding: 5,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 14px 34px rgba(15,34,41,0.16)",
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
            {m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.avatar_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: "50% 30%" }} />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.12) 0%, rgba(8,145,178,0.14) 100%)" }}
              >
                <span className={`${compact ? "text-4xl" : "text-6xl"} font-black font-headline`} style={{ color: CYAN }}>
                  {initial}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3
              className={`${compact ? "text-2xl" : "text-[30px]"} font-black font-headline tracking-tight leading-[1.05]`}
              style={{ color: INK, letterSpacing: "-0.03em" }}
            >
              {name}
            </h3>
            <span
              className="text-[10px] font-black font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
            >
              {isStudio ? "Studio" : "Expert"}
            </span>
          </div>
          {m.tagline && (
            <p className={`${compact ? "text-sm" : "text-base"} font-bold font-headline mt-2 leading-snug`} style={{ color: CYAN }}>
              {m.tagline}
            </p>
          )}
          {m.facts?.city && (
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              {m.facts.city}
            </p>
          )}
          {m.is_founding_expert && <FoundingExpertBadge className="mt-3" large />}
        </div>
      </div>

      {/* The two answers */}
      {(m.brings || m.seeks) && (
        <div
          className={`relative ${pad} pt-5 pb-4 grid gap-3`}
          style={{ gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))" }}
        >
          {m.brings && <Answer kind="brings" label={labels.brings} text={m.brings} accent={ORANGE} />}
          {m.seeks && <Answer kind="seeks" label={labels.seeks} text={m.seeks} accent={CYAN} />}
        </div>
      )}

      {m.link_url && (
        <div className={`relative ${pad} pb-5 -mt-1`}>
          <a
            href={m.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold font-headline hover:opacity-80"
            style={{ color: CYAN }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
            </svg>
            {linkLabel(m.link_url)}
          </a>
        </div>
      )}

      {/* Background: a light table, aligned on one baseline per row */}
      {groups.length > 0 && (
        <div className={`relative ${pad} pb-2 mt-auto`} style={{ borderTop: `1px solid ${HAIR}` }}>
          {groups.map((g, gi) => (
            <div
              key={g.kind}
              className={`grid items-start gap-x-4 py-3 ${compact ? "grid-cols-[44px_minmax(0,1fr)]" : "grid-cols-[44px_160px_minmax(0,1fr)]"}`}
              style={gi > 0 ? { borderTop: `1px solid ${HAIR}` } : undefined}
            >
              <span
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,97,48,0.3)", color: ORANGE }}
              >
                <CredentialIcon kind={g.kind} size={21} studio={isStudio} strokeWidth={1.7} />
              </span>
              {!compact && (
                <span
                  className="h-11 flex items-center text-[12px] font-black font-headline uppercase tracking-[0.16em] pl-4"
                  style={{ color: "#334155", borderLeft: `1px solid ${HAIR}` }}
                >
                  {g.label}
                </span>
              )}
              <div className={`flex flex-col gap-2.5 ${compact ? "" : "pl-4 pt-3"}`} style={compact ? undefined : { borderLeft: `1px solid ${HAIR}` }}>
                {compact && (
                  <span className="h-11 flex items-center text-[11px] font-black font-headline uppercase tracking-[0.16em]" style={{ color: "#334155" }}>
                    {g.label}
                  </span>
                )}
                {g.items.map((c, i) => {
                  const detail = [c.org, credentialPeriod(c.year, c.year_end)].filter(Boolean).join(" · ");
                  return (
                    <div key={i} className="leading-snug">
                      <p className="text-[14px] font-bold font-headline leading-5" style={{ color: INK }}>
                        {c.title}
                      </p>
                      {detail && (
                        <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>
                          {detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
