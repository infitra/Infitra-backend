-- Bundle 2 migration 6/6: views that drive the engagement UI surfaces.
--
-- All five views are SECURITY INVOKER so they respect the caller's RLS
-- on the underlying tables. (Postgres 15+ feature.) The existing
-- SECURITY DEFINER views in the project — vw_my_lifetime_summary,
-- app_profile_public, etc. — are flagged by the database linter; new
-- ones should not add to that pile.
--
-- Views shipped:
--   - vw_challenge_program_state: current_week_number / total_weeks /
--     current_week_theme. Anchor: smallest week whose last session
--     hasn't ended yet; calendar-clock fallback when no sessions.
--   - vw_session_pre_pulse_aggregate: per-session (count, avg, can_show)
--     with the 5+ privacy floor as a boolean.
--   - vw_pending_questions_for_creator: drives the dashboard widget for
--     the caller (any creator). Filtered to questions where caller is
--     in directed_to AND hasn't yet posted a coach answer.
--   - vw_recent_reflections_for_creator: recent (48h) reflections on
--     programs the caller owns or cohosts.
--   - vw_challenge_buyer_view: COALESCE'd resolved fields for the
--     public buyer page (Promise → description fallback, etc.).

-- ── vw_challenge_program_state ──

create or replace view public.vw_challenge_program_state
with (security_invoker = true) as
with challenge_weeks as (
  select
    c.id as challenge_id,
    c.weekly_arc,
    c.start_date,
    c.end_date,
    greatest(1, ((c.end_date - c.start_date) / 7 + 1)::int) as total_weeks
  from public.app_challenge c
),
session_week_buckets as (
  select
    csess.challenge_id,
    greatest(1, ((s.start_time::date - cw.start_date) / 7 + 1)::int) as week_num,
    coalesce(s.ended_at, s.start_time + make_interval(mins => s.duration_minutes)) as effective_end
  from challenge_weeks cw
  join public.app_challenge_session csess on csess.challenge_id = cw.challenge_id
  join public.app_session s on s.id = csess.session_id
),
week_last_session_end as (
  select challenge_id, week_num, max(effective_end) as last_end
  from session_week_buckets
  group by challenge_id, week_num
),
ongoing_week as (
  -- Smallest week_num whose last session hasn't ended yet
  select challenge_id, min(week_num) as week_num_from_sessions
  from week_last_session_end
  where last_end > now()
  group by challenge_id
),
resolved as (
  select
    cw.challenge_id,
    cw.total_weeks,
    cw.weekly_arc,
    least(
      cw.total_weeks,
      greatest(
        1,
        coalesce(
          ow.week_num_from_sessions,
          ((current_date - cw.start_date) / 7 + 1)::int
        )
      )
    )::int as current_week_number
  from challenge_weeks cw
  left join ongoing_week ow on ow.challenge_id = cw.challenge_id
)
select
  challenge_id,
  total_weeks,
  current_week_number,
  current_week_number - 1 as weeks_completed,
  total_weeks - current_week_number as weeks_remaining,
  coalesce(weekly_arc->(current_week_number - 1)->>'theme', '') as current_week_theme
from resolved;

-- ── vw_session_pre_pulse_aggregate ──

create or replace view public.vw_session_pre_pulse_aggregate
with (security_invoker = true) as
select
  s.id as session_id,
  count(p.id)::int as response_count,
  case when count(p.id) > 0
    then round(avg(p.value)::numeric, 1)
    else null
  end as avg_value,
  (select count(*) from public.app_attendance a where a.session_id = s.id)::int as eligible_count,
  (count(p.id) >= 5) as can_show
from public.app_session s
left join public.app_session_pre_pulse_response p on p.session_id = s.id
group by s.id;

-- ── vw_pending_questions_for_creator ──

create or replace view public.vw_pending_questions_for_creator
with (security_invoker = true) as
select
  p.id as post_id,
  p.body,
  p.created_at,
  p.author_id,
  p.directed_to,
  cs.source_challenge_id as challenge_id,
  prof.display_name as asker_name,
  (extract(epoch from (now() - p.created_at)) / 3600)::int as hours_since_asked
from public.app_challenge_post p
join public.app_challenge_space cs on cs.id = p.space_id
join public.app_profile prof on prof.id = p.author_id
where p.kind = 'question'
  and (select auth.uid()) = any(p.directed_to)
  and not exists (
    select 1 from public.app_challenge_comment c
    where c.post_id = p.id
      and c.author_id = (select auth.uid())
      and c.is_coach_answer = true
  );

-- ── vw_recent_reflections_for_creator ──

create or replace view public.vw_recent_reflections_for_creator
with (security_invoker = true) as
select
  p.id as post_id,
  p.body,
  p.created_at,
  p.author_id,
  p.context_id as session_id,
  cs.source_challenge_id as challenge_id,
  s.title as session_title,
  prof.display_name as author_name,
  (p.metadata->>'energy_after')::int as energy_after
from public.app_challenge_post p
join public.app_challenge_space cs on cs.id = p.space_id
join public.app_challenge c on c.id = cs.source_challenge_id
left join public.app_session s on s.id = p.context_id and p.context_type = 'session'
join public.app_profile prof on prof.id = p.author_id
where p.kind = 'reflection'
  and p.created_at > now() - interval '48 hours'
  and (
    c.owner_id = (select auth.uid())
    or exists (
      select 1 from public.app_challenge_cohost ch
      where ch.challenge_id = c.id and ch.cohost_id = (select auth.uid())
    )
  );

-- ── vw_challenge_buyer_view ──
--
-- Resolved fields ready to render on the public buyer page. Promise
-- falls back to description for legacy challenges that pre-date the
-- Promise field; weekly_arc and topic_ownership default to empty arrays.

create or replace view public.vw_challenge_buyer_view
with (security_invoker = true) as
select
  c.id as challenge_id,
  c.title,
  c.image_url,
  c.start_date,
  c.end_date,
  c.price_cents,
  c.currency,
  c.status,
  c.owner_id,
  coalesce(nullif(c.promise_text, ''), c.description) as promise_text,
  coalesce(c.weekly_arc, '[]'::jsonb) as weekly_arc,
  coalesce(c.topic_ownership, '[]'::jsonb) as topic_ownership,
  c.intro_prompt,
  (select count(*)
   from public.app_challenge_session csess
   where csess.challenge_id = c.id)::int as session_count,
  public.challenge_spots_left(c.id) as spots_left
from public.app_challenge c
where c.status in ('published', 'completed');
