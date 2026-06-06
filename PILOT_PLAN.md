# INFITRA — Pilot Engagement Plan (v3)

> Status: working document. Replaces the v1 phased plan and the v2 in-chat draft.
> Pre-pilot — no real users, no in-flight traffic. Build cleanly; delete legacy without redirects; no backward-compat shims anywhere.

---

## 0. Status snapshot

> ⚠️ This snapshot is historical. **Current frontier = §9 (v4 — Phase 2 pilot
> hardening).** Bundles 1–9 are effectively shipped; Phase 2 (H0–H5) precedes the
> pushed-back Bundles 10/11/12. Read §9 for what's next + the locked v4 decisions.

### What Bundle 2.x has shipped

- **Phase 1 deletion** — tribes dashboard, dev-only routes, sessions list index, /discover, /creators/[username], /communities/creator all deleted; orphaned components purged; dashboard nav reduced to Home · Earnings · Create
- **Landing rewrite** — visual-first single-CTA structure, heartbeat ECG, "Structure + peak moments" line, system feature chips
- **Auth surface** — restyled to cream + wave, single brand from landing through onboarding
- **Create page** — visual scene CTAs (orange Collaboration / cyan Solo), avatar parity, draft cleanup, rich draft grid
- **Dashboard restructure (Phase 3a Bundle 1)** — `ActiveProgramCard`, `OtherProgramCard`, `IdentityStrip`, `PrimaryActionPill`, `CollabInvitations`, `NotificationBell` all live
- **Contract document** — read-only viewer at `/dashboard/collaborate/[id]/contract` with sha256 hash
- **Section 2 diagram + system feature chips** on landing
- **Collab invite card polish + pending-invitee RLS + split-default fix**
- **Bundle 2.11** — identity flows, session weight, invite splits
- **Bundle 2.12** — challenge space palette inversion to match dashboard
- **Bundle 3** — workspace restructure: Promise, Weekly Arc (Program Rhythm), Who Handles What (Topics), Intro Prompt, edit-log split UI all shipped
- **Bundle 3 polish v1-v12.AC** — heavy iteration on the workspace surface based on dogfooding feedback. Notable: dual-color split slider, Realtime cohost+session propagation, side-by-side team portraits with role-coloured details, hero session images, locked workspace = the contract (deleted `/contract` route), accept/decline flow with prominent decline-reason callout, celebratory all-signatures-in state with per-card orange edges. Four propagation paths added during v12.U-v12.Z as band-aids for lock-state realtime unreliability — these get removed in Bundle 3.5 Phase 6.

### Publish flow verified end-to-end

Publish action tested two-browser after Bundle 3 polish v12.AC. Worked: action succeeds, owner redirects to success page, all signatures recorded, `challenge_published` notification fires correctly (v12.S allow-list addition), `ensure_challenge_space_for_published_challenge` runs cleanly. Lag noted (same workspace propagation issue as lock/reopen) — accepted as known and queued for Bundle 3.5 fix.

Surfacing the post-publish success page as ugly / legacy / lacking detail is the trigger for promoting Bundle 4 ahead of Bundle 3.5.

### What's next: Bundle 4 — public buyer page + post-publish success page upgrade

Reordered ahead of Bundle 3.5 (was: Bundle 3.5 then 4). Rationale: Bundle 4 is read-only / server-rendered and doesn't share Bundle 3.5's live-collab patterns, so the architectural ordering is preserved (Bundle 3.5 still ships before Bundle 5 which IS the live-collab page that needs it). Bundle 4 delivers user-perceived value sooner — the success page upgrade is mostly a free side-effect of building the public buyer components (they get reused inline in the success page wrapped in a celebratory frame).

Pre-bundle design step: sketch the participant view layout end-to-end in chat before writing component files. See Bundle 4 spec for what needs deciding.

### Then: Bundle 3.5 — workspace live-collab refactor (deferred ~2-3 days, slotted right after Bundle 4)

Bundle 3 shipped functionally but the live-collab architecture underneath is band-aided. Adding more `router.refresh()` propagation paths doesn't fix the root cause: every realtime event triggers a full server re-render with ~10 sequential queries. Bundle 3.5 rearchitects this to client-state-as-live-cache with Zustand + direct payload mutation + optimistic UI. Same pattern then inherited natively by Bundle 5 (cohort space) and Bundle 8 (live session UI).

Not blocking pilot ship — current architecture works, just slowly. Doing it before Bundle 5 because: (a) workspace is the most state-heavy page and we'd refactor anyway, (b) cohort space (Bundle 5+) NEEDS this pattern from day one, (c) easier to build with the right architecture than retrofit later. Frontend phases zero backend risk; backend phase (RPC simplification) is separate and only attempted after frontend phases validated in production.

### What's still open from v1 (now folded into v3)

- Pilot application form (`/apply`) — landing CTA links to it; route is 404
- Pilot terms (`/pilot-terms`) — linked from landing footer; route is 404
- Onboarding "what now" ending screen
- Workspace E2E verification
- Earnings page polish
- Public buyer page rewrite
- Checkout audit
- Live session two-device test
- Entitlement gating audit
- Challenge space view (cohort space)
- Dogfood + 90-second demo video
- Outreach readiness

### What v3 adds (the engagement architecture)

- **Program Promise** (with Weekly Arc + Who Handles What + Intro Prompt) on workspace + public buyer page
- **Pre-Session Pulse** — single-slider readiness check 4h before each session
- **Post-Session Reflection** — combined slider + free text fired on session end
- **Directed Q&A** — Ask composer mode, auto-promotion to Coach Answer
- **Locker-room IA** in the cohort space (current week prominent, action bar, next moment, cohort feed, past moments)
- **Workspace edit-log split** — inline field attribution + "Recent changes" expander; chat purely conversational
- **Three transactional emails** — Kickoff, Session reminder, Missed session
- **Routing cleanup** — `/challenges/[id]/space` replaces `/communities/challenge/[spaceId]`
- **pg_cron + SQL functions** for scheduled work; views drive UI action items

### What's parked / cut

- **Replay window** (Daily.co recording, time-bounded join) — parked; meaningful schema + cost; revisit post-pilot
- **Cues** — cut; creators authoring `kind='talk'` posts that render with a creator badge is enough
- **Daily pulse** — cut; pre/post pulses on session days carry the data signal
- **Section 5 of the spec** — was a numbering typo; section 6 is real

---

## 1. Architecture principles

Four governing principles. Every bundle must respect them.

### P1 — Backend-heavy logic; frontend is rendering

If a value is needed in two places, it lives in a SQL view, not in a TypeScript helper. If a page loads more than three independent queries, consolidate into a single `load_*` RPC that returns one typed object. Frontend computes only presentation (relative timestamps, currency display, layout). All cross-cutting concerns (current-week computation, action-item resolution, fallback values, aggregations) live in views or RPCs.

### P2 — Clean routing, no legacy

Pre-pilot, no real traffic. When a route moves, the old route is deleted, not redirected. URL design uses the natural identifier (`challenge_id`, not `space_id`). One identifier flows through every URL related to a challenge. The `/communities/` namespace is gone after Bundle 5.

### P3 — Bounded notifications

Three categories, 13 types total (locked taxonomy in §2.4). Field edits never notify. Posts in cohort feed never notify. Comments never notify (except the first auto-promoted Coach Answer). Inbox death is a churn driver.

### P4 — pg_cron + SQL functions for scheduled work; views drive UI

`pg_cron` is enabled. Scheduled work is SQL functions inside the database, not edge functions invoked over HTTP. Cron handles best-effort notifications and email queueing only — never the source of truth for UI state. The UI computes its own action items from `vw_action_items_for_user` on every page load. If a notification didn't fire, the user still sees the action card the moment they open the app. Cron drift becomes a non-issue for in-app surfaces; for email it's bounded by frequency (every 5 min) and idempotency (UNIQUE constraints).

---

## 2. Locked architecture

### 2.1 Three surfaces, two grammars

| Surface | URL | Audience | Grammar | Promise + Arc role |
|---|---|---|---|---|
| Workspace | `/dashboard/collaborate/[id]` | Two creators co-designing | Structural editor | Front and centre — what they're designing |
| Public buyer page | `/challenges/[id]` | Prospective buyer | Sales brochure | Front and centre — what they're buying |
| Cohort space | `/challenges/[id]/space` | Enrolled participant + creators | **Locker room** | Demoted: current week heading prominent, full arc behind `view program ▾` |

### 2.2 Engagement primitives matrix

| Primitive | Storage | Author | Trigger | Where it appears | Privacy default |
|---|---|---|---|---|---|
| Talk | `app_challenge_post kind='talk'` | Anyone enrolled | Manual | Cohort Feed | Public to cohort |
| Intro | `app_challenge_post kind='intro'` or `'intro_private'` | New enrollee | Action Bar prompt on first landing | Cohort Feed (public variant only) | Default share with cohort; opt-out keeps it creator-only |
| Reflection | `app_challenge_post kind='reflection'`, `context_id=session_id`, `metadata.energy_after` | Attendee | Action Bar after `end_session` | Cohort Feed + clustered in session detail | Public to cohort |
| Question | `app_challenge_post kind='question'`, `directed_to uuid[]` | Anyone enrolled | Manual via Ask mode | Cohort Feed with `Question for [avatars]` chip | Public to cohort |
| Coach answer | `app_challenge_comment is_coach_answer=true` | Tagged collaborator | First comment by tagged creator auto-promotes | Pinned above thread on its question post | Public to cohort |
| Coach drop | `app_challenge_post kind='talk'` authored by creator | Creator | Manual | Cohort Feed with creator badge (rendered, not stored) | Public to cohort |
| Pre-pulse | `app_session_pre_pulse_response (session_id, user_id, value)` | Attendee | Cron 4h before session + on-visit fallback | Action Bar slider + aggregation chip on Next Moment | Aggregate public (5+ floor); individual creator-only |
| Post-pulse (energy_after) | `metadata.energy_after` on the reflection post | Attendee | Same Action Bar card as reflection | Inline on reflection post + aggregate chip on session detail | Aggregate public (5+ floor); individual public via reflection |

### 2.3 Routing map (final)

```
/                                landing
/apply                           pilot application form              [NEW Bundle 1]
/pilot-terms                     static                              [NEW Bundle 1]
/login, /sign-up, /beta-access   auth (existing)
/onboarding                      onboarding (existing, ending screen Bundle 8)

/challenges/[id]                 public buyer page (Bundle 4 rewrite)
                                 — auto-redirects authenticated enrolled users to /space
                                 — auto-redirects authenticated owner/cohost to /space
/challenges/[id]/space           cohort space (the locker room)      [NEW path Bundle 5]
/challenges/[id]/sessions/[sid]  session detail (clustered reflections) [NEW path Bundle 5]
/challenges/[id]/sessions/[sid]/live  live join (participant) [moved Bundle 5]

/dashboard                       creator hub
/dashboard/create                create new program
/dashboard/collaborate/[id]      workspace (drafting room only;
                                  redirects to /challenges/[id]/space when published)
/dashboard/sessions/[sid]/live   live join (host)
/dashboard/earnings              earnings (small footer note Bundle 12)

DELETED:
/communities/challenge/[spaceId]  → replaced by /challenges/[id]/space (no redirect)
/communities/                     → namespace gone entirely
/sessions/[id]                    → moved under /challenges/[id]/sessions/[sid]
```

### 2.4 Notification taxonomy (locked)

13 types total. New types added by v3 marked **NEW**.

**Action item — you have a thing to do:**

| Type | Trigger | Recipient | Payload |
|---|---|---|---|
| `pre_pulse_ready` **NEW** | pg_cron job 4h before session start | Each attendee | `{session_id, challenge_id}` |
| `reflection_ready` **NEW** | `end_session` SQL function | Each attendee with `joined_at` | `{session_id, challenge_id}` |
| `intro_prompt_ready` **NEW** | `app_challenge_member` insert via stripe_webhook | New buyer | `{challenge_id}` |

**Status change — something happened that affects you:**

| Type | Trigger | Recipient | Payload |
|---|---|---|---|
| `contract_locked` **NEW** | `lock_challenge_contract` | Each cohost | `{challenge_id, contract_id}` |
| `contract_accepted` **NEW** | `respond_to_contract accept` | Owner + other cohosts | `{challenge_id, contract_id, actor_id}` |
| `contract_declined` **NEW** | `respond_to_contract reject` | Owner | `{challenge_id, contract_id, actor_id, comment}` |
| `challenge_published` **NEW** | `publish_challenge` | Each cohost | `{challenge_id}` |
| `coach_answered_your_question` **NEW** | First auto-promote on `create_challenge_comment` | Question's author | `{post_id, comment_id, answerer_id}` |
| `collab_invite` (existing) | `send_collab_invites_with_draft` | Each invitee | `{invite_id, from_id, challenge_id}` |
| `collab_accepted` (existing) | `accept_collab_invite` | Inviter | `{invite_id, actor_id, challenge_id}` |
| `badge_awarded` (existing) | Monthly cron | Recipient | `{badge_id, period}` |

**Direct ask — someone is talking to you:**

| Type | Trigger | Recipient | Payload |
|---|---|---|---|
| `question_for_you` **NEW** | `create_challenge_post kind='question'` | Each `directed_to` creator | `{post_id, asker_id, challenge_id}` |
| `dm_new` (existing) | `dm_send` | Conversation member | `{conversation_id, message_id}` |

### 2.5 Anti-list — never notify on

