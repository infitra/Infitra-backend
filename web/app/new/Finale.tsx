import { INK, ORANGE, CYAN, MUTED, ApplyCTA } from "./ui";
import { Reveal } from "./Reveal";
import { WaitlistForm } from "./WaitlistForm";

/**
 * M8 · THE FINALE — "The room is open." The page's single climax. Act 2 ends
 * on "Ready to join the movement?" — this section answers it: this is how
 * you can be part. Two doors, nothing else: creators found the pilot,
 * participants join the waitlist. Straightforward and converting.
 */

export function Finale() {
  return (
    <section id="join" className="px-6 pt-24 pb-32" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 16%, rgba(255,255,255,0.45) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Question → answer → doors, one viewport. Act 2 releases into this. */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <p
            className="text-xl md:text-3xl font-headline tracking-tight mb-4"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Ready to join <span style={{ color: ORANGE }}>the movement?</span>
          </p>
          <h2
            className="text-4xl md:text-7xl font-headline tracking-tight leading-[1.02] mb-6"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            The room <span style={{ color: ORANGE }}>is open.</span>
          </h2>
          <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
            Digital fitness is shifting — from paying for access to content, to
            participating in live experiences built together. Shape what INFITRA
            becomes and position yourself early. Two ways in.
          </p>
        </div>

        <Reveal>
          <div className="grid lg:grid-cols-5 gap-6 items-stretch">
            {/* Door 1 — creators (primary) */}
            <div
              className="lg:col-span-3 rounded-3xl p-8 md:p-10 flex flex-col text-left"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.35), 0 24px 60px rgba(255,97,48,0.12)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                For creators · The founding pilot
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Build one of the first five.
              </h3>
              <p className="text-[15px] md:text-base mt-3 leading-relaxed" style={{ color: MUTED }}>
                Pair with a complementary expert and found a real experience with
                direct, hands-on support — everything you just scrolled through,
                running for your audience.
              </p>

              <div className="mt-auto pt-9 flex justify-center">
                <ApplyCTA micro="5 founding pairs · reviewed individually · starting now" />
              </div>
            </div>

            {/* Door 2 — participants (quiet) */}
            <div
              className="lg:col-span-2 rounded-3xl p-8 md:p-10 flex flex-col text-left"
              style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: "0 0 0 1px rgba(8,145,178,0.22)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
                For participants
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Be in the first rooms.
              </h3>
              <p className="text-[15px] md:text-base mt-3 leading-relaxed" style={{ color: MUTED }}>
                The first experiences open with the pilot. Leave your email and
                you&apos;re first in when the doors open.
              </p>
              <div className="mt-auto pt-9">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
