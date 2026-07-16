/**
 * Landing V2 — the ONE source of truth for all showcased content.
 *
 * Everything here is REAL data from the flagship example experience
 * ("6-Week Sustainable Fitness Reset" 5683908e…) and the real draft
 * ("Post-Partum Fitness Rebuild" 6fe01bc3…), so every module on the page
 * tells one consistent story. Alex & Mira are demo personas — the page
 * labels the showcase "Example experience" and never presents them as
 * customer proof.
 *
 * Money math (pilot): CHF 99.00 gross → 10% platform 9.90 → creator pool
 * 89.10 → co-host 40% = 35.64 → owner 53.46. Totals = ×12 members (real
 * member count): 1,188.00 gross → 641.52 owner net.
 */

export const EX = {
  title: "6-Week Sustainable Fitness Reset",
  promise: "Sustainably rebuild your fitness, energy, and consistency in 6 weeks!",
  weeks: 6,
  sessions: 20,
  dates: "3 Jan → 13 Feb",
  priceChf: 99,
  members: 12,
  cover: "/landing/flagship-cover.jpg",
  sha: "4b530def9fab3287",
  lockedDate: "27 May 2026",
  split: { owner: 60, cohost: 40 },
  sale: { gross: "99.00", platform: "9.90", cohost: "35.64", mine: "53.46" },
  totals: { sales: 12, gross: "1,188.00", net: "641.52" },
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
  arc: [
    "Rebuilding Momentum & Daily Structure",
    "Energy, Recovery & Sustainable Nutrition",
    "Confidence, Consistency & Cravings",
    "Long-Term Routine & Independence",
  ],
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