- Field edits in workspace (Promise, Weekly Arc themes, Topic ownership, Intro prompt, title, description, dates, price, image, capacity)
- Session add/remove/edit during drafting
- Cohost split adjustments during drafting
- New posts in cohort feed (Talk, Reflection — Question is the exception, fires `question_for_you` for tagged creators only)
- New comments on any post (except first auto-promoted Coach Answer)
- Likes on posts or comments
- Attendance changes (people joining/leaving live)

### 2.6 Idempotency

All system-generated notifications use a UNIQUE index to prevent dupes:

```sql
CREATE UNIQUE INDEX uniq_notification_target
  ON app_notification(recipient_id, type, (payload->>'session_id'))
  WHERE payload ? 'session_id';

CREATE UNIQUE INDEX uniq_notification_challenge
  ON app_notification(recipient_id, type, (payload->>'challenge_id'))
  WHERE payload ? 'challenge_id' AND NOT (payload ? 'session_id');

CREATE UNIQUE INDEX uniq_notification_post
  ON app_notification(recipient_id, type, (payload->>'post_id'))
  WHERE payload ? 'post_id';
```

All emails use UNIQUE on `(user_id, kind, target_id)` in `app_email_outbox` (see §3.7).

---

## 3. Schema delta (consolidated)

All migrations follow the existing convention: `YYYYMMDDhhmmss_description.sql` in `supabase/migrations/`. Apply via `supabase db push`. RLS policies attached in the same migration as the table change.

### 3.1 — ALTER `app_challenge`

```sql
ALTER TABLE public.app_challenge
  ADD COLUMN IF NOT EXISTS promise_text text,
  ADD COLUMN IF NOT EXISTS weekly_arc jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS topic_ownership jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intro_prompt text,
  ADD COLUMN IF NOT EXISTS promise_edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS promise_edited_by uuid REFERENCES public.app_profile(id);
```

`weekly_arc` shape: `[{week:1, theme:"Build base"}, {week:2, theme:"Push"}, ...]`. Number of rows derived by RPC from `start_date`/`end_date` consistency.

`topic_ownership` shape: `[{creator_id:uuid, topics:["training","strength"]}, ...]`. Free-text topics; soft routing signal, never enforced.

RLS unchanged — new columns inherit existing `app_challenge` policies (read by published/owner/cohost/invitee; update by owner+cohost when draft, plus `weekly_arc[].theme` text remains editable post-publish via dedicated RPC).

### 3.2 — ALTER `app_challenge_post`

```sql
ALTER TABLE public.app_challenge_post
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'talk',
  ADD COLUMN IF NOT EXISTS context_type text,
  ADD COLUMN IF NOT EXISTS context_id uuid,
  ADD COLUMN IF NOT EXISTS directed_to uuid[],
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.app_challenge_post
  ADD CONSTRAINT app_challenge_post_kind_valid
  CHECK (kind IN ('talk','intro','intro_private','reflection','question'));

CREATE INDEX IF NOT EXISTS idx_challenge_post_kind
  ON public.app_challenge_post(space_id, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_post_context
  ON public.app_challenge_post(context_type, context_id)
  WHERE context_type IS NOT NULL;
```

**RLS addition for `intro_private`:**

```sql
DROP POLICY IF EXISTS app_challenge_post_select ON public.app_challenge_post;
CREATE POLICY app_challenge_post_select ON public.app_challenge_post
  FOR SELECT USING (
    -- Public posts: standard space access
    (kind != 'intro_private' AND public.can_access_challenge_space(space_id, (SELECT auth.uid())))
    OR
    -- Private intros: author + creators on the source challenge only
    (kind = 'intro_private' AND (
      author_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.app_challenge_space cs
        JOIN public.app_challenge c ON c.id = cs.source_challenge_id
        WHERE cs.id = app_challenge_post.space_id
        AND (
          c.owner_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.app_challenge_cohost ch
            WHERE ch.challenge_id = c.id AND ch.cohost_id = (SELECT auth.uid())
          )
        )
      )
    ))
  );
```

No backfill needed — pre-pilot, near-zero data; DEFAULT covers any test rows.

### 3.3 — ALTER `app_challenge_comment`

```sql
ALTER TABLE public.app_challenge_comment
  ADD COLUMN IF NOT EXISTS is_coach_answer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_by uuid REFERENCES public.app_profile(id);

CREATE INDEX IF NOT EXISTS idx_challenge_comment_coach_answer
  ON public.app_challenge_comment(post_id, is_coach_answer)
  WHERE is_coach_answer = true;
```

### 3.4 — ALTER `app_session`

```sql
ALTER TABLE public.app_session
  ADD COLUMN IF NOT EXISTS pre_pulse_fired_at timestamptz;
```

Used by the pre-pulse cron job to mark which sessions have already fired notifications.

### 3.5 — CREATE `app_session_pre_pulse_response`

```sql
CREATE TABLE IF NOT EXISTS public.app_session_pre_pulse_response (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.app_session(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.app_profile(id) ON DELETE CASCADE,
  value smallint NOT NULL CHECK (value BETWEEN 0 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX idx_pre_pulse_session ON public.app_session_pre_pulse_response(session_id);

ALTER TABLE public.app_session_pre_pulse_response ENABLE ROW LEVEL SECURITY;

CREATE POLICY pre_pulse_insert ON public.app_session_pre_pulse_response
  FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.app_attendance a
      WHERE a.session_id = app_session_pre_pulse_response.session_id
      AND a.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY pre_pulse_select ON public.app_session_pre_pulse_response
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_session s
      LEFT JOIN public.app_challenge_session cs ON cs.session_id = s.id
      LEFT JOIN public.app_challenge c ON c.id = cs.challenge_id
      WHERE s.id = app_session_pre_pulse_response.session_id
      AND (
        s.host_id = (SELECT auth.uid())
        OR c.owner_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.app_challenge_cohost ch
          WHERE ch.challenge_id = c.id AND ch.cohost_id = (SELECT auth.uid())
        )
      )
    )
  );
```

### 3.6 — CREATE `app_workspace_activity`

```sql
CREATE TABLE IF NOT EXISTS public.app_workspace_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.app_challenge(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.app_profile(id),
  kind text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workspace_activity_challenge
  ON public.app_workspace_activity(challenge_id, created_at DESC);

ALTER TABLE public.app_workspace_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_activity_select ON public.app_workspace_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.app_challenge c
      WHERE c.id = app_workspace_activity.challenge_id
      AND (
        c.owner_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.app_challenge_cohost ch
          WHERE ch.challenge_id = c.id AND ch.cohost_id = (SELECT auth.uid())
        )
      )
    )
  );
-- INSERT: service-role only (called from RPCs)
```

`kind` values used by RPCs: `field_edit` (with payload `{field, old, new}`), `session_added`, `session_removed`, `session_edited`, `cohost_added`, `cohost_split_changed`.

### 3.7 — ALTER `app_email_outbox`

```sql
ALTER TABLE public.app_email_outbox
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.app_profile(id),
  ADD COLUMN IF NOT EXISTS target_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_email_outbox_idempotent
  ON public.app_email_outbox(user_id, kind, target_id)
  WHERE user_id IS NOT NULL AND target_id IS NOT NULL;
-- Receipts (existing) leave user_id/target_id NULL and aren't subject to this constraint
```

### 3.8 — CREATE `app_pilot_application`

```sql
CREATE TABLE IF NOT EXISTS public.app_pilot_application (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  channel_url text,
  expertise text NOT NULL,
  audience_size_range text,
  location text,
  has_partner boolean DEFAULT false,
  partner_info text,
  complement_interest text,
  success_description text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_pilot_application ENABLE ROW LEVEL SECURITY;

CREATE POLICY pilot_app_insert_any ON public.app_pilot_application
  FOR INSERT WITH CHECK (true);

CREATE POLICY pilot_app_select_admin ON public.app_pilot_application
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.app_profile
            WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
```

### 3.9 — RPCs to ADD or EXTEND

#### EXTEND `update_challenge_workspace`

Add nullable params for the new fields. When any non-null, set `promise_edited_at = now()`, `promise_edited_by = p_actor`. Replace the internal `post_workspace_log` call (for field-level changes) with a call to the new `log_workspace_field_edit`. Keep `post_workspace_log` for collaboration milestones (invite, lock, accept, publish).

```sql
-- Signature additions:
p_promise_text text DEFAULT NULL,
p_weekly_arc jsonb DEFAULT NULL,
p_topic_ownership jsonb DEFAULT NULL,
p_intro_prompt text DEFAULT NULL
```

#### ADD `log_workspace_field_edit`

```sql
CREATE OR REPLACE FUNCTION public.log_workspace_field_edit(
  p_challenge_id uuid,
  p_actor uuid,
  p_field text,
  p_old jsonb,
  p_new jsonb
) RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  INSERT INTO public.app_workspace_activity(challenge_id, actor_id, kind, payload)
  VALUES (p_challenge_id, p_actor, 'field_edit',
    jsonb_build_object('field', p_field, 'old', p_old, 'new', p_new));
$$;
```

#### ADD `update_weekly_arc_themes_post_publish`

Allows owner + cohost to edit `weekly_arc[].theme` text after publish (per locked architecture call 1).

```sql
CREATE OR REPLACE FUNCTION public.update_weekly_arc_themes(
  p_challenge_id uuid,
  p_weekly_arc jsonb
) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_authorized boolean;
BEGIN
  SELECT (c.owner_id = v_actor) OR EXISTS (
    SELECT 1 FROM public.app_challenge_cohost ch
    WHERE ch.challenge_id = p_challenge_id AND ch.cohost_id = v_actor
  ) INTO v_authorized
  FROM public.app_challenge c WHERE c.id = p_challenge_id;

  IF NOT v_authorized THEN RAISE EXCEPTION 'not authorized'; END IF;

  -- Validate shape: array of {week:int, theme:text}
  IF jsonb_typeof(p_weekly_arc) != 'array' THEN
    RAISE EXCEPTION 'weekly_arc must be an array';
  END IF;

  UPDATE public.app_challenge
    SET weekly_arc = p_weekly_arc,
        promise_edited_at = now(),
        promise_edited_by = v_actor
    WHERE id = p_challenge_id;
END $$;
```

#### EXTEND `create_challenge_post`

Add optional params for the new columns:

```sql
-- Signature additions:
p_kind text DEFAULT 'talk',
p_context_type text DEFAULT NULL,
p_context_id uuid DEFAULT NULL,
p_directed_to uuid[] DEFAULT NULL,
p_metadata jsonb DEFAULT '{}'::jsonb
```

Validate `p_kind` against the CHECK list. For `kind='question'`, validate every `directed_to` element is a creator on the source challenge. For `kind='question'`, also INSERT `app_notification type='question_for_you'` for each `directed_to` user.

#### EXTEND `create_challenge_comment` — auto-promote logic

```sql
-- After insert, if parent.kind = 'question' AND author_id = ANY(parent.directed_to)
-- AND no prior comment with is_coach_answer=true exists from this user on this post:
--   UPDATE the new comment SET is_coach_answer = true
--   INSERT app_notification type='coach_answered_your_question' for parent.author_id
```

#### ADD `update_challenge_comment`

```sql
CREATE OR REPLACE FUNCTION public.update_challenge_comment(
  p_id uuid,
  p_body text
) RETURNS void
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public
AS $$
BEGIN
  UPDATE public.app_challenge_comment
    SET body = p_body,
        edited_at = now(),
        edited_by = (SELECT auth.uid())
    WHERE id = p_id
    AND author_id = (SELECT auth.uid());

  IF NOT FOUND THEN RAISE EXCEPTION 'not authorized or not found'; END IF;
END $$;
```

#### ADD `submit_pre_pulse`

```sql
CREATE OR REPLACE FUNCTION public.submit_pre_pulse(
  p_session_id uuid,
  p_value smallint
) RETURNS void
  LANGUAGE sql
  SECURITY INVOKER
  SET search_path = public
AS $$
  INSERT INTO public.app_session_pre_pulse_response(session_id, user_id, value)
  VALUES (p_session_id, (SELECT auth.uid()), p_value)
  ON CONFLICT (session_id, user_id) DO UPDATE SET value = EXCLUDED.value;
$$;
```

#### ADD `submit_session_reflection`

```sql
CREATE OR REPLACE FUNCTION public.submit_session_reflection(
  p_session_id uuid,
  p_body text,
  p_energy_after smallint
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_space_id uuid;
  v_post_id uuid;
  v_metadata jsonb := '{}'::jsonb;
BEGIN
  -- Validate: caller attended, session ended
  IF NOT EXISTS (
    SELECT 1 FROM public.app_attendance a
    JOIN public.app_session s ON s.id = a.session_id
    WHERE a.session_id = p_session_id
      AND a.user_id = v_user
      AND s.ended_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'not eligible to reflect on this session';
  END IF;

  -- Validate: at least one of body, energy
  IF (p_body IS NULL OR length(trim(p_body)) = 0) AND p_energy_after IS NULL THEN
    RAISE EXCEPTION 'reflection requires body or energy value';
  END IF;

  -- Find the challenge space for this session
  SELECT cs.id INTO v_space_id
  FROM public.app_challenge_session csess
  JOIN public.app_challenge_space cs ON cs.source_challenge_id = csess.challenge_id
  WHERE csess.session_id = p_session_id
  LIMIT 1;

  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'no challenge space for this session';
  END IF;

  IF p_energy_after IS NOT NULL THEN
    v_metadata := jsonb_build_object('energy_after', p_energy_after);
  END IF;

  INSERT INTO public.app_challenge_post(
    space_id, author_id, body, kind, context_type, context_id, metadata
  ) VALUES (
    v_space_id, v_user, COALESCE(p_body, ''), 'reflection',
    'session', p_session_id, v_metadata
  ) RETURNING id INTO v_post_id;

  RETURN v_post_id;
END $$;
```

