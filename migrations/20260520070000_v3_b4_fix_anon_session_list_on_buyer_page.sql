-- Bundle 4.1 fix: buyer page shows 0 sessions to anon
--
-- Same pattern as 20260520060000_v3_b4_fix_anon_buyer_page_404.sql.
-- The buyer page joins app_challenge_session → app_session to render
-- the session list. app_session's SELECT policy has the right
-- short-circuit (`status = 'published' OR …`), but the OR branches
-- reach helpers that anon can't EXECUTE — most notably
-- is_session_host, which is called from app_session_cohost's SELECT
-- policy and reached transitively from app_session_select_merged via
-- an EXISTS subquery.
--
-- During planning Postgres may evaluate these helpers even when the
-- leading `status = 'published'` branch makes the OR trivially true.
-- Granting EXECUTE lets the plan succeed; the helpers' own bodies
-- (and the row-level short-circuit) keep things locked down.
--
-- Security review (same shape as the earlier _nors grant):
--
--   is_session_host(uuid, uuid) — SECURITY INVOKER. Body queries
--   app_session under the caller's RLS. For anon, the inner SELECT
--   only sees published rows (already exposed). Net info-leak: zero.
--
--   has_attended_session(uuid, uuid) — SECURITY DEFINER but the
--   first thing it does is `p_user = auth.uid()`. For anon
--   auth.uid() is null → always returns false regardless of input.
--   Safe.
--
--   is_creator(uuid) — SECURITY INVOKER, queries app_profile. anon
--   has no creator role tied to a null uid → returns false. Safe.
--
-- Granting EXECUTE on a boolean helper does not expose any new data
-- beyond what RLS already permits. The relevant principle: anon's
-- ability to *call* a function is independent of what the function
-- can *return*.

GRANT EXECUTE ON FUNCTION public.is_session_host(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_attended_session(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_creator(uuid) TO anon;
