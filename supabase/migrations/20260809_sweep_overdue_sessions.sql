-- Sweep overdue sessions (2026-08-09) — the exit that doesn't need a human.
--
-- WHY: "live" in every surface derives from (live_room_id, status), and the
-- ONLY path that ever set status='ended' was the host pressing End Session.
-- Both failure modes happened in production within one week:
--   · room precreated at T-15, host never joined → live forever
--     (Recovery, Mobility & Reset Flow, 7 Aug)
--   · host started the room and left without pressing End → live forever
--     (Strength Under Pressure, 3 Aug)
-- Meanwhile the Daily room itself self-expires at start + duration + 1h
-- (sessionRoomExp, eject_at_room_exp), so a stale "Live now" card is a
-- promise wired to a guaranteed-dead door.
--
-- THE FIX: a cron sweep that ends any published session past
-- start + duration + 1h — deliberately the SAME clock as the Daily room
-- expiry, so UI-live can never outlive the actual room. Swept regardless of
-- whether a room exists: a published session whose moment has passed is
-- ended as a fact, room or not.
--
-- Semantics of a swept row:
--   · ended_at = the SCHEDULED end (start + duration), not now(): the sweep
--     runs at an arbitrary later minute and timestamps the session, not
--     itself. Best-estimate for a session that ran unended; harmless for
--     one that never started.
--   · started_at stays as-is — null for a never-started session is the
--     honest record.
--   · NO session_ended feed event: end_session's celebratory summary is for
--     a host closing a real room. An auto-closed no-show should be silent.
--
-- Surface: DB trigger family (cron). end_session (Edge) remains the host's
-- deliberate path and is unchanged; the sweep is the backstop.

create or replace function public.app_sweep_overdue_sessions()
returns integer
language sql
security definer
set search_path = public
as $$
  with swept as (
    update app_session s
       set status = 'ended',
           ended_at = s.start_time
                      + make_interval(mins => greatest(coalesce(s.duration_minutes, 60), 15))
     where s.status = 'published'
       and s.start_time is not null
       and now() > s.start_time
                   + make_interval(mins => greatest(coalesce(s.duration_minutes, 60), 15))
                   + interval '60 minutes'
    returning s.id
  )
  select count(*)::int from swept;
$$;

revoke all on function public.app_sweep_overdue_sessions() from public, anon, authenticated;
grant execute on function public.app_sweep_overdue_sessions() to service_role;

comment on function public.app_sweep_overdue_sessions() is
  'Ends published sessions past start + duration + 1h (the Daily room expiry clock). Backstop for hosts who never press End Session; keeps every live-state surface truthful. Cron/service only.';

-- Every 5 minutes. The room''s own 1h overrun buffer means the sweep''s
-- worst-case 5-minute lag never ejects anyone from a room that still works.
select cron.schedule(
  'sweep-overdue-sessions',
  '*/5 * * * *',
  $job$ select public.app_sweep_overdue_sessions(); $job$
);

-- First sweep runs NOW, inside the migration: this is the cleanup of the
-- two stuck sessions above, and proof the function works before cron owns it.
select public.app_sweep_overdue_sessions();
