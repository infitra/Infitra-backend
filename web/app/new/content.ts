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
 */

export type AgendaSession = { day: string; time: string; dur: string; title: string; host: string };

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
  /** Real sessions per week (weekday · time · duration · title · host). */
  agenda: [
    [
      { day: "Sun", time: "13:00", dur: "45 min", title: "Meet your Experts", host: "Alex & Mira" },
      { day: "Mon", time: "13:00", dur: "45 min", title: "Nutrition Foundations & Weekly Setup", host: "Mira" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength Foundations", host: "Alex" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Movement, Mobility & Routine Reset", host: "Alex" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Sustainable Eating in Real Life", host: "Mira" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength & Stability", host: "Alex" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Conditioning, Core & Recovery Flow", host: "Alex" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Fueling Energy Without Overshooting", host: "Mira" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength & Energy", host: "Alex" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Mobility, Core & Recovery Reset", host: "Alex" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Cravings, Cheat Meals & Staying Consistent", host: "Mira" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Strength Under Pressure", host: "Alex" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Recovery, Mobility & Reset Flow", host: "Alex" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Building Sustainable Eating Habits", host: "Mira" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Strength, Control & Confidence", host: "Alex" },
      { day: "Thu", time: "13:00", dur: "45 min", title: "Mobility, Recovery & Sustainable Training", host: "Alex" },
    ],
    [
      { day: "Mon", time: "13:00", dur: "45 min", title: "Making Healthy Eating Enjoyable Long-Term", host: "Mira" },
      { day: "Tue", time: "13:00", dur: "1 h", title: "Full Body Strength & Momentum", host: "Alex" },
      { day: "Sat", time: "12:00", dur: "45 min", title: "Continue Your Journey", host: "Alex & Mira" },
    ],
  ] as AgendaSession[][],
  /** The real marketing page's positioning lines. */
  positioning: ["Stop buying static fitness content.", "Start participating in a real fitness experience."],
  /** Real intro prompt (adapted to experiences vocabulary). */
  introPrompt:
    "What made you join — and what routine or habit are you most hoping to improve over the next 6 weeks?",
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

/** Signature record stamps — shown visually on the agreement (real lock date). */
export const CONTRACT = {
  lockedStamp: "27 May 2026 · 12:20",
  agreedStamp: "27 May 2026 · 14:03",
} as const;

/** The space, live in week 2 — real session titles + thumbs. */
export const ROOM = {
  week: 2,
  theme: "Building Consistency",
  activeNow: 3,
  done: { title: "Sustainable Eating in Real Life", host: "Mira", img: "/landing/session-nutritionist.jpg" },
  next: { title: "Full Body Strength & Stability", host: "Alex", inLabel: "in 1d 22h", img: "/landing/session-trainer.jpg" },
  upcoming: { title: "Conditioning, Core & Recovery Flow", host: "Alex", img: "/landing/session-intro.jpg" },
  /** The directed-question thread — ask one expert, everyone learns. */
  qa: {
    asker: "Lea",
    question: "High-protein options when I'm traveling all week?",
    answer:
      "Batch-cook once, then build plates around protein first — skyr, tuna packs, deli turkey. I'll bring my full travel list to tonight's session.",
  },
} as const;
