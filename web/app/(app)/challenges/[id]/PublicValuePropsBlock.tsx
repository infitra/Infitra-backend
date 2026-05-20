/**
 * PublicValuePropsBlock — Bundle 4.2 new block.
 *
 * The "what's inside" block. Four concrete inclusion cards that answer
 * "what am I physically getting for CHF X" — focused specifically on
 * LIVE coaching strengths. The always-on cohort/coach-access dimension
 * has its own block (PublicBeyondLiveBlock) after the Journey.
 *
 * All copy is auto-generated from the data we already have (session
 * count, week count, creator count) — no creator effort required. The
 * defaults work for any INFITRA collaboration. A creator-overridable
 * `value_props` JSONB field can be added later if/when creators want
 * to customize.
 */

interface Props {
  sessionCount: number;
  weekCount: number;
  creatorCount: number;
}

interface ValueCard {
  title: string;
  subtext: string;
  icon: React.ReactNode;
}

export function PublicValuePropsBlock({
  sessionCount,
  weekCount,
  creatorCount,
}: Props) {
  const solo = creatorCount === 1;

  const cards: ValueCard[] = [
    {
      title: `${sessionCount} live coaching ${sessionCount === 1 ? "session" : "sessions"}`,
      subtext:
        "Real coaching in real time. Show up live and be present, no replays substituted for the moment.",
      icon: <IconLive />,
    },
    {
      title: solo
        ? "Personal coaching"
        : `${creatorCount} coaches leading together`,
      subtext: solo
        ? "Designed around your goals — one coach, one program, focused attention."
        : "Different strengths, one program — more than any one coach could deliver alone.",
      icon: solo ? <IconPerson /> : <IconHandshake />,
    },
    {
      title: `Structured ${weekCount}-week rhythm`,
      subtext:
        "A clear arc, week by week. You always know what's coming next and how it builds.",
      icon: <IconCalendar />,
    },
    {
      title: "Built around your week",
      subtext:
        "Block out the live moments. The rest of the week stays yours to move at your own pace.",
      icon: <IconClock />,
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24">
      <div className="max-w-5xl mx-auto">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3 text-center"
          style={{ color: "#FF6130" }}
        >
          What's inside
        </p>
        <h2
          className="text-3xl lg:text-5xl font-black font-headline tracking-tight text-center mb-12 lg:mb-16"
          style={{ color: "#0F2229", letterSpacing: "-0.02em" }}
        >
          Built for live coaching, together
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {cards.map((card, i) => (
            <ValueCardView key={i} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueCardView({ card }: { card: ValueCard }) {
  return (
    <div
      className="rounded-2xl p-6 lg:p-7 flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 1px 2px rgba(15,34,41,0.03)",
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "rgba(156,240,255,0.30)" }}
      >
        {card.icon}
      </div>
      <h3
        className="text-base lg:text-[17px] font-black font-headline leading-tight mb-2"
        style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
      >
        {card.title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "#475569" }}
      >
        {card.subtext}
      </p>
    </div>
  );
}

/* ── Icons — 20px line icons in darker cyan ──────────────────────── */

const ICON_PROPS = {
  width: 20,
  height: 20,
  fill: "none",
  stroke: "#0891b2",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

function IconLive() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function IconHandshake() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconPerson() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
