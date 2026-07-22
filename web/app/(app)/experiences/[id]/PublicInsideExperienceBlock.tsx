import Image from "next/image";

/**
 * PublicInsideExperienceBlock — "Inside the experience", the differentiation
 * beat. Replaces the Bundle 4.2.46 "Coming soon." placeholder (which read as
 * "product not finished" on a sales page).
 *
 * Answers the hesitant buyer's real question: what happens BETWEEN the live
 * sessions? Four mechanics of the tribe space, each powered by REAL data
 * already on the page (the experts' names and faces, this experience's own
 * intro prompt).
 *
 * HARD RULE (r19 principle, doubly binding on a real expert's page): show
 * the MACHINE, never script the outcome. No invented member posts, no fake
 * pulse numbers, no fake room counts — fabricated activity here would read
 * as this experience's real social proof. The landing may stage demo
 * personas under its "example experience" label; this page may not.
 */

interface ExpertLite {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "cohost";
}

interface Props {
  experts: ExpertLite[];
  /** This experience's real day-one prompt (app_challenge.intro_prompt). */
  introPrompt: string | null;
}

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const CARD_SHADOW =
  "0 0 0 1px rgba(15,34,41,0.06), 0 1px 3px rgba(15,34,41,0.04), 0 16px 40px rgba(15,34,41,0.05)";

