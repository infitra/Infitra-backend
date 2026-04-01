# INFITRA — Claude Project Context

## What is INFITRA
A **creator collaboration platform for live fitness experiences**. Creators publish sessions and challenges, participants purchase access, revenue is distributed via transparent collaboration contracts. Collaboration is a first-class system primitive.

Full architecture reference: `~/Desktop/Architecture & Security Model + Business Logic Integration - INFITRA.txt`

---

## Stack
- **Backend**: Supabase Postgres (canonical state engine) + Row Level Security
- **Edge Functions**: Deno/TypeScript in `./functions/` — privileged orchestration layer
- **Payments**: Stripe Checkout + Webhooks (CHF only, currently)
- **Live Video**: Daily.co (modular provider interface — replaceable without DB changes)
- **Frontend**: Not yet built — to be a thin layer calling RLS + RPC + Edge Functions

---

## Architecture: 4 Mutation Surfaces

| Surface | Who | What |
|---|---|---|
| **Client + RLS** | Authenticated user | Profile, posts, reviews, templates, creator-owned objects |
| **RPC Functions** | Client via Supabase | Atomic structured ops (publish flows, collaboration state) |
| **Edge Functions** | Service role (privileged) | Payments, webhook processing, token issuance, community side effects |
| **DB Triggers** | Database engine | Invariant enforcement, split validation, acceptance resets |

**Rule**: The frontend never writes to economic, financial, or governance tables directly. Period.

---

## 15 Canonical Domains

| Domain | Tables (prefix: `app_`) | Notes |
|---|---|---|
| **Identity** | `app_profile` | Root actor — every domain references this |
| **Attendance** | `app_attendance`, `app_stream_token` | Entitlement = attendance record after payment |
| **Challenge** | `app_challenge`, `app_challenge_session`, `app_challenge_member`, `app_challenge_cohost` | Multi-session programs |
| **Session** | `app_session`, `app_session_cohost` | Live event unit |
| **Community** | Creator + challenge community containers, posts, comments | Always container-bound, never global |
| **Templates** | `app_template`, template items | Structural blueprints only — not runtime objects |
| **Review / Badge** | Reviews, badges | Reputation + discovery |
| **Subscription** | Creator plans + user subscriptions | Recurring access |
| **Direct Messaging** | DM relationships + messages | Private, isolated |
| **Financial** | `app_order`, `app_transaction`, `app_transaction_audit`, `app_payment_event`, `app_payout` | **SYSTEM-ONLY writes** |
| **Email** | Email workflows | Notifications |
| **Staff Governance** | Staff + moderation | Admin surface |
| **Edge Observability** | `app_edge_call_log` | Audit trail — system-only |
| **Governance Constraints** | Caps tables | Enforced at mutation boundary |

---

## Edge Functions (all in `./functions/`)

| Function | Purpose |
|---|---|
| `create_checkout_session` | Creates Stripe Checkout Session. Buyer absorbs fees (3% + CHF 0.30). Rate-limited. |
| `stripe_webhook` | Receives Stripe events → creates financial records → materializes attendance entitlement |
| `issue_join_token` | Validates entitlement (host / cohost / attendee) → issues Daily.co token + room URL |
| `create_live_room` | Creates Daily.co room for a session |
| `live_provider` | Modular adapter — abstracts live video provider |
| `live_webhook` | Receives live provider events (Daily.co webhooks) |
| `precreate_rooms` | Pre-creates rooms ahead of session start time |
| `end_session` | Ends live session, updates state |
| `follow_user` | Follow relationship (creator community) |
| `unfollow_user` | Unfollow relationship |
| `email_send_receipt` | Sends payment receipt email |
| `monthly_badges` | Badge issuance cron job |
| `create_from_template` | Instantiates challenge/session from template |

---

## Key System Invariants (never violate these)

- **SR-I1**: Schema constraints are non-bypassable across all surfaces
- **SR-I2**: Attendance is unique per `(session_id, user_id)` — one entitlement per person
- **SR-I3**: Monetized challenges enforce CHF currency at schema level
- **SR-I4**: Cohost revenue splits ≤ 100% of creator share (trigger-enforced)
- **SR-I5**: Collaboration term changes invalidate prior collaborator acceptance
- **SR-I6**: Platform fee = fixed 20% gross; creator share = 80%
- **SR-I7**: Payment webhook processing is idempotent (`webhook_event_lock` table)
- **SR-I8**: Economic/system-control tables: privileged backend only
- **SR-I10**: Continuation lineage is structural (`continuation_group_id`) — never inferred from names/dates
- **SR-I11**: All community interaction belongs to a defined container
- **SR-MB3**: Client NEVER writes to `app_order`, `app_transaction`, `app_payout`, etc.
- **SR-MB4**: Attendance records come from payment workflows, not client inserts

---

## Principal Types (DB roles)
- `anon` — unauthenticated
- `authenticated` — both participants AND creators (distinguished by `app_profile.role`)
- `service_role` — Edge Functions only — bypasses RLS; must validate explicitly

`app_profile.role` values: `participant` | `creator` | `admin`

Account type is **permanent at creation**. Creators and participants are different role flows.

---

## Payment & Entitlement Flow
```
Client → create_checkout_session (Edge) → Stripe Checkout
Stripe → stripe_webhook (Edge) → app_order + app_transaction + app_attendance (entitlement)
Client → issue_join_token (Edge) → validates attendance → Daily.co token + room_url
```

---

## Working Rules for Claude

1. **Never suggest client-side writes to financial tables** — always via Edge Function.
2. **Always check RLS implications** before adding new queries to the frontend.
3. **The frontend is a thin layer** — business logic lives in the DB (RPC/triggers) or Edge Functions.
4. **Respect domain isolation** — financial events cause community side effects via triggers, not frontend calls.
5. **Stripe is financial truth** — local state derives from confirmed webhook events only.
6. **CHF only** — all prices in `price_cents` (integer, CHF). No multi-currency frontend assumptions.
7. **Daily.co is the live provider** — but behind the `live_provider` adapter (swappable).
8. **Before adding a new mutation**: identify which surface it belongs to (Client/RPC/Edge/Trigger).
9. **Entitlement = `app_attendance` row** for sessions, `app_challenge_member` row for challenges.
10. **Community interaction is always container-scoped** — creator community or challenge community.
11. **Never query `app_profile_stats` directly from the frontend** — it is SECURITY DEFINER and unfiltered. Always use `app_profile_public` which applies `can_view_profile()` as the access filter.
12. **`vw_my_lifetime_summary` is SECURITY DEFINER by design** — it needs elevated access to read restricted tables scoped to the current user. Safe to query from authenticated clients.

---

## Current Implementation State
- Backend: Fully architected (schema + RLS + triggers + RPC)
- Edge Functions: All core flows implemented (payments, live, badges, templates)
- Frontend: **Not yet built**
- Stripe Connect (creator payouts): Schema-ready, not yet activated
- Staff/governance: Architecturally defined, not yet operationally active
- Private beta mode: Creator onboarding is invite/manual approval

---

## MVP Frontend Goal
Build the thinnest possible frontend that lets:
1. **Participants**: discover sessions/challenges → purchase → join live session
2. **Creators**: create session/challenge → publish → go live → manage attendees

Stack to be decided (Next.js recommended). See MVP plan in project memory.
