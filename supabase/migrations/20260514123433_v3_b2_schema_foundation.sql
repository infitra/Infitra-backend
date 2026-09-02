-- Bundle 2 migration 1/6: schema foundation for the engagement architecture.
--
-- All structural additions in one file so the schema is consistent before
-- the RPCs that use the new columns ship in subsequent migrations.
--
-- Adds:
--   - app_challenge: Promise text, Weekly Arc, Topic Ownership, Intro
--     prompt, edit-attribution columns
--   - app_challenge_post: kind/context/directed_to/metadata + intro_private
--     SELECT branching in RLS
--   - app_challenge_comment: is_coach_answer + edited_at/by
--   - app_session: pre_pulse_fired_at marker
--   - app_session_pre_pulse_response: NEW table for pre-pulse responses
--   - app_workspace_activity: NEW audit table for field-edit log (the
--     workspace chat split)
--   - app_email_outbox: user_id + target_id + idempotency UNIQUE (and
--     drop NOT NULL on tx_id so non-transaction kinds can enqueue)
--   - app_notification: idempotency UNIQUE indexes for new system kinds
--
-- No data backfills needed — pre-pilot, near-zero data.

-- ── 1. app_challenge: Promise + Weekly Arc + Ownership + Intro prompt ──

alter table public.app_challenge
  add column if not exists promise_text text,
  add column if not exists weekly_arc jsonb not null default '[]'::jsonb,
  add column if not exists topic_ownership jsonb not null default '[]'::jsonb,
  add column if not exists intro_prompt text,
  add column if not exists promise_edited_at timestamptz,
  add column if not exists promise_edited_by uuid references public.app_profile(id);

-- ── 2. app_challenge_post: kind discriminator + context + directed_to ──

alter table public.app_challenge_post
  add column if not exists kind text not null default 'talk',
  add column if not exists context_type text,
  add column if not exists context_id uuid,
  add column if not exists directed_to uuid[],
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Constrain kind to the locked taxonomy from PILOT_PLAN.md §2.2
alter table public.app_challenge_post
  drop constraint if exists app_challenge_post_kind_valid;
alter table public.app_challenge_post
  add constraint app_challenge_post_kind_valid
  check (kind in ('talk','intro','intro_private','reflection','question'));

create index if not exists idx_challenge_post_kind
  on public.app_challenge_post(space_id, kind, created_at desc);

create index if not exists idx_challenge_post_context
  on public.app_challenge_post(context_type, context_id)
  where context_type is not null;

-- Replace the SELECT policy so intro_private posts are visible only to
-- (a) the author and (b) creators on the source challenge. Public kinds
-- (talk, intro, reflection, question) keep the existing space-access path.
drop policy if exists challenge_post_select_access on public.app_challenge_post;

create policy challenge_post_select_access on public.app_challenge_post
  for select using (
    (kind <> 'intro_private'
     and public.can_access_challenge_space(space_id, (select auth.uid())))
    or
    (kind = 'intro_private' and (
      author_id = (select auth.uid())
      or exists (
        select 1
        from public.app_challenge_space cs
        join public.app_challenge c on c.id = cs.source_challenge_id
        where cs.id = app_challenge_post.space_id
          and (
            c.owner_id = (select auth.uid())
            or exists (
              select 1 from public.app_challenge_cohost ch
              where ch.challenge_id = c.id
                and ch.cohost_id = (select auth.uid())
            )
          )
      )
    ))
  );

-- ── 3. app_challenge_comment: coach answer flag + edit attribution ──

alter table public.app_challenge_comment
  add column if not exists is_coach_answer boolean not null default false,
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid references public.app_profile(id);

create index if not exists idx_challenge_comment_coach_answer
  on public.app_challenge_comment(post_id, is_coach_answer)
  where is_coach_answer = true;

-- ── 4. app_session: pre_pulse_fired_at marker (cron uses this) ──

alter table public.app_session
  add column if not exists pre_pulse_fired_at timestamptz;

-- ── 5. app_session_pre_pulse_response: NEW table for pre-pulse data ──

create table if not exists public.app_session_pre_pulse_response (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.app_session(id) on delete cascade,
  user_id uuid not null references public.app_profile(id) on delete cascade,
  value smallint not null check (value between 0 and 10),
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create index if not exists idx_pre_pulse_session
  on public.app_session_pre_pulse_response(session_id);

alter table public.app_session_pre_pulse_response enable row level security;

-- INSERT: only your own responses, only for sessions you've attended
-- (entitlement = attendance row, which Stripe webhook creates on purchase).
create policy pre_pulse_insert_self_for_attended_sessions
  on public.app_session_pre_pulse_response
  for insert
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.app_attendance a
      where a.session_id = app_session_pre_pulse_response.session_id
        and a.user_id = (select auth.uid())
    )
  );

