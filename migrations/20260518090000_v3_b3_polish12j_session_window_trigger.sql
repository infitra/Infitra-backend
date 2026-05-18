-- Bundle 3 polish v12.J — canonical DB guardrail (SR-I1)
--
-- A session's start_time must fall within every linked challenge's
-- [start_date, end_date + 1 day) window. Frontend (datetime min/max)
-- and server action (assertSessionWithinChallengeWindow) already
-- enforce this, but PostgREST callers can bypass both — this trigger
-- is the non-bypassable backstop per SR-I1.
--
-- Standalone sessions (no app_challenge_session link) are unconstrained:
-- no link → no window to enforce against.
--
-- The trigger fires only on the session row. Linking an out-of-range
-- session via a later app_challenge_session insert is not covered here
-- (intentional — the user-facing flow always validates start_time
-- against the chosen challenge before either row is written).

create or replace function public.app_session_assert_within_challenge_window()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_offender record;
begin
  -- Find any linked challenge whose window does NOT contain NEW.start_time.
  -- end_date is inclusive (a session may start any time on the end date),
  -- so the upper bound is (end_date + 1 day) exclusive.
  select c.id, c.start_date, c.end_date
    into v_offender
  from public.app_challenge_session cs
  join public.app_challenge c on c.id = cs.challenge_id
  where cs.session_id = new.id
    and (
      new.start_time <  c.start_date::timestamptz
      or new.start_time >= (c.end_date + interval '1 day')::timestamptz
    )
  limit 1;

  if found then
    raise exception
      'Session start_time % falls outside challenge % window [%, %]',
      new.start_time, v_offender.id, v_offender.start_date, v_offender.end_date
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists app_session_assert_within_challenge_window on public.app_session;

create trigger app_session_assert_within_challenge_window
  before insert or update of start_time
  on public.app_session
  for each row
  execute function public.app_session_assert_within_challenge_window();
