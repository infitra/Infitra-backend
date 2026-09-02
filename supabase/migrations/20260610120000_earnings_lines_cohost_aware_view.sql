-- Earnings: co-host-aware per-sale attribution for the current user.
-- Applied to production via MCP apply_migration on 2026-06-10; this file mirrors
-- it into version control.
--
-- SECURITY DEFINER (default view behavior; owner = postgres, which has BYPASSRLS):
-- required so a co-host can see their share of the OWNER's app_transaction rows,
-- which RLS otherwise hides. Mirrors the vw_my_lifetime_summary pattern
-- (CLAUDE.md #12). The view filters internally to auth.uid(), so it only ever
-- returns the caller's own attributed lines — never another user's data.
--
-- Per succeeded sale it emits ONE line for the caller:
--   * owner  : your_cut = creator_cut − Σ(per-co-host floor(creator_cut × split/100))
--              (owner takes the exact remainder, so rounding never leaks)
--   * co-host: your_cut = floor(creator_cut × my_split/100)
-- effective_fee_percent = recorded platform_fee_percent, or computed from the
-- split for legacy rows that predate the configurable-fee column.

CREATE OR REPLACE VIEW public.vw_my_earnings_lines AS
WITH me AS (
  SELECT auth.uid() AS uid
),
tx AS (
  SELECT
    t.id,
    t.type,
    t.created_at,
    t.amount_gross_cents,
    t.platform_cut_cents,
    t.creator_cut_cents,
    t.platform_fee_percent,
    t.challenge_id,
    t.session_id,
    t.buyer_id,
    t.creator_id AS owner_id,
    COALESCE(c.title, s.title) AS product_title,
    bp.display_name AS buyer_name
  FROM app_transaction t
  LEFT JOIN app_challenge c ON c.id = t.challenge_id
  LEFT JOIN app_session   s ON s.id = t.session_id
  LEFT JOIN app_profile  bp ON bp.id = t.buyer_id
  WHERE t.status = 'succeeded'::payment_status
),
cohosts AS (
  SELECT t.id AS tx_id, ch.cohost_id, ch.split_percent
  FROM tx t
  JOIN app_challenge_cohost ch ON ch.challenge_id = t.challenge_id
  WHERE t.type = 'bundle'
  UNION ALL
  SELECT t.id AS tx_id, sc.cohost_id, sc.split_percent
  FROM tx t
  JOIN app_session_cohost sc ON sc.session_id = t.session_id
  WHERE t.type = 'ticket'
),
cohost_agg AS (
  SELECT
    ch.tx_id,
    SUM(floor(t.creator_cut_cents::numeric * ch.split_percent / 100))::bigint AS cohost_cut_cents,
    COUNT(*)::int AS cohost_count,
    MIN(p.display_name) AS single_cohost_name
  FROM cohosts ch
  JOIN tx t ON t.id = ch.tx_id
  LEFT JOIN app_profile p ON p.id = ch.cohost_id
  GROUP BY ch.tx_id
)
-- Owner lines: I own it; I keep creator_cut minus what co-hosts take (remainder, exact).
SELECT
  t.id,
  t.type,
  t.created_at,
  t.product_title,
  t.buyer_id,
  t.buyer_name,
  t.amount_gross_cents,
  t.platform_cut_cents,
  t.creator_cut_cents,
  COALESCE(t.platform_fee_percent,
           round(t.platform_cut_cents * 100.0 / NULLIF(t.amount_gross_cents, 0)))::numeric AS effective_fee_percent,
  'owner'::text AS my_role,
  NULL::int AS my_split_percent,
  COALESCE(ca.cohost_cut_cents, 0)::bigint AS cohost_cut_cents,
  COALESCE(ca.cohost_count, 0)::int AS cohost_count,
  CASE WHEN ca.cohost_count = 1 THEN ca.single_cohost_name ELSE NULL END AS cohost_name,
  (t.creator_cut_cents - COALESCE(ca.cohost_cut_cents, 0))::bigint AS your_cut_cents
FROM tx t
CROSS JOIN me
LEFT JOIN cohost_agg ca ON ca.tx_id = t.id
WHERE me.uid IS NOT NULL AND t.owner_id = me.uid

UNION ALL

-- Co-host lines: someone else owns it; I take my split of the creator_cut.
SELECT
  t.id,
  t.type,
  t.created_at,
  t.product_title,
  t.buyer_id,
  t.buyer_name,
  t.amount_gross_cents,
  t.platform_cut_cents,
  t.creator_cut_cents,
  COALESCE(t.platform_fee_percent,
           round(t.platform_cut_cents * 100.0 / NULLIF(t.amount_gross_cents, 0)))::numeric AS effective_fee_percent,
  'cohost'::text AS my_role,
  ch.split_percent AS my_split_percent,
  NULL::bigint AS cohost_cut_cents,
  NULL::int AS cohost_count,
  NULL::text AS cohost_name,
  floor(t.creator_cut_cents::numeric * ch.split_percent / 100)::bigint AS your_cut_cents
FROM tx t
CROSS JOIN me
JOIN cohosts ch ON ch.tx_id = t.id AND ch.cohost_id = me.uid
WHERE me.uid IS NOT NULL AND t.owner_id <> me.uid;

GRANT SELECT ON public.vw_my_earnings_lines TO authenticated;
