import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, v6 on 8 Sep). Rendered on the
 * landing row, on /founding-network, in the logged-in directory, live next
 * to the join form and on the arrival stage; the same shape everywhere.
 *
 * Three things, nothing else: the person (a large photo, the name with the
 * founding badge, one line, city; expert or studio as a corner signal), the
 * two answers as tagged blocks, and the background as a tidy label column
 * on cream. A studio fills the same three background slots with its own
 * meanings: track record, team, recognition. Fed by load_founding_community():
 * explicit public-safe columns, never an email.
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
  const photo = compact ? "w-[88px] h-[88px]" : "w-[132px] h-[132px]";

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
        style={{ color: "#fff", backgroundColor: isStudio ? CYAN : ORANGE }}
      >
        {isStudio ? "Studio" : "Expert"}
      </span>

      {/* The person: the photo is the editorial moment */}
      <div className={`${pad} pt-5 lg:pt-6 pb-5 pr-20 flex items-center gap-5`}>
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatar_url}
            alt=""
            className={`${photo} rounded-2xl object-cover shrink-0`}
            style={{ boxShadow: "0 10px 24px rgba(15,34,41,0.18), 0 0 0 3px rgba(255,97,48,0.35)" }}
          />
        ) : (
          <div
            className={`${photo} rounded-2xl flex items-center justify-center shrink-0`}
            style={{ backgroundColor: "rgba(8,145,178,0.12)", boxShadow: "0 0 0 3px rgba(8,145,178,0.25)" }}
          >
            <span className={`${compact ? "text-3xl" : "text-5xl"} font-black font-headline`} style={{ color: CYAN }}>
              {initial}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={`${compact ? "text-xl" : "text-2xl lg:text-[26px]"} font-black font-headline tracking-tight leading-tight`}
            style={{ color: INK, letterSpacing: "-0.025em" }}
          >
            {name}
          </h3>
          {m.tagline && (
            <p className="text-sm font-bold font-headline mt-1.5 leading-snug" style={{ color: CYAN }}>
              {m.tagline}
            </p>
          )}
          {m.facts?.city && (
            <p className="text-xs mt-1" style={{ color: FAINT }}>
              {m.facts.city}
            </p>
          )}
          {m.is_founding_expert && <FoundingExpertBadge className="mt-2.5" />}
        </div>
      </div>

      {/* The two answers */}
      {(m.brings || m.seeks) && (
        <div className={`${pad} pb-5 flex flex-col gap-2.5`}>
          {m.brings && <Block label={labels.brings} text={m.brings} accent={ORANGE} tint="rgba(255,97,48,0.06)" />}
          {m.seeks && <Block label={labels.seeks} text={m.seeks} accent={CYAN} tint="rgba(8,145,178,0.07)" />}
        </div>
      )}

      {/* Background: a tidy label column on cream; the icons carry the weight */}
      {groups.length > 0 && (
        <div
          className={`${pad} py-3 mt-auto`}
          style={{ backgroundColor: "rgba(242,239,232,0.9)", borderTop: "1px solid rgba(15,34,41,0.08)" }}
        >
          <dl className="flex flex-col">
            {groups.map((g, gi) => (
              <div
                key={g.kind}
                className={`grid gap-x-5 gap-y-2 ${compact ? "grid-cols-1" : "sm:grid-cols-[168px_minmax(0,1fr)]"} py-3`}
                style={gi > 0 ? { borderTop: "1px solid rgba(15,34,41,0.08)" } : undefined}
              >
                <dt className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: ORANGE, color: "#fff", boxShadow: "0 4px 10px rgba(255,97,48,0.28)" }}
                  >
                    <CredentialIcon kind={g.kind} size={15} studio={isStudio} strokeWidth={2.2} />
                  </span>
                  <span className="text-[11px] font-black font-headline uppercase tracking-[0.16em]" style={{ color: INK }}>
                    {g.label}
                  </span>
                </dt>
                <dd className="m-0 flex flex-col gap-2">
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
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </article>
  );
}
