-- Reflect on your OWN attendance, not the session's paperwork (2026-08-11).
--
-- WHY: the leave→reflection loop asks a participant "how was it?" the moment
-- they LEAVE the room. submit_session_reflection required s.ended_at to be
-- set, so anyone leaving before the host pressed End Session was told they
-- were "not eligible to reflect" — on a session they had just attended.
-- Eligibility is now the honest fact: you were in the room (attendance with
-- joined_at set, which issue_join_token writes on entry). The host's End,
-- the sweep, none of that gates a participant's own experience.
--
-- Everything else unchanged: body-or-energy requirement, energy bounds,
-- space resolution, kind='reflection' post.

CREATE OR REPLACE FUNCTION public.submit_session_reflection(p_session_id uuid, p_body text, p_energy_after smallint DEFAULT NULL::smallint)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- You reflect on YOUR attendance: having been in the room (joined_at is
  -- written by issue_join_token on entry) is the whole eligibility. The
  -- session does not need to be ended — leaving early is still leaving.
  if not exists (
    select 1
    from public.app_attendance a
    where a.session_id = p_session_id
      and a.user_id = v_actor
      and a.joined_at is not null
  ) then
    raise exception 'not eligible to reflect on this session';
  end if;

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
$function$;