-- UPDATE: own responses (allows changing your value before submit closes)
create policy pre_pulse_update_self
  on public.app_session_pre_pulse_response
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- SELECT: own response always; creators on the source challenge see
-- everyone's individual responses (for cohort coaching signal).
create policy pre_pulse_select_self_or_creator
  on public.app_session_pre_pulse_response
  for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.app_session s
      left join public.app_challenge_session cs on cs.session_id = s.id
      left join public.app_challenge c on c.id = cs.challenge_id
      where s.id = app_session_pre_pulse_response.session_id
        and (
          s.host_id = (select auth.uid())
          or c.owner_id = (select auth.uid())
          or exists (
            select 1 from public.app_challenge_cohost ch
            where ch.challenge_id = c.id
              and ch.cohost_id = (select auth.uid())
          )
        )
    )
  );

-- ── 6. app_workspace_activity: NEW audit table for field-edit log ──
--
-- The workspace chat (post_workspace_log → app_dm_message kind='system')
-- previously absorbed every field edit. With Promise + Weekly Arc + Topic
-- Ownership + Intro prompt landing on top of title/dates/price, that
-- volume would bury the human conversation. This table absorbs field
-- edits via a separate RPC; the chat keeps only collaboration milestones.

create table if not exists public.app_workspace_activity (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.app_challenge(id) on delete cascade,
  actor_id uuid not null references public.app_profile(id),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_activity_challenge_created
  on public.app_workspace_activity(challenge_id, created_at desc);

alter table public.app_workspace_activity enable row level security;

-- SELECT: any owner or cohost on the challenge sees the full log.
create policy workspace_activity_select_party
  on public.app_workspace_activity
  for select
  using (
    exists (
      select 1 from public.app_challenge c
      where c.id = app_workspace_activity.challenge_id
        and (
          c.owner_id = (select auth.uid())
          or exists (
            select 1 from public.app_challenge_cohost ch
            where ch.challenge_id = c.id
              and ch.cohost_id = (select auth.uid())
          )
        )
    )
  );
-- INSERT: service-role only (called from log_workspace_field_edit RPC).

-- ── 7. app_email_outbox: support non-transaction email kinds ──
--
-- The current schema requires tx_id NOT NULL (designed for receipts).
-- New kinds — kickoff, session_reminder, session_missed — have no tx_id.
-- Drop NOT NULL on tx_id; add user_id + target_id with a partial UNIQUE
-- so cron-driven enqueues are idempotent per (user, kind, target).

alter table public.app_email_outbox
  alter column tx_id drop not null;

alter table public.app_email_outbox
  add column if not exists user_id uuid references public.app_profile(id),
  add column if not exists target_id uuid;

create unique index if not exists uniq_email_outbox_user_kind_target
  on public.app_email_outbox(user_id, kind, target_id)
  where user_id is not null and target_id is not null;

-- ── 8. app_notification: idempotency UNIQUE indexes for new system kinds ──
--
-- Locked taxonomy in PILOT_PLAN.md §2.4. The cron jobs and triggers that
-- emit these notifications use ON CONFLICT DO NOTHING against these
-- indexes so re-runs are safe.

-- pre_pulse_ready, reflection_ready: keyed on session_id
create unique index if not exists uniq_notification_recipient_kind_session
  on public.app_notification(recipient_id, type, ((payload->>'session_id')))
  where type in ('pre_pulse_ready','reflection_ready');

-- intro_prompt_ready, contract_locked, contract_accepted, contract_declined,
-- challenge_published: keyed on challenge_id
create unique index if not exists uniq_notification_recipient_kind_challenge
  on public.app_notification(recipient_id, type, ((payload->>'challenge_id')))
  where type in (
    'intro_prompt_ready',
    'contract_locked',
    'contract_accepted',
    'contract_declined',
    'challenge_published'
  );

-- question_for_you, coach_answered_your_question: keyed on post_id
create unique index if not exists uniq_notification_recipient_kind_post
  on public.app_notification(recipient_id, type, ((payload->>'post_id')))
  where type in ('question_for_you','coach_answered_your_question');
