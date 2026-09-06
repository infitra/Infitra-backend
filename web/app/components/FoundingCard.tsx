import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "@/app/(app)/experiences/[id]/PublicChallengeHero";

/**
 * One founding-community card (6 Sep 2026). Rendered on the landing row,
 * on /founding-group and in the logged-in directory; the same shape in all
 * three places, so a member sees on the homepage exactly what they set up.
 *
 * Fed by load_founding_community(): explicit public-safe columns, never an
 * email. The sentence (collab_wish) is the matching surface.
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
  visibility: "members" | "public";
  collab_wish: string | null;
  facts: { city?: string | null; disciplines?: string[]; focus?: string | null };
  credentials: { kind: string; title: string; org: string | null; year: number | null; year_end: number | null }[];
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

export function FoundingCard({ m, compact = false }: { m: FoundingMember; compact?: boolean }) {
  const name = m.display_name ?? "Founding member";
  const initial = (name[0] ?? "?").toUpperCase();
  const disciplines = (m.facts?.disciplines ?? []).slice(0, compact ? 3 : 6);
  const creds = (m.credentials ?? []).slice(0, compact ? 2 : 4);

  return (
    <article
      className="rounded-2xl p-5 lg:p-6 flex flex-col gap-4 h-full"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.04), 0 10px 30px rgba(15,34,41,0.05)",
      }}
    >
      <div className="flex items-start gap-4">
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatar_url}
            alt=""
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
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
                color: m.entity_type === "studio" ? CYAN : ORANGE,
                backgroundColor:
                  m.entity_type === "studio" ? "rgba(8,145,178,0.10)" : "rgba(255,97,48,0.10)",
              }}
            >
              {m.entity_type === "studio" ? "Studio" : "Expert"}
            </span>
          </div>
          {m.tagline && (
            <p className="text-xs font-bold font-headline mt-1" style={{ color: CYAN }}>
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

      {m.collab_wish && (
        <p
          className="text-[15px] leading-snug font-headline"
          style={{ color: INK, fontWeight: 600 }}
        >
          <span style={{ color: ORANGE }}>&ldquo;</span>
          {m.collab_wish}
          <span style={{ color: ORANGE }}>&rdquo;</span>
        </p>
      )}

      {!compact && m.bio && (
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
          {m.bio}
        </p>
      )}

      {disciplines.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {disciplines.map((d) => (
            <span
              key={d}
              className="text-[11px] px-2.5 py-1 rounded-md font-bold font-headline"
              style={{ backgroundColor: "rgba(15,34,41,0.05)", color: INK }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {creds.length > 0 && (
        <ul className="space-y-1.5 mt-auto">
          {creds.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#475569" }}>
              <CredentialIcon kind={c.kind} />
              <span>
                <span className="font-bold font-headline" style={{ color: INK }}>
                  {c.title}
                </span>
                {c.org ? ` · ${c.org}` : ""}
                {credentialPeriod(c.year, c.year_end) ? ` · ${credentialPeriod(c.year, c.year_end)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
