import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-network card (6 Sep 2026, v7 on 8 Sep). Rendered on the
 * landing row, on /founding-network, in the network, live next to the join
 * form and on the arrival stage; the same shape everywhere.
 *
 * The photo is the card: a full-width portrait with the name set into it.
 * Then the founding badge, the two answers as tagged blocks, one link to
 * where to find them (network only; the public reader omits it), and the
 * background as a tidy label column on cream. A studio fills the same three
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
const CREAM = "#F2EFE8";
const MUTED = "#475569";

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

  return (
    <article
      className="rounded-2xl flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: solid ? "#FFFFFF" : "rgba(255,255,255,0.78)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.04), 0 10px 30px rgba(15,34,41,0.05)",
      }}
    >
      {/* The photo is the card */}
      <div className="relative w-full" style={{ aspectRatio: compact ? "4 / 3" : "16 / 9" }}>
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatar_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "50% 30%" }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0C262E 0%, #14424E 100%)" }}
          >
            <span className={`${compact ? "text-6xl" : "text-8xl"} font-black font-headline`} style={{ color: "rgba(156,240,255,0.35)" }}>
              {initial}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(12,38,46,0) 30%, rgba(12,38,46,0.45) 60%, rgba(12,38,46,0.92) 100%)" }}
        />
        <span
          className="absolute top-4 right-4 text-[10px] font-black font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
          style={{ color: "#fff", backgroundColor: isStudio ? CYAN : ORANGE, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
        >
          {isStudio ? "Studio" : "Expert"}
        </span>
        <div className={`absolute inset-x-0 bottom-0 ${pad} pb-5`}>
          <h3
            className={`${compact ? "text-2xl" : "text-3xl lg:text-[34px]"} font-black font-headline tracking-tight leading-none`}
            style={{ color: CREAM, letterSpacing: "-0.03em", textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
          >
            {name}
          </h3>
          {m.tagline && (
            <p className={`${compact ? "text-sm" : "text-base"} font-bold font-headline mt-2 leading-snug`} style={{ color: CYAN_BRIGHT }}>
              {m.tagline}
            </p>
          )}
          {m.facts?.city && (
            <p className="text-xs mt-1" style={{ color: "rgba(242,239,232,0.75)" }}>
              {m.facts.city}
            </p>
          )}
        </div>
      </div>

      {/* Badge, then the two answers */}
      <div className={`${pad} pt-4 pb-5 flex flex-col gap-3`}>
        {m.is_founding_expert && (
          <div>
            <FoundingExpertBadge />
          </div>
        )}
        {m.brings && <Block label={labels.brings} text={m.brings} accent={ORANGE} tint="rgba(255,97,48,0.06)" />}
        {m.seeks && <Block label={labels.seeks} text={m.seeks} accent={CYAN} tint="rgba(8,145,178,0.07)" />}
        {m.link_url && (
          <a
            href={m.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-1.5 text-xs font-bold font-headline hover:opacity-80"
            style={{ color: CYAN }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
            </svg>
            {linkLabel(m.link_url)}
          </a>
        )}
      </div>

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
