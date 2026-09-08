import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, v5 on 8 Sep). Rendered on the
 * landing row, on /founding-network, in the logged-in directory, live next
 * to the join form and on the arrival stage; the same shape everywhere.
 *
 * Weight, top to bottom: who (name with the founding badge, one line, city;
 * expert or studio as a corner signal); about, quiet; the two answers as
 * tagged blocks, loud; background as the backbone, in columns with icons.
 * A studio fills the same three background slots with its own meanings:
 * track record, team, recognition. Fed by load_founding_community():
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
  facts: { city?: string | null };
  credentials: { kind: string; title: string; org: string | null; year: number | null; year_end: number | null }[];
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const MUTED = "#475569";
const FAINT = "#94a3b8";

const KIND_ORDER = ["experience", "education", "certification"] as const;
const KIND_LABEL: Record<"expert" | "studio", Record<(typeof KIND_ORDER)[number], string>> = {
  expert: { experience: "Experience", education: "Education", certification: "Certifications" },
  studio: { experience: "Track record", education: "Team", certification: "Recognition" },
};

function Block({ label, text, accent, tint }: { label: string; text: string; accent: string; tint: string }) {
  return (
    <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: tint, border: `1px solid ${accent}33` }}>
      <span
        className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black font-headline uppercase tracking-[0.16em] text-white mb-2"
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
  const pad = compact ? "px-5" : "px-5 lg:px-6";
  const avatar = compact ? "w-14 h-14" : "w-[76px] h-[76px]";
  const columns = compact ? "grid-cols-1" : groups.length === 3 ? "sm:grid-cols-3" : groups.length === 2 ? "sm:grid-cols-2" : "grid-cols-1";

  return (
    <article
      className="rounded-2xl flex flex-col h-full overflow-hidden relative"
      style={{
        backgroundColor: solid ? "#FFFFFF" : "rgba(255,255,255,0.78)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.04), 0 10px 30px rgba(15,34,41,0.05)",
      }}
    >
      {/* Expert or studio: a corner signal */}
      <span
        className="absolute top-4 right-4 text-[10px] font-black font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
        style={{
          color: "#fff",
          backgroundColor: isStudio ? CYAN : ORANGE,
        }}
      >
        {isStudio ? "Studio" : "Expert"}
      </span>

      {/* Who */}
      <div className={`${pad} pt-5 lg:pt-6 pr-20 flex items-start gap-4`}>
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatar_url}
            alt=""
            className={`${avatar} rounded-full object-cover shrink-0`}
            style={{ border: "2px solid rgba(255,97,48,0.25)" }}
          />
        ) : (
          <div
            className={`${avatar} rounded-full flex items-center justify-center shrink-0`}
            style={{ backgroundColor: "rgba(8,145,178,0.12)" }}
          >
            <span className="text-2xl font-black font-headline" style={{ color: CYAN }}>
              {initial}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3
              className={`${compact ? "text-lg" : "text-[22px]"} font-black font-headline tracking-tight leading-tight`}
              style={{ color: INK, letterSpacing: "-0.02em" }}
            >
              {name}
            </h3>
            {m.is_founding_expert && <FoundingExpertBadge />}
          </div>
          {m.tagline && (
            <p className="text-[13px] font-bold font-headline mt-1.5 leading-snug" style={{ color: CYAN }}>
              {m.tagline}
            </p>
          )}
          {m.facts?.city && (
            <p className="text-xs mt-1" style={{ color: FAINT }}>
              {m.facts.city}
            </p>
          )}
        </div>
      </div>

      {/* About, quiet */}
      {!compact && m.bio && (
        <p className={`${pad} pt-4 text-sm leading-relaxed`} style={{ color: MUTED }}>
          {m.bio}
        </p>
      )}

      {/* The two answers, loud */}
      {(m.brings || m.seeks) && (
        <div className={`${pad} pt-4 pb-5 flex flex-col gap-2.5`}>
          {m.brings && <Block label={labels.brings} text={m.brings} accent={ORANGE} tint="rgba(255,97,48,0.06)" />}
          {m.seeks && <Block label={labels.seeks} text={m.seeks} accent={CYAN} tint="rgba(8,145,178,0.07)" />}
        </div>
      )}

      {/* Background: the backbone */}
      {groups.length > 0 && (
        <div
          className={`${pad} pt-4 pb-5 mt-auto`}
          style={{ backgroundColor: "rgba(12,38,46,0.06)", borderTop: "2px solid rgba(12,38,46,0.12)" }}
        >
          <div className={`grid gap-4 ${columns}`}>
            {groups.map((g) => (
              <div key={g.kind} className="min-w-0">
                <p className="flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: INK, color: "#fff" }}
                  >
                    <CredentialIcon kind={g.kind} size={12} studio={isStudio} />
                  </span>
                  <span className="text-[11px] font-black font-headline uppercase tracking-[0.14em]" style={{ color: INK }}>
                    {g.label}
                  </span>
                </p>
                <ul className="flex flex-col gap-1.5">
                  {g.items.map((c, i) => {
                    const detail = [c.org, credentialPeriod(c.year, c.year_end)].filter(Boolean).join(" · ");
                    return (
                      <li key={i} className="leading-snug">
                        <p className="text-[13px] font-bold font-headline" style={{ color: INK }}>
                          {c.title}
                        </p>
                        {detail && (
                          <p className="text-xs" style={{ color: MUTED }}>
                            {detail}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