#### ADD `submit_intro_post`

```sql
CREATE OR REPLACE FUNCTION public.submit_intro_post(
  p_challenge_id uuid,
  p_body text,
  p_share_with_cohort boolean
) RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_space_id uuid;
  v_post_id uuid;
  v_kind text;
BEGIN
  -- Validate: caller is enrolled
  IF NOT EXISTS (
    SELECT 1 FROM public.app_challenge_member
    WHERE challenge_id = p_challenge_id AND user_id = v_user
  ) THEN
    RAISE EXCEPTION 'not enrolled';
  END IF;

  -- Find the space
  SELECT id INTO v_space_id
  FROM public.app_challenge_space
  WHERE source_challenge_id = p_challenge_id;

  IF v_space_id IS NULL THEN
    RAISE EXCEPTION 'no challenge space';
  END IF;

  -- One intro per user per challenge
  IF EXISTS (
    SELECT 1 FROM public.app_challenge_post
    WHERE space_id = v_space_id AND author_id = v_user
      AND kind IN ('intro','intro_private')
  ) THEN
    RAISE EXCEPTION 'intro already posted';
  END IF;

  v_kind := CASE WHEN p_share_with_cohort THEN 'intro' ELSE 'intro_private' END;

  INSERT INTO public.app_challenge_post(space_id, author_id, body, kind)
  VALUES (v_space_id, v_user, p_body, v_kind)
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END $$;
```

#### EXTEND `lock_challenge_contract`, `respond_to_contract`, `publish_challenge`

Add notification inserts for `contract_locked`, `contract_accepted`, `contract_declined`, `challenge_published` types per the taxonomy in §2.4. Verify whether existing implementations already do this; if not, add.

### 3.10 — Views and consolidated load RPCs

This is the backend-heavy logic layer. Frontend reads these; never re-implements the logic.

#### `vw_challenge_program_state`

Computes current week and program state for any challenge. Used by every surface that needs to know "where are we in the program."

```sql
CREATE OR REPLACE VIEW public.vw_challenge_program_state AS
WITH week_ranges AS (
  SELECT
    c.id as challenge_id,
    c.start_date,
    c.end_date,
    GREATEST(1, CEIL(EXTRACT(EPOCH FROM (c.end_date - c.start_date)) / (7*86400))::int) as total_weeks
  FROM public.app_challenge c
),
last_session_per_week AS (
  SELECT
    csess.challenge_id,
    CEIL(EXTRACT(EPOCH FROM (s.start_time::date - wr.start_date)) / (7*86400))::int as week_number,
    MAX(s.ended_at) as last_session_ended_at,
    MAX(s.start_time::timestamptz) as last_session_start
  FROM public.app_challenge_session csess
  JOIN public.app_session s ON s.id = csess.session_id
  JOIN week_ranges wr ON wr.challenge_id = csess.challenge_id
  GROUP BY csess.challenge_id, week_number
),
current_week_calc AS (
  SELECT
    wr.challenge_id,
    wr.total_weeks,
    -- Anchor: heading transitions on the last session of the prior week ending
    -- Fall back to calendar-clock for weeks without sessions
    LEAST(
      wr.total_weeks,
      GREATEST(1, COALESCE(
        (SELECT MIN(week_number)
         FROM last_session_per_week ls
         WHERE ls.challenge_id = wr.challenge_id
         AND (ls.last_session_ended_at IS NULL OR ls.last_session_ended_at > now())),
        CEIL(EXTRACT(EPOCH FROM (CURRENT_DATE - wr.start_date)) / (7*86400))::int
      ))
    ) as current_week_number
  FROM week_ranges wr
)
SELECT
  c.id as challenge_id,
  cwc.current_week_number,
  cwc.total_weeks,
  COALESCE(c.weekly_arc -> (cwc.current_week_number - 1) ->> 'theme', '') as current_week_theme,
  cwc.current_week_number - 1 as weeks_completed,
  cwc.total_weeks - cwc.current_week_number as weeks_remaining
FROM public.app_challenge c
JOIN current_week_calc cwc ON cwc.challenge_id = c.id;
```

#### `vw_action_items_for_user`

Drives the Action Bar. Returns pending actions for the caller in a given challenge. UI reads this on every page load — cron is best-effort push for notifications, not the source of truth.

```sql
CREATE OR REPLACE VIEW public.vw_action_items_for_user AS
WITH me AS (SELECT (SELECT auth.uid()) as user_id)

-- Pre-pulse pending: attended, session in [now, now+4h], not yet responded
SELECT
  'pre_pulse' as kind,
  s.id as target_id,
  cs.source_challenge_id as challenge_id,
  s.start_time::timestamptz as fires_at,
  jsonb_build_object('session_title', s.title, 'session_start', s.start_time) as payload
FROM public.app_attendance a
JOIN public.app_session s ON s.id = a.session_id
JOIN public.app_challenge_session csess ON csess.session_id = s.id
JOIN public.app_challenge_space cs ON cs.source_challenge_id = csess.challenge_id
WHERE a.user_id = (SELECT user_id FROM me)
  AND s.start_time::timestamptz BETWEEN now() AND now() + interval '4 hours'
  AND s.status != 'ended'
  AND NOT EXISTS (
    SELECT 1 FROM public.app_session_pre_pulse_response p
    WHERE p.session_id = s.id AND p.user_id = (SELECT user_id FROM me)
  )

UNION ALL

-- Reflection pending: attended (joined_at NOT NULL), ended in last 24h, no reflection yet
SELECT
  'reflection' as kind,
  s.id as target_id,
  cs.source_challenge_id as challenge_id,
  s.ended_at as fires_at,
  jsonb_build_object('session_title', s.title, 'session_ended', s.ended_at) as payload
FROM public.app_attendance a
JOIN public.app_session s ON s.id = a.session_id
JOIN public.app_challenge_session csess ON csess.session_id = s.id
JOIN public.app_challenge_space cs ON cs.source_challenge_id = csess.challenge_id
WHERE a.user_id = (SELECT user_id FROM me)
  AND a.joined_at IS NOT NULL
  AND s.ended_at IS NOT NULL
  AND s.ended_at > now() - interval '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM public.app_challenge_post p
    WHERE p.author_id = (SELECT user_id FROM me)
      AND p.kind = 'reflection'
      AND p.context_type = 'session'
      AND p.context_id = s.id
  )

UNION ALL

-- Intro pending: enrolled, no intro post yet
SELECT
  'intro' as kind,
  m.challenge_id as target_id,
  m.challenge_id,
  m.joined_at as fires_at,
  jsonb_build_object('intro_prompt', COALESCE(c.intro_prompt, 'What are you hoping to get from this program?')) as payload
FROM public.app_challenge_member m
JOIN public.app_challenge c ON c.id = m.challenge_id
JOIN public.app_challenge_space cs ON cs.source_challenge_id = m.challenge_id
WHERE m.user_id = (SELECT user_id FROM me)
  AND NOT EXISTS (
    SELECT 1 FROM public.app_challenge_post p
    WHERE p.space_id = cs.id
      AND p.author_id = (SELECT user_id FROM me)
      AND p.kind IN ('intro','intro_private')
  );
```

(Use `SECURITY INVOKER` view; relies on existing RLS for joined tables.)

#### `vw_session_pre_pulse_aggregate`

```sql
CREATE OR REPLACE VIEW public.vw_session_pre_pulse_aggregate AS
SELECT
  s.id as session_id,
  COUNT(p.id)::int as response_count,
  ROUND(AVG(p.value)::numeric, 1) as avg_value,
  (SELECT COUNT(*) FROM public.app_attendance WHERE session_id = s.id)::int as eligible_count,
  (COUNT(p.id) >= 5) as can_show
FROM public.app_session s
LEFT JOIN public.app_session_pre_pulse_response p ON p.session_id = s.id
GROUP BY s.id;
```

#### `vw_pending_questions_for_creator`

Drives the dashboard "Pending Questions" widget.

```sql
CREATE OR REPLACE VIEW public.vw_pending_questions_for_creator AS
SELECT
  p.id as post_id,
  p.body,
  p.created_at,
  p.author_id,
  p.directed_to,
  cs.source_challenge_id as challenge_id,
  prof.display_name as asker_name,
  EXTRACT(EPOCH FROM (now() - p.created_at))::int / 3600 as hours_since_asked
FROM public.app_challenge_post p
JOIN public.app_challenge_space cs ON cs.id = p.space_id
JOIN public.app_profile prof ON prof.id = p.author_id
WHERE p.kind = 'question'
  AND (SELECT auth.uid()) = ANY(p.directed_to)
  AND NOT EXISTS (
    SELECT 1 FROM public.app_challenge_comment c
    WHERE c.post_id = p.id
      AND c.author_id = (SELECT auth.uid())
      AND c.is_coach_answer = true
  );
```

#### `vw_recent_reflections_for_creator`

Drives "Reflections to read" dashboard widget.

```sql
CREATE OR REPLACE VIEW public.vw_recent_reflections_for_creator AS
SELECT
  p.id as post_id,
  p.body,
  p.created_at,
  p.author_id,
  p.context_id as session_id,
  cs.source_challenge_id as challenge_id,
  s.title as session_title,
  prof.display_name as author_name,
  p.metadata->>'energy_after' as energy_after
FROM public.app_challenge_post p
JOIN public.app_challenge_space cs ON cs.id = p.space_id
JOIN public.app_challenge c ON c.id = cs.source_challenge_id
LEFT JOIN public.app_session s ON s.id = p.context_id AND p.context_type = 'session'
JOIN public.app_profile prof ON prof.id = p.author_id
WHERE p.kind = 'reflection'
  AND p.created_at > now() - interval '48 hours'
  AND (
    c.owner_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_challenge_cohost ch
      WHERE ch.challenge_id = c.id AND ch.cohost_id = (SELECT auth.uid())
    )
  );
```

#### `vw_challenge_buyer_view`

Drives the public buyer page. Returns one row per challenge with all fields the page needs, with COALESCE fallbacks (Promise → description; empty Weekly Arc → empty array).

```sql
CREATE OR REPLACE VIEW public.vw_challenge_buyer_view AS
SELECT
  c.id as challenge_id,
  c.title,
  c.image_url,
  c.start_date,
  c.end_date,
  c.price_cents,
  c.currency,
  c.status,
  COALESCE(NULLIF(c.promise_text, ''), c.description) as promise_text,
  COALESCE(c.weekly_arc, '[]'::jsonb) as weekly_arc,
  COALESCE(c.topic_ownership, '[]'::jsonb) as topic_ownership,
  c.intro_prompt,
  -- Aggregated session count
  (SELECT COUNT(*) FROM public.app_challenge_session WHERE challenge_id = c.id) as session_count,
  -- Spots left (uses existing function)
  public.challenge_spots_left(c.id) as spots_left
FROM public.app_challenge c
WHERE c.status IN ('published','completed');
```

#### `load_challenge_space(p_challenge_id uuid)` — RPC

Single round-trip data load for the cohort space page.

```sql
CREATE OR REPLACE FUNCTION public.load_challenge_space(p_challenge_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_user uuid := (SELECT auth.uid());
  v_space_id uuid;
  v_result jsonb;
BEGIN
  -- Resolve space; verify access
  SELECT id INTO v_space_id FROM public.app_challenge_space
  WHERE source_challenge_id = p_challenge_id;

  IF v_space_id IS NULL THEN RAISE EXCEPTION 'no space'; END IF;

  IF NOT public.can_access_challenge_space(v_space_id, v_user) THEN
    RAISE EXCEPTION 'no access';
  END IF;

  SELECT jsonb_build_object(
    'challenge', (SELECT row_to_json(c) FROM public.app_challenge c WHERE c.id = p_challenge_id),
    'space', (SELECT row_to_json(s) FROM public.app_challenge_space s WHERE s.id = v_space_id),
    'program_state', (SELECT row_to_json(ps) FROM public.vw_challenge_program_state ps WHERE ps.challenge_id = p_challenge_id),
    'creators', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', prof.id, 'name', prof.display_name, 'avatar', prof.avatar_url,
        'role', CASE WHEN prof.id = c.owner_id THEN 'owner' ELSE 'cohost' END,
        'split', COALESCE(ch.split_percent, 100)
      ))
      FROM public.app_challenge c
      LEFT JOIN public.app_challenge_cohost ch ON ch.challenge_id = c.id
      JOIN public.app_profile prof ON prof.id = c.owner_id OR prof.id = ch.cohost_id
      WHERE c.id = p_challenge_id
    ),
    'sessions', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'title', s.title, 'start_time', s.start_time,
        'duration_minutes', s.duration_minutes, 'host_id', s.host_id,
        'status', s.status, 'started_at', s.started_at, 'ended_at', s.ended_at,
        'live_room_id', s.live_room_id,
        'pre_pulse', (SELECT row_to_json(pp) FROM public.vw_session_pre_pulse_aggregate pp WHERE pp.session_id = s.id),
        'reflection_count', (SELECT COUNT(*) FROM public.app_challenge_post p
                             WHERE p.kind = 'reflection' AND p.context_type = 'session' AND p.context_id = s.id),
        'attendance_count', (SELECT COUNT(*) FROM public.app_attendance a
                             WHERE a.session_id = s.id AND a.joined_at IS NOT NULL)
      ) ORDER BY s.start_time)
      FROM public.app_session s
      JOIN public.app_challenge_session cs ON cs.session_id = s.id
      WHERE cs.challenge_id = p_challenge_id
    ),
    'action_items', (
      SELECT jsonb_agg(row_to_json(ai))
      FROM public.vw_action_items_for_user ai
      WHERE ai.challenge_id = p_challenge_id
    ),
    'is_creator', (SELECT EXISTS (
      SELECT 1 FROM public.app_challenge c
      WHERE c.id = p_challenge_id AND c.owner_id = v_user
    ) OR EXISTS (
      SELECT 1 FROM public.app_challenge_cohost ch
      WHERE ch.challenge_id = p_challenge_id AND ch.cohost_id = v_user
    )),
    'is_member', (SELECT EXISTS (
      SELECT 1 FROM public.app_challenge_member m
      WHERE m.challenge_id = p_challenge_id AND m.user_id = v_user
    ))
  ) INTO v_result;

  RETURN v_result;
END $$;
```

