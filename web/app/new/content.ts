/**
 * Landing V2 — the ONE source of truth for all showcased content.
 *
 * ONE experience threads the whole story: the real flagship
 * "6-Week Sustainable Fitness Reset" by Alex & Mira (5683908e…) — designed in
 * the workspace, agreed, published, unfolding as the space. All titles, arc
 * themes, sessions, topics and taglines are the real records. Alex & Mira are
 * demo personas; the example carries one honesty caption and is never
 * presented as customer proof.
 *
 * DESIGN LAW: every visual is a direct PORT of a real INFITRA surface — its
 * grammar, type and imagery — never an invented layout. Conceptual numbers
 * only (the 60/40 split; recorded timestamps shown, not explained). The
 * public page is the MARKETING PAGE; the Experience Space is where the tribe
 * lives. Vocabulary: experiences — never "program".
 *
 * COVERS: every session carries its EXACT cover from the real records
 * (`/landing/covers/…`, exported from the flagship's session rows) — no
 * doubles, no rotation. Wherever a session is referenced (agenda, room,
 * workspace, live card, moments), it must use ITS OWN cover.
 */

export type AgendaSession = { day: string; time: string; dur: string; title: string; host: string; img: string };

export const EX = {
  title: "6-Week Sustainable Fitness Reset",
  promise: "Sustainably rebuild your fitness, energy, and consistency in 6 weeks!",
  blurb:
    "A 6-week guided experience to rebuild consistency, improve your energy, and create healthier routines that actually fit into real life.",
  weeks: 6,
  sessions: 20,
  cover: "/landing/flagship-cover.jpg",
  split: { owner: 60, cohost: 40 },
  /** Real weekly arc. */
  arc: [
    "Foundation & Momentum",
    "Building Consistency",
    "Energy & Routine",
    "Staying Consistent Under Stress",
    "Building Long-Term Habits",
    "Transition & Sustainability",
  ],
  /** All 20 real sessions (weekday · time · duration · title · host),
   *  each with its own real cover image. */
  agenda: [
    [
      { day: "Sun", time: "13:00", dur: "45 min", title: "Meet your Experts", host: "Alex & Mira", img: "/landing/covers/w1-meet-your-experts.jpg" },
      { day: "Mon", time: "13:00", dur: "45 min", title: "Nutrition Foundations & Weekly Setup", host: "Mira", img: "/landing/covers/w1-nutrition-foundations.jpg" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength Foundations", host: "Alex", img: "/landing/covers/w1-strength-foundations.jpg" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Movement, Mobility & Routine Reset", host: "Alex", img: "/landing/covers/w1-mobility-routine-reset.jpg" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Sustainable Eating in Real Life", host: "Mira", img: "/landing/covers/w2-sustainable-eating.jpg" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength & Stability", host: "Alex", img: "/landing/covers/w2-strength-stability.jpg" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Conditioning, Core & Recovery Flow", host: "Alex", img: "/landing/covers/w2-conditioning-core-recovery.jpg" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Fueling Energy Without Overshooting", host: "Mira", img: "/landing/covers/w3-fueling-energy.jpg" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength & Energy", host: "Alex", img: "/landing/covers/w3-strength-energy.jpg" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Mobility, Core & Recovery Reset", host: "Alex", img: "/landing/covers/w3-mobility-core-reset.jpg" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Cravings, Cheat Meals & Staying Consistent", host: "Mira", img: "/landing/covers/w4-cravings-consistency.jpg" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Strength Under Pressure", host: "Alex", img: "/landing/covers/w4-strength-under-pressure.jpg" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Recovery, Mobility & Reset Flow", host: "Alex", img: "/landing/covers/w4-recovery-reset-flow.jpg" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Building Sustainable Eating Habits", host: "Mira", img: "/landing/covers/w5-sustainable-eating-habits.jpg" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Strength, Control & Confidence", host: "Alex", img: "/landing/covers/w5-strength-control-confidence.jpg" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Mobility, Recovery & Sustainable Training", host: "Alex", img: "/landing/covers/w5-mobility-sustainable-training.jpg" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Making Healthy Eating Enjoyable Long-Term", host: "Mira", img: "/landing/covers/w6-healthy-eating-longterm.jpg" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength & Momentum", host: "Alex", img: "/landing/covers/w6-strength-momentum.jpg" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Recovery, Mobility & Long-Term Reset", host: "Alex", img: "/landing/covers/w6-recovery-longterm-reset.jpg" },
      { day: "Sat", time: "12:00", dur: "45 min", title: "Continue Your Journey", host: "Alex & Mira", img: "/landing/covers/w6-continue-your-journey.jpg" },
    ],
  ] as AgendaSession[][],
  /** The real marketing page's positioning lines. */
  positioning: ["Stop buying static fitness content.", "Start participating in a real fitness experience."],
  /** Real intro prompt (adapted to experiences vocabulary). */
  introPrompt:
    "What made you join, and what routine or habit are you most hoping to improve over the next 6 weeks?",
} as const;

export const ALEX = {
  name: "Alex Mercer",
  first: "Alex",
  tag: "Strength Coach",
  tagline: "Strength Coach · Sustainable fitness for real life",
  avatar: "/landing/avatar-alex.jpg",
  /** Real topic ownership (trimmed to three). */
  topics: ["Strength Training", "Recovery", "Habit Building"],
} as const;

export const MIRA = {
  name: "Mira Hart",
  first: "Mira",
  tag: "Nutrition Systems",
  tagline: "Simple nutrition systems for real life",
  avatar: "/landing/avatar-mira.jpg",
  topics: ["Nutrition", "Meal Structure", "Accountability"],
} as const;

/** The tribe — real faces, so the human side of the space is FELT.
 *  `color` is each member's accent (rings, chips) across every surface. */
export type Member = { name: string; avatar: string; color: string };

export const ANNA: Member = { name: "Anna", avatar: "/landing/avatar-anna.jpg", color: "#0891b2" };
export const NINA: Member = { name: "Nina", avatar: "/landing/avatar-nina.jpg", color: "#FF6130" };
export const TIM: Member = { name: "Tim", avatar: "/landing/avatar-tim.jpg", color: "#0891b2" };
export const SAM: Member = { name: "Sam", avatar: "/landing/avatar-sam.jpg", color: "#FF6130" };
export const PRIYA: Member = { name: "Priya", avatar: "/landing/avatar-priya.jpg", color: "#FF6130" };

/** Signature record stamps — shown visually on the agreement (real lock date). */
export const CONTRACT = {
  lockedStamp: "27 May 2026 · 12:20",
  agreedStamp: "27 May 2026 · 14:03",
} as const;

/** The space, live in week 2 — the week's own sessions, with THEIR covers. */
export const ROOM = {
  week: 2,
  theme: "Building Consistency",
  activeNow: 3,
  done: { title: EX.agenda[1][0].title, host: EX.agenda[1][0].host, img: EX.agenda[1][0].img },
  next: { title: EX.agenda[1][1].title, host: EX.agenda[1][1].host, inLabel: "in 1d 22h", img: EX.agenda[1][1].img },
  upcoming: { title: EX.agenda[1][2].title, host: EX.agenda[1][2].host, img: EX.agenda[1][2].img },
  /** The directed-question thread — REAL copy from the live product
   *  (Tim's question + Alex's actual answer). Ask one expert, everyone learns. */
  qa: {
    asker: "Tim",
    question: "Hi Alex, should I train besides the live sessions?",
    answer:
      "Hi Tim! Recovery is a very important part of training and you need to give your body time to reset for the next sessions. That being said, an active lifestyle besides our sessions or lighter activity like some jogging, a walk or even a Padel session with a friend is great! Just make sure to not tire yourself out fully!",
  },
} as const;
