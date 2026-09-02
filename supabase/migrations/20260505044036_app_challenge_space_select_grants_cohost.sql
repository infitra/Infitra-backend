-- Cohosts are co-creators of the underlying challenge (collaboration is
-- a first-class primitive). The previous SELECT policy on
-- app_challenge_space granted read only to space owners, space members,
-- and paid challenge members, leaving the cohost dashboard unable to
-- resolve the space URL — clicking an active program fell back to the
-- public challenge page instead of the challenge space.

drop policy if exists challenge_space_select_access on app_challenge_space;

create policy challenge_space_select_access on app_challenge_space
  for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from app_challenge_space_member m
      where m.space_id = app_challenge_space.id
        and m.user_id = auth.uid()
    )
    or exists (
      select 1 from app_challenge_member cm
      where cm.challenge_id = app_challenge_space.source_challenge_id
        and cm.user_id = auth.uid()
    )
    or exists (
      select 1 from app_challenge_cohost ch
      where ch.challenge_id = app_challenge_space.source_challenge_id
        and ch.cohost_id = auth.uid()
    )
  );
