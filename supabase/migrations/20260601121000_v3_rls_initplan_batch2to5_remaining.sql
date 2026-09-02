-- Batches 2-5: RLS auth_rls_initplan fix — all remaining tables.
--
-- Wraps every bare auth.uid() in (select auth.uid()) so Postgres evaluates it
-- once per query (an InitPlan) instead of per row — the documented Supabase
-- remediation for the `auth_rls_initplan` advisor warning.
--
-- Implemented as a DO block that introspects pg_policies and rewrites each
-- policy in place via ALTER POLICY:
--   * already-wrapped policies are skipped (the AUTHX protect/restore round-trip
--     is an identity, so they don't re-ALTER) — no double-wrapping
--   * the remaining policies use only auth.uid() (no role/jwt/email/current_setting)
--   * ATOMIC: any failure rolls the entire block back (no partial state)
--   * IDEMPOTENT: re-running is a no-op (everything is already wrapped)
--
-- LOGIC-PRESERVING: only function calls are wrapped; no predicate logic changes,
-- so access semantics (who can read/write what) are identical. cmd and roles are
-- untouched (ALTER POLICY only sets USING / WITH CHECK).
--
-- Verified after apply: 0 bare auth.uid() across all 124 policy references;
-- advisor auth_rls_initplan 84 -> 0. (Batch 1 — hot path — shipped separately in
-- 20260601120000_v3_rls_initplan_batch1_hotpath.sql.)
DO $$
DECLARE
  r record;
  nq text;
  nc text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual,'') || ' ' || coalesce(with_check,'')) ~ 'auth\.uid\(\)'
  LOOP
    nq := r.qual;
    IF nq IS NOT NULL THEN
      nq := regexp_replace(nq, '(\(\s*select\s+)auth(\.uid\(\)\s+as\s+\w+\s*\))', '\1AUTHX\2', 'gi');
      nq := regexp_replace(nq, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      nq := regexp_replace(nq, 'AUTHX\.uid', 'auth.uid', 'g');
    END IF;
    nc := r.with_check;
    IF nc IS NOT NULL THEN
      nc := regexp_replace(nc, '(\(\s*select\s+)auth(\.uid\(\)\s+as\s+\w+\s*\))', '\1AUTHX\2', 'gi');
      nc := regexp_replace(nc, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      nc := regexp_replace(nc, 'AUTHX\.uid', 'auth.uid', 'g');
    END IF;
    IF (nq IS DISTINCT FROM r.qual) OR (nc IS DISTINCT FROM r.with_check) THEN
      EXECUTE format('ALTER POLICY %I ON public.%I%s%s',
        r.policyname, r.tablename,
        CASE WHEN nq IS NOT NULL THEN format(' USING (%s)', nq) ELSE '' END,
        CASE WHEN nc IS NOT NULL THEN format(' WITH CHECK (%s)', nc) ELSE '' END);
    END IF;
  END LOOP;
END $$;
