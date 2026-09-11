import type { FoundingMember } from "@/app/components/FoundingCard";
import { FoundingCard } from "@/app/components/FoundingCard";
import { StageWaves } from "@/app/components/BrandWaves";
import { ApplyCTA } from "../ui";
import { HeroCards } from "./HeroCards";

/**
 * M1 · THE STAGE (11 Sep 2026): the dark hero, and the network inside it.
 *
 * The hero answers two questions and no others: what is the opportunity, and
 * what does INFITRA provide. One sentence carries both, in two typographic
 * beats. What an experience looks like from the inside (the weeks, the live
 * video, the tribe space) is the next section's job, not the opening's.
 *
 * Dark, because the cream cards with the brand waves have to pop off it, and
 * because the page then breathes dark, light, dark, light. The waves are the
 * original paths with the stops pulled down, never redrawn.
 *
 * Two layouts, one copy deck. While no card is public the hero is centred and
 * holds nothing else: an empty column reserved for cards that do not exist
 * yet is dead space. The moment the first profile is public, the layout
 * switches: the copy moves left and the network stands beside it, compact
 * tiles that open the full card. That is momentum you can see, in the first
 * viewport, before a single argument is made.
 */
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.78)";
const CREAM_FAINT = "rgba(242,239,232,0.5)";
const CYAN_BRIGHT = "#9CF0FF";
const ORANGE = "#FF6130";
const TEAL = "#0C262E";

function Copy({ centered }: { centered: boolean }) {
  return (
    <div className={centered ? "flex flex-col items-center text-center" : "text-left"}>
      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
        style={{ backgroundColor: "rgba(156,240,255,0.10)", border: "1px solid rgba(156,240,255,0.25)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: CYAN_BRIGHT }} />
        <span className="text-[10px] tracking-widest uppercase font-headline" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
          The founding network is forming
        </span>
      </div>

      {/* The tension, one whole line per colour. Cyan-bright, not the light
         page's cyan: #0891b2 goes muddy on teal. */}
      <h1
        className="font-headline tracking-tight leading-[1.12] mb-7"
        style={{
          color: CREAM,
          fontWeight: 600,
          letterSpacing: "-0.025em",
          fontSize: centered ? "clamp(2rem, 4.6vw, 3.5rem)" : "clamp(2rem, 3.6vw, 2.875rem)",
        }}
      >
        <span className="block" style={{ color: ORANGE, fontWeight: 700 }}>Offer more</span>
        <span className="block" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>without becoming everything.</span>
      </h1>

      {/* What and why in one sentence: the opportunity, then what INFITRA
         puts under it. The second half carries the weight typographically so
         one sentence still reads as two beats. */}
      <p
        data-definition
        className={`text-base md:text-xl lg:text-[22px] leading-relaxed mb-9 ${centered ? "max-w-2xl" : "max-w-[46ch]"}`}
        style={{ color: CREAM_MUTED }}
      >
        INFITRA makes professional collaboration in fitness and health easy:
        experts, studios and gyms create live experiences together that none
        could run alone,{" "}
        <span style={{ color: CREAM, fontWeight: 600 }}>
          with the infrastructure and the revenue split provided on a
          transparent agreement.
        </span>
      </p>

      {/* ApplyCTA centres its own contents, so in the two-column layout it
         sits in an inline-block that shrinks to the button. Its micro is
         slate for cream grounds, so the stage writes its own. */}
      <div className={centered ? "" : "inline-block"}>
        <ApplyCTA xl label="Join the founding network" />
      </div>
      <p className="text-xs tracking-wide mt-4" style={{ color: CREAM_MUTED }}>
        Invite only. Apply, and if it fits, your personal invitation follows.
      </p>
    </div>
  );
}

export function Hero({ members, preview }: { members: FoundingMember[]; preview: boolean }) {
  const shown = members.slice(0, 3);
  const showCards = shown.length > 0;

  return (
    // svh so the centred content fits the VISIBLE viewport on phones, not the
    // taller vh box hidden behind the URL bar.
    <section
      id="stage"
      className="relative overflow-hidden min-h-svh lg:min-h-[92vh] flex flex-col justify-center px-6 pt-28 pb-16"
      style={{ backgroundColor: TEAL }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <StageWaves id="stage" />
      </div>

      <div className="relative z-10 w-full">
        {showCards ? (
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 lg:gap-14 items-center">
            <div className="min-w-0">
              <Copy centered={false} />
            </div>
            <div className="min-w-0 w-full lg:max-w-[380px] lg:ml-auto">
              <HeroCards
                members={shown}
                preview={preview}
                more={members.length > shown.length}
                cards={shown.map((m) => (
                  <FoundingCard key={m.id} m={m} />
                ))}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            <Copy centered />
          </div>
        )}

        <div className="mt-12 flex flex-col items-center gap-1.5" style={{ color: CREAM_FAINT }} aria-hidden>
          <span className="text-[11px] uppercase tracking-[0.22em] font-headline" style={{ fontWeight: 700 }}>
            See who it is for
          </span>
          <svg className="animate-bounce" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
