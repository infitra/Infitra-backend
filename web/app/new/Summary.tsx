import { INK, ORANGE, CYAN, MUTED } from "./ui";
import { Reveal } from "./Reveal";

/**
 * M7.5 · THE SUMMARY — the synthesis the story built toward.
 *
 * Both chapters end; here their refrains reunite ("From isolation to
 * collaboration. From content to experience.") and the whole story
 * compresses into one statement + four pillars — design & agree, publish
 * once, live together, grow every run. The payoff moment ("wow, this is
 * one thing") that releases straight into the conversion doors below.
 */

const P_CONTRACT = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M7.5 19.5c1.4-2.3 2-4.8 2-7.5a2.5 2.5 0 0 1 5 0c0 2.4-.4 4.8-1.2 7" />
    <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5 0 1.7-.2 3.4-.6 5" />
    <path d="M4.5 12a7.5 7.5 0 0 1 3.7-6.5" />
    <path d="M4.9 15.5c.4-1.1.6-2.3.6-3.5" />
  </svg>
);
const P_PUBLISH = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10v4h3l11 5V5L6 10H3z" />
    <path d="M20 9a5 5 0 0 1 0 6" />
  </svg>
);
const P_LIVE = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12h4l3 8 4-16 3 8h6" />
  </svg>
);
const P_GROW = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 7l-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

const PILLARS = [
  { icon: P_CONTRACT, c: ORANGE, t: "Design & agree", d: "One shared workspace, one sealed agreement, a fair split." },
  { icon: P_PUBLISH, c: CYAN, t: "Publish once", d: "Page, checkout, rooms, space — live in one click." },
  { icon: P_LIVE, c: ORANGE, t: "Show up live", d: "Your tribe trains together, week after week." },
  { icon: P_GROW, c: CYAN, t: "Grow every run", d: "Re-enrollment, new people, natural progression." },
];

export function Summary() {
  return (
    <section className="px-5 sm:px-6 pt-24 pb-10 md:pt-32 md:pb-14">
      <div className="max-w-5xl mx-auto text-center">
        <Reveal>
          <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-5" style={{ color: CYAN, fontWeight: 800 }}>
            The whole story
          </p>
          {/* the refrains, reunited — each half was proven by its chapter */}
          <h2
            className="font-headline tracking-tight leading-[1.14] max-w-4xl mx-auto"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em", fontSize: "clamp(1.9rem, 4.4vw, 3.2rem)" }}
          >
            <span className="block mb-1.5">From isolation to <span style={{ color: ORANGE }}>collaboration.</span></span>
            <span className="block">From content to <span style={{ color: CYAN }}>experience.</span></span>
          </h2>
          <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto mt-7" style={{ color: MUTED }}>
            That&apos;s INFITRA — complementary experts building one living fitness
            experience: designed together, published in one click, alive every week,
            growing run after run.
          </p>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5 mt-12 md:mt-14 text-left">
            {PILLARS.map(({ icon, c, t, d }) => (
              <div
                key={t}
                className="rounded-3xl p-5 md:p-6"
                style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 18px 44px rgba(15,34,41,0.09)" }}
              >
                <span className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${c}12` }}>
                  {icon(c, 20)}
                </span>
                <p className="text-[14.5px] md:text-[16px] font-headline leading-snug mt-3.5" style={{ color: INK, fontWeight: 800 }}>{t}</p>
                <p className="text-[11.5px] md:text-[12.5px] font-semibold mt-1 leading-snug" style={{ color: MUTED }}>{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
