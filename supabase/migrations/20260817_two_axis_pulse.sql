-- =============================================================================
-- The two-axis pulse (2026-08-17, founder-approved design)
--
-- One number was flat: exertion drains AROUSAL while lifting MOOD, so a
-- single "energy" scale biases hard sessions negative. The pulse becomes the
-- exercise-psychology circumplex pair, asked identically before and after:
--   mood    "How do you feel?"   (1 heavy .. 10 great)      up = good
--   energy  "How's your tank?"   (1 empty .. 10 charged)    a STATE, not a score
--
-- The four session signatures this unlocks (the analytics language):
--   mood+ energy+  energizing     |  mood+ energy-  spent but lifted
--   mood- energy+  restless       |  mood- energy-  drained -> check in
--
-- Mechanics:
--   - app_session_pre_pulse_response.value stays the ENERGY column (historic
--     rows keep meaning); new nullable mood column alongside.
--   - submit_pre_pulse gains a (session, mood, energy) overload; the old
--     (session, value) signature stays for the deploy window. Experts are
--     silently no-opped: the cohort metric is about participants.
--   - submit_session_reflection gains p_mood_after and stamps the author's
--     OWN before-values (their pre-pulse row) into the post metadata at post
--     time: {mood_after, energy_after, mood_before, energy_before}. The feed
--     renders pairs with zero joins. Publishing the pair on your own
--     reflection is YOUR disclosure; people who pulse but never reflect stay
--     private (aggregate-only), as designed. The OLD 3-arg signature is
--     DROPPED in the same migration: keeping it alongside the defaulted
--     4-arg version makes PostgREST named-arg calls ambiguous and would
--     break the deployed frontend instantly.
--   - Aggregate view gains avg_mood (avg_value remains the energy average).
--   - load_experience_space's sessions[].prePulse gains avgMood (surgical
--     patch applied in production, anchor-asserted, same technique as
--     changeReason).
--
-- Applied to production 2026-08-17 via MCP; verified with a rolled-back
-- impersonated dry-run: pulse row {mood 4, energy 7}, reflection metadata
-- {mood 4->9, energy 7->3} (the "spent but lifted" signature), expert taps
-- ignored, aggregate carries both averages.
-- =============================================================================

alter table public.app_session_pre_pulse_response
  add column if not exists mood smallint
  check (mood is null or (mood >= 0 and mood <= 10));

comment on column public.app_session_pre_pulse_response.value is
  'ENERGY axis (0-10). Kept as "value" for historic continuity; mood is the second axis.';

create or replace function public.submit_pre_pulse(p_session_id uuid, p_mood smallint, p_energy smallint)
returns void
language plpgsql
set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_session_id is null then raise exception 'session_id is required'; end if;
  if p_mood is null and p_energy is null then
    raise exception 'at least one of mood/energy is required';
  end if;
  if p_mood is not null and (p_mood < 0 or p_mood > 10) then
    raise exception 'mood must be between 0 and 10';
  end if;
  if p_energy is not null and (p_energy < 0 or p_energy > 10) then
    raise exception 'energy must be between 0 and 10';
  end if;

  -- The cohort metric is about participants; expert taps are silently
  -- ignored rather than rejected (no error toast on the expert path).
  if is_session_expert(p_session_id, v_actor) then
    return;
  end if;

  insert into public.app_session_pre_pulse_response (session_id, user_id, value, mood)
  values (p_session_id, v_actor, p_energy, p_mood)
  on conflict (session_id, user_id)
  do update set value = coalesce(excluded.value, app_session_pre_pulse_response.value),
                mood  = coalesce(excluded.mood,  app_session_pre_pulse_response.mood),
                created_at = now();
end;
$$;
revoke all on function public.submit_pre_pulse(uuid, smallint, smallint) from public, anon;
grant execute on function public.submit_pre_pulse(uuid, smallint, smallint) to authenticated, service_role;

drop view if exists public.vw_session_pre_pulse_aggregate;
create view public.vw_session_pre_pulse_aggregate as
 select s.id as session_id,
    (count(p.id))::integer as response_count,
        case
            when (count(p.value) > 0) then round(avg(p.value), 1)
            else null::numeric
        end as avg_value,
        case
            when (count(p.mood) > 0) then round(avg(p.mood), 1)
            else null::numeric
        end as avg_mood,
    (( select count(*) from app_attendance a where a.session_id = s.id))::integer as eligible_count,
    (count(p.id) >= 5) as can_show
   from app_session s
     left join app_session_pre_pulse_response p on p.session_id = s.id
  group by s.id;

create or replace function public.submit_session_reflection(
    p_session_id uuid,
    p_body text,
    p_energy_after smallint default null,
    p_mood_after smallint default null
)
returns uuid
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
  v_before record;
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_session_id is null then raise exception 'session_id is required'; end if;
  if v_body is null and p_energy_after is null and p_mood_after is null then
    raise exception 'reflection requires body or a pulse value';
  end if;
  if p_energy_after is not null and (p_energy_after < 0 or p_energy_after > 10) then
    raise exception 'energy_after must be between 0 and 10';
  end if;
  if p_mood_after is not null and (p_mood_after < 0 or p_mood_after > 10) then
    raise exception 'mood_after must be between 0 and 10';
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
    v_metadata := v_metadata || jsonb_build_object('energy_after', p_energy_after);
  end if;
  if p_mood_after is not null then
    v_metadata := v_metadata || jsonb_build_object('mood_after', p_mood_after);
  end if;

  -- Stamp the author's OWN before-values so the feed renders the pair with
  -- zero joins. Posting the pair on your own reflection is your disclosure.
  select r.value as energy, r.mood into v_before
  from public.app_session_pre_pulse_response r
  where r.session_id = p_session_id and r.user_id = v_actor;
  if found then
    if v_before.energy is not null and p_energy_after is not null then
      v_metadata := v_metadata || jsonb_build_object('energy_before', v_before.energy);
    end if;
    if v_before.mood is not null and p_mood_after is not null then
      v_metadata := v_metadata || jsonb_build_object('mood_before', v_before.mood);
    end if;
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
revoke all on function public.submit_session_reflection(uuid, text, smallint, smallint) from public, anon;
grant execute on function public.submit_session_reflection(uuid, text, smallint, smallint) to authenticated, service_role;

-- Ambiguity guard: see header. Old 3-arg calls resolve to the 4-arg version
-- via the p_mood_after default once this is gone.
drop function if exists public.submit_session_reflection(uuid, text, smallint);

-- load_experience_space: sessions[].prePulse gains avgMood. Surgical patch
-- (production RPC is ahead of the repo mirror). Idempotent.
do $do$
declare
    v_def text;
    v_anchor text := '''avg'', COALESCE(ROUND(AVG(r.value)::numeric, 1), 0),';
    v_new text := '''avg'', COALESCE(ROUND(AVG(r.value)::numeric, 1), 0), ''avgMood'', COALESCE(ROUND(AVG(r.mood)::numeric, 1), 0),';
begin
    select pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'load_experience_space';

    if v_def is null then raise exception 'load_experience_space not found'; end if;
    if v_def like '%avgMood%' then raise notice 'already patched'; return; end if;
    if (length(v_def) - length(replace(v_def, v_anchor, ''))) / length(v_anchor) <> 1 then
        raise exception 'anchor count != 1, aborting';
    end if;

    v_def := replace(v_def, v_anchor, v_new);
    execute v_def;
    raise notice 'patched';
end $do$;
