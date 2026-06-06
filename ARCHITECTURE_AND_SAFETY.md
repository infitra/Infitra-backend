# INFITRA — Architecture & Safety / Disaster-Recovery Analysis

> Produced as the gate before Pilot Plan v5 Phase 2 (see `PILOT_PLAN.md` §10).
> Question being answered: **where does everything live, and how safe is it
> against loss** (device loss, account loss, accidental deletion)?
> Status legend: ✅ safe · 🟡 confirm / minor gap · 🔴 real gap to fix.

---

## 1. Where everything lives

| Layer | Lives in | Identifier / notes |
|---|---|---|
| **Source code** | **GitHub** `git@github.com:infitra/Infitra-backend.git` (origin/main) | All commits pushed; this laptop is a *clone*, not the only copy. ✅ |
| **Web app (hosting)** | **Vercel** project `infitra-backend`, prod `www.infitra.fit` | Currently Hobby (non-commercial). Deploy = push to `main` → auto-deploy. |
| **Database, RLS, RPCs, Edge Functions, Auth, Storage** | **Supabase** project `INFITRA BACKEND` (`okcujzmlpwijjxwhuehe`, region eu-central-2, Postgres 17) | The single most critical asset. A *second* Supabase project (`khceqfwvppuxtrcqjvjh`) exists but is INACTIVE. |
| **Payments** | **Stripe** (CHF) | Checkout + webhook. Stripe itself retains the financial record of truth. |
| **Live video** | **Daily.co** (behind the `live_provider` adapter) | Rooms are ephemeral; no durable data at risk. |
| **Domain / DNS** | registrar for `infitra.fit` (+ Vercel DNS) | Account access matters for recovery. |
| **Secrets / env** | Supabase (edge-function secrets: STRIPE_SECRET_KEY, webhook secret, DAILY_API_KEY…) · Vercel (NEXT_PUBLIC_* + server env) · local `.env` (dev) | **Not** in git (verified: `.env*` gitignored, no committed secrets ✅). Their only durable home is the Supabase/Vercel dashboards. |

---

## 2. Loss-resilience assessment

- **Source code — ✅ safe.** On GitHub, everything pushed, no committed secrets. Losing the laptop loses nothing but the (gitignored) local `.env` + the unpushed `web/.claude/launch.json` tweak (irrelevant).
- **Database SCHEMA — 🔴 real gap.** The `migrations/` folder (44 files) does **not** fully reproduce the schema: core objects (`app_transaction`, `app_payout`, `vw_my_creator_summary`, `vw_my_transactions`, and other base tables) **pre-date migration tracking**. There is **no full schema dump in the repo**. → If the Supabase DB were lost, **git cannot rebuild it**; you depend entirely on Supabase's backups. This is the #1 fix.
- **Database DATA — 🟡 confirm.** Resilience = Supabase's backup tier. Free = daily backup, ~7-day retention, **no PITR**; Pro = point-in-time recovery. For a payments product, daily-only risks losing up to a day of **financial** rows. Tier currently **unconfirmed** (not visible via tooling). Stripe is an external second record for payments, but local `app_transaction`/entitlements would still need rebuilding.
- **Storage (avatars/post images) — 🟡 minor.** Supabase Storage `profile-images` bucket. Covered by Supabase backups; see the listing-exposure security item below.
- **Secrets / env — 🟡 confirm.** Live only in the Supabase + Vercel dashboards (+ local `.env`). If those accounts are lost or a secret is rotated/forgotten, recovery is manual. No off-dashboard backup is known.
- **Accounts — ❓ human-knowledge.** GitHub / Supabase / Vercel / Stripe / Daily / registrar. Single-owner + no-2FA + personal-email recovery are the real single-points-of-failure here (see §5 questions).

---

## 3. Security check (Supabase advisors, triaged)

Ran the security advisor: **5 ERROR, 71 WARN.** Most are expected (our SECURITY DEFINER RPC/view architecture). The genuinely actionable items:

