/**
 * PublicBeyondLiveBlock — Bundle 4.2.2 ("Inside the program").
 *
 * Section 2's second beat. After buyers have met the Experts in the
 * previous block, this block tells them what the *ongoing experience*
 * feels like. The live moments are the punctuation; the tribe is the
 * continuous experience.
 *
 * Heading: "Inside the program" (renamed from "Beyond the live moments"
 * per Bundle 4.2.2 — more declarative, less "marketing voice").
 *
 * Copy frame:
 *   - "Join for the goals. Stay for the momentum."
 *   - "Your tribe stays beyond the final session."
 *
 * Three bullets that unfold the claim:
 *   1. Direct access to your Experts
 *   2. A tribe moving with you
 *   3. The bonds keep growing (beyond program end)
 *
 * Vocabulary: "tribe" not "cohort" / "community." "Experts" not "coaches."
 */

interface Bullet {
  title: string;
  body: string;
  icon: React.ReactNode;
}

const BULLETS: Bullet[] = [
  {
    title: "Direct access to your Experts",
    body:
      "Ask questions, get coached, share blockers — your Experts are in the tribe space between sessions, not just on session days.",
    icon: <IconChat />,
  },
  {
    title: "A tribe moving with you",
    body:
      "Daily check-ins, shared wins, and mutual accountability in your private tribe space. You're not training alone — even when you're training alone.",
    icon: <IconUsers />,
  },
  {
    title: "The bonds keep growing",
    body:
      "The tribe stays open beyond the final session. The relationships you build here don't end on a calendar date.",
    icon: <IconInfinity />,
  },
];

export function PublicBeyondLiveBlock() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3 text-center"
          style={{ color: "#FF6130" }}
        >
          Inside the program
        </p>
        <h2
          className="text-3xl lg:text-5xl font-black font-headline tracking-tight text-center mb-5"
          style={{ color: "#0F2229", letterSpacing: "-0.02em" }}
        >
          Join for the goals. <br className="hidden sm:block" />
          Stay for the momentum.
        </h2>
        <p
          className="text-base lg:text-lg text-center mb-12 lg:mb-14 max-w-xl mx-auto leading-relaxed"
          style={{ color: "#475569" }}
        >
          Your tribe stays beyond the final session.
        </p>

        <div
          className="rounded-3xl p-7 lg:p-10"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(15,34,41,0.08)",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.03), 0 16px 40px rgba(15,34,41,0.05)",
          }}
        >
          <ul className="space-y-7 lg:space-y-8">
            {BULLETS.map((b, i) => (
              <li key={i} className="flex items-start gap-4 lg:gap-5">
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(156,240,255,0.30)" }}
                >
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base lg:text-lg font-black font-headline tracking-tight mb-1.5"
                    style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
                  >
                    {b.title}
                  </h3>
                  <p
                    className="text-sm lg:text-[15px] leading-relaxed"
                    style={{ color: "#475569" }}
                  >
                    {b.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Icons ──────────────────────────────────────────────────────── */

const ICON_PROPS = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "#0891b2",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

function IconChat() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconInfinity() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
    </svg>
  );
}
