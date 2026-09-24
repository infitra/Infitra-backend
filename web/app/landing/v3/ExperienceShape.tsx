import { StageWaves } from "@/app/components/BrandWaves";
import { EX, ALEX, MIRA } from "../content";
import { ORANGE } from "../ui";

/** The card runs the dark theme: it sits on the cream page and has to read
 *  as one object, not as a lighter patch of it. Same teal as the stage, and
 *  therefore the BRIGHT cyan, which is the only one that works on teal. */
const TEAL = "#0C262E";
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.78)";
const CREAM_FAINT = "rgba(242,239,232,0.45)";
const CYAN_BRIGHT = "#9CF0FF";

/**
 * THE SHAPE (23 Sep 2026): what a live experience actually is, in one still
 * picture, before the example runs.
 *
 * Both Michael and Marco came off calls without knowing what an experience
 * looks like. The answer was already on the page twice and both times in a
 * costume: as metadata inside the mock marketing page, and as LiveWeek, six
 * scroll-chapters deep. So nothing here is new information. The caption
 * strip was deleted from the mockup and its facts moved here, into the
 * page's own voice, where the question is actually asked.
 *
 * Two layers, and the relationship between them is the whole point:
 *   · the weeks, with that week's real live moments as marks (the rhythm)
 *   · ONE unbroken band beneath all of them (the part that never stops)
 * Every other rendering on this page shows the sessions and leaves the
 * in-between invisible, which is exactly the half that was missing.
 *
 * IT IS THE SHAPE, NOT AN INSTANCE (23 Sep, second pass). The first build
 * labelled this with the flagship's names, arc themes and session count,
 * which put the example on the page before the example was introduced and,
 * worse, made one run look like the definition of the product. BRAND bans
 * exactly that move in its other form: a duo is the example, never the
 * definition. So the cadence still comes from content.ts, because a real
 * run's rhythm is not something to invent, but nothing here is labelled
 * with that run: the weeks are numbers, and the colours are roles.
 *
 * MARKS ARE COLOURED BY ROLE, not by person: orange is whoever owns the
 * experience, cyan is the complement they brought in, and the two sessions
 * they host together carry both. That is the same language as the hero's
 * two doors and the same language the buyer page uses for owner and cohost,
 * so one colour rule spans three surfaces. In the flagship that happens to
 * be Alex (owner, 60) and Mira (cohost, 40).
 *
 * Still on purpose: no pinned scroll, no parallax, not even hover. This is
 * the quick answer, and the page already has three chapters that move.
 */

type Lead = "owner" | "complement" | "both";

function leadOf(host: string): Lead {
  const owner = host.includes(ALEX.first);
  const complement = host.includes(MIRA.first);
  if (owner && complement) return "both";
  return complement ? "complement" : "owner";
}

const WEEKS = EX.agenda.map((sessions, i) => ({
  n: i + 1,
  leads: sessions.map((s) => leadOf(s.host)),
}));

