# LANDING V2 — The Product-Showcase Landing (plan · pre-implementation)

> Status: PLAN ONLY — awaiting Yves' confirmation before any implementation.
> Goal date: ASAP (Track A of PILOT_PLAN §11 — the recruitment vehicle).

---

## 1. Goal & feel

A fitness creator lands and within 30 seconds thinks:

> *"This is a real platform — further along than I expected. Collaboration, contracts,
> money, live, community: already built. Being one of 5 founding pairs is a genuine
> early position, not beta risk. This could be a new revenue stream."*

**Tone law: never oversell — show.** No hype adjectives, no fake proof, no invented
users. The persuasion comes from (a) product depth rendered faithfully, (b) real
numbers in CHF, (c) honest pilot scale ("5 pairs, on purpose"), (d) process
transparency. Serious > loud.

## 2. Audience & voice

- **Who:** fitness creators & complementary experts (trainer, nutritionist, physio,
  yoga/mobility, mindset) in DACH, with an audience they currently monetize via 1:1,
  PDFs, or nothing. Considering "what's my next product?"
- **Their questions, in order:** What is this? → What do I actually get? → How does
  the money work with a partner? → Will my audience buy & stay? → Why now / why me?
  → What happens if I apply?  ← the page answers them in exactly this order.
- **Voice rules:** short declaratives; concrete nouns (contract, split, checkout,
  tribe, room); numbers with CHF; "founding" framing; zero superlatives.

## 3. The core move — ONE real program threads the whole page

Every module is populated with the **real flagship**: *6-Week Sustainable Fitness
Reset* by Alex Mercer (Strength, Owner · 60%) × Mira Hart (Nutrition, Co-host · 40%)
— CHF 99 · 6 weeks · 20 live sessions · real weekly arc · real topic ownership ·
real bios · real cover/session images · **real signed contract (v1, SHA-256
`4b530def9fab3287…`, locked 27 May 2026)** · 12 members · 45 tribe posts.
The in-progress states use the real draft (*Post-Partum Fitness Rebuild*, 4 weeks,
real arc + topics).

Why this wins: the page tells ONE coherent story — this pair designed this program
in this workspace, sealed this contract, published this product page, and this is
the room its members live in. Consistency across modules is what makes it feel real
instead of collaged.

