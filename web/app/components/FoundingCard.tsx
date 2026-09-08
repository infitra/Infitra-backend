import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, restructured 8 Sep). Rendered on
 * the landing row, on /founding-network, in the logged-in directory, live
 * next to the join form and on the arrival stage; the same shape everywhere,
 * so a member sees on the homepage exactly what they set up.
 *
 * Reads as the member's own card, top to bottom: who they are; their
 * expertise and what would complement it (the matching surface); about;
 * background grouped by kind; disciplines. Fed by load_founding_community():
 * explicit public-safe columns, never an email.
 */
export interface FoundingMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  bio: string | null;
  username: string | null;
  entity_type: "expert" | "studio";
  is_founding_expert: boolean;
  brings: string | null;
  seeks: string | null;
  facts: { city?: string | null; disciplines?: string[]; focus?: string | null };
  credentials: { kind: string; title: string; org: string | null; year: number | null; year_end: number | null }[];
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const MUTED = "#475569";

const KIND_ORDER = ["experience", "education", "certification"] as const;
const KIND_LABEL: Record<(typeof KIND_ORDER)[number], string> = {
  experience: "Experience",
  education: "Education",
  certification: "Certifications",
};

function Block({
  label,
  text,
  accent,
  tint,
}: {
  label: string;
  text: string;
  accent: string;
  tint: string;
}) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ backgroundColor: tint, borderLeft: `3px solid ${accent}` }}>
      <p
        className="text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-1"
        style={{ color: accent }}
      >
        {label}
      </p>
      <p className="text-[14px] leading-snug" style={{ color: INK }}>
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
  const disciplines = (m.facts?.disciplines ?? []).slice(0, compact ? 3 : 8);
  const creds = (m.credentials ?? []).slice(0, compact ? 3 : 8);
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    label: KIND_LABEL[kind],
    items: creds.filter((c) => c.kind === kind),
  })).filter((g) => g.items.length > 0);
  const labels = isStudio
    ? { brings: "What we bring", seeks: "What would complement our offer" }
    : { brings: "My expertise", seeks: "What would complement my work" };
  const pad = compact ? "px-5" : "px-5 lg:px-6";

  return (
    <article
      className="rounded-2xl flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: solid ? "#FFFFFF" : "rgba(255,255,255,0.78)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.04), 0 10px 30px rgba(15,34,41,0.05)",
      }}
    >
      {/* Who */}
      <div className={`${pad} pt-5 lg:pt-6 pb-4 flex items-start gap-4`}>
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatar_url}
            alt=""
            className={`${compact ? "w-14 h-14" : "w-[72px] h-[72px]"} rounded-full object-cover shrink-0`}
            style={{ border: "2px solid rgba(255,97,48,0.25)" }}
          />
        ) : (
          <div
            className={`${compact ? "w-14 h-14" : "w-[72px] h-[72px]"} rounded-full flex items-center justify-center shrink-0`}
            style={{ backgroundColor: "rgba(8,145,178,0.12)" }}
          >
            <span className="text-2xl font-black font-headline" style={{ color: CYAN }}>
              {initial}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-lg font-black font-headline tracking-tight leading-tight"
              style={{ color: INK }}
            >
              {name}
            </h3>
            <span
              className="text-[10px] font-bold font-headline uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
              style={{
                color: isStudio ? CYAN : ORANGE,
                backgroundColor: isStudio ? "rgba(8,145,178,0.10)" : "rgba(255,97,48,0.10)",
              }}
            >
              {isStudio ? "Studio" : "Expert"}
            </span>
          </div>
          {m.tagline && (
            <p className="text-[13px] font-bold font-headline mt-1 leading-snug" style={{ color: CYAN }}>
              {m.tagline}
            </p>
          )}
          {m.facts?.city && (
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              {m.facts.city}
            </p>
          )}
          {m.is_founding_expert && <FoundingExpertBadge className="mt-2" />}
        </div>
      </div>

      {/* The matching surface */}
      {(m.brings || m.seeks) && (
        <div className={`${pad} pb-4 flex flex-col gap-2.5`}>
          {m.brings && (
            <Block label={labels.brings} text={m.brings} accent={ORANGE} tint="rgba(255,97,48,0.05)" />
          )}
          {m.seeks && (
            <Block label={labels.seeks} text={m.seeks} accent={CYAN} tint="rgba(8,145,178,0.06)" />
          )}
        </div>
      )}

      {/* About */}
      {!compact && m.bio && (
        <div className={`${pad} pb-4`}>
          <p
            className="text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-1"
            style={{ color: "#94a3b8" }}
          >
            About
          </p>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            {m.bio}
          </p>
        </div>
      )}

      {/* Background, grouped by kind; a subtitle only where there is an entry */}
      {groups.length > 0 && (
        <div className={`${pad} pb-4 flex flex-col gap-3 mt-auto`}>
          {groups.map((g) => (
            <div key={g.kind}>
              <p
                className="flex items-center gap-1.5 text-[10px] font-black font-headline uppercase tracking-[0.16em] mb-1.5"
                style={{ color: "#94a3b8" }}
              >
                <span style={{ color: ORANGE }}>
                  <CredentialIcon kind={g.kind} size={13} />
                </span>
                {g.label}
              </p>
              <ul className="flex flex-col gap-1">
                {g.items.map((c, i) => (
                  <li key={i} className="text-xs leading-snug" style={{ color: MUTED }}>
                    <span className="font-bold font-headline" style={{ color: INK }}>
                      {c.title}
                    </span>
                    {c.org ? ` · ${c.org}` : ""}
                    {credentialPeriod(c.year, c.year_end) ? ` · ${credentialPeriod(c.year, c.year_end)}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Disciplines */}
      {disciplines.length > 0 && (
        <div
          className={`${pad} py-3 flex flex-wrap gap-1.5`}
          style={{ backgroundColor: "rgba(15,34,41,0.035)", borderTop: "1px solid rgba(15,34,41,0.06)" }}
        >
          {disciplines.map((d) => (
            <span
              key={d}
              className="text-[11px] px-2.5 py-1 rounded-md font-bold font-headline"
              style={{ backgroundColor: "rgba(255,255,255,0.8)", color: INK, border: "1px solid rgba(15,34,41,0.08)" }}
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
