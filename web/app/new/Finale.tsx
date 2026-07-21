import { INK, ORANGE, CYAN, MUTED, ApplyCTA } from "./ui";
import { Reveal } from "./Reveal";
import { WaitlistForm } from "./WaitlistForm";

/**
 * M8 · THE FINALE — "The room is open." The page's single climax. Act 2 ends
 * on "Ready to join the movement?" — this section answers it: this is how
 * you can be part. Two doors, nothing else: experts found the pilot,
 * participants join the waitlist. Straightforward and converting.
 */

export function Finale() {
  return (
    <section id="join" className="px-6 pt-20 pb-24" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 16%, rgba(255,255,255,0.45) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        {/* Question → answer → doors, one viewport. Act 2 releases into this. */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          {/* the couplet, reunited whole at the climax — each half was proven
             by the chapter it led (collaboration story / experience story) */}
          <p
            className="text-lg md:text-2xl font-headline tracking-tight mb-3"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            From isolation to <span style={{ color: ORANGE }}>collaboration.</span> From content to <span style={{ color: CYAN }}>experience.</span>
          </p>
          <h2
            className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.02] mb-5"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            The room <span style={{ color: ORANGE }}>is open.</span>
          </h2>
          <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
            Digital fitness is shifting — from paying for access to content, to
            participating in live experiences built together. Shape what INFITRA
            becomes and position yourself early. Two ways in.
          </p>
        </div>

        <Reveal>
          <div className="grid lg:grid-cols-5 gap-6 items-stretch">
            {/* Door 1 — creators (primary) */}
            <div
              className="lg:col-span-3 rounded-3xl p-7 md:p-8 flex flex-col text-left"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.35), 0 24px 60px rgba(255,97,48,0.12)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                For experts · The founding pilot
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Build one of the first five.
              </h3>
              <p className="text-[15px] md:text-base mt-3 leading-relaxed" style={{ color: MUTED }}>
                Pair with a complementary expert and found a real experience with
                direct, hands-on support — everything you just scrolled through,
                running for your audience.
              </p>

              <div className="mt-auto pt-8 flex justify-center">
                <ApplyCTA xl micro="5 founding pairs · reviewed individually · starting now" />
              </div>
            </div>

            {/* Door 2 — participants (quiet) */}
            <div
              className="lg:col-span-2 rounded-3xl p-7 md:p-8 flex flex-col text-left"
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
              <div className="mt-auto pt-8">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
