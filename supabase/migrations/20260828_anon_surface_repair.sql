-- =============================================================================
-- Repair of the 2026-08-18 sweep's anon revocations (found 2026-08-28, when
-- the public buyer page 404'd for logged-out visitors).
--
-- THE LESSON: functions referenced INSIDE views and RLS policies execute as
-- the QUERYING role. Revoking anon EXECUTE on a helper that the anon-readable
-- surface traverses breaks that surface:
--   vw_challenge_buyer_view          -> challenge_spots_left
--   app_challenge select policy      -> is_challenge_cohost
--   app_session   select policy      -> has_attended_session
-- Every buyer page 404'd for anon since Aug 18; nobody noticed because every
-- tester was logged in (authenticated kept EXECUTE) and the pilot has no
-- public traffic yet. The sweep's verification battery covered anon-blocked
-- RPCs and authenticated flows but never loaded a page AS anon — a future
-- sweep must include one raw anon page-load of the buyer surface.
--
-- The fix restores anon EXECUTE on exactly these three read-only helpers.
-- experience_review_open (the fourth revoked function found inside policies)
-- stays authenticated-only: it appears only in INSERT policies anon can
-- never evaluate.
-- =============================================================================
do $do$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('is_challenge_cohost','challenge_spots_left','has_attended_session')
  loop
    execute format('grant execute on function %s to anon', r.sig);
  end loop;
end $do$;
