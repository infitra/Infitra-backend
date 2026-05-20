-- Bundle 4 fix: anonymous buyer page returns 404
--
-- The public buyer page /challenges/[id] is supposed to be readable
-- by anyone (creators paste it into DMs/Instagram), but every anon
-- visitor was hitting a 404. Root cause was a chain of RLS / function-
-- grant issues that all became reachable once the page was opened
-- without auth:
--
--   1. vw_challenge_buyer_view (security_invoker = true) calls
--      challenge_spots_left(). That function was SECURITY INVOKER
--      and selects from app_transaction — a financial table anon
--      cannot SELECT. View query errored, page rendered notFound().
--
--   2. The page also queries app_challenge_session (session count).
--      That table's SELECT RLS contains an EXISTS subquery on
--      app_challenge_cohost, which inherits app_challenge_cohost's
--      own SELECT RLS, which calls is_challenge_owner_nors(...).
--      Anon has no EXECUTE grant on that function — permission
--      denied propagates up.
--
--   3. app_challenge_cohost's SELECT policy itself had no public
--      clause, so even with the EXECUTE grant the page's direct
--      query of the cohost list would have returned 0 rows for anon.
--
-- Three fixes, smallest surface that fully unbreaks the buyer page:

-- ── (1) challenge_spots_left → SECURITY DEFINER ──
--
-- Returns a single integer (capacity minus distinct succeeded buyers,
-- floored at 0). The result is intended public merchandising data
-- ("X spots left"), and the function does not select any column from
-- app_transaction — only a row count. No leak.
--
-- search_path pinned to '' so the definer body only resolves
-- fully-qualified names (standard SECURITY DEFINER hardening).
CREATE OR REPLACE FUNCTION public.challenge_spots_left(p_challenge uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE WHEN c.capacity IS NULL THEN NULL
    ELSE greatest(c.capacity - (
      SELECT count(DISTINCT t.buyer_id) FROM public.app_transaction t
      WHERE t.challenge_id = c.id AND t.status = 'succeeded'
    ), 0)
  END FROM public.app_challenge c WHERE c.id = p_challenge;
$$;

REVOKE ALL ON FUNCTION public.challenge_spots_left(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.challenge_spots_left(uuid) TO anon, authenticated;

-- ── (2) Allow anon to EXECUTE is_challenge_owner_nors ──
--
-- The function only returns a boolean ownership check. Any anon
-- evaluating it gets false (auth.uid() is null), so no rows are
-- exposed via this path. Granting EXECUTE prevents permission-
-- denied errors when the policy on app_challenge_cohost is reached
-- transitively under an anon session.
GRANT EXECUTE ON FUNCTION public.is_challenge_owner_nors(uuid, uuid) TO anon;

-- ── (3) Public read on app_challenge_cohost for published challenges ──
--
-- The cohost list ("two coaches co-leading this program") is
-- displayed on the public buyer page. Mirror the visibility rule
-- already on app_challenge itself: anyone can read cohost rows for
-- a challenge in published/completed status. Owner-and-self branches
-- preserved so cohort visibility during draft / pre-publish is
-- unchanged.
DROP POLICY IF EXISTS challenge_cohost_select_owner_or_self ON public.app_challenge_cohost;

CREATE POLICY challenge_cohost_select_owner_or_self ON public.app_challenge_cohost
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.app_challenge c
    WHERE c.id = app_challenge_cohost.challenge_id
      AND c.status = ANY (ARRAY['published'::challenge_status, 'completed'::challenge_status])
  )
  OR is_challenge_owner_nors(challenge_id, (SELECT auth.uid()))
  OR cohost_id = (SELECT auth.uid())
);