The page reads ONE typed object. Frontend renders.

#### `load_workspace(p_challenge_id uuid)` — RPC

Single round-trip for the workspace editor. Returns: challenge fields (including new Promise/Arc/Ownership), sessions, cohosts with profiles, contract state, recent activity.

#### `load_creator_dashboard()` — RPC

Returns: profile, active programs, drafts, archive, pending invites, pending questions count, recent reflections count.

### 3.11 — pg_cron jobs and SQL functions

All cron work is `pg_cron` + SQL functions. No edge functions for scheduling.

#### Job 1: `fire_pre_session_pulses_job`

```sql
CREATE OR REPLACE FUNCTION public.fire_pre_session_pulses_job() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- Insert pre_pulse_ready notifications for sessions starting in [3h45min, 4h15min]
  INSERT INTO public.app_notification (recipient_id, type, payload)
  SELECT a.user_id, 'pre_pulse_ready',
    jsonb_build_object('session_id', s.id,
                       'challenge_id', cs.challenge_id)
  FROM public.app_session s
  JOIN public.app_attendance a ON a.session_id = s.id
  JOIN public.app_challenge_session cs ON cs.session_id = s.id
  WHERE s.start_time::timestamptz BETWEEN now() + interval '3 hours 45 minutes'
                                       AND now() + interval '4 hours 15 minutes'
    AND s.pre_pulse_fired_at IS NULL
    AND s.status != 'ended'
  ON CONFLICT DO NOTHING;

  -- Mark fired
  UPDATE public.app_session
    SET pre_pulse_fired_at = now()
  WHERE start_time::timestamptz BETWEEN now() + interval '3 hours 45 minutes'
                                     AND now() + interval '4 hours 15 minutes'
    AND pre_pulse_fired_at IS NULL;
END $$;

SELECT cron.schedule(
  'fire-pre-session-pulses', '*/5 * * * *',
  $$SELECT public.fire_pre_session_pulses_job()$$
);
```

#### Job 2: `enqueue_session_reminders_job`

```sql
CREATE OR REPLACE FUNCTION public.enqueue_session_reminders_job() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_email_outbox(kind, user_id, target_id, to_email, subject, html_body, text_body)
  SELECT
    'session_reminder',
    a.user_id,
    s.id,
    p.email,
    'Tonight at ' || to_char(s.start_time::timestamptz, 'HH24:MI') || ' — ' || s.title,
    public.render_session_reminder_html(s.id, a.user_id),
    public.render_session_reminder_text(s.id, a.user_id)
  FROM public.app_session s
  JOIN public.app_attendance a ON a.session_id = s.id
  JOIN public.app_profile p ON p.id = a.user_id
  WHERE s.start_time::timestamptz BETWEEN now() + interval '55 minutes'
                                       AND now() + interval '70 minutes'
    AND s.status != 'ended'
  ON CONFLICT (user_id, kind, target_id) WHERE user_id IS NOT NULL AND target_id IS NOT NULL
  DO NOTHING;
END $$;

SELECT cron.schedule(
  'enqueue-session-reminders', '*/5 * * * *',
  $$SELECT public.enqueue_session_reminders_job()$$
);
```

#### Job 3: `enqueue_missed_session_emails_job`

```sql
CREATE OR REPLACE FUNCTION public.enqueue_missed_session_emails_job() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_email_outbox(kind, user_id, target_id, to_email, subject, html_body, text_body)
  SELECT
    'session_missed',
    a.user_id,
    s.id,
    p.email,
    'We missed you tonight',
    public.render_session_missed_html(s.id, a.user_id),
    public.render_session_missed_text(s.id, a.user_id)
  FROM public.app_session s
  JOIN public.app_attendance a ON a.session_id = s.id
  JOIN public.app_profile p ON p.id = a.user_id
  WHERE s.ended_at BETWEEN now() - interval '75 minutes' AND now() - interval '55 minutes'
    AND a.joined_at IS NULL
  ON CONFLICT (user_id, kind, target_id) WHERE user_id IS NOT NULL AND target_id IS NOT NULL
  DO NOTHING;
END $$;

SELECT cron.schedule(
  'enqueue-missed-session-emails', '*/5 * * * *',
  $$SELECT public.enqueue_missed_session_emails_job()$$
);
```

#### Job 4: `dispatch_email_outbox_job`

Calls the edge function via `pg_net.http_post` to drain the outbox. Edge function does the actual sending.

```sql
SELECT cron.schedule(
  'dispatch-email-outbox', '*/2 * * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/email_send_outbox',
    headers := jsonb_build_object('x-cron-secret', current_setting('app.cron_secret'))
  )$$
);
```

(Cron secret stored in Postgres settings via `ALTER DATABASE ... SET app.cron_secret = '...'`.)

### 3.12 — Email templates (in edge function)

Three new templates as inline HTML+text strings inside the renamed `email_send_outbox` edge function (or as files under `supabase/functions/email_send_outbox/templates/`):

- `kickoff` — Welcome subject; body has Promise + Weekly Arc table + Who Handles What + link to challenge space + creators bios
- `session_reminder` — Time + join link + space link
- `session_missed` — "We missed you" + space link (no replay link, replay parked)

Render functions in SQL (`render_session_reminder_html`, etc.) populate the HTML at enqueue time with current data; the edge function just sends what's in the outbox.

---

## 4. Implementation bundles

12 bundles, each shippable independently with its own verification clause. Sequencing notes at the end — most can parallelize after Bundle 2.

### Bundle 1 — Outreach unblock

**Scope:** Pilot application form + pilot terms page. Without these, the landing CTA goes nowhere and outreach can't open.

**Migration:** §3.8 (`app_pilot_application` table + RLS).

**Files to CREATE:**
- `web/app/apply/page.tsx` — server component, renders client form
- `web/app/apply/PilotApplicationForm.tsx` — client form
- `web/app/actions/pilot-application.ts` — server action `submitPilotApplication(formData)`
- `web/app/pilot-terms/page.tsx` — static markdown content

**Verification:**
- Submit form anonymously → row in `app_pilot_application`
- Landing CTA "Apply for the pilot" routes to `/apply`
- `/pilot-terms` loads
- `npm run build` passes

---

### Bundle 2 — Schema foundation + workspace activity split

**Scope:** Land all schema changes that downstream bundles depend on, plus the workspace activity table split. Backend-only; no UI changes yet.

**Migrations (single timestamp file):**
- §3.1 ALTER `app_challenge` (Promise + Weekly Arc + Ownership + Intro prompt + edit attribution)
- §3.2 ALTER `app_challenge_post` (kind, context_type, context_id, directed_to, metadata, CHECK constraint, indexes, intro_private RLS policy)
- §3.3 ALTER `app_challenge_comment` (is_coach_answer, edited_at, edited_by)
- §3.4 ALTER `app_session` (pre_pulse_fired_at)
- §3.6 CREATE `app_workspace_activity`
- §3.7 ALTER `app_email_outbox` (user_id, target_id, UNIQUE)
- §3.9 EXTEND `update_challenge_workspace`; ADD `log_workspace_field_edit`, `update_weekly_arc_themes`, `update_challenge_comment`; EXTEND `create_challenge_post`, `create_challenge_comment` (auto-promote), `lock_challenge_contract`, `respond_to_contract`, `publish_challenge` (notification inserts)
- §3.10 Views: `vw_challenge_program_state`, `vw_session_pre_pulse_aggregate`, `vw_pending_questions_for_creator`, `vw_recent_reflections_for_creator`, `vw_challenge_buyer_view` (action items view ships in Bundle 5; load_challenge_space ships in Bundle 5; load_workspace ships in Bundle 3; load_creator_dashboard ships in Bundle 9)
- §2.6 Notification idempotency UNIQUE indexes

**Files to MODIFY:**
- `web/app/actions/challenge.ts` — `updateChallenge()` server action: pass new params; replace internal `logWorkspaceActivity` calls (which use `post_workspace_log`) with calls to `log_workspace_field_edit` for field-level changes; KEEP `post_workspace_log` calls for milestone events
- `web/app/actions/community.ts` — `createChallengePost()` accepts new optional `kind`, `contextType`, `contextId`, `directedTo`, `metadata` params; `createChallengeComment()` unchanged externally

**Verification:**
- `supabase db push` applies cleanly
- Existing dashboard / workspace / challenge space all still render correctly (new columns nullable, default 'talk' kind)
- A test edit on a draft challenge writes to `app_workspace_activity` instead of the chat
- Old-style call to `create_challenge_post` (no kind) still works → defaults to `kind='talk'`

---

### Bundle 3 — Workspace restructure (Promise + Weekly Arc + Ownership + Intro prompt + edit-log split UI)

**Scope:** The new authoring surface. Two creators co-design with the new structure. Chat goes back to purely conversational.

**RPC:** ADD `load_workspace(p_challenge_id)` — single round-trip data load.

**Files to MODIFY:**
- `web/app/(app)/dashboard/collaborate/[challengeId]/page.tsx` — replace 10 sequential queries with one call to `load_workspace` RPC
- `web/app/(app)/dashboard/collaborate/[challengeId]/WorkspaceEditor.tsx` — major restructure (~600 → ~900 lines)
  - New sections: Promise · Weekly Arc · Who Handles What · Intro Prompt
  - Existing sections: Title/dates/price/image, Cohosts, Contract
- `web/app/(app)/dashboard/collaborate/[challengeId]/WorkspaceChat.tsx` — drop field-edit system messages from rendering filter (still readable in DB but not in chat); keep collaboration-milestone messages

**Files to CREATE:**
- `web/app/(app)/dashboard/collaborate/[challengeId]/PromiseEditor.tsx` — single textarea, attribution chip below
- `web/app/(app)/dashboard/collaborate/[challengeId]/WeeklyArcEditor.tsx` — auto-derives row count from dates
- `web/app/(app)/dashboard/collaborate/[challengeId]/OwnershipEditor.tsx` — table with two columns
- `web/app/(app)/dashboard/collaborate/[challengeId]/IntroPromptEditor.tsx` — single text field with default placeholder
- `web/app/(app)/dashboard/collaborate/[challengeId]/RecentChangesExpander.tsx` — slim expander next to chat reading `app_workspace_activity`
- `web/app/components/EditedAttribution.tsx` — reusable `Edited 2h ago by Lara` chip

**Verification:**
- Two creators on different browsers can both edit Promise / themes / topics; last write wins; attribution updates inline; no chat noise
- Collaboration milestones (invite, lock, accept, publish) still post into chat
- Recent Changes expander shows last 10 edits with timestamps and actor names
- `npx tsc --noEmit` clean

---

### Bundle 3.5 — Workspace live-collab refactor

**Scope:** End-to-end rearchitecture of how the workspace handles live collaboration state. Replaces the current `router.refresh()`-on-every-event pattern with a client-state-as-live-cache model: realtime payloads mutate React state directly, mutations are optimistic for the actor, and a state container (Zustand) owns the local truth. Backend lock RPC simplification shipped as a separate cautious phase. Not blocking pilot ship (current architecture works, just slowly) but a prerequisite for cohort space (Bundle 5+), which inherits this pattern.

#### Why this exists

After Bundle 3 polish (v12.A-AC), the workspace shipped functionally but with significant live-collab latency issues:

- Lock action: 5-30s perceived (server RPC heavy + cold start + 10 sequential queries on refresh)
- Cohost-side propagation: unreliable; 4 band-aid realtime paths (app_challenge UPDATE, app_collaboration_contract INSERT, chat system message via window event, page-visibility refresh) all eventually hitting the same expensive `router.refresh()` re-fetch
- Owner experience: every click waits for the server before any UI feedback
- Channel health: stale WebSockets silently logged but not reconnected

Adding more propagation paths doesn't fix the root cause — every path calls `router.refresh()` which re-runs the whole page server component and re-fetches ~10 queries. We're throwing away the changed row that realtime hands us in the payload, then re-fetching all data.

#### Architectural shift

**From:** server-state-only — page.tsx server component is source of truth, `router.refresh()` to propagate every change
**To:** client-state-as-live-cache — server seeds initial state, realtime payloads mutate Zustand state directly, server consulted only on first load + reconciliation

This is the standard pattern for collaborative apps (Linear, Figma, Notion). The realtime payload IS the change — read it directly into local state, sub-100ms perceived latency, no wasted server round-trip.

