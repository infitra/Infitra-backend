import type { FoundingMember } from "@/app/components/FoundingCard";
import { FoundingCard } from "@/app/components/FoundingCard";
import { StageWaves } from "@/app/components/BrandWaves";
import { ApplyCTA } from "../ui";
import { HeroCards } from "./HeroCards";

/**
 * M1 · THE STAGE (12 Sep 2026): the dark hero, and the network inside it.
 *
 * The hero answers two questions and no others: what is the opportunity, and
 * what does INFITRA provide. One sentence carries both, in two typographic
 * beats. What an experience looks like from the inside is the next section's
 * job, not the opening's.
 *
 * Dark, because the cream cards have to pop off it, and because the page then
 * breathes dark, light, dark, light. The waves are the original paths with
 * the stops pulled down, never redrawn.
 *
 * ONE FLOW, not a stack. Once profiles are public the hero reads as a single
 * movement: here is the opportunity, the network is building up, here are the
 * people already in it, now your move. So the invitation comes before the
 * faces and the ask comes after them, never the other way around. While no
 * profile is public the band is simply absent and the pill carries the state:
 * an empty rail reserved for cards that do not exist yet is dead space.
 */
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.78)";
const CREAM_FAINT = "rgba(242,239,232,0.5)";
const CYAN_BRIGHT = "#9CF0FF";
const ORANGE = "#FF6130";
const TEAL = "#0C262E";

function Pill() {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
      style={{ backgroundColor: "rgba(156,240,255,0.10)", border: "1px solid rgba(156,240,255,0.25)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: CYAN_BRIGHT }} />
      <span className="text-[10px] tracking-widest uppercase font-headline" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
        The founding network is forming
      </span>
    </div>
  );
}

/** The tension, one whole line per colour. Cyan-bright, not the light page's
 *  cyan: #0891b2 goes muddy on teal. */
function Headline() {
  return (
    <h1
      className="font-headline tracking-tight leading-[1.12] mb-7"
      style={{ color: CREAM, fontWeight: 600, letterSpacing: "-0.025em", fontSize: "clamp(2rem, 4.6vw, 3.5rem)" }}
    >
      <span className="block" style={{ color: ORANGE, fontWeight: 700 }}>Offer more</span>
      <span className="block" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>without becoming everything.</span>
    </h1>
  );
}

/** What and why in one sentence: the opportunity, then what INFITRA puts
 *  under it. The second half carries the weight typographically, so one
 *  sentence still reads as two beats. */
function Punch({ tight }: { tight?: boolean }) {
  return (
    <p
      data-definition
      className={`text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl ${tight ? "mb-5" : "mb-9"}`}
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
  );
}

/** The turn from explanation to invitation, right before the faces. */
function Invite() {
  return (
    <div data-invite className="mb-6">
      <p className="text-[17px] md:text-xl leading-snug font-headline" style={{ color: CREAM, fontWeight: 600 }}>
        The founding network is building up.
      </p>
      <p
        className="text-[17px] md:text-xl leading-snug font-headline mt-1"
        style={{ color: CYAN_BRIGHT, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        Ready to collaborate?
      </p>
    </div>
  );
}

/** ApplyCTA's own micro is slate, tuned for cream grounds, so the stage
 *  writes its own. */
function Ask() {
  return (
    <div className="flex flex-col items-center">
      <ApplyCTA xl label="Join the founding network" />
      <p className="text-xs tracking-wide mt-4" style={{ color: CREAM_MUTED }}>
        Invite only. Apply, and if it fits, your personal invitation follows.
      </p>
    </div>
  );
}

export function Hero({ members, preview }: { members: FoundingMember[]; preview: boolean }) {
  const shown = members.slice(0, 6);
  const showCards = shown.length > 0;

  return (
    // svh so the centred content fits the VISIBLE viewport on phones, not the
    // taller vh box hidden behind the URL bar.
    <section
      id="stage"
      className={`relative overflow-hidden min-h-svh flex flex-col justify-center ${showCards ? "pt-20 pb-14" : "pt-28 pb-16"}`}
      style={{ backgroundColor: TEAL }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <StageWaves id="stage" />
      </div>

      <div className="relative z-10 w-full">
        {showCards ? (
          <>
            <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center text-center">
              <Headline />
              <Punch tight />
              <Invite />
            </div>

            <HeroCards
              members={shown}
              preview={preview}
              more={members.length > shown.length}
              cards={shown.map((m) => (
                <FoundingCard key={m.id} m={m} />
              ))}
            />

            <div className="px-6 mt-8">
              <Ask />
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center text-center">
            <Pill />
            <Headline />
            <Punch />
            <Ask />
            <div className="mt-12 flex flex-col items-center gap-1.5" style={{ color: CREAM_FAINT }} aria-hidden>
              <span className="text-[11px] uppercase tracking-[0.22em] font-headline" style={{ fontWeight: 700 }}>
                See who it is for
              </span>
              <svg className="animate-bounce" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
