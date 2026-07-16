/**
 * Landing V2 — the ONE source of truth for all showcased content.
 *
 * Everything here is REAL data from the flagship example experience
 * ("6-Week Sustainable Fitness Reset" 5683908e…) and the real draft
 * ("Post-Partum Fitness Rebuild" 6fe01bc3…). Alex & Mira are demo personas —
 * the "What you can build" section carries the single honesty caption; they
 * are never presented as customer proof.
 *
 * DESIGN LAW (polish round 2): every visual is a direct PORT of a real
 * INFITRA surface — its grammar, type scale, and imagery — never an invented
 * layout. Conceptual numbers only (the 60/40 split; recorded timestamps on
 * signatures are shown visually, not explained). No hashes, no prices, no
 * accounting rows.
 */

export const EX = {
  title: "6-Week Sustainable Fitness Reset",
  promise: "Sustainably rebuild your fitness, energy, and consistency in 6 weeks!",
  weeks: 6,
  sessions: 20,
  cover: "/landing/flagship-cover.jpg",
  split: { owner: 60, cohost: 40 },
  /** Real weekly arc — drives the journey strips. */
  arc: [
    "Foundation & Momentum",
    "Building Consistency",
    "Energy & Routine",
    "Staying Consistent Under Stress",
    "Building Long-Term Habits",
    "Transition & Sustainability",
  ],
  /** Real week-1 sessions for the compressed buyer page (real titles + durations). */
  week1: [
    { title: "Meet your Experts", host: "Alex & Mira", dur: "45 min", img: "/landing/session-intro.jpg" },
    { title: "Nutrition Foundations & Weekly Setup", host: "Mira", dur: "45 min", img: "/landing/session-nutritionist.jpg" },
    { title: "Full Body Strength Foundations", host: "Alex", dur: "1 h", img: "/landing/session-trainer.jpg" },
  ],
  /** The real buyer page's positioning lines. */
  positioning: ["Stop buying static fitness content.", "Start participating in a real fitness experience."],
} as const;

export const ALEX = {
  name: "Alex Mercer",
  first: "Alex",
  tag: "Strength Coach",
  tagline: "Strength Coach · Sustainable fitness for real life",
  avatar: "/landing/avatar-alex.jpg",
} as const;

export const MIRA = {
  name: "Mira Hart",
  first: "Mira",
  tag: "Nutrition Systems",
  tagline: "Simple nutrition systems for real life",
  avatar: "/landing/avatar-mira.jpg",
} as const;

/** The real draft — the "in creation" state for the workspace step. */
export const DRAFT = {
  title: "Post-Partum Fitness Rebuild",
  promise: "Create realistic fitness and nutrition habits that actually fit post-partum life!",
  rhythm: ["Rebuilding Momentum", "Energy & Recovery", "Confidence & Cravings", "Long-Term Routine"],
  alexTopics: ["Strength Training", "Mobility & Recovery"],
  miraTopics: ["Post-Partum Nutrition", "Energy Management"],
} as const;

/** Signature record stamps — shown visually on the sealed contract (real lock date). */
export const CONTRACT = {
  lockedStamp: "27 May 2026 · 12:20",
  acceptedStamp: "27 May 2026 · 14:03",
} as const;

/** Real flagship session titles used in the participant Room (week 2). */
export const ROOM = {
  week: 2,
  theme: "Building Consistency",
  done: { title: "Sustainable Eating in Real Life", host: "Mira", img: "/landing/session-nutritionist.jpg" },
  next: { title: "Full Body Strength & Stability", host: "Alex", inLabel: "in 1d 22h", img: "/landing/session-trainer.jpg" },
  upcoming: { title: "Conditioning, Core & Recovery Flow", host: "Alex", img: "/landing/session-intro.jpg" },
} as const;
