import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, v8 on 8 Sep). Rendered on the
 * landing row, on /founding-network, in the network, live next to the join
 * form and on the arrival stage; the same shape everywhere.
 *
 * A personal, professional card for collaborations, in INFITRA's register:
 * white, light, alive. A round portrait with a fine orange-to-cyan ring
 * anchors the top-left corner; the name sits on its midline. The two
 * answers are the only filled colour on the card. The background is a
 * quiet table of light tiles and hairlines. A studio fills the same three
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

function Answer({ label, text, accent, tint }: { label: string; text: string; accent: string; tint: string }) {
  return (
    <div className="rounded-2xl px-4 py-4" style={{ backgroundColor: tint }}>
      <span
        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black font-headline uppercase tracking-[0.16em] text-white mb-2.5"
        style={{ backgroundColor: accent }}
      >
        {label}
      </span>
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
  // The portrait hangs over the top-left corner; the outer box reserves the
  // overhang so no container has to know.
  const over = compact ? { top: 22, left: 10, size: 132 } : { top: 30, left: 14, size: 184 };

  return (
    <div className="h-full" style={{ paddingTop: over.top, paddingLeft: over.left }}>
      <article
        className="rounded-[22px] flex flex-col h-full relative"
        style={{
          backgroundColor: solid ? "#FFFFFF" : "rgba(255,255,255,0.86)",
          border: "1px solid rgba(15,34,41,0.06)",
          boxShadow: "0 1px 2px rgba(15,34,41,0.03), 0 16px 44px rgba(15,34,41,0.08)",
        }}
      >
        {/* A soft brand wash, alive but quiet */}
        <div aria-hidden className="absolute inset-0 rounded-[22px] overflow-hidden pointer-events-none">
          <div
            className="absolute -top-28 -right-20 w-80 h-80 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,97,48,0.14) 0%, rgba(255,97,48,0) 66%)" }}
          />
          <div
            className="absolute -top-16 right-28 w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(156,240,255,0.30) 0%, rgba(156,240,255,0) 66%)" }}
          />
        </div>

        {/* The portrait: round, with a fine orange-to-cyan ring */}
        <div
          className="absolute rounded-full"
          style={{
            top: -over.top,
            left: -over.left,
            width: over.size,
            height: over.size,
            padding: 3,
            background: "linear-gradient(135deg, #FF6130 0%, #9CF0FF 100%)",
            boxShadow: "0 14px 34px rgba(15,34,41,0.16)",
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ border: "3px solid #FFFFFF", backgroundColor: "#FFFFFF" }}>
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

        {/* The person, on the portrait's midline */}
        <div
          className="relative pr-6 flex flex-col justify-center"
          style={{
            marginTop: -over.top,
            minHeight: over.size,
            paddingLeft: over.size - over.left + (compact ? 16 : 26),
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3
                className={`${compact ? "text-xl" : "text-[28px] lg:text-[30px]"} font-black font-headline tracking-tight leading-[1.05]`}
                style={{ color: INK, letterSpacing: "-0.03em" }}
              >
                {name}
              </h3>
              <span
                className="text-[10px] font-black font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
                style={{
                  color: isStudio ? CYAN : ORANGE,
                  backgroundColor: isStudio ? "rgba(8,145,178,0.10)" : "rgba(255,97,48,0.11)",
                }}
              >
                {isStudio ? "Studio" : "Expert"}
              </span>
            </div>
            {m.tagline && (
              <p className={`${compact ? "text-sm" : "text-[15px]"} font-bold font-headline mt-2 leading-snug`} style={{ color: CYAN }}>
                {m.tagline}
              </p>
            )}
            {m.facts?.city && (
              <p className="text-xs mt-1" style={{ color: FAINT }}>
                {m.facts.city}
              </p>
            )}
            {m.is_founding_expert && <FoundingExpertBadge className="mt-3" />}
          </div>
        </div>

        {/* The two answers: the only filled colour on the card */}
        {(m.brings || m.seeks) && (
          <div className={`relative ${pad} pt-6 pb-5 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
            {m.brings && <Answer label={labels.brings} text={m.brings} accent={ORANGE} tint="rgba(255,97,48,0.07)" />}
            {m.seeks && <Answer label={labels.seeks} text={m.seeks} accent={CYAN} tint="rgba(8,145,178,0.08)" />}
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

        {/* Background: light tiles, hairlines, nothing heavy */}
        {groups.length > 0 && (
          <div className={`relative ${pad} pb-2 mt-auto`} style={{ borderTop: `1px solid ${HAIR}` }}>
            {groups.map((g, gi) => (
              <div
                key={g.kind}
                className={`grid items-start gap-x-4 py-3.5 ${compact ? "grid-cols-[36px_minmax(0,1fr)]" : "grid-cols-[40px_140px_minmax(0,1fr)]"}`}
                style={gi > 0 ? { borderTop: `1px solid ${HAIR}` } : undefined}
              >
                <span
                  className={`${compact ? "w-9 h-9" : "w-10 h-10"} rounded-xl flex items-center justify-center`}
                  style={{ backgroundColor: "rgba(255,97,48,0.10)", color: ORANGE }}
                >
                  <CredentialIcon kind={g.kind} size={compact ? 15 : 17} studio={isStudio} strokeWidth={1.8} />
                </span>
                {!compact && (
                  <span
                    className="self-center text-[11px] font-black font-headline uppercase tracking-[0.16em] pl-4"
                    style={{ color: INK, borderLeft: `1px solid ${HAIR}` }}
                  >
                    {g.label}
                  </span>
                )}
                <div className={`flex flex-col gap-2 ${compact ? "" : "pl-4"}`} style={compact ? undefined : { borderLeft: `1px solid ${HAIR}` }}>
                  {compact && (
                    <span className="text-[10px] font-black font-headline uppercase tracking-[0.16em]" style={{ color: FAINT }}>
                      {g.label}
                    </span>
                  )}
                  {g.items.map((c, i) => {
                    const detail = [c.org, credentialPeriod(c.year, c.year_end)].filter(Boolean).join(" · ");
                    return (
                      <div key={i} className="leading-snug">
                        <p className="text-[13px] font-bold font-headline" style={{ color: INK }}>
                          {c.title}
                        </p>
                        {detail && (
                          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
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
    </div>
  );
}
