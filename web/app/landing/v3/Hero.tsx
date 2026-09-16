import type { FoundingMember } from "@/app/components/FoundingCard";
import { FoundingCard } from "@/app/components/FoundingCard";
import { ApplyCTA } from "../ui";
import { HeroCards } from "./HeroCards";
import { TwoDoors } from "./TwoDoors";

/**
 * M1 · THE STAGE (12 Sep 2026): the dark hero, and the network inside it.
 *
 * The whole pitch is here now, in one movement: what the thing is, who it is
 * for and what each of them gets, what they keep, the network building up,
 * the people already in it, and the ask. Everything under it is the demo.
 *
 * Dark, because the cream cards have to pop off it, and because the page then
 * breathes dark, light, dark, light. The waves are the original paths with
 * the stops pulled down, never redrawn.
 *
 * The invitation comes before the faces and the ask after them, never the
 * other way around: the faces mean nothing until the reader knows why they
 * would want to be among them. While no profile is public the band is simply
 * absent; the invitation line carries the state on its own, which is why
 * there is no pill saying the same thing two hundred pixels above it.
 */
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.78)";
const CYAN_BRIGHT = "#9CF0FF";
const ORANGE = "#FF6130";

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

/** What the thing is, then what INFITRA does about it. Who "together" means
 *  is answered two lines down by the doors, so the roles are named once. */
function Punch({ tight }: { tight?: boolean }) {
  return (
    <p
      data-definition
      className={`text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl ${tight ? "mb-5" : "mb-9"}`}
      style={{ color: CREAM_MUTED }}
    >
      One live experience, created together and run online over several
      weeks.{" "}
      <span style={{ color: CREAM, fontWeight: 600 }}>
        INFITRA handles everything around it.
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
      className="relative min-h-svh flex flex-col justify-center pt-24 pb-16"
    >
      <div className="relative z-10 w-full">
        <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center text-center">
          <Headline />
          <Punch tight />
        </div>

        <div className="px-6 mt-2 md:mt-4">
          <TwoDoors />
        </div>

        <div className="max-w-4xl mx-auto w-full px-6 mt-12 md:mt-14 flex flex-col items-center text-center">
          <Invite />
        </div>

        {showCards && (
          <HeroCards
            members={shown}
            preview={preview}
            more={members.length > shown.length}
            cards={shown.map((m) => (
              <FoundingCard key={m.id} m={m} />
            ))}
          />
        )}

        <div className="px-6 mt-8">
          <Ask />
        </div>
      </div>
    </section>
  );
}
