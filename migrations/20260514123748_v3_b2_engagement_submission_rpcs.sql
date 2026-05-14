-- Bundle 2 migration 4/6: engagement submission RPCs.
--
-- Three small RPCs the participant client invokes for their engagement
-- actions:
--   - submit_pre_pulse: 0–10 readiness score for an upcoming session.
--     Idempotent: re-submitting overwrites the prior value.
--   - submit_session_reflection: optional free text + optional 0–10 energy
--     value, fired the moment the participant chooses to reflect after a
--     session ends. Creates a kind='reflection' post.
--   - submit_intro_post: the goal-share prompt that fires on first landing
--     in the cohort space. Single intro per (user, challenge); share toggle
--     selects intro vs intro_private kind.
--
-- All RLS is on the underlying tables (pre_pulse_response, challenge_post),
-- so SECURITY INVOKER is safe — the policies already gate access.

-- ── submit_pre_pulse ──

create or replace function public.submit_pre_pulse(
  p_session_id uuid,
  p_value smallint
) returns void
  language plpgsql
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_session_id is null then raise exception 'session_id is required'; end if;
  if p_value is null or p_value < 0 or p_value > 10 then
    raise exception 'value must be between 0 and 10';
  end if;

  insert into public.app_session_pre_pulse_response (session_id, user_id, value)
  values (p_session_id, v_actor, p_value)
  on conflict (session_id, user_id)
  do update set value = excluded.value, created_at = now();
end;
$$;

-- ── submit_session_reflection ──

create or replace function public.submit_session_reflection(
  p_session_id uuid,
  p_body text,
  p_energy_after smallint default null
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
  v_space_id uuid;
  v_post_id uuid;
  v_metadata jsonb := '{}'::jsonb;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_session_id is null then raise exception 'session_id is required'; end if;
  if v_body is null and p_energy_after is null then
    raise exception 'reflection requires body or energy value';
  end if;
  if p_energy_after is not null and (p_energy_after < 0 or p_energy_after > 10) then
    raise exception 'energy_after must be between 0 and 10';
  end if;

  -- Validate: caller attended the session AND session has ended
  if not exists (
    select 1
    from public.app_attendance a
    join public.app_session s on s.id = a.session_id
    where a.session_id = p_session_id
      and a.user_id = v_actor
      and s.ended_at is not null
  ) then
    raise exception 'not eligible to reflect on this session';
  end if;

  -- Find the challenge space hosting this session
  select cs.id into v_space_id
  from public.app_challenge_session csess
  join public.app_challenge_space cs on cs.source_challenge_id = csess.challenge_id
  where csess.session_id = p_session_id
  limit 1;

  if v_space_id is null then
    raise exception 'no challenge space for this session';
  end if;

  if p_energy_after is not null then
    v_metadata := jsonb_build_object('energy_after', p_energy_after);
  end if;

  insert into public.app_challenge_post (
    space_id, author_id, body, kind, context_type, context_id, metadata
  ) values (
    v_space_id,
    v_actor,
    coalesce(v_body, ''),
    'reflection',
    'session',
    p_session_id,
    v_metadata
  ) returning id into v_post_id;

  return v_post_id;
end;
$$;

-- ── submit_intro_post ──

create or replace function public.submit_intro_post(
  p_challenge_id uuid,
  p_body text,
  p_share_with_cohort boolean default true
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
  v_space_id uuid;
  v_post_id uuid;
  v_kind text;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_challenge_id is null then raise exception 'challenge_id is required'; end if;
  if v_body is null then raise exception 'body is required'; end if;
  if length(v_body) > 2000 then raise exception 'intro is too long'; end if;

  -- Caller must be enrolled
  if not exists (
    select 1 from public.app_challenge_member
    where challenge_id = p_challenge_id and user_id = v_actor
  ) then
    raise exception 'not enrolled in this challenge';
  end if;

  -- Find the space
  select id into v_space_id
  from public.app_challenge_space
  where source_challenge_id = p_challenge_id
  limit 1;

  if v_space_id is null then
    raise exception 'no challenge space for this challenge';
  end if;

  -- Single intro per (user, challenge)
  if exists (
    select 1 from public.app_challenge_post p
    where p.space_id = v_space_id
      and p.author_id = v_actor
      and p.kind in ('intro','intro_private')
  ) then
    raise exception 'intro already posted';
  end if;

  v_kind := case when p_share_with_cohort then 'intro' else 'intro_private' end;

  insert into public.app_challenge_post (space_id, author_id, body, kind)
  values (v_space_id, v_actor, v_body, v_kind)
  returning id into v_post_id;

  return v_post_id;
end;
$$;