**Fix (easy, real):**
- 🟡 **`app_profile_stats` (DEFINER view, unfiltered)** — CLAUDE.md says "never query directly; use `app_profile_public`." Lock it down so clients *can't* reach it directly (revoke SELECT from `anon`/`authenticated`; only the `app_profile_public` chain needs it). The one DEFINER view that's a genuine exposure if reachable.
- 🟡 **`profile-images` bucket allows listing** — policy `profile_images_public_read` lets clients **enumerate all files**. Public URL access doesn't need that; tighten so objects are fetchable by URL but the bucket isn't listable.
- 🟡 **4 functions with mutable `search_path`** — `accept_collab_invite`, `send_collab_invite`, `send_additional_collab_invite`, `send_collab_invites_with_draft`. Add `SET search_path = public` (privilege-escalation hygiene on DEFINER funcs).
- 🟡 **Auth leaked-password protection is OFF** — enable HaveIBeenPwned check in Supabase Auth (good for real-user signups).

**Confirm (likely intentional):**
- The other 4 DEFINER views — `app_profile_public` (✅ applies `can_view_profile()`), `vw_my_lifetime_summary` (✅ by-design, self-scoped per CLAUDE.md), `vw_my_transactions` + `vw_challenge_session_team` (verify each filters by `auth.uid()` / is meant to be public-team). 
- `rls_policy_always_true` on `app_pilot_application` INSERT — ✅ intentional (public application form; SELECT is admin-only).
- 64× "DEFINER function executable by anon/authenticated" — expected (our RPCs self-authorize via `auth.uid()`); worth a one-time skim that each rejects unauthenticated callers (they do by pattern). Document as accepted.

---

## 4. Prioritized fix-list

1. 🔴 **Make the DB reproducible from git.** Commit a full schema dump and keep it current:
   `supabase db dump --linked --schema public -f db/schema.sql` (schema), optionally a roles/policies dump too. Refresh on each migration. *(Needs the Supabase CLI linked + DB password — a you-run or guided step.)* This gives a second, reviewable copy of the schema off Supabase.
2. 🟡 **Confirm Supabase plan + backups.** If free, know the daily/no-PITR limit; **upgrade to Pro + PITR before real payments** (losing financial data is unacceptable). Add a periodic off-Supabase `pg_dump` of data as belt-and-suspenders.
3. 🟡 **Security hygiene** (one small migration + two dashboard toggles): lock down `app_profile_stats`; tighten the `profile-images` listing policy; pin `search_path` on the 4 collab functions; enable leaked-password protection.
4. 🟡 **2FA everywhere** (GitHub, Supabase, Vercel, Stripe, Daily, registrar) + record account ownership/recovery (see §5).

> Note: items 1–3 are small and could fold into **H1** (platform/deploy readiness) since they're pilot-launch hygiene; item 4 is operational (you).

---

## 5. Recovery runbook ("if X is lost…")

- **Laptop lost/dead** → `git clone` from GitHub on a new machine; recreate `web/.env.local` from the Vercel env vars (so keep those complete + know how to read them). No source lost.
- **Vercel project lost** → re-import the GitHub repo into a new Vercel project, set env vars, point `www.infitra.fit` DNS. Code unaffected.
- **Supabase project lost / corrupted** → restore from Supabase backup (or PITR if Pro). **Today, git won't help** until fix #1 lands. After #1: re-create schema from `db/schema.sql` + reapply, then restore data from the latest dump/backup.
- **A secret leaks** → rotate in Stripe/Daily/Supabase, update Supabase edge secrets + Vercel env, redeploy.
- **Account locked out** → recovery hinges on 2FA backup codes + the recovery email being one you control long-term (see questions).

---

## 6. Open questions for you (human-knowledge — needed to finish the safety picture)

1. **Supabase plan**: free or Pro? (Determines backup retention + whether PITR exists.)
2. **2FA**: enabled on GitHub, Supabase, Vercel, Stripe, Daily, and the domain registrar? Backup codes stored somewhere safe (not only on the laptop)?
3. **Account ownership**: are these on a company email you'll keep, or a personal one? Is there a second admin on the critical accounts (bus-factor)?
4. **Secrets backup**: is there any copy of the env/secret values outside the Supabase/Vercel dashboards (e.g., a password manager)?
5. **This laptop**: is it the only dev machine? (Code is safe on GitHub regardless; this is about local-only secrets + habits.)