#### Architecture rules (so this stays inside the "thin frontend" principle)

- **Backend remains source of truth.** All business rules (who can lock, split caps, status transitions) stay in DB constraints / RLS / RPCs.
- **Frontend may PREDICT backend behavior for UX speed, never DECIDE.** Optimistic UI encodes "this should succeed" — if server rejects, rollback. Same trade-off accepted in v12.J's session-window guard: frontend predicts for UX, backend enforces.
- **No business logic creep.** State container is plumbing/cache. Realtime → state mapping is plumbing. Optimistic actions encode expected server behavior only for instant feedback.
- **Server wins disputes.** When local prediction diverges from server reality (RPC error, reconciliation mismatch), server data takes over.

#### Tech choice — Zustand

State container: **Zustand** (~1.2kb, MIT, no dep on any service).

Rationale (vs `useReducer + Context`):
- Selector-based subscriptions: only components reading the changed slice re-render. Workspace already has ~7-15 consumers; cohort space (Bundle 5) will have 20-50 (chat, presence, reactions, action items). Context-based re-render cascade becomes a real problem at cohort-space scale.
- Less boilerplate per slice (no action-type union, no reducer switch, no Context provider).
- Devtools support for diagnosing realtime issues.
- Established library (~3M weekly downloads, pmndrs collective, used in production by Coinbase + others). MIT license, free forever, no SaaS lock-in, no accounts.

The 1.2kb + ~30min learning curve is a cheap one-time cost vs the alternative of refactoring later when state surface doubles.

#### Scope rules — where this pattern applies

| Page | Apply pattern? | Why |
|---|---|---|
| Workspace (Bundle 3) | **Yes** (this bundle) | Heavy live collab, 2-3 concurrent creators editing |
| Cohort space (Bundle 5+) | **Yes** (build natively when shipping Bundle 5) | Heaviest live collab: 10-50 participants, chat, presence, reactions |
| Live session UI (Bundle 8) | **Yes** (build natively when shipping Bundle 8) | Real-time reactions, presence, host actions |
| `/dashboard` (home) | **No** | Read-mostly, rare updates, server-rendered fine |
| `/challenges/[id]` (public buyer) | **No** | Largely static, no live updates |
| `/dashboard/sessions/[id]` (session detail) | **No** | Light updates, single realtime subscription is enough |
| Earnings / payments | **No** | Read-mostly, rare webhook-driven updates |

Pattern reusable utilities (`useChannelHealth`, store-creation helpers, optimistic-mutation patterns) land in `/lib` during this bundle so Bundles 5 + 8 inherit them cheaply.

#### Phase-by-phase plan

Each phase ships as its own commit. Phases 1-4 are frontend-only (zero backend risk, zero migration). Phase 5 is the backend change, surgical, only after 1-4 validated in production. Phase 6 is cleanup.

##### Phase 1 — State container plumbing (no behavior change)

**Effort:** 2-3 hours

**Files to CREATE:**
- `web/lib/workspace/store.ts` — Zustand store factory, `WorkspaceState` type, slice definitions (challenge, sessions, cohorts, contract, acceptances, declines, activity, profileMap, ui state)
- `web/lib/workspace/initFromServerProps.ts` — converts server-rendered props to initial store state

**Files to MODIFY:**
- `web/app/(app)/dashboard/collaborate/[challengeId]/WorkspaceShell.tsx` — instantiate store from initial props, provide via store hook (no Context needed — Zustand stores are accessed via hook directly)

**Files unchanged in this phase:** every consumer component still reads from props. The store exists but isn't consumed yet. This is pure plumbing.

**Install:** `npm install zustand` (single dep, no peer deps).

**Verification:**
- `npx tsc --noEmit` clean
- Workspace still renders correctly (no behavioral change)
- Store is populated correctly from initial props (verify via React DevTools or temporary console log)

##### Phase 2 — Realtime handlers → store dispatches

**Effort:** 4-6 hours

**Files to MODIFY:**
- `web/app/(app)/dashboard/collaborate/[challengeId]/useWorkspaceRealtime.ts` — each `postgres_changes` handler stops calling `router.refresh()` and instead calls a typed store mutator (e.g., `useWorkspaceStore.getState().applyContractInsert(payload.new)`)

**Specific handler refactors:**
- `app_workspace_activity` INSERT → `applyActivityInsert(row)`
- `app_challenge` UPDATE → `applyChallengeUpdate(row)`
- `app_challenge_session` INSERT/DELETE → `applySessionAdded/applySessionRemoved`
- `app_session` UPDATE/DELETE → `applySessionUpdate/applySessionRemoved` (client-side filter still applies)
- `app_session_cohost` INSERT/DELETE → `applySessionCohostChange`
- `app_challenge_cohost` INSERT/UPDATE/DELETE → `applyCohostChange`
- `app_collaboration_invite` UPDATE → `applyInviteUpdate`
- `app_collaboration_contract` INSERT → `applyContractLocked`
- `app_collaboration_acceptance` INSERT → `applyAcceptanceAdded`
- `app_collaboration_decline` INSERT → `applyDeclineAdded`

**Files to MODIFY (consumers — read from store instead of props):**
- `web/app/(app)/dashboard/collaborate/[challengeId]/WorkspaceEditor.tsx` — replace prop reads with `useWorkspaceStore(state => ...)` selectors
- `TeamSection.tsx`, `ProgramRhythmSection.tsx`, `WorkspaceChat.tsx`, `RecentChangesExpander.tsx`, `ContractStatusBanner.tsx` — same pattern, one component per commit

**Backward-compat during refactor:** for the migration window, the store consumes initial props on mount AND realtime events update it. Server-render props become a one-shot seed. After Phase 2 commits, `router.refresh()` is no longer called from any realtime handler.

**Verification:**
- Two-browser test: every realtime event must update the partner's UI within sub-second without a full page re-render
- No regressions in any of: field edit propagation, session add/remove, cohost add/remove, lock/accept/decline/publish
- Network tab on cohost: no full page re-fetch on partner's edits (just the realtime event payload)

##### Phase 3 — Optimistic mutations

**Effort:** 6-8 hours

**Pattern:** every commit handler in `WorkspaceEditor.tsx` becomes:
```typescript
async function commitX(value) {
  // 1. Optimistic local update
  const prevState = useWorkspaceStore.getState().captureSnapshot(); // for rollback
  useWorkspaceStore.getState().applyXOptimistic(value);

  // 2. Server call in background
  const result = await serverActionX(value);

  // 3. On error, rollback
  if (result.error) {
    useWorkspaceStore.getState().restoreSnapshot(prevState);
    setError(result.error);
    return;
  }
  // 4. On success: no-op (state already reflects truth; realtime echo will reconcile if needed)
}
```

**Mutations to make optimistic:**
- Field edits (title, description, dates, weeks, price, image, promise, weekly_arc, topic_ownership, intro_prompt) — partially optimistic today via `useSyncedField`; formalize through store
- `lockTerms` → owner sees `Locking…` for split-second then immediately the locked banner + read-only cards. Server runs in background.
- `confirmTerms` (cohost accept) → cohost sees their row flip to ✓ instantly
- `requestChanges` (cohost decline) → cohost sees banner flip to "Changes requested", owner gets it via realtime
- `reactivateDrafting` (owner reopen) → owner sees editable cards instantly
- `publishChallenge` → owner sees redirect-to-published state instantly
- `addCohost` / `removeCohost` / `updateCohostSplit`
- `createChallengeSession` / `updateChallengeSession` / `removeChallengeSession`
- `addSessionCohost` / `removeSessionCohost`

**Verification per mutation:**
- Click → UI feedback within 50ms
- Server takes longer → no visible wait for the actor
- Server rejects → state rolls back, error surfaces inline
- Partner browser → realtime echo arrives, state already matches (no-op), no flicker

##### Phase 4 — Channel health + reconnect + reconciliation

**Effort:** 2-4 hours

**Files to CREATE:**
- `web/lib/realtime/useChannelHealth.ts` — wraps a Supabase channel with status monitoring, exponential-backoff auto-reconnect, exposes `{status, reconnectCount}` for UI indicators
- `web/lib/workspace/reconcile.ts` — single targeted query to verify local state matches server (run on reconnect + on visibility return + on mount); diff and apply corrections

**Files to MODIFY:**
- `useWorkspaceRealtime.ts` — wrap subscription with `useChannelHealth`, run reconciliation on reconnect and visibility return
- `WorkspaceShell.tsx` — small "Reconnecting…" / "Out of sync" pill when channel health degraded; auto-clears when reconnected

**Verification:**
- Disconnect network for 30s, reconnect → workspace catches up via reconciliation
- Kill the WebSocket via DevTools → status pill appears, auto-reconnect within seconds
- Tab in background for hours → on return, reconciliation pulls fresh state without full page re-fetch

##### Phase 5 — Backend lock RPC simplification (surgical, careful)

**Effort:** 3-4 hours plus careful verification

**Only attempted after Phases 1-4 validated in production for at least one full dogfood cycle.**

**Files to CREATE:**
- `migrations/YYYYMMDD_v3_b3_5_lock_rpc_async_snapshot.sql`

**Migration content:**
- Add `snapshot_status text` column to `app_collaboration_contract` (default `'pending'`, becomes `'ready'` when snapshot computed)
- Simplify `lock_contract` to insert the contract row with `snapshot_json = '{}'::jsonb`, `snapshot_text = NULL`, `sha256 = NULL`, `snapshot_status = 'pending'`
- New `AFTER INSERT` trigger on `app_collaboration_contract` that computes the snapshot JSON + text + sha256 asynchronously and updates the row, flipping status to `'ready'`
- Migration includes the rollback SQL inline as a comment so it's trivially revertible

**Frontend handling for the brief "pending" window:**
- Contract banner shows "Finalizing contract..." while `snapshot_status = 'pending'` (typically <500ms)
- Lock action returns immediately after the INSERT — owner sees locked state without waiting for snapshot
- Publish action blocked until `snapshot_status = 'ready'` (publish_challenge already validates)

**Caution rules:**
- Apply migration with rollback SQL prepared first
- Verify existing contract rows still parse correctly (default `snapshot_status` to `'ready'` for them)
- Test path: lock → cohost accept → owner publish (with snapshot still pending briefly)
- Test rollback path: revert migration, verify old behavior restored

**Verification:**
- Lock action server-side latency: <500ms (was 2-5s)
- Frontend perceived: instant via optimistic UI from Phase 3 (was 5-30s)
- Snapshot computation: arrives async, banner indicator confirms when ready

##### Phase 6 — Cleanup / remove band-aids

**Effort:** 1-2 hours

**Files to MODIFY:**
- `useWorkspaceRealtime.ts` — remove the visibility-change refresh (superseded by Phase 4 reconciliation), remove the `workspace-contract-event` window-event listener (superseded by Phase 2 direct state mutation), remove the secondary `app_collaboration_contract` INSERT subscription IF the primary `app_challenge` UPDATE handler is now reliable via the new architecture
- `WorkspaceChat.tsx` — stop dispatching `workspace-contract-event` (no longer consumed)
- `page.tsx` — `export const dynamic = "force-dynamic"` can stay (defensive, no cost) or be removed if the new architecture makes it unnecessary

**Verification:**
- Full two-browser test pass after band-aid removal — confirms the proper architecture stands on its own without the v12.U / v12.Y / v12.Z safety nets

#### Verification gates between phases

After EACH phase, before moving to the next:
- `npx tsc --noEmit` clean
- Vercel deploy succeeds
- Two-browser test: owner locks → cohost sees locked within 1s; cohost accepts → owner sees acceptance within 1s; owner publishes → both redirect
- No regressions in chat, recent changes expander, notifications

#### Out of scope (explicit)

- **Concurrent edit conflict resolution (CRDT/OT).** Last-write-wins remains acceptable for workspace text fields. Real co-editing is a separate workstream.
- **Offline-first / sync queue.** No IndexedDB persistence, no offline mutation queue. Optimistic UI rollback is the only failure mode.
- **Cross-tab state sync.** If a user opens the workspace in two tabs, each has its own state. Realtime keeps them roughly aligned but not guaranteed coherent.
- **Push notifications when app closed.** Service worker / web push is separate work.

#### Scaling envelope (what this architecture supports)

Workspace specifically, after Phases 1-5:
- 2-3 concurrent users per workspace: trivial
- 5-10 concurrent users: comfortable
- 20-30 concurrent users (eventual): fine, realtime fan-out negligible
- 50+ concurrent users: would need broadcast channels for ephemeral state (presence, typing) — but workspace is creator+cohosts, never has 50+ users

System-wide ceiling: ~10,000 active creators in workspaces concurrently before Supabase Pro tier limits become the binding constraint (not architecture). Sufficient for pilot → first year+ post-launch.

#### Reusable artifacts this bundle produces

For Bundle 5 (cohort space) and Bundle 8 (live session) to inherit:
- `web/lib/realtime/useChannelHealth.ts` — channel monitoring + auto-reconnect hook
- `web/lib/realtime/reconcile.ts` — reconciliation pattern (parameterized)
- `web/lib/workspace/store.ts` — reference implementation of a Zustand store with realtime + optimistic patterns; cohort space follows same shape
- Documented patterns: optimistic mutation lifecycle, payload-to-state mapping, channel resubscription on dep changes

---

### Bundle 4 — Public buyer page rewrite + post-publish success page upgrade

