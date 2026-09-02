-- =============================================================================
-- load_experience_creator_stats joins the lineage principle (2026-08-28).
--
-- Found on the founder's phone walkthrough: the space console's "Needs you"
-- sat forever on its loading line ("Checking your tribe…") in the published
-- continuation run's space. The RPC resolved the space by
-- source_challenge_id = p_challenge_id only — the pre-Phase-5 single-id
-- pattern. A continuation run shares its lineage's space and has NO own
-- anchor, so it returned authorized:false and the frontend never got numbers.
--
-- Same fix as load_experience_space / load_workspace before it: resolve the
-- container across continuation_group_id (prefer own anchor). Counts go
-- lineage-wide because the room IS the lineage — the feed's "Open for you"
-- tab already counts questions from every run, and the console must agree
-- with it (verified: pending_questions=1 matches the feed tab).
-- member_count dedupes users across runs.
-- =============================================================================
create or replace function public.load_experience_creator_stats(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_space_id uuid;
  v_group uuid;
begin
  if v_user is null then
    return jsonb_build_object('authorized', false);
  end if;

  select continuation_group_id into v_group
  from public.app_challenge
  where id = p_challenge_id;

  select id into v_space_id
  from public.app_challenge_space
  where source_challenge_id = p_challenge_id;

  if v_space_id is null and v_group is not null then
    select s.id into v_space_id
    from public.app_challenge_space s
    join public.app_challenge c on c.id = s.source_challenge_id
    where c.continuation_group_id = v_group
    limit 1;
  end if;

  if v_space_id is null or not public.is_challenge_space_admin(v_space_id, v_user) then
    return jsonb_build_object('authorized', false);
  end if;

  return (
    with lineage as (
      select id from public.app_challenge
      where id = p_challenge_id
         or (v_group is not null and continuation_group_id = v_group)
    )
    select jsonb_build_object(
      'authorized', true,
      'member_count', (
        select count(distinct m.user_id)::int
        from public.app_challenge_member m
        where m.challenge_id in (select id from lineage)
      ),
      'pending_questions', (
        select count(*)::int from public.vw_pending_questions_for_creator q
        where q.challenge_id in (select id from lineage)
      ),
      'recent_reflections', (
        select count(*)::int from public.vw_recent_reflections_for_creator r
        where r.challenge_id in (select id from lineage)
      )
    )
  );
end $function$;