**Honesty guard:** Alex & Mira are demo personas. The showcase carries a quiet
"Example program" eyebrow (same pattern the current landing already uses — "AN
EXAMPLE"). We show it as *the product experience*, never as customer proof. No fake
testimonials anywhere. Post-pilot, real pairs + real numbers replace the example
(§10).

## 4. Mockups vs. screenshots — the decision

**Faithful in-page mockups. Zero screenshots required from you.**

Why mockups are the *stronger* choice here (not the fallback):
1. **1:1 fidelity is guaranteed** — I build them from the same component source that
   renders the real product (same colors, type, radii, spacing, section grammar).
   They ARE the UI, re-rendered natively in the page.
2. **Crisp at every size** — screenshots turn to mush scaled down, especially on
   mobile; DOM mockups re-flow.
3. **Art-directable** — compress a 4-step flow into its four best moments; highlight
   the split slider or the hash line; hide dev noise.
4. **Light & fast** — no heavy PNGs → LCP + Vercel bandwidth stay lean (a stated
   hosting guardrail).
5. **Alive** — subtle CSS animation (live pulse, signature tick, split slider) where
   a screenshot is dead pixels. `prefers-reduced-motion` respected.

Where real screenshots WOULD add value — **optional, later, not blocking**:
- (a) a real workspace wide-shot, (b) a real live room mid-session, (c) the real
  contract page — best captured **post-onboarding with real pilot pairs** as the
  social-proof upgrade. If you ever want them sooner: log in in the Browser pane
  (I can't type passwords — platform rule) and I drive + capture, or you shoot per
  this list.

## 5. Page structure (M0–M9)

Kept from V1: nav, wave background, headline, chips pattern, "See why this matters"
collapsible, footer, /apply + /pilot-terms funnel. Killed/absorbed: fictional "The
Reset" example (→ real flagship), standalone 2-experts diagram (→ M2·S1), the
living-experience section shipped 2026-07-16 (→ absorbed & upgraded in M4).

---

### M0 · NAV + pilot ribbon (keep)
Logo · Apply pill. Unchanged.

### M1 · HERO — the claim + the product in one view
- Eyebrow: `THE PLATFORM FOR LIVE, CO-CREATED FITNESS PROGRAMS` (upgrade from
  "workspace" — we now show the whole platform). Pilot badge stays.
- **H1 (keep):** "Build a program beyond what you can offer alone."
- Sub: "Team up with a complementary expert. INFITRA turns it into one real product —
  page, checkout, contract, revenue split, live rooms and community. You coach; the
  platform runs."
- CTA `Apply for the pilot` + microline: "5 founding pairs · DACH · reviewed
  individually · starting now."
- **Visual:** the flagship buyer-page hero card, faithfully mocked (cover photo,
  promise-headline, Alex+Mira portraits, "6 weeks · 20 live sessions", `I'm in ·
  CHF 99` pill) with three floating proof-chips pinned to its edges:
  `✓ Contract signed · SHA-256 4b53…` · `Split 60/40 · automatic` · `● LIVE · Week 1`.
  Quiet eyebrow on the card: "Example program". Mobile: card stacks below copy,
  chips become a row under it.

### M2 · HOW IT WORKS — "From two experts to one product, in four moves"
Four steps, each = caption + faithful mini-UI. Desktop: alternating text/visual;
mobile: stacked cards.
- **S1 · Pick your complement.** Create-page collab scene (you + dashed "invite your
  complement" slot → Mira's portrait snapping in). Caption: "Trainer × nutritionist.
  Physio × strength. Yoga × mindset. Your expertise, completed — one invitation."
- **S2 · Design it together.** Workspace mock fed by the real draft (*Post-Partum
  Fitness Rebuild*): Promise field, Program Rhythm W1–W4 (real themes: "Rebuilding
  Momentum & Daily Structure" …), Team row (avatars · roles · real topic chips
  "Strength Training / Post-Partum Nutrition / Energy Management") + one team-chat
  bubble. Caption: "One shared workspace: the promise, the weekly arc, the sessions,
  who handles what. Co-edited live — with your team chat right there."
- **S3 · One handshake, on record.** Contract document mock: header "Collaboration
  Agreement · v1", parties with split bars (Alex — Owner · 60% / Mira — Co-host ·
  40%), signature lines with timestamps ("Locked by Alex · 27 May, 12:20" /
  "Accepted by Mira · 27 May, 14:03"), terms rows, `SHA-256 4b530def9fab3287…`
  tamper-evidence line. Caption: "No WhatsApp deals. The workspace becomes a signed,
  hash-sealed agreement — **and if any term changes, acceptance resets. Nobody's
  split moves without a new handshake.**"
- **S4 · Publish a real product.** Compressed buyer-page mock (what M1 previewed,
  now framed as the outcome) + chips `Payments by Stripe` `CHF` `Receipts + calendar
  included`. Caption: "A branded product page with checkout — live the moment you
  publish. No website, no funnel tools, no setup."

### M3 · THE MONEY — "Every franc, accounted — automatically"
- **Visual:** earnings-page mock (Alex's view): per-sale line
  `6-Week Sustainable Fitness Reset · CHF 99.00 gross → 9.90 platform → 35.64
  co-host → 53.46 your cut` (+1 more row), totals strip: `12 sales · CHF 1,188.00
  gross → your net CHF 641.52` (real member count → realistic pilot-scale math; no
  inflated dashboards).
- Caption: "The split from your contract books itself on every sale. Both partners
  see the same numbers — per sale, in real time."
- Founding line (subtle, per your earlier call): "Founding pilot: 10% platform share
  — 90% stays with the pair." ← exact wording pending decision D2.

*(divider: slim heartbeat ECG — the creator-side → participant-side bridge)*

### M4 · THE EXPERIENCE — "Not a video library. A room they show up to."
Why their audience buys — and stays.
- **Desktop space mock** (upgrade of the one shipped 2026-07-16, now with real
  flagship content): header `● LIVE · WEEK 2 OF 6` + Alex/Mira avatars; journey rows
  with real titles ("Sustainable Eating in Real Life" ✓ done · "Full Body Strength &
  Stability" → next, in 1d 22h · "Conditioning, Core & Recovery Flow" upcoming);
  tribe feed (an intro post + a reflection with an energy chip); YOU-hub (progress
  ring "5 of 20 attended", next moment).
- **Phone frame** alongside: the tribe feed + a pre-pulse card ("How ready are you
  for tonight?" slider) — shows the engagement loop is native, mobile-first.
- **Live strip** beneath: video-grid mock (Alex + Mira host tiles + 4 attendee
  tiles, `● LIVE — Week 2 · Full Body Strength & Stability`).
- Caption: "Live sessions anchor the week. Between them, the tribe shares progress,
  reflections and questions — routed to the right expert. Show-up rates are the
  product."

### M5 · IT CONTINUES — "Programs that don't end"
- **Visual (small):** the real continuation UI — a completed run's card with
  `Continues · live now — Jump back in →` chip, or run-1 → run-2 arc with the tribe
  carrying over.
- Caption: "When a run ends, the next one opens. The tribe carries over; rejoining
  is one tap. Retention becomes a revenue line — not a relaunch campaign."

### M6 · EVERYTHING'S HANDLED — "Live in production today"
Chip grid (extends V1's four): Shared workspace · Signed contracts · Automatic
revenue splits · Product page + checkout (Stripe · CHF) · Live session rooms ·
Tribe space · Progress + check-ins · Questions routed to experts · Calendar export ·
Continuations. Label: "All of the above is live in production — this page shows the
actual product."

### M7 · THE FOUNDING PILOT — "Deliberately small. Deliberately early."
Two-column honest terms card:
- **What founding pairs get:** founding economics (→ D2 wording) · direct,
  hands-on work with the founder · real influence on the roadmap · founding-creator
  status at public launch.
- **What we ask:** design and run one real program with your audience · honest
  weekly feedback · DACH-based (or a pair willing to form one).
- Honesty line: "Everything above is built and running. The pilot is where it meets
  real audiences — that's why it's 5 pairs, not 500."
- No fixed costs — the platform earns only when you do.

### M8 · PROCESS + FINAL CTA — "From application to your first live session"
Five mini-steps: Apply (5 min) → Intro call with the founder → Pair onboarding →
Co-design in the workspace (1–2 weeks) → Publish & go live. CTA `Apply for the
pilot` + microline "Reviewed individually · starting now."

### M9 · Collapsible "See why this matters" (keep as-is) + footer (keep)

---

## 6. Assets & data needs

- Reuse: `/landing/avatar-alex.jpg`, `/landing/avatar-mira.jpg` (same personas!).
- Add to `/public/landing/`: flagship cover + 1–2 session images (copied from the
  public storage URLs — I do this; no action from you).
- All mockup text lives in ONE `landing-content.ts` (single source → numbers stay
  consistent across hero/steps/money modules).
- **DB stays untouched** — mockups don't need data changes.

## 7. Decisions needed from Yves (D1–D5)

- **D1 · Showcase = real flagship with "Example program" label?** Alex/Mira are
  personas; labeled example = honest. (Recommended: yes.)
- **D2 · Founding economics wording:** do founding pairs KEEP 10% after the pilot
  ("your founding rate, locked") or is it pilot-period only (then 15%)? Changes the
  strongest line on the page.
- **D3 · Screenshots:** confirm mockups-only (recommended), or name spots you want
  real captures for.
- **D4 · Language:** English only for now, German variant later? (DACH outreach —
  a DE version is a meaningful conversion lever but doubles copy maintenance;
  recommend EN now, DE after first outreach learnings.)
- **D5 · Eyebrow:** "The platform for live, co-created fitness programs" (upgrade
  from "workspace")?

## 8. Separate (NOT landing): demo-polish list for outreach click-throughs

When you demo live or someone reaches the real buyer page, these read unfinished:
1. Buyer page section "INSIDE THE EXPERIENCE — Coming soon." placeholder → needs
   real content or hiding until built.
2. Draft title "Post-Partum Fitness Rebuild!!" → drop the "!!".
3. Draft sessions "Nutrition 1/2/3/4" → give them real titles like the others.
(Your call whether/when — mockups don't depend on it. #1 is the one a prospect
might actually see.)

## 9. Implementation plan (after confirmation)

- Extract sections into `web/app/components/landing/*` (page stays a static server
  component; zero client JS — CSS-only animation).
- New mock components: `MockBuyerCard`, `MockWorkspace`, `MockContract`,
  `MockEarnings`, `MockSpace`, `MockPhone`, `MockLiveGrid`, `MockContinuation`.
- Per-module mobile behavior as specced (stack / horizontal-scroll rows / phone
  frame becomes primary in M4).
- Verify: typecheck + lint + `next build` + browser pass (known quirk: the pane
  won't screenshot scrolled regions of this animated page — I verify via DOM +
  computed styles; you eyeball the deploy).
- Estimate: ~1.5–2 focused days. Ship in 2–3 deploys (M1–M2 first, then M3–M5,
  then M6–M9 + polish).

## 10. Post-pilot upgrade path (planned now, built later)

Swap the "Example program" for REAL proof: a real pair's program as the showcase,
real earnings totals, 1–2 real screenshots (workspace / live room), short creator
quotes. The honest example converts the pilot; real proof converts the scale-up.