**Scope:** Replace the current "info grid + flat session list" with the Promise/Arc/Ownership spine. Also upgrade the post-publish success page (currently a legacy confirmation card with date/sessions/price/collaborators) to preview the new public buyer view — so the moment after publish, the creator sees exactly what their participants will see and can share the URL confidently.

**Files to MODIFY:**
- `web/app/(app)/challenges/[id]/page.tsx` — full rewrite; loads from `vw_challenge_buyer_view`; redirects authenticated enrolled users + creators to `/challenges/[id]/space`
- `web/app/(app)/dashboard/collaborate/[challengeId]/published/page.tsx` — replace the legacy success card with a celebratory header ("Your collaboration is live — here's what participants see") + the same public components composed inline as a preview + "Share this link" + "View public page" CTAs

**Files to CREATE:**
- `web/app/(app)/challenges/[id]/PublicChallengeHero.tsx` — title, both creator avatars in parity, dates strip
- `web/app/(app)/challenges/[id]/PublicPromiseBlock.tsx` — prominent Promise text
- `web/app/(app)/challenges/[id]/PublicWeeklyArc.tsx` — N-row visual with theme + session count per week
- `web/app/(app)/challenges/[id]/PublicOwnershipTable.tsx` — Who Handles What as side-by-side creator cards with bios
- `web/app/(app)/challenges/[id]/PublicSessionTimeline.tsx` — collapsed by default, expandable
- `web/app/(app)/challenges/[id]/StickyJoinCTA.tsx` — sticky bottom-bar CTA on mobile

**Success page composition:** the published page in `dashboard/collaborate/[challengeId]/published/page.tsx` reuses the SAME public components (PublicChallengeHero, PublicPromiseBlock, PublicWeeklyArc, PublicOwnershipTable, PublicSessionTimeline) — wrapped in a celebratory header and with a "Share" action above and "View public page" link. Single source of truth for the buyer experience; success page is just the same view in a different frame.

**Pre-Bundle-4 design step (before writing components):**
- Sketch the participant view layout end-to-end (Promise → Arc → Who Handles What → Sessions → CTA)
- Decide hero treatment (cover image full-width vs split with creators, etc.)
- Decide weekly arc visual (vertical timeline vs horizontal cards vs week-by-week stacked)
- Decide whether Promise gets its own hero treatment or sits within the main scroll
- Discuss in chat before any component file is created

**Verification:**
- A friend who's never heard of INFITRA sees the URL and understands the offer in 30 seconds
- Mobile renders cleanly
- Sticky CTA is always tappable
- Authenticated enrolled user hitting `/challenges/[id]` redirects to `/challenges/[id]/space`
- After publish, the success page shows the public view inline (creator sees exactly what participants see), with a celebratory frame and a copyable share link
- URL is shareable to strangers without beta gate / login (proxy.ts has `/challenges/` in `PUBLIC_PREFIXES`)

**Post-pilot evolution (NOT in scope for v1, documented for later):**

The current buyer page is built for the pilot reality: each URL is a singular, focused offer that fills the whole page. Outreach is creator-paste-link-in-DM, recipient lands on a focused product page, they decide. That's right for pilot.

Post-pilot, when INFITRA has 10s-100s of published programs and the brand is a catalog of offers (not a single pilot product), the buyer page evolves:
- Top: a real INFITRA nav (browse other programs, search, sign in, etc.) replacing the current minimal logo-only header
- Bottom: "More from INFITRA" / "Related programs" carousel pulling adjacent programs (same creator(s), similar topics, similar dates)
- Footer: full marketing footer with browse links, creator directory, sign in, about, etc.
- The buyer page becomes ONE product detail page inside a fuller infitra storefront — not THE infitra.

For pilot: defer entirely. Buyer page = focused product page. Catalog conversion lives in a future bundle once there are multiple programs to browse and a meaningful "more from INFITRA" experience to surface.

---

### Bundle 5 — Cohort space (locker-room IA + routing migration)

**Scope:** Replace today's `/communities/challenge/[spaceId]` layout with the locker-room shape at the new URL `/challenges/[id]/space`. Delete the old route entirely (no redirect).

**RPC:** ADD `load_challenge_space(p_challenge_id)` — single round-trip.
**View:** ADD `vw_action_items_for_user`.

**Files to MOVE / CREATE:**
- DELETE `web/app/(app)/communities/challenge/[spaceId]/` entirely (page.tsx, TribeCoverEditor.tsx)
- DELETE `web/app/(app)/communities/` namespace
- CREATE `web/app/(app)/challenges/[id]/space/page.tsx` — server component, calls `load_challenge_space`
- CREATE `web/app/(app)/challenges/[id]/space/ChallengeSpaceCoverEditor.tsx` (renamed from TribeCoverEditor)
- CREATE `web/app/(app)/challenges/[id]/space/ChallengeSpaceHero.tsx` — title + creators + current week heading + `[program ▾]` link
- CREATE `web/app/(app)/challenges/[id]/space/ActionBar.tsx` — slim wrapper renders 0+ action cards stacked oldest first
- CREATE `web/app/(app)/challenges/[id]/space/NextMomentCard.tsx` — next session with pre-pulse aggregate chip
- CREATE `web/app/(app)/challenges/[id]/space/CohortFeed.tsx` — wraps PostFeed with locker-room empty states + "Today / Yesterday / Earlier this week" headings
- CREATE `web/app/(app)/challenges/[id]/space/PastMomentsList.tsx` — slim list, click → session detail
- CREATE `web/app/(app)/challenges/[id]/space/ProgramExpander.tsx` — expanding panel showing full Promise + Weekly Arc + Who Handles What
- MOVE `web/app/(app)/sessions/[id]/` → `web/app/(app)/challenges/[id]/sessions/[sid]/`
- CREATE `web/app/(app)/challenges/[id]/sessions/[sid]/SessionDetailReflections.tsx` — clustered reflections under one session

**Files to MODIFY:**
- `web/app/components/community/PostFeed.tsx` — extend to render kind-aware variants:
  - `intro` → "introduced themselves" chip
  - `reflection` → context chip linking to session detail
  - `question` → "Question for [avatars]" chip; coach answers (`is_coach_answer=true` comments) pin above thread
  - `talk` authored by creator → "Coach" badge after name
  - `intro_private` → only shown when caller is a creator (RLS already filters)
- `web/app/components/community/PostCard.tsx` — wire existing context props (already accepts contextType etc.)
- `web/app/(app)/dashboard/page.tsx` — update internal links from `/communities/challenge/[spaceId]` to `/challenges/[id]/space`
- `web/app/(app)/dashboard/collaborate/[challengeId]/page.tsx` — update post-publish redirect to `/challenges/[id]/space`
- `web/app/components/ParticipantNav.tsx` — verify no stale links
- `web/app/globals.css` — rename `tribe-border-breathe` → `cohort-border-breathe`
- Sweep all "tribe" copy → "cohort" or "space" in user-facing strings (metadata titles, button labels, section headings)

**Verification:**
- An enrolled participant lands on `/challenges/[id]/space` and sees: hero with current week → empty Action Bar (no actions waiting) → Next Moment card → cohort feed → empty Past Moments
- The `view program ▾` expander shows full Promise + Weekly Arc + Who Handles What
- Existing challenge spaces (with no Promise/Arc) render gracefully via fallback content from `vw_challenge_buyer_view` COALESCE
- Old `/communities/challenge/[spaceId]/...` returns 404 (not redirect — pre-pilot, deletion is clean)
- No "tribe" copy remains user-facing

---

### Bundle 6 — Pre-Session Pulse

**Scope:** Cron-triggered notification 4h before each session. Action Bar shows the slider card. Cohort signal on Next Moment with 5+ floor. Per-session sparkline on creator dashboard.

**Migrations / SQL:** §3.4 already shipped in Bundle 2. ADD job `fire_pre_session_pulses_job` per §3.11.

**RPCs:** ADD `submit_pre_pulse` (already in §3.9). ADD `list_pre_pulse_responses(session_id)` for creator-only view of individuals.

**Files to CREATE:**
- `web/app/(app)/challenges/[id]/space/PrePulseCard.tsx` — Action Bar card; slider + Submit/Skip; calls `submitPrePulse`
- `web/app/components/Slider.tsx` — reusable 0-10 slider (touch-friendly, big thumb, value chip below)
- `web/app/actions/pulse.ts` — server action `submitPrePulse(sessionId, value)`
- `web/app/(app)/dashboard/PrePulseSparkline.tsx` — small chart for active programs

**Files to MODIFY:**
- `web/app/(app)/challenges/[id]/space/NextMomentCard.tsx` — render aggregate chip when `can_show=true` from `vw_session_pre_pulse_aggregate`
- `web/app/(app)/challenges/[id]/space/page.tsx` — `load_challenge_space` already returns action items; ActionBar reads them
- `web/app/(app)/dashboard/ActiveProgramCard.tsx` — embed sparkline in hero density variant

