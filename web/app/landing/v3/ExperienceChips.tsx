import { EX, ROOM, ALEX, MIRA, ANNA, PRIYA } from "../content";
import { INK, ORANGE, CYAN, MUTED, FAINT } from "../ui";

/**
 * WHAT IT FEELS LIKE, in three compact ports (12 Sep 2026).
 *
 * The showcase further down shows the live room, the tribe space and the
 * weekly arc in full. This section used to describe them in words, which
 * read as a text block pretending to be a section. So the same three
 * surfaces are ported here at chip size, with the same grammar, the same
 * covers and the same faces, and the words underneath say what each one
 * means for the reader.
 */
const PAPER = "#F8F6F0";
const HAIR = "rgba(15,34,41,0.06)";

const ICON_HEART = (color: string) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const ICON_COMMENT = (color: string) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3.1-.4-4.4-1.2L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);

/** The live room: the two experts in the frame, and the live mark. */
function LiveMini() {
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: "#0C262E", aspectRatio: "16 / 10" }}>
      <div className="absolute inset-0 p-2 grid grid-cols-2 gap-2">
        {[ALEX, MIRA].map((p) => (
          <span key={p.name} className="relative block rounded-lg overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" className="w-full h-full object-cover" style={{ objectPosition: "50% 28%" }} />
            <span
              className="absolute bottom-1 left-1 px-1.5 py-[1px] rounded-full text-[8.5px] font-headline"
              style={{ backgroundColor: "rgba(12,38,46,0.72)", color: "#F2EFE8", fontWeight: 700 }}
            >
              {p.first}
            </span>
          </span>
        ))}
      </div>
      <span
        className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[8.5px] uppercase tracking-widest font-headline"
        style={{ backgroundColor: "rgba(242,239,232,0.16)", color: "#9CF0FF", fontWeight: 700 }}
      >
        <span className="w-1 h-1 rounded-full bg-[#9CF0FF] animate-pulse" />
        Live
      </span>
    </div>
  );
}

/** The tribe space: one post, and the reply that makes it a tribe. */
function TribeMini() {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1px ${HAIR}` }}>
      <div className="flex gap-2">
        <span className="shrink-0 w-8 h-8 rounded-full overflow-hidden" style={{ border: `1.5px solid ${ANNA.color}59` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ANNA.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-headline" style={{ color: INK, fontWeight: 800 }}>
            {ANNA.name} <span style={{ color: FAINT, fontWeight: 600 }}>· 2h</span>
          </p>
          <p className="text-[11.5px] leading-snug mt-0.5" style={{ color: MUTED }}>
            Week 1 done, first plan I&apos;ve actually kept up with 🔥
          </p>
          <span className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: MUTED }}>
              {ICON_HEART(ORANGE)} 8
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: MUTED }}>
              {ICON_COMMENT(MUTED)} 3
            </span>
          </span>
        </div>
      </div>
      <div className="flex gap-2 mt-2 pl-2.5" style={{ borderLeft: "2px solid rgba(15,34,41,0.08)" }}>
        <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden" style={{ border: `1.5px solid ${PRIYA.color}59` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PRIYA.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block text-[9.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>
            {PRIYA.name}
          </span>
          <span className="block text-[11px] leading-snug" style={{ color: MUTED }}>
            Same here, Tuesday can&apos;t come soon enough 🙌
          </span>
        </span>
      </div>
    </div>
  );
}

/** The weekly arc: the weeks, and the moment that comes next. */
function WeeksMini() {
  return (
    <div>
      <div className="flex gap-1">
        {EX.arc.map((_, i) => (
          <span
            key={i}
            className="flex-1 text-center py-1 rounded-md text-[9.5px] font-headline"
            style={
              i === 1
                ? { backgroundColor: ORANGE, color: "#FFFFFF", fontWeight: 700 }
                : { backgroundColor: "#FFFFFF", color: FAINT, fontWeight: 700, boxShadow: `0 0 0 1px ${HAIR}` }
            }
          >
            W{i + 1}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2.5 rounded-xl p-2 mt-2" style={{ backgroundColor: "rgba(255,97,48,0.05)", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.28)" }}>
        <span className="relative shrink-0 w-[58px] h-[38px] rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ROOM.next.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>
            {ROOM.next.title}
          </span>
          <span className="block text-[10px] font-bold mt-0.5" style={{ color: CYAN }}>
            {ROOM.next.host}
          </span>
        </span>
        <span className="shrink-0 text-[10px] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
          Next
        </span>
      </div>
    </div>
  );
}

const CHIPS = [
  {
    key: "live",
    media: <LiveMini />,
    label: "Live on video every week.",
    body: "You lead your half. Your complement leads theirs, and both parts stay at full depth.",
  },
  {
    key: "tribe",
    media: <TribeMini />,
    label: "A tribe space in between.",
    body: "The momentum lives between the live sessions, and the tribe keeps its purpose.",
  },
  {
    key: "weeks",
    media: <WeeksMini />,
    label: "Several weeks, one rhythm.",
    body: "The people who join buy once and follow the whole arc with you.",
  },
];

export function ExperienceChips() {
  return (
    <div className="grid md:grid-cols-3 gap-4 md:gap-5">
      {CHIPS.map((c) => (
        <div
          key={c.key}
          data-chip={c.key}
          className="rounded-2xl p-3.5 flex flex-col"
          style={{ backgroundColor: PAPER, boxShadow: `0 0 0 1px ${HAIR}, 0 12px 32px rgba(15,34,41,0.07)` }}
        >
          <div className="mb-3.5">{c.media}</div>
          <p className="text-[14px] font-headline" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {c.label}
          </p>
          <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: MUTED }}>
            {c.body}
          </p>
        </div>
      ))}
    </div>
  );
}
