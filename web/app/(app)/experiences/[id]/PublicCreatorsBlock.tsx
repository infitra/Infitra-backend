/**
 * PublicCreatorsBlock — "Who Handles What" for buyers.
 *
 * Side-by-side creator portrait cards (mirrors the workspace's polished
 * team rows from v12.N onwards, but bigger and read-only for marketing).
 * Each card: large avatar, name, bio paragraph, topics they bring as
 * role-coloured chips.
 *
 * The two-creator parity is the brand differentiator. Identical card
 * structure for both creators reinforces that they're co-leads, not
 * a star + assistant.
 *
 * For 3+ creators (rare at pilot), wraps gracefully to multiple rows.
 * For solo (1 creator), still renders the same card structure — looks
 * fine on its own, doesn't pretend there's a partner.
 */

import Image from "next/image";
import { CredentialIcon, credentialPeriod } from "@/app/components/CredentialIcon";
import { FoundingExpertBadge } from "./PublicChallengeHero";

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  tagline: string | null;
  role: "owner" | "cohost";
  is_founding_expert?: boolean | null;
}

export interface CreatorCredential {
  id: string;
  kind: string;
  title: string;
  org: string | null;
  year: number | null;
  year_end: number | null;
}

interface Props {
  creators: Creator[];
  topicsByCreator: Record<string, string[]>;
  /** P7 trust strip: structured, self-declared background per expert. */
  credentialsByCreator?: Record<string, CreatorCredential[]>;
}

export function PublicCreatorsBlock({ creators, topicsByCreator, credentialsByCreator = {} }: Props) {
  return (
    <section className="px-6 lg:px-12 py-12 lg:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Section eyebrow + heading. Bundle 4.2.2: "Experts" not "coaches"
            (brand-language shift — capitalized as a noun). Section 2 begins
            with this block; it's the deeper-dive on the people the buyer
            saw in the hero card. */}
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3 text-center"
          style={{ color: "#FF6130" }}
        >
          Your Experts
        </p>
        <h2
          className="text-3xl lg:text-5xl font-black font-headline tracking-tight text-center mb-4"
          style={{ color: "#0F2229", letterSpacing: "-0.02em" }}
        >
          {creators.length === 1
            ? "Meet your Expert"
            : "Meet your Experts"}
        </h2>
        <p
          className="text-sm sm:text-base text-center mb-10 lg:mb-12 max-w-xl mx-auto leading-relaxed"
          style={{ color: "#475569" }}
        >
          {creators.length === 1
            ? "Designed around your goals: focused attention, one experience, one Expert."
            : "Designed and led together. Different strengths, one experience, shared accountability for your results."}
        </p>

        {/* Cards: side-by-side on desktop, stacked on mobile */}
        <div
          className={`grid gap-5 ${
            creators.length === 2
              ? "grid-cols-1 md:grid-cols-2"
              : creators.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {creators.map((c) => {
            const roleColor = c.role === "owner" ? "#FF6130" : "#0891b2";
            const topics = topicsByCreator[c.id] ?? [];
            const credentials = credentialsByCreator[c.id] ?? [];

            return (
              <article
                key={c.id}
                className="rounded-2xl p-6 lg:p-8"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(15,34,41,0.06)",
                  // Bundle 4.2.53: trimmed the large 24px-blur shadow to a
                  // tighter 14px. Visually near-identical, smaller blurred
                  // paint region as these below-fold cards scroll in.
                  boxShadow:
                    "0 1px 2px rgba(15,34,41,0.04), 0 4px 14px rgba(15,34,41,0.05)",
                }}
              >
                {/* Avatar + name + tagline */}
                <div className="flex items-start gap-4 mb-5">
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.display_name ?? "Creator"}
                      width={96}
                      height={96}
                      // Bundle 4.2.53: eager (not lazy) + tinted slot. These
                      // sit just below the fold and were popping in on a fast
                      // scroll. Tiny optimized avatars — cheap to load up
                      // front; the cream tint covers the brief pre-paint gap.
                      loading="eager"
                      decoding="async"
                      className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover shrink-0"
                      style={{ backgroundColor: "#ECE7DD" }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${roleColor}20` }}
                    >
                      <span
                        className="text-2xl lg:text-3xl font-black font-headline"
                        style={{ color: roleColor }}
                      >
                        {(c.display_name ?? "?")[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-1">
                    <h3
                      className="text-lg lg:text-xl font-black font-headline tracking-tight leading-tight"
                      style={{ color: "#0F2229" }}
                    >
                      {c.display_name ?? "Creator"}
                    </h3>
                    {c.tagline && (
                      <p
                        className="text-xs font-bold font-headline mt-1.5"
                        style={{ color: roleColor }}
                      >
                        {c.tagline}
                      </p>
                    )}
                    {c.is_founding_expert && <FoundingExpertBadge className="mt-2" />}
                  </div>
                </div>

                {/* Bio paragraph */}
                {c.bio && c.bio.trim() && (
                  <p
                    className="text-sm leading-relaxed mb-5 whitespace-pre-wrap"
                    style={{ color: "#475569" }}
                  >
                    {c.bio}
                  </p>
                )}

                {/* Topics they bring — role-coloured chips */}
                {topics.length > 0 && (
                  <>
                    <p
                      className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mb-2.5"
                      style={{ color: "#94a3b8" }}
                    >
                      Focuses on
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-1 rounded-md font-bold font-headline"
                          style={{
                            backgroundColor: `${roleColor}15`,
                            color: roleColor,
                          }}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* P7 · BACKGROUND — the legitimacy layer. Structured
                    credentials, rendered as a quiet document-like list: this
                    is where a buyer's "are these people qualified?" gets its
                    answer, on the page where the money decision happens. */}
                {credentials.length > 0 && (
                  <>
                    <p
                      className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mt-4 mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Background
                    </p>
                    <ul className="space-y-1.5">
                      {credentials.map((cr) => {
                        const period = credentialPeriod(cr.year, cr.year_end);
                        const meta = [cr.org, period].filter(Boolean).join(" · ");
                        return (
                          // Icon in its own fixed column, text free to wrap:
                          // the old baseline-flex row let long titles wrap and
                          // stranded the org/year fragments mid-line.
                          <li key={cr.id} className="flex gap-2">
                            <span className="shrink-0 mt-[3px]" style={{ color: roleColor }}>
                              <CredentialIcon kind={cr.kind} size={14} />
                            </span>
                            <span className="text-[12.5px] leading-snug">
                              <span className="font-bold font-headline" style={{ color: "#0F2229" }}>
                                {cr.title}
                              </span>
                              {meta && <span style={{ color: "#94a3b8" }}> · {meta}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
