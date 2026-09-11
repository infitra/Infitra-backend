import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { CardWaves } from "@/app/components/BrandWaves";
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
 * email. Below sm (phones) the full card shrinks rather than stacks: the
 * type pill sits in the top-left corner (Edit top-right), a 100px portrait
 * with the name beside it, the small founding badge right under the name,
 * one background column with the label on top. Fits from 375px.
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

/** The two answer icons: the person, and two circles meeting. Shared with the editor's labels. */
export function AnswerIcon({ kind, color, size = 20 }: { kind: "brings" | "seeks"; color: string; size?: number }) {
  const common = {
    width: size,
    height: size,
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
          className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent, boxShadow: "0 0 0 3px #FFFFFF" }}
        >
          <AnswerIcon kind={kind} color="#FFFFFF" />
        </span>
        <span
          className="-ml-3 pl-5 pr-3.5 py-1.5 rounded-full text-[10px] sm:text-[11.5px] font-bold font-headline uppercase tracking-[0.08em] sm:tracking-[0.12em] text-white leading-tight sm:whitespace-nowrap"
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
      {!compact && (
        <span
          className="absolute top-5 left-5 z-10 sm:hidden text-[10px] font-bold font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
        >
          {isStudio ? "Studio" : "Expert"}
        </span>
      )}
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
      <div className={`relative ${pad} ${compact ? "pt-6" : "pt-14 sm:pt-6"}`}>
      <div className={`flex ${compact ? "flex-col items-start gap-4" : "items-center gap-4 sm:gap-6"}`}>
        <div
          className={`rounded-full shrink-0 ${compact ? "w-[116px] h-[116px]" : "w-[100px] h-[100px] sm:w-[168px] sm:h-[168px]"}`}
          style={{
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
                <span className={`${compact ? "text-4xl" : "text-4xl sm:text-6xl"} font-bold font-headline`} style={{ color: CYAN }}>
                  {initial}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3
              className={`${compact ? "text-2xl" : "text-[24px] sm:text-[30px]"} font-bold font-headline tracking-tight leading-[1.05]`}
              style={{ color: INK, letterSpacing: "-0.03em" }}
            >
              {name}
            </h3>
            <span
              className={`${compact ? "" : "hidden sm:inline-block"} text-[10px] font-bold font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-white`}
              style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
            >
              {isStudio ? "Studio" : "Expert"}
            </span>
          </div>
          {/* Phones: the founding badge takes the pill's old place, right under the name */}
          {m.is_founding_expert && !compact && (
            <div className="mt-2 sm:hidden">
              <FoundingExpertBadge />
            </div>
          )}
          {m.tagline && (
            <p className={`${compact ? "text-sm" : "text-[15px] sm:text-base"} font-bold font-headline mt-2 leading-snug`} style={{ color: CYAN }}>
              {m.tagline}
            </p>
          )}
          {(m.facts?.city || m.link_url) && (
            <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5">
              {m.facts?.city && (
                <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#64748b" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 21s-6-5.3-6-10.5a6 6 0 0 1 12 0C18 15.7 12 21 12 21z" />
                    <circle cx="12" cy="10.5" r="2.3" />
                  </svg>
                  {m.facts.city}
                </span>
              )}
              {/* The link is a fact under the one line, set like the location, never a second headline */}
              {m.link_url && (
                <a
                  href={m.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm hover:underline"
                  style={{ color: "#64748b" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
                    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
                  </svg>
                  {linkLabel(m.link_url)}
                </a>
              )}
            </div>
          )}
          {m.is_founding_expert &&
            (compact ? (
              <FoundingExpertBadge className="mt-3" large />
            ) : (
              <div className="mt-3 hidden sm:block">
                <FoundingExpertBadge large />
              </div>
            ))}
        </div>
      </div>
      </div>

      {/* The two answers */}
      {(m.brings || m.seeks) && (
        <div
          className={`relative ${pad} pt-5 pb-4 grid gap-3`}
          style={{ gridTemplateColumns: compact ? "1fr" : "repeat(auto-fit, minmax(min(300px, 100%), 1fr))" }}
        >
          {m.brings && <Answer kind="brings" label={labels.brings} text={m.brings} accent={ORANGE} />}
          {m.seeks && <Answer kind="seeks" label={labels.seeks} text={m.seeks} accent={CYAN} />}
        </div>
      )}

      {/* Background: a light table, aligned on one baseline per row */}
      {groups.length > 0 && (
        <div className={`relative ${pad} pb-2 mt-auto`} style={{ borderTop: `1px solid ${HAIR}` }}>
          {groups.map((g, gi) => (
            <div
              key={g.kind}
              className={`grid items-start gap-x-4 py-3 ${compact ? "grid-cols-[44px_minmax(0,1fr)]" : "grid-cols-[44px_minmax(0,1fr)] sm:grid-cols-[44px_160px_minmax(0,1fr)]"}`}
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
                  className="hidden sm:flex h-11 items-center text-[12px] font-bold font-headline uppercase tracking-[0.16em] pl-4"
                  style={{ color: "#334155", borderLeft: `1px solid ${HAIR}` }}
                >
                  {g.label}
                </span>
              )}
              <div className={`flex flex-col gap-2.5 ${compact ? "" : "sm:pl-4 sm:pt-3 sm:border-l sm:border-[rgba(15,34,41,0.08)]"}`}>
                <span
                  className={`h-11 flex items-center text-[11px] font-bold font-headline uppercase tracking-[0.16em] ${compact ? "" : "sm:hidden"}`}
                  style={{ color: "#334155" }}
                >
                  {g.label}
                </span>
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
