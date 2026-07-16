/**
 * Landing V2 — the ONE source of truth for all showcased content.
 *
 * Everything here is REAL data from the flagship example experience
 * ("6-Week Sustainable Fitness Reset" 5683908e…) and the real draft
 * ("Post-Partum Fitness Rebuild" 6fe01bc3…), so every module tells one
 * consistent story. Alex & Mira are demo personas — the hero carries the
 * single "example experience" honesty caption; they are never presented
 * as customer proof.
 *
 * DESIGN LAW (polish round 1): mocks are conceptual — no number appears
 * unless the number IS the concept (the 60/40 split). No hashes, prices,
 * dates, seat counts, or accounting rows.
 */

export const EX = {
  title: "6-Week Sustainable Fitness Reset",
  promise: "Sustainably rebuild your fitness, energy, and consistency in 6 weeks!",
  weeks: 6,
  sessions: 20,
  cover: "/landing/flagship-cover.jpg",
  split: { owner: 60, cohost: 40 },
} as const;

export const ALEX = {
  name: "Alex Mercer",
  first: "Alex",
  tag: "Strength Coach",
  avatar: "/landing/avatar-alex.jpg",
} as const;

export const MIRA = {
  name: "Mira Hart",
  first: "Mira",
  tag: "Nutrition Systems",
  avatar: "/landing/avatar-mira.jpg",
} as const;

/** The real draft — the "in creation" state for the workspace move. */
export const DRAFT = {
  title: "Post-Partum Fitness Rebuild",
  promise: "Create realistic fitness and nutrition habits that actually fit post-partum life!",
  alexTopics: ["Strength Training", "Mobility & Recovery"],
  miraTopics: ["Post-Partum Nutrition", "Energy Management"],
} as const;

/** Real flagship session titles used in the Room module (week 2). */
export const ROOM = {
  week: 2,
  done: { title: "Sustainable Eating in Real Life", host: "Mira" },
  next: { title: "Full Body Strength & Stability", host: "Alex", inLabel: "in 1d 22h" },
  upcoming: { title: "Conditioning, Core & Recovery Flow", host: "Alex" },
} as const;
