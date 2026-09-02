-- =============================================================================
-- Timezone legacy sweep (2026-08-17) — ends the pinned-Phnom-Penh era.
--
-- Doctrine (see memory + c31fd63): display times are the DEVICE's zone;
-- server-composed text carries no absolute times; and semantic day
-- boundaries must not be pinned to a foreign zone.
--
-- 1. complete_ended_experiences and experience_review_open decided "the
--    experience is over" at Cambodia's midnight ((now() at time zone
--    'Asia/Phnom_Penh')::date — a +7 boundary fires up to 7 hours early for
--    a European cohort). They now use current_date (UTC): neutral, and the
--    future-session guard remains the real protector against completing an
--    experience with sessions still to run. If experiences ever carry their
--    own timezone, these boundaries move there.
--
-- 2. DELIBERATE EXCEPTION kept: admin_email_enqueue_receipt dates the
--    purchase in Europe/Zurich. A receipt is a Swiss legal document dated
--    in the seller's jurisdiction; that is convention, not legacy.
--
-- 3. Data: script-written change_reason values from the remediation /
--    rehearsal era ("4.2.34 timezone-remediation script", "test flip",
--    rehearsal notes) now render in the participant-facing "this session
--    was moved" note. They were never participant messages — nulled. Only
--    reasons written through the reschedule flow remain.
--
-- 4. Data: the one live Tribe post written before the tz-neutral pass
--    carried a pinned "New time: ... (GMT+7)" line — stripped (the session
--    chip on the post shows the real time in each reader's device zone).
--
-- Frontend part of the same sweep (same commit): viewer_tz fallback moves
-- Asia/Phnom_Penh -> Europe/Zurich (pilot market; only shapes the very
-- first paint before the cookie exists), plus stale pinned-tz comments.
-- Applied to production 2026-08-17 via MCP; verified zero pinned zones
-- remain across functions, views, trigger functions, and cron commands.
-- =============================================================================

create or replace function public.complete_ended_experiences()
returns integer
language sql
security definer
set search_path to 'public'
as $function$
  with done as (
    update public.app_challenge c
       set status = 'completed', updated_at = now()
     where c.status = 'published'
       -- UTC day boundary on purpose (no pinned foreign zone); the
       -- future-session guard below is what actually protects a cohort
       -- with sessions still to run.
       and c.end_date < current_date
       and not exists (
         select 1 from public.app_challenge_session cs
         join public.app_session s on s.id = cs.session_id
         where cs.challenge_id = c.id
           and s.status in ('draft','published','scheduled')
           and s.start_time > now()
       )
    returning 1
  )
  select count(*)::int from done;
$function$;

create or replace function public.experience_review_open(p_challenge uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    ( exists (select 1 from app_challenge_session cs where cs.challenge_id = p_challenge)
      and not exists (
        select 1 from app_challenge_session cs
        join app_session s on s.id = cs.session_id
        where cs.challenge_id = p_challenge
          and s.status in ('draft','published','scheduled')
      ) )
    or
    -- UTC day boundary on purpose (no pinned foreign zone).
    ( coalesce((select c.end_date from app_challenge c where c.id = p_challenge), 'infinity'::date)
        < current_date );
$function$;

-- Legacy data: engineer-facing change_reason values predating the
-- reschedule feature (script corrections, rehearsal notes) must not render
-- in the participant-facing "moved" note.
update app_session
   set change_reason = null
 where change_reason is not null
   and (change_reason ilike '%timezone%'
        or change_reason ilike '%remediation%'
        or change_reason ilike '%rehearsal%'
        or change_reason ilike '%test flip%'
        or change_reason ilike '%date correction%');

-- Legacy data: strip the pinned "New time: ... (GMT+7)" line from the one
-- pre-tz-neutral reschedule post.
update app_challenge_post
   set body = regexp_replace(body, E'\n*New time:[^\n]*$', '')
 where metadata ->> 'reschedule' is not null
   and body like '%GMT+7%';
