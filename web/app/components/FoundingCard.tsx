import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, v9 on 8 Sep). Rendered on the
 * landing row, on /founding-network, in the network, live next to the join
 * form and on the arrival stage; the same shape everywhere.
 *
 * A personal, professional card for collaborations in INFITRA's register:
 * white, bright, alive. The brand waves (the same diagonal stripes as the
 * app background, cyan-bright to orange, static) flow through the top-right
 * corner. A round portrait with a fine gradient ring and a soft glow anchors
 * the top-left; the name sits beside it. The two answers are pastel panels
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
const FAINT = "#94a3b8";
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

/** The brand waves, in the card: two static diagonal stripes, bottom-left to top-right. */
function CardWaves({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 800 500"
      preserveAspectRatio="xMaxYMin slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={CYAN_BRIGHT} stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.55" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor={CYAN_BRIGHT} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M 380 560 C 520 360, 560 420, 700 220 C 780 110, 820 80, 900 -40"
        stroke={`url(#${id}-a)`}
        strokeWidth="92"
        strokeLinecap="round"
        fill="none"
        opacity="0.42"
      />
      <path
        d="M 560 600 C 700 380, 720 440, 860 240 C 920 160, 960 120, 1040 40"
        stroke={`url(#${id}-b)`}
        strokeWidth="56"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

function AnswerIcon({ kind, color }: { kind: "brings" | "seeks"; color: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
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
  // The complement: two circles meeting
  return (
    <svg {...common}>
      <circle cx="9" cy="12" r="5.2" />
      <circle cx="15" cy="12" r="5.2" />
    </svg>
  );
}

function Answer({
  kind,
  label,
  text,
  accent,
  tint,
}: {
  kind: "brings" | "seeks";
  label: string;
  text: string;
  accent: string;
  tint: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: `linear-gradient(135deg, ${tint} 0%, rgba(255,255,255,0.35) 100%)`, border: `1px solid ${accent}1f` }}
    >
      <span
        className="self-start px-2.5 py-1 rounded-full text-[10px] font-black font-headline uppercase tracking-[0.16em] text-white"
        style={{ backgroundColor: accent }}
      >
        {label}
      </span>
      <div className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 2px 8px rgba(15,34,41,0.08)" }}
        >
          <AnswerIcon kind={kind} color={accent} />
        </span>
        <p className="text-[15px] leading-snug pt-2" style={{ color: INK }}>
          {text}
        </p>
      </div>
    </div>
  );
}

export function FoundingCard({
  m,
  compact = false,
  solid = false,
}: {
  m: FoundingMember;
  compact?: boolean;
  /** Opaque paper for dark grounds (the arrival stage). */
  solid?: boolean;
}) {
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
        backgroundColor: solid ? "#FFFFFF" : "rgba(255,255,255,0.88)",
        border: "1px solid rgba(15,34,41,0.06)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.03), 0 18px 48px rgba(15,34,41,0.08)",
      }}
    >
      {/* The brand waves through the corner, and a glow behind the portrait */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <CardWaves id={`fc-${m.id.slice(0, 8)}`} />
        <div
          className="absolute rounded-full"
          style={{
            top: -portrait * 0.35,
            left: -portrait * 0.3,
            width: portrait * 1.9,
            height: portrait * 1.9,
            background: `radial-gradient(circle, rgba(156,240,255,0.42) 0%, rgba(255,97,48,0.10) 45%, rgba(255,255,255,0) 70%)`,
          }}
        />
      </div>

      {/* The person */}
      <div className={`relative ${pad} pt-6 flex ${compact ? "flex-col items-start gap-4" : "items-center gap-6"}`}>
        <div
          className="rounded-full shrink-0"
          style={{
            width: portrait,
            height: portrait,
            padding: 4,
            background: `linear-gradient(135deg, ${ORANGE} 0%, ${CYAN_BRIGHT} 100%)`,
            boxShadow: "0 12px 30px rgba(15,34,41,0.14)",
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ border: "4px solid #FFFFFF", backgroundColor: "#FFFFFF" }}>
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
              className={`${compact ? "text-2xl" : "text-[30px] lg:text-[34px]"} font-black font-headline tracking-tight leading-[1.05]`}
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
            <p className="text-sm mt-1" style={{ color: FAINT }}>
              {m.facts.city}
            </p>
          )}
          {m.is_founding_expert && <FoundingExpertBadge className="mt-3" />}
        </div>
      </div>

      {/* The two answers */}
      {(m.brings || m.seeks) && (
        <div className={`relative ${pad} pt-6 pb-5 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
          {m.brings && <Answer kind="brings" label={labels.brings} text={m.brings} accent={ORANGE} tint="rgba(255,97,48,0.10)" />}
          {m.seeks && <Answer kind="seeks" label={labels.seeks} text={m.seeks} accent={CYAN} tint="rgba(156,240,255,0.32)" />}
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

      {/* Background: a light table */}
      {groups.length > 0 && (
        <div className={`relative ${pad} pb-2 mt-auto`} style={{ borderTop: `1px solid ${HAIR}` }}>
          {groups.map((g, gi) => (
            <div
              key={g.kind}
              className={`grid items-start gap-x-4 py-4 ${compact ? "grid-cols-[40px_minmax(0,1fr)]" : "grid-cols-[44px_150px_minmax(0,1fr)]"}`}
              style={gi > 0 ? { borderTop: `1px solid ${HAIR}` } : undefined}
            >
              <span
                className={`${compact ? "w-10 h-10" : "w-11 h-11"} rounded-xl flex items-center justify-center text-white`}
                style={{
                  background: "linear-gradient(135deg, #FF6130 0%, #FF8A5C 100%)",
                  boxShadow: "0 6px 14px rgba(255,97,48,0.28)",
                }}
              >
                <CredentialIcon kind={g.kind} size={compact ? 17 : 19} studio={isStudio} strokeWidth={1.8} />
              </span>
              {!compact && (
                <span
                  className="self-center text-[11px] font-bold font-headline uppercase tracking-[0.16em] pl-4 py-1"
                  style={{ color: MUTED, borderLeft: `1px solid ${HAIR}` }}
                >
                  {g.label}
                </span>
              )}
              <div className={`flex flex-col gap-2.5 ${compact ? "" : "pl-4"}`} style={compact ? undefined : { borderLeft: `1px solid ${HAIR}` }}>
                {compact && (
                  <span className="text-[10px] font-bold font-headline uppercase tracking-[0.16em]" style={{ color: FAINT }}>
                    {g.label}
                  </span>
                )}
                {g.items.map((c, i) => {
                  const detail = [c.org, credentialPeriod(c.year, c.year_end)].filter(Boolean).join(" · ");
                  return (
                    <div key={i} className="leading-snug">
                      <p className="text-[14px] font-bold font-headline" style={{ color: INK }}>
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