function Mark({ lead }: { lead: Lead }) {
  const background =
    lead === "both"
      ? `linear-gradient(180deg, ${ORANGE} 0%, ${ORANGE} 50%, ${CYAN_BRIGHT} 50%, ${CYAN_BRIGHT} 100%)`
      : lead === "owner"
        ? ORANGE
        : CYAN_BRIGHT;
  return (
    <span
      className="block w-[6px] sm:w-[9px] h-7 sm:h-9 rounded-full shrink-0"
      style={{ background }}
      aria-hidden
    />
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function ExperienceShape() {
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        backgroundColor: TEAL,
        boxShadow: "0 18px 48px rgba(12,38,46,0.22), 0 2px 8px rgba(12,38,46,0.10)",
      }}
    >
      <div className="px-4 sm:px-6 pt-5 sm:pt-6">
        {/* Roles, not names, and it carries the header alone now. The moment
           the marks are labelled this way the picture states the thing that
           is actually new about INFITRA, which the first build only hinted
           at: the live moments are led by two independent businesses,
           alternating, opening and closing it together. Same two words the
           split visual uses further down, so the page teaches one mental
           model twice. It is the key to the whole card, so it is set at the
           weight of a label rather than a footnote. */}
        <p
          className="text-[13px] sm:text-sm font-headline mb-5"
          style={{ color: CREAM, fontWeight: 600 }}
        >
          <Dot color={ORANGE} />
          You
          <span className="mx-2.5" style={{ color: CREAM_FAINT }}>
            ·
          </span>
          <Dot color={CYAN_BRIGHT} />
          Your complement
        </p>

        {/* The rhythm. Column gap stays wider than the gap between marks, so
           six clusters read before twenty marks do. */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-3 relative z-10">
          {WEEKS.map((w) => (
            <div key={w.n} className="min-w-0">
              {/* Spelled out, and neither uppercase nor letter-spaced: six
                 columns of "WEEK 1" at that tracking do not fit a phone. */}
              <p
                className="text-[10px] sm:text-[11px] font-headline whitespace-nowrap"
                style={{ color: CREAM_FAINT, fontWeight: 700 }}
              >
                Week {w.n}
              </p>
              <div className="mt-3 sm:mt-4 flex items-end gap-1 sm:gap-1.5 h-7 sm:h-9">
                {w.leads.map((lead, i) => (
                  <Mark key={i} lead={lead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The part that never stops. Full bleed on purpose: it has to keep
         going where the weeks stop, and the marks overlap into it so they
         read as rising out of it rather than sitting above it. */}
      <div
        className="relative -mt-1.5 h-[80px] sm:h-[88px] overflow-hidden"
        style={{
          backgroundColor: "rgba(156,240,255,0.06)",
          borderTop: "1px solid rgba(156,240,255,0.14)",
          borderBottom: "1px solid rgba(156,240,255,0.14)",
        }}
      >
        {/* The dark field, the same one the stage runs. It is the only thing
           on the card with movement in it, which is the point: the band is
           the part that does not stop. */}
        <div className="absolute inset-0" aria-hidden>
          <StageWaves id="shape-band" fit="slice" />
        </div>
        <div className="relative h-full flex flex-col justify-center px-4 sm:px-6">
          <p
            className="text-[10px] uppercase tracking-[0.2em] font-headline"
            style={{ color: CYAN_BRIGHT, fontWeight: 800 }}
          >
            The tribe space
          </p>
          <p
            className="mt-1 text-[12.5px] sm:text-[13.5px] leading-snug"
            style={{ color: CREAM }}
          >
            One room, open the whole way through. Ask, share, reflect.
          </p>
        </div>
      </div>

      {/* The two intents live inside the card now, under the band, so the
         stripe divides one object into what it is and what it is for
         instead of separating two. Intent is the useful cut because it
         crosses the roles: both lines are true for an expert and for a
         studio, which a list of who-pairs-with-whom could never be. They
         are a ladder, not a fork, the second being the low-risk entry
         because the audience already exists. */}
      <div className="px-4 sm:px-6 py-6 sm:py-7 grid sm:grid-cols-2 gap-6 sm:gap-10">
        <Intent title="A new experience, standing on its own.">
          You and a complement build it outside what either of you already
          sells, and open it to both your audiences.
        </Intent>
        <Intent title="Or more for the people you already have.">
          You bring in expertise you do not offer, and the audience is already
          there.
        </Intent>
      </div>
    </div>
  );
}

/** An intent reads as its own statement, not as a bolded run-in: the title
 *  carries the weight and the line under it explains, which is the only way
 *  two of these get scanned instead of read. */
function Intent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="text-[17px] sm:text-[19px] font-headline leading-snug"
        style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.015em" }}
      >
        {title}
      </h3>
      <p
        className="mt-2 text-[14.5px] sm:text-[15px] leading-relaxed"
        style={{ color: CREAM_MUTED }}
      >
        {children}
      </p>
    </div>
  );
}