export function PublicInsideExperienceBlock({ experts, introPrompt }: Props) {
  const owner = experts.find((e) => e.role === "owner") ?? experts[0] ?? null;
  const expertNames = experts
    .map((e) => e.display_name)
    .filter((n): n is string => !!n && n.trim().length > 0);
  const askName = owner?.display_name ?? "your expert";

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Section head */}
        <div className="text-center mb-10 lg:mb-12">
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
            style={{ color: ORANGE }}
          >
            Inside the experience
          </p>
          <h2
            className="font-black font-headline"
            style={{
              color: INK,
              fontSize: "clamp(1.5rem, 4.4vw, 2.125rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            The room your tribe lives in.
          </h2>
          <p
            className="text-base lg:text-lg font-medium mt-3 max-w-xl mx-auto"
            style={{ color: "#64748b" }}
          >
            The live sessions are the heartbeat. Between them, the space keeps
            moving: here is what opens the moment you join.
          </p>
        </div>

        {/* Four mechanics — real data, no staged activity. */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 text-left" aria-hidden>
          {/* 1 · Day one: the intro prompt, verbatim */}
          <MechCard
            accent={CYAN}
            kicker="Day one · You introduce yourself"
            caption="No cold start. The space greets you with your experts' first question."
          >
            <div
              className="rounded-xl px-4 py-3.5"
              style={{
                backgroundColor: "rgba(8,145,178,0.06)",
                boxShadow: `inset 3.5px 0 0 ${CYAN}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Facepile experts={experts} />
                <span
                  className="text-[10px] font-black font-headline uppercase tracking-[0.16em]"
                  style={{ color: CYAN }}
                >
                  {expertNames.length > 1 ? "Your experts ask" : "Your expert asks"}
                </span>
              </div>
              <p
                className="text-[14px] font-bold font-headline leading-snug line-clamp-4"
                style={{ color: INK }}
              >
                {introPrompt?.trim() ||
                  "A personal question from your experts, waiting for you on day one."}
              </p>
            </div>
          </MechCard>

          {/* 2 · Directed Q&A — routed to the real expert, pinned for all */}
          <MechCard
            accent={ORANGE}
            kicker="Anytime · Ask your experts"
            caption="Every question lands on their console until it's answered. Pinned for the whole tribe, so everyone learns."
          >
            <div className="space-y-2.5">
              <div
                className="rounded-lg px-3.5 py-2.5 inline-flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(8,145,178,0.07)",
                  boxShadow: `inset 3px 0 0 ${CYAN}`,
                }}
              >
                <span
                  className="text-[9.5px] font-black font-headline uppercase tracking-[0.14em]"
                  style={{ color: CYAN }}
                >
                  Question for
                </span>
                <ExpertChip expert={owner} />
                <span className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>
                  routed ✓
                </span>
              </div>
              <div
                className="rounded-lg px-3.5 py-2.5 flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(255,97,48,0.06)",
                  boxShadow: `inset 3px 0 0 ${ORANGE}`,
                }}
              >
                <span
                  className="text-[9.5px] font-black font-headline uppercase tracking-[0.14em]"
                  style={{ color: ORANGE }}
                >
                  Answered by {askName}
                </span>
              </div>
            </div>
          </MechCard>

          {/* 3 · Pulse + reflection — the scale stays empty and the answer
             field stays blank: no staged numbers, no staged words. */}
          <MechCard
            accent={CYAN}
            kicker="Around every live moment"
            caption="A pulse before, a reflection after. Your tribe shares the journey, not just the workouts."
          >
            <p
              className="text-[9.5px] font-black font-headline uppercase tracking-[0.16em]"
              style={{ color: "#94a3b8" }}
            >
              Before
            </p>
            <p
              className="text-[13.5px] font-bold font-headline mt-1"
              style={{ color: INK }}
            >
              How ready are you?
            </p>
            <div
              className="mt-3 relative h-2 rounded-full"
              style={{ backgroundColor: "rgba(15,34,41,0.08)" }}
            >
              {/* Centered on the bar with explicit negative margins (half the
                 16px knob), not a percentage transform — top:50% + a %
                 transform on a 2px-tall bar was landing the knob above the
                 line. */}
              <span
                className="absolute w-4 h-4 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  marginTop: -8,
                  marginLeft: -8,
                  backgroundColor: "#FFFFFF",
                  boxShadow: `0 0 0 2px ${CYAN}`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>0</span>
              <span className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>10</span>
            </div>
            <p
              className="text-[9.5px] font-black font-headline uppercase tracking-[0.16em] mt-4"
              style={{ color: "#94a3b8" }}
            >
              After
            </p>
            <p
              className="text-[13.5px] font-bold font-headline mt-1"
              style={{ color: INK }}
            >
              How was the session?
            </p>
            <div
              className="mt-2.5 rounded-full px-4 py-2.5 text-[12px]"
              style={{ backgroundColor: "#F8F6F0", color: "#94a3b8" }}
            >
              Tell your tribe how it went…
            </div>
          </MechCard>

          {/* 4 · The live room — the mechanic, not a fake live state. The
             experts are real (they host), the button is the real tap; no
             invented "N in the room". */}
          <MechCard
            accent={ORANGE}
            kicker="When it's time · One tap"
            caption="No new login, no external link. The room opens right here, inside the space."
          >
            <div className="flex items-center gap-2.5">
              <Facepile experts={experts} />
              <span className="text-[11.5px] font-bold font-headline" style={{ color: INK }}>
                {expertNames.length > 1 ? "Your experts host it, live" : "Your expert hosts it, live"}
              </span>
            </div>
            <span
              className="mt-4 w-full inline-flex items-center justify-center px-5 py-3.5 rounded-full text-white text-[14px] font-black font-headline"
              style={{
                backgroundColor: "#ef4444",
                boxShadow: "0 6px 18px rgba(239,68,68,0.30)",
              }}
            >
              Join the room →
            </span>
          </MechCard>
        </div>

        <p
          className="text-center text-sm lg:text-base font-medium mt-8 lg:mt-10"
          style={{ color: "#64748b" }}
        >
          All of it opens the moment you join.
        </p>
      </div>
    </section>
  );
}

function MechCard({
  accent,
  kicker,
  caption,
  children,
}: {
  accent: string;
  kicker: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 lg:p-6 flex flex-col"
      style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }}
    >
      <p
        className="text-[10.5px] font-black font-headline uppercase tracking-[0.18em] mb-3.5"
        style={{ color: accent }}
      >
        {kicker}
      </p>
      <div>{children}</div>
      <p className="text-[12.5px] leading-relaxed mt-3.5" style={{ color: "#64748b" }}>
        {caption}
      </p>
    </div>
  );
}

/** The experts' real faces, small overlap row. */
function Facepile({ experts }: { experts: ExpertLite[] }) {
  const withFaces = experts.slice(0, 3);
  if (withFaces.length === 0) return null;
  return (
    <span className="flex -space-x-1.5 shrink-0">
      {withFaces.map((e) =>
        e.avatar_url ? (
          <Image
            key={e.id}
            src={e.avatar_url}
            alt=""
            width={22}
            height={22}
            decoding="async"
            className="w-[22px] h-[22px] rounded-full object-cover"
            style={{ border: "1.5px solid #FFFFFF", backgroundColor: "#ECE7DD" }}
          />
        ) : (
          <span
            key={e.id}
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,97,48,0.12)",
              border: "1.5px solid #FFFFFF",
            }}
          >
            <span className="text-[9px] font-black font-headline" style={{ color: ORANGE }}>
              {(e.display_name ?? "?")[0]?.toUpperCase()}
            </span>
          </span>
        ),
      )}
    </span>
  );
}

/** One expert's face + name, chip-sized. */
function ExpertChip({ expert }: { expert: ExpertLite | null }) {
  if (!expert) return null;
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {expert.avatar_url ? (
        <Image
          src={expert.avatar_url}
          alt=""
          width={18}
          height={18}
          decoding="async"
          className="w-[18px] h-[18px] rounded-full object-cover shrink-0"
          style={{ backgroundColor: "#ECE7DD" }}
        />
      ) : null}
      <span
        className="text-[11.5px] font-black font-headline truncate"
        style={{ color: INK }}
      >
        {expert.display_name ?? "Your expert"}
      </span>
    </span>
  );
}
