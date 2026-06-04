-- Creator console stats for the Experience Space YouPanel.
--
-- Returns the calling creator's at-a-glance numbers for ONE experience:
--   - member_count       : cohort size
--   - pending_questions  : directed questions still waiting on THIS creator
--   - recent_reflections : recent post-session reflections to read
--
-- SECURITY DEFINER + self-auth via is_challenge_space_admin so only the
-- experience's owner/cohosts get real numbers; everyone else (and anon) gets
-- {authorized:false}. The two views already scope to the caller via auth.uid()
-- (which stays the caller under DEFINER); we add challenge_id to scope to this
-- experience. Kept as a tiny standalone RPC rather than bloating the big
-- load_experience_space snapshot — creators are few and fetch it on demand.

create or replace function public.load_experience_creator_stats(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_space_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('authorized', false);
  end if;

  select id into v_space_id
  from public.app_challenge_space
  where source_challenge_id = p_challenge_id;

  if v_space_id is null or not public.is_challenge_space_admin(v_space_id, v_user) then
    return jsonb_build_object('authorized', false);
  end if;

  return jsonb_build_object(
    'authorized', true,
    'member_count', (
      select count(*)::int from public.app_challenge_member
      where challenge_id = p_challenge_id
    ),
    'pending_questions', (
      select count(*)::int from public.vw_pending_questions_for_creator
      where challenge_id = p_challenge_id
    ),
    'recent_reflections', (
      select count(*)::int from public.vw_recent_reflections_for_creator
      where challenge_id = p_challenge_id
    )
  );
end $$;

grant execute on function public.load_experience_creator_stats(uuid) to authenticated;