**Verification:**
- Manually run pg_cron job with a test session 4h out → notifications appear; `pre_pulse_fired_at` set
- Action Bar card renders for the attendee; submit writes to `app_session_pre_pulse_response`; card dismisses
- Aggregate chip appears on Next Moment when 5+ responses; hidden when <5
- Creator sees per-session sparkline on dashboard
- Skip button dismisses without writing a response (the card simply doesn't reappear because `vw_action_items_for_user` excludes responded sessions; for skip without response, frontend remembers via session storage)

---

### Bundle 7 — Post-Session Reflection

**Scope:** When a session ends, fire reflection prompt to attendees. Combined energy slider + free text. Submission creates a `kind='reflection'` post in cohort feed.

**SQL:** EXTEND existing trigger or add SQL function called from `end_session` edge function to:
- INSERT `app_notification type='reflection_ready'` for each attendee with `joined_at`
- (No need for new cron — reflection_ready fires on session end, not on schedule)

Alternative: trigger on `app_session.status` change to 'ended':
```sql
CREATE OR REPLACE FUNCTION public.on_session_ended() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ended' AND (OLD.status IS NULL OR OLD.status != 'ended') THEN
    INSERT INTO public.app_notification(recipient_id, type, payload)
    SELECT a.user_id, 'reflection_ready',
      jsonb_build_object('session_id', NEW.id)
    FROM public.app_attendance a
    WHERE a.session_id = NEW.id AND a.joined_at IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_session_ended
  AFTER UPDATE OF status ON public.app_session
  FOR EACH ROW EXECUTE FUNCTION public.on_session_ended();
```

(Database trigger is more reliable than depending on the edge function to fire it.)

**RPCs:** `submit_session_reflection` already in §3.9 (Bundle 2 schema). Add the notification trigger in this bundle.

**Files to CREATE:**
- `web/app/(app)/challenges/[id]/space/ReflectionCard.tsx` — Action Bar card; "How was [Session]?" + free text (collapsed) + Slider 0-10 (prominent) + Submit/Skip
- `web/app/actions/reflection.ts` — server action `submitSessionReflection(sessionId, body, energyAfter)`

**Files to MODIFY:**
- `web/app/(app)/challenges/[id]/space/CohortFeed.tsx` — render `kind='reflection'` posts with session-context chip; energy_after value displayed inline
- `web/app/components/community/PostCard.tsx` — for `kind='reflection'`, context chip clicks to session detail; inline energy chip when metadata has energy_after
- `web/app/(app)/dashboard/page.tsx` — add "Reflections to read" widget reading `vw_recent_reflections_for_creator`
- `web/app/(app)/challenges/[id]/sessions/[sid]/SessionDetailReflections.tsx` — list reflections clustered for that session

**Coach reflections** are the same primitive — when a creator submits, the post renders with a "Coach" badge (inferred at render time from `author_id` matching a creator).

**Verification:**
- End a test session → trigger fires; all attendees with `joined_at` receive `reflection_ready` notification
- Action Bar reflection card renders for those attendees on next page load
- Submit writes a `kind='reflection'` post with `context_id=session_id`; card dismisses
- Reflection appears in cohort feed with context chip
- Energy_after chip renders when value is present
- Creator dashboard widget counts recent reflections via `vw_recent_reflections_for_creator`

---

### Bundle 8 — Intro prompt + Onboarding ending

**Scope:** New buyer's first landing in cohort space shows intro prompt. They share goal publicly to cohort or privately to creators. Onboarding form gets a "what now" ending screen.

**SQL:** Trigger on `app_challenge_member` insert to fire `intro_prompt_ready` notification:

```sql
CREATE OR REPLACE FUNCTION public.on_challenge_member_inserted() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_notification(recipient_id, type, payload)
  VALUES (NEW.user_id, 'intro_prompt_ready',
    jsonb_build_object('challenge_id', NEW.challenge_id))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_challenge_member_intro
  AFTER INSERT ON public.app_challenge_member
  FOR EACH ROW EXECUTE FUNCTION public.on_challenge_member_inserted();
```

**RPC:** `submit_intro_post` already in §3.9.

**Files to CREATE:**
- `web/app/(app)/challenges/[id]/space/IntroPromptCard.tsx` — Action Bar card; uses `intro_prompt` from challenge or default; textarea + share toggle (default ON: "share with the cohort"; toggle off: "keep this between me and [creator names]")
- `web/app/actions/intro.ts` — `submitIntroPost(challengeId, body, shareWithCohort)`
- `web/app/(app)/onboarding/OnboardingComplete.tsx` — "what now" 3-step explainer; CTA "Go to dashboard"

**Files to MODIFY:**
- `web/app/(app)/challenges/[id]/space/page.tsx` — `vw_action_items_for_user` already returns 'intro' kind when no intro post exists; ActionBar surfaces it
- `web/app/(app)/onboarding/OnboardingForm.tsx` — after successful submit, render `<OnboardingComplete />` instead of immediate redirect

**Verification:**
- New buyer lands in cohort space → IntroPromptCard at top of Action Bar
- Submit with share-on → `kind='intro'` post; appears in cohort feed
- Submit with share-off → `kind='intro_private'` post; not visible to cohort, visible to creators
- Skip dismisses (track skip in user metadata or as private empty post)
- Newly onboarded creator sees 3-step explainer before dashboard

---

### Bundle 9 — Directed Q&A

**Scope:** Ask composer mode in PostFeed. Multi-select avatar picker. Auto-promote first tagged comment to coach answer. Comment edit. Pending Questions widget on creator dashboard.

**SQL:** Auto-promote logic in `create_challenge_comment` already specified in Bundle 2. Verify it's actually in the migration.

**RPC:** ADD `load_creator_dashboard()` returning all dashboard widget data including pending questions count.

**Files to CREATE:**
- `web/app/components/community/AskComposer.tsx` — toggleable composer mode within PostFeed; "Talk / Ask" toggle in composer header
- `web/app/components/AvatarMultiSelect.tsx` — reusable multi-select avatar picker
- `web/app/(app)/dashboard/PendingQuestionsWidget.tsx` — server-rendered card from `vw_pending_questions_for_creator`
- `web/app/components/community/CoachAnswerPin.tsx` — renders auto-promoted coach answer pinned above regular comments

**Files to MODIFY:**
- `web/app/components/community/PostFeed.tsx` — composer becomes Talk/Ask toggleable; pass `directed_to` IDs to `createChallengePost(spaceId, body, kind='question', directed_to=[...])`; render "Question for [avatars]" chip on question posts
- `web/app/components/community/PostCard.tsx` — for `kind='question'`, render comments in two layers: pinned coach answers at top with "Coach answer · Lara" label, then regular thread; show edit affordance on own comments
- `web/app/components/community/CommentSection.tsx` — inline edit for own comments; calls `updateChallengeComment` server action; "Edited" tag with timestamp
- `web/app/actions/community.ts` — add `updateChallengeComment(commentId, body)`
- `web/app/(app)/dashboard/page.tsx` — embed `PendingQuestionsWidget`

**Tagging restrictions (enforced in UI + RPC):**
- Only collaborators on the challenge (owner + cohosts) can be tagged
- Self-tagging not allowed
- AvatarMultiSelect filtered to challenge collaborators

**Verification:**
- Participant opens composer → toggle to Ask → tag both creators → submit → post appears with "Question for [Lara] [Mia]" chip
- Both creators receive `question_for_you` notifications
- First creator comments → auto-promotes; pinned with "Coach answer" label
- Second creator comments later → also auto-promotes; both stacked
- Creator's second comment on same question → renders normally below pin
- Author edits own comment → `edited_at` updates; "Edited" chip appears
- Creator dashboard shows pending questions count; clicking jumps to post

---

### Bundle 10 — Email touchpoints

**Scope:** Generalize email infra. Three transactional emails: Kickoff (on purchase), Session reminder (1h before), Missed session (60min after).

**Migrations:** §3.7 already in Bundle 2. ADD pg_cron jobs §3.11 (jobs 2, 3, 4).

**Edge function:** RENAME `email_send_receipt/` → `email_send_outbox/`; parameterize template lookup by `kind`. 4 kinds: `receipt` (existing), `kickoff`, `session_reminder`, `session_missed`.

**Modify `stripe_webhook`:** After successful challenge payment, enqueue kickoff:
```typescript
await admin.from('app_email_outbox').insert({
  kind: 'kickoff',
  user_id: buyer_id,
  target_id: challenge_id,
  to_email: buyer.email,
  subject: `Welcome to ${challenge.title}`,
  html_body: renderKickoff(challenge_id, buyer_id),
  text_body: renderKickoffText(challenge_id, buyer_id)
}).onConflict('user_id, kind, target_id').ignore();
```

**SQL render functions** (used by both stripe_webhook for kickoff + cron jobs for reminder/missed):
- `render_session_reminder_html(p_session_id, p_user_id) → text`
- `render_session_reminder_text(p_session_id, p_user_id) → text`
- `render_session_missed_html(p_session_id, p_user_id) → text`
- `render_session_missed_text(p_session_id, p_user_id) → text`
- `render_kickoff_html(p_challenge_id, p_user_id) → text`
- `render_kickoff_text(p_challenge_id, p_user_id) → text`

These render minimal HTML reading challenge / session / Promise / Weekly Arc data and producing email body. Live in their own migration file alongside the cron jobs.

**Email content:**
- **Kickoff:** "You're in — Strong Together"; body has Promise + Weekly Arc table + Who Handles What + link to `/challenges/[id]/space` + creator bios
- **Session reminder:** "Tonight at 7pm — Session 3 with Lara"; body has session title, time, join link (`/challenges/[id]/sessions/[sid]/live`), space link
- **Missed session:** "We missed you tonight"; body says "Here's what came up in [Strong Together] cohort while you were away" + link to `/challenges/[id]/space`; NO replay link

**Verification:**
- Test purchase end-to-end → kickoff email arrives within 2 min after Stripe receipt
- Manually run `enqueue_session_reminders_job` with a test session 1h out → reminder enqueued; outbox dispatcher sends within 2 min
- Manually run `enqueue_missed_session_emails_job` with test session ended 1h ago + attendee with no joined_at → missed email enqueued + sent
- Re-running any cron does NOT produce dupes (UNIQUE constraint enforces idempotency)
- Existing receipt email path still works

---

### Bundle 11 — Verification + dogfooding

**Scope:** End-to-end manual walkthrough; entitlement audit; live two-device test; real dry-run pilot with trusted partner.

**Activities:**
1. **Two-account creator-pair walkthrough:** A invites B → B accepts → both edit Promise / Weekly Arc / Ownership / Intro prompt in workspace → lock contract → both accept → publish → confirm public buyer page renders Promise/Arc/Ownership cleanly
2. **Buyer purchase:** C buys → Stripe receipt arrives → kickoff email arrives within 2 min → C lands in cohort space → IntroPromptCard surfaces → C submits intro
3. **Pre-pulse:** Wait 4h before scheduled session OR run cron manually → C receives `pre_pulse_ready` → opens space → PrePulseCard in Action Bar → C submits → aggregate chip appears once 5+ submitted (test with seed accounts)
4. **Live session:** A goes live (host device) → C joins (mobile Safari) → check video/audio/screen share both directions; A ends session
5. **Post-reflection:** Trigger fires on session end → C receives `reflection_ready` → opens space → ReflectionCard → C submits energy + free text → post appears with context chip + energy chip
6. **Q&A:** C asks question tagging A and B → both receive `question_for_you` → A comments first → auto-promotes to Coach Answer → B comments → also auto-promotes (stacked)
7. **Missed session:** Test session runs without C joining → wait 1h after end → confirm missed email arrives
8. **Entitlement gate:** Account D (not enrolled) tries `/challenges/[id]/sessions/[sid]/live` → blocked, redirects to public challenge page

**Verification:**
- Friction list captured during walkthrough is empty after fix-up pass
- Founder can screen-share product to a real fitness creator friend for 10 minutes without saying "this part isn't finished yet"

---

### Bundle 12 — Demo + outreach readiness

**Scope:** Record demo video; build outreach list and DM drafts; define cadence; small earnings polish.

**Files to MODIFY:**
- `web/app/(app)/dashboard/earnings/page.tsx` — add "manual payouts during pilot" footer note; remove dead `/profile/${id}` links if any remain

**Activities:**
1. Record 90-second demo video — screen + voiceover; covers invite → co-design Promise/Arc → publish → buyer purchases → posts intro → goes live → submits reflection → asks question → coach answers
2. Build target list of 10 creator pairs (real Instagram handles, real contact paths, mix of cross-discipline)
3. Draft 3 DM variants (warm intro / cold to one half / cold to single)
4. Define cadence (5-10 DMs/day, follow-up at day 5, day 12)

**Verification:**
- Demo video shareable on LinkedIn or directly to a real creator
- Target list of 10 documented pairs exists
- Three DM drafts ready
- Day-1 outreach batch queued

---

## 5. Critical files map

### Files to CREATE

**Bundle 1:**
- `web/app/apply/page.tsx`
- `web/app/apply/PilotApplicationForm.tsx`
- `web/app/actions/pilot-application.ts`
- `web/app/pilot-terms/page.tsx`

**Bundle 3:**
- `web/app/(app)/dashboard/collaborate/[challengeId]/PromiseEditor.tsx`
- `web/app/(app)/dashboard/collaborate/[challengeId]/WeeklyArcEditor.tsx`
- `web/app/(app)/dashboard/collaborate/[challengeId]/OwnershipEditor.tsx`
- `web/app/(app)/dashboard/collaborate/[challengeId]/IntroPromptEditor.tsx`
- `web/app/(app)/dashboard/collaborate/[challengeId]/RecentChangesExpander.tsx`
- `web/app/components/EditedAttribution.tsx`

**Bundle 4:**
- `web/app/(app)/challenges/[id]/PublicChallengeHero.tsx`
- `web/app/(app)/challenges/[id]/PublicPromiseBlock.tsx`
- `web/app/(app)/challenges/[id]/PublicWeeklyArc.tsx`
- `web/app/(app)/challenges/[id]/PublicOwnershipTable.tsx`
- `web/app/(app)/challenges/[id]/PublicSessionTimeline.tsx`
- `web/app/(app)/challenges/[id]/StickyJoinCTA.tsx`

**Bundle 5:**
- `web/app/(app)/challenges/[id]/space/page.tsx`
- `web/app/(app)/challenges/[id]/space/ChallengeSpaceCoverEditor.tsx`
- `web/app/(app)/challenges/[id]/space/ChallengeSpaceHero.tsx`
- `web/app/(app)/challenges/[id]/space/ActionBar.tsx`
- `web/app/(app)/challenges/[id]/space/NextMomentCard.tsx`
- `web/app/(app)/challenges/[id]/space/CohortFeed.tsx`
- `web/app/(app)/challenges/[id]/space/PastMomentsList.tsx`
- `web/app/(app)/challenges/[id]/space/ProgramExpander.tsx`
- `web/app/(app)/challenges/[id]/sessions/[sid]/page.tsx` (moved from `/sessions/[id]/`)
- `web/app/(app)/challenges/[id]/sessions/[sid]/live/page.tsx` (moved from `/sessions/[id]/live/`)
- `web/app/(app)/challenges/[id]/sessions/[sid]/SessionDetailReflections.tsx`

**Bundle 6:**
- `web/app/(app)/challenges/[id]/space/PrePulseCard.tsx`
- `web/app/components/Slider.tsx`
- `web/app/actions/pulse.ts`
- `web/app/(app)/dashboard/PrePulseSparkline.tsx`

**Bundle 7:**
- `web/app/(app)/challenges/[id]/space/ReflectionCard.tsx`
- `web/app/actions/reflection.ts`

**Bundle 8:**
- `web/app/(app)/challenges/[id]/space/IntroPromptCard.tsx`
- `web/app/actions/intro.ts`
- `web/app/(app)/onboarding/OnboardingComplete.tsx`

**Bundle 9:**
- `web/app/components/community/AskComposer.tsx`
- `web/app/components/AvatarMultiSelect.tsx`
- `web/app/(app)/dashboard/PendingQuestionsWidget.tsx`
- `web/app/components/community/CoachAnswerPin.tsx`

### Files to MODIFY

- `web/app/(app)/dashboard/collaborate/[challengeId]/page.tsx` — Bundles 2, 3 (consolidated load via `load_workspace`), 5 (post-publish redirect to `/challenges/[id]/space`)
- `web/app/(app)/dashboard/collaborate/[challengeId]/WorkspaceEditor.tsx` — Bundle 3 (major restructure)
- `web/app/(app)/dashboard/collaborate/[challengeId]/WorkspaceChat.tsx` — Bundle 3 (drop field-edit messages from render)
- `web/app/(app)/challenges/[id]/page.tsx` — Bundle 4 (full rewrite)
- `web/app/components/community/PostFeed.tsx` — Bundles 5, 9
- `web/app/components/community/PostCard.tsx` — Bundles 5, 7, 9
- `web/app/components/community/CommentSection.tsx` — Bundle 9
- `web/app/actions/community.ts` — Bundles 2, 9
- `web/app/actions/challenge.ts` — Bundle 2 (replace logWorkspaceActivity for field edits with `log_workspace_field_edit`)
- `web/app/(app)/dashboard/page.tsx` — Bundles 5, 6, 7, 9 (links + widgets)
- `web/app/(app)/dashboard/ActiveProgramCard.tsx` — Bundle 6 (sparkline)
- `web/app/(app)/onboarding/OnboardingForm.tsx` — Bundle 8
- `web/app/components/ParticipantNav.tsx` — Bundle 5 (link sweep)
- `web/app/globals.css` — Bundle 5 (rename `tribe-border-breathe` → `cohort-border-breathe`)
- `supabase/functions/stripe_webhook/index.ts` — Bundle 10 (enqueue kickoff)

### Files to DELETE

**Bundle 5:**
- `web/app/(app)/communities/challenge/[spaceId]/page.tsx`
- `web/app/(app)/communities/challenge/[spaceId]/TribeCoverEditor.tsx`
- Entire `web/app/(app)/communities/` directory
- Old `web/app/(app)/sessions/[id]/page.tsx` and `live/page.tsx` (after moving content to new path)

### Files RENAMED

**Bundle 10:**
- `supabase/functions/email_send_receipt/` → `supabase/functions/email_send_outbox/`

### Files NOT touched

- `web/app/page.tsx` (landing) — locked
- `web/app/(app)/dashboard/sessions/[id]/page.tsx` and `live/page.tsx` (host live experience) — locked
- All checkout pages — locked
- All auth/login/signup/beta-access — locked

---

## 6. Rollout sequence

> ⚠️ Superseded by §9's revised order (Phase 2 H0–H5 → Bundle 10 → 11 → H6 → 12).
> The Week 1–5 block below is the original v3 sequence, kept for context.

### Recommended order

```
Week 1
├─ Bundle 1 — Outreach unblock              (1 day, parallel-able)        ✅ done
├─ Bundle 2 — Schema foundation             (2 days, foundational)         ✅ done
└─ Bundle 3 — Workspace restructure         (3 days)                       ✅ done (incl. polish v1-v12.AC)

Week 2
├─ Bundle 4 — Public buyer page rewrite +
│             post-publish success-page upgrade    (2-3 days)               ← NEXT
│     Reordered ahead of Bundle 3.5 (was: Bundle 3.5 then 4). Rationale:
│     Bundle 4 is read-only / server-rendered and doesn't share Bundle 3.5's
│     live-collab patterns, so the architectural ordering is preserved
│     (Bundle 3.5 still ships before Bundle 5). Bundle 4 delivers user-
│     perceived value sooner (success page after publish + outreach-ready
│     public URL) while workspace lag is acceptable in the interim.
└─ Bundle 3.5 — Workspace live-collab refactor (2.5-3 days frontend +
                 0.5-1 day backend = ~4 days total)
      Phases 1-4 frontend-only (zero backend risk).
      Phase 5 backend (lock RPC + async snapshot trigger) is SURGICAL,
      only after 1-4 validated in production.
      Phase 6 cleanup (remove v12.U-Z band-aids).

Week 3
├─ Bundle 5 — Cohort space + routing        (3 days, depends on B2 + B3.5)
│            ← inherits Bundle 3.5's Zustand/realtime/optimistic patterns natively
└─ Bundle 6 — Pre-pulse                     (2 days, depends on B5)

Week 4 — these three parallelize
├─ Bundle 7 — Post-reflection               (2 days, depends on B5)
├─ Bundle 8 — Intro + onboarding            (1 day, depends on B5)
│            ← also inherits Bundle 3.5's patterns for live session UI
└─ Bundle 9 — Directed Q&A                  (3 days, depends on B5)

Week 5
├─ Bundle 10 — Emails                       (2 days, parallel with B6-B9)
├─ Bundle 11 — Verification + dogfooding    (2-3 days, depends on B6-B10)
└─ Bundle 12 — Demo + outreach              (2 days, depends on B11)
```

Total: ~5 weeks of focused work (was 4; added Bundle 3.5).

**Why Bundle 3.5 slots here and not later:** the workspace pattern becomes the template that Bundle 5 (cohort space) and Bundle 8 (live session UI) inherit. Refactoring AFTER those bundles ship would mean retrofitting two more pages instead of one. Compounding cost increases the longer we wait.

### Outreach gating

- **Outreach can OPEN after Bundle 1** — earliest point where DMs route somewhere real
- **Outreach should TARGET HIGH-INTENT pairs only after Bundle 11** — product is shippable to friendlies after Bundle 5; show with pride only after Bundle 11
- **Outreach should SCALE after Bundle 12** — demo video exists to share

### Parallelization notes

- Bundle 2 is the only true bottleneck — until schema lands, almost nothing downstream can ship
- Bundles 3 and 5 (the two big restructures) can run in parallel after B2 if there are two streams of work
- Bundles 6-9 are peer-bundles after B5 — pure parallelization potential
- Bundle 10 (emails) is fully independent after B2 — third parallel stream

---

## 7. Anti-patterns to avoid

- **Don't add a Cue primitive** — explicitly cut. Creators authoring Talk that renders with a creator badge is enough.
- **Don't add a daily pulse** — explicitly cut. Pre/Post pulses on session days carry the data signal.
- **Don't ship the replay window now** — explicitly parked. Cost + schema work is non-trivial; revisit post-pilot.
- **Don't expand directed-tagging to participants** — Q&A is for tagging collaborators only.
- **Don't expose the full Weekly Arc as a structural rail in the cohort space** — it dies if it looks like a syllabus. Hero shows current week only; full arc lives behind `view program ▾`.
- **Don't notify on Talk posts, Reflection posts, or Comments** — locker room conversation, not announcements. Notification list in §2.4 is locked.
- **Don't notify on field edits in workspace** — Recent Changes expander is pull-based.
- **Don't add a Pulse-question editor in the workspace** — Pre/Post pulses use fixed slider semantics across all programs. Per-program custom pulses are post-pilot.
- **Don't write logic on the frontend that could be a SQL view** — current week, action items, fallback values, aggregations all backend.
- **Don't compose a page from many sequential queries** — consolidate into one `load_*` RPC.
- **Don't depend on cron timing for in-app surfaces** — `vw_action_items_for_user` is the source of truth; cron is best-effort push.
- **Don't add backward-compat shims for renamed routes / RPCs / functions** — pre-pilot, deletion is clean.
- **Don't open beyond the pilot cohort** — 5 creator pairs is the cap until learning lands.
- **Don't use `router.refresh()` as the propagation mechanism for live collaboration** (post-Bundle 3.5). It re-runs the page server component and re-fetches every query. Realtime hands us the changed row in the payload — read it directly into the store. `router.refresh()` is for action-triggered server data invalidation (e.g., after a form submit on a non-live page), not for partner-edit propagation.
- **Don't pile on more realtime propagation paths to mask reliability issues** (this is the lesson from v12.U-v12.Z). If realtime is unreliable, fix the architecture (state container + reconciliation + channel health) — don't add a fourth or fifth path that all eventually call the same expensive `router.refresh()`.
- **Don't pre-refactor read-mostly pages to client-state-as-cache** (`/dashboard`, `/challenges/[id]`, `/dashboard/sessions/[id]`, earnings, etc.). The pattern is only worth it where live collaboration is happening — workspace, cohort space, live session UI. Read-mostly pages stay server-rendered.
- **Don't put business rules (only) on the frontend.** Optimistic UI may PREDICT what the server will accept for instant feedback, but the canonical rule must still live in DB constraints / RLS / RPCs. Frontend prediction is a UX hint, not authority. When server rejects, frontend rolls back.

---

## 8. Quality bar for "pilot-ready"

Before broad outreach: founder can screen-share the product to a real fitness creator friend for 10 minutes end to end **without once saying "this part isn't finished yet" or "ignore that bit."**

Specifically:
- Workspace authoring (Promise + Weekly Arc + Ownership + Intro prompt) feels rich and creative, not like form-filling
- Public buyer page reads as a journey, not a SKU listing
- Cohort space feels like a locker room — alive, contextual, not a course portal
- Action Bar prompts (intro, pre-pulse, reflection) feel unobtrusive but there
- Cohort Feed has multiple post types with clear visual differentiation
- Q&A coach-answer auto-promotion works cleanly on first try
- Three emails arrive on cue and read as INFITRA-shaped
- Notifications are bounded to the locked taxonomy — no surprise pings

If that test passes with pride, scale outreach. Otherwise, another polish bundle.

---

## Appendix — Verification of existing notifications

The plan assumes some notification types are already wired in the existing RPCs but the audit didn't fully confirm. Bundle 2 acceptance criteria includes verifying these exist; if any are missing, add them in Bundle 2:

- `lock_challenge_contract` → `contract_locked` for each cohost
- `respond_to_contract` accept → `contract_accepted` for owner + other cohosts
- `respond_to_contract` reject → `contract_declined` for owner
- `publish_challenge` → `challenge_published` for each cohost

The existing `accept_collab_invite` is confirmed to insert `collab_accepted` for the inviter (line 82 of migration `20260513110859`).

---

## 9. v4 — Phase 2: Pre-verification pilot hardening (CURRENT FRONTIER)

> Supersedes §0's stale "Bundle 4 next." Bundles 1–9 are effectively shipped:
> 1–5 done; **8 (intro)** and **9 (Directed Q&A)** pulled forward during Bundle 5;
> **6 (Pre-Session Pulse) + 7 (Post-Session Reflection)** shipped as the engagement
> loop. Routes renamed in the legacy sweep: `/challenges/*` → `/experiences/*`,
> `load_challenge_space` → `load_experience_space`, cohort space components live
> in `web/app/(app)/experiences/[id]/space/`.
>
> Phase 2 is the polish + readiness work that must land **before** verification.
> Bundles 10 / 11 / 12 are KEPT but pushed behind Phase 2.

### Decisions locked (v4)

- **Creator payouts — MANUAL for the pilot.** Capture payout details (bank/IBAN)
  at onboarding/approval; platform holds funds via the existing Stripe Checkout;
  pay creators by hand at pilot end. **Stripe Connect is deferred post-pilot**
  (trigger: pilot success / payout volume). Saves ~1 week of Connect build + KYC
  risk; right-sized for <10 creators.
- **Dashboards — POLISH, not rebuild.** Refine existing creator/participant/
  earnings surfaces; full rebuild deferred post-pilot (do it with real usage data).
- **App — web + optional PWA-lite.** Native app parked post-pilot (App Store
  review + Apple IAP ~30%-on-payments risk for a payments product). PWA-lite
  (manifest + icons + service worker) keeps payments on web, gives app-feel cheap.
- **Live provider — Daily for now; LiveKit gated on a 1-day spike** (see H0).
  The `live_provider` adapter makes a later swap safe regardless.

### Phase 2 bundles (in rollout order)

**H0 · LiveKit spike (1 day, time-boxed, GATING) — do first.**
Verify the one real unknown: minting a LiveKit access token inside the Supabase
Deno edge runtime (`issue_join_token`) + a bare `@livekit/components-react`
`<VideoConference />` connecting with that token. Clean → schedule the full
Daily→LiveKit migration (~3.5–5d) into Phase 2 so the pilot runs on the kept
stack; edge-runtime friction → park LiveKit post-pilot. Cheap way to turn a gut
call into a data-backed one.

**H1 · Platform boundaries + notifications (S–M) — cheap, derisks all testing.**
- Mobile/desktop boundaries: workspace (`/dashboard/collaborate/[id]`) + heavy
  creator editing are **desktop-only** with a clean "best on desktop" screen;
  buyer page + Experience Space stay mobile-first (already responsive).
- Notification dropdown design (items, empty/loading/read states) — `NotificationBell`
  renders raw today.
- *(Optional)* PWA-lite: web manifest + icons + minimal service worker.

**H2 · Creator readiness + manual payouts (M) — pilot-critical money path.**
- Creator onboarding polish (signup/approval flow).
- Capture payout details (bank/IBAN) at onboarding; clearly state "manual payout
  at pilot end."
- Earnings page reflects **accrued** (not auto-paid) amounts. No Stripe Connect.

**H3 · Calendar export + contract display (S–M) — two lean, high-ROI wins.**
- `.ics` export: participant downloads their Experience calendar (their sessions);
  creator downloads their hosting calendar (all sessions). Direct attendance lever.
- Post-publish read-only contract view (the collaboration agreement; the pre-publish
  "locked workspace = contract" doesn't cover post-publish).

**H4 · Workspace preview — two-sided workspace (M–H) — the differentiator.**
A preview pane/tab in the workspace that renders the REAL buyer page (+ Experience
Space shell) from the live draft, so creators see the actual product INFITRA builds
from their input. Raises published-page quality + creator confidence.

**H5 · Dashboard + earnings polish (M) — daily-home quality.**
Polish (NOT rebuild) the creator dashboard (`ActiveProgramCard` et al.), participant
home (`/me`), and earnings page.

### Pushed back (kept)

- **Bundle 10 · Email touchpoints** — Kickoff / Session reminder / Missed session.
  Also unblocks the deferred pulse/reflection PUSH notifications (the cron from
  B6/B7 we deferred — the in-app action-item path already works).
- **Bundle 11 · Verification + dogfooding** — full E2E pass of the pilot-critical
  path (apply → buy → space → engagement loop → live → reflect → payout-accrual).
  Gates "show with pride" outreach.
- **H6 · Landing / marketing polish** — refresh with real product insight; slot
  just before outreach scaling.
- **Bundle 12 · Demo + outreach readiness.**

### Parked (post-pilot / triggered)

- **Daily→LiveKit migration** — slots into Phase 2 only if H0 is clean; else
  post-pilot. Trigger: cost/scale or a custom-branded in-room UI need.
- **Stripe Connect (automated payouts)** — trigger: pilot success / payout volume.
- **Native app** — trigger: post-pilot validation. PWA-lite covers app-feel meanwhile.
- **Continuation flow** — trigger: first pilot program nearing completion (backend
  lineage via `continuation_group_id` is ready; this is a completion-time feature,
  not pre-verification).

### Revised rollout order

```
Phase 2 (pre-verification):  H0 spike → H1 → H2 → H3 → H4 → H5
                             (+ Daily→LiveKit migration IF H0 clean)
Then (pushed back):          Bundle 10 (emails) → Bundle 11 (verification)
                             → H6 (landing polish) → Bundle 12 (demo/outreach)
Parked w/ triggers:          LiveKit migration · Stripe Connect · native app · continuation
```
