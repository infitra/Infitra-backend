-- Migration: 20260401000000_security_and_performance_fixes
-- Applied: 2026-04-01
-- Context: First tracked migration. Schema existed prior to migration system.
--          This file records all security and performance fixes applied in the
--          initial backend audit session. A full baseline schema dump should be
--          generated via `supabase db pull` once Docker is available.
-- ─────────────────────────────────────────────────────────────────────────────

-- FIX 1: Remove unsafe session DELETE policy (allowed deleting published sessions)
-- Violates Ch. 7.10 immutability. Only draft sessions may be deleted by owners.
DROP POLICY IF EXISTS "creator can delete own session" ON public.app_session;


-- FIX 2: Lock app_order to service_role only (financial integrity — SR-MB2, SR-MB3)
-- Clients must never write directly to the financial ledger.
DROP POLICY IF EXISTS "buyer inserts order" ON public.app_order;
CREATE POLICY "order_insert_service_only"
  ON public.app_order FOR INSERT TO service_role WITH CHECK (true);


-- FIX 3: Lock app_challenge_member to service_role only (entitlement integrity — SR-MB4)
-- Challenge membership is an entitlement artifact; must derive from payment workflow only.
DROP POLICY IF EXISTS "user join challenge" ON public.app_challenge_member;
CREATE POLICY "challenge_member_insert_service_only"
  ON public.app_challenge_member FOR INSERT TO service_role WITH CHECK (true);


-- FIX 4: RLS performance — replace auth.uid() with (SELECT auth.uid()) across policies
-- Prevents per-row function re-evaluation. No permission logic change.

-- app_stream_token
DROP POLICY IF EXISTS "stream_token_read_own" ON public.app_stream_token;
CREATE POLICY "stream_token_read_own" ON public.app_stream_token
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- app_creator_space
DROP POLICY IF EXISTS "creator_space_select_access" ON public.app_creator_space;
CREATE POLICY "creator_space_select_access" ON public.app_creator_space
  FOR SELECT TO authenticated USING (can_access_creator_space(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "creator_space_update_owner" ON public.app_creator_space;
CREATE POLICY "creator_space_update_owner" ON public.app_creator_space
  FOR UPDATE TO authenticated
  USING (is_creator_space_owner(id, (SELECT auth.uid())))
  WITH CHECK (is_creator_space_owner(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "creator_space_delete_owner" ON public.app_creator_space;
CREATE POLICY "creator_space_delete_owner" ON public.app_creator_space
  FOR DELETE TO authenticated USING (is_creator_space_owner(id, (SELECT auth.uid())));

-- app_creator_space_member
DROP POLICY IF EXISTS "creator_space_member_select_owner" ON public.app_creator_space_member;
CREATE POLICY "creator_space_member_select_owner" ON public.app_creator_space_member
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_creator_space s
    WHERE s.id = app_creator_space_member.space_id AND s.creator_id = (SELECT auth.uid())
  ));

-- app_creator_post
DROP POLICY IF EXISTS "creator_post_select_access" ON public.app_creator_post;
CREATE POLICY "creator_post_select_access" ON public.app_creator_post
  FOR SELECT TO authenticated USING (can_access_creator_space(space_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "creator_post_insert_owner" ON public.app_creator_post;
CREATE POLICY "creator_post_insert_owner" ON public.app_creator_post
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND can_post_in_creator_space(space_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "creator_post_update_owner" ON public.app_creator_post;
CREATE POLICY "creator_post_update_owner" ON public.app_creator_post
  FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid()) AND can_post_in_creator_space(space_id, (SELECT auth.uid())))
  WITH CHECK (author_id = (SELECT auth.uid()) AND can_post_in_creator_space(space_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "creator_post_delete_owner" ON public.app_creator_post;
CREATE POLICY "creator_post_delete_owner" ON public.app_creator_post
  FOR DELETE TO authenticated
  USING (author_id = (SELECT auth.uid()) AND can_post_in_creator_space(space_id, (SELECT auth.uid())));

-- app_creator_comment
DROP POLICY IF EXISTS "creator_comment_select_access" ON public.app_creator_comment;
CREATE POLICY "creator_comment_select_access" ON public.app_creator_comment
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_creator_post p
    WHERE p.id = app_creator_comment.post_id AND can_access_creator_space(p.space_id, (SELECT auth.uid()))
  ));

DROP POLICY IF EXISTS "creator_comment_insert_interact" ON public.app_creator_comment;
CREATE POLICY "creator_comment_insert_interact" ON public.app_creator_comment
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM app_creator_post p
    WHERE p.id = app_creator_comment.post_id AND can_interact_creator_space(p.space_id, (SELECT auth.uid()))
  ));

DROP POLICY IF EXISTS "creator_comment_update_author" ON public.app_creator_comment;
CREATE POLICY "creator_comment_update_author" ON public.app_creator_comment
  FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid())) WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "creator_comment_delete_author_or_owner" ON public.app_creator_comment;
CREATE POLICY "creator_comment_delete_author_or_owner" ON public.app_creator_comment
  FOR DELETE TO authenticated
  USING (author_id = (SELECT auth.uid()) OR EXISTS (
    SELECT 1 FROM app_creator_post p
    JOIN app_creator_space s ON s.id = p.space_id
    WHERE p.id = app_creator_comment.post_id AND s.creator_id = (SELECT auth.uid())
  ));

-- app_challenge_comment
DROP POLICY IF EXISTS "challenge_comment_select_access" ON public.app_challenge_comment;
CREATE POLICY "challenge_comment_select_access" ON public.app_challenge_comment
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_challenge_post p
    WHERE p.id = app_challenge_comment.post_id AND can_access_challenge_space(p.space_id, (SELECT auth.uid()))
  ));

DROP POLICY IF EXISTS "challenge_comment_insert_access" ON public.app_challenge_comment;
CREATE POLICY "challenge_comment_insert_access" ON public.app_challenge_comment
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM app_challenge_post p
    WHERE p.id = app_challenge_comment.post_id AND can_access_challenge_space(p.space_id, (SELECT auth.uid()))
  ));

DROP POLICY IF EXISTS "challenge_comment_update_author" ON public.app_challenge_comment;
CREATE POLICY "challenge_comment_update_author" ON public.app_challenge_comment
  FOR UPDATE TO authenticated
  USING (author_id = (SELECT auth.uid())) WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "challenge_comment_delete_author" ON public.app_challenge_comment;
CREATE POLICY "challenge_comment_delete_author" ON public.app_challenge_comment
  FOR DELETE TO authenticated USING (author_id = (SELECT auth.uid()));

-- app_badge
DROP POLICY IF EXISTS "app_badge_admin_all" ON public.app_badge;
CREATE POLICY "app_badge_admin_all" ON public.app_badge
  FOR ALL TO authenticated
  USING (is_admin((SELECT auth.uid()))) WITH CHECK (is_admin((SELECT auth.uid())));

DROP POLICY IF EXISTS "app_badge_creator_insert" ON public.app_badge;
CREATE POLICY "app_badge_creator_insert" ON public.app_badge
  FOR INSERT TO authenticated
  WITH CHECK (
    source = 'creator_defined' AND created_by = (SELECT auth.uid()) AND
    audience = 'participant' AND is_event_based = true AND
    is_monthly = false AND is_auto_awarded = false
  );

-- app_challenge (remove duplicate INSERT, enforce creator role)
DROP POLICY IF EXISTS "owner insert challenge" ON public.app_challenge;
DROP POLICY IF EXISTS "challenge_insert_creator" ON public.app_challenge;
CREATE POLICY "challenge_insert_creator" ON public.app_challenge
  FOR INSERT TO authenticated
  WITH CHECK (is_creator((SELECT auth.uid())) AND owner_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "challenge_update_owner_draft" ON public.app_challenge;
CREATE POLICY "challenge_update_owner_draft" ON public.app_challenge
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status = 'draft')
  WITH CHECK (owner_id = (SELECT auth.uid()) AND status = 'draft');

DROP POLICY IF EXISTS "challenge_delete_owner_draft" ON public.app_challenge;
CREATE POLICY "challenge_delete_owner_draft" ON public.app_challenge
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT auth.uid()) AND status = 'draft');


-- FIX 5: Collapse duplicate app_session INSERT policies + enforce creator role
DROP POLICY IF EXISTS "app_session_insert_merged" ON public.app_session;
DROP POLICY IF EXISTS "session_insert_creator" ON public.app_session;
CREATE POLICY "session_insert_creator" ON public.app_session
  FOR INSERT TO authenticated
  WITH CHECK (is_creator((SELECT auth.uid())) AND host_id = (SELECT auth.uid()));


-- FIX 6: Remove dead review_delete_deny_all (was blocking the 15-min delete window)
DROP POLICY IF EXISTS "review_delete_deny_all" ON public.app_review;


-- FIX 7: Lock templates to creators only (not anonymous/participants)
DROP POLICY IF EXISTS "template_read_all" ON public.app_template;
CREATE POLICY "template_read_creators" ON public.app_template
  FOR SELECT TO authenticated USING (is_creator((SELECT auth.uid())));

DROP POLICY IF EXISTS "template_item_read_all" ON public.app_template_item;
CREATE POLICY "template_item_read_creators" ON public.app_template_item
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM app_template t
    WHERE t.id = app_template_item.template_id AND is_creator((SELECT auth.uid()))
  ));


-- FIX 8: Missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_challenge_member_user   ON public.app_challenge_member (user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_cohost_cohost ON public.app_challenge_cohost (cohost_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_author     ON public.app_chat_message (author_id);
CREATE INDEX IF NOT EXISTS idx_dm_message_author       ON public.app_dm_message (author_id);
CREATE INDEX IF NOT EXISTS idx_order_session           ON public.app_order (session_id);
CREATE INDEX IF NOT EXISTS idx_order_challenge         ON public.app_order (challenge_id);
CREATE INDEX IF NOT EXISTS idx_feed_event_challenge    ON public.app_feed_event (challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_badge_awarded_by   ON public.app_user_badge (awarded_by);
CREATE INDEX IF NOT EXISTS idx_badge_created_by        ON public.app_badge (created_by);
CREATE INDEX IF NOT EXISTS idx_user_subscription_plan  ON public.app_user_subscription (plan_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_tx         ON public.app_email_outbox (tx_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversation_created_by ON public.app_dm_conversation (created_by);


-- FIX 9: Pin search_path on capacity-check functions (prevent search path injection)
CREATE OR REPLACE FUNCTION public.session_spots_left(p_session uuid)
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  SELECT CASE WHEN s.capacity IS NULL THEN NULL
    ELSE greatest(s.capacity - (SELECT count(*) FROM public.app_attendance a WHERE a.session_id = s.id), 0)
  END FROM public.app_session s WHERE s.id = p_session;
$$;

CREATE OR REPLACE FUNCTION public.challenge_spots_left(p_challenge uuid)
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  SELECT CASE WHEN c.capacity IS NULL THEN NULL
    ELSE greatest(c.capacity - (
      SELECT count(DISTINCT t.buyer_id) FROM public.app_transaction t
      WHERE t.challenge_id = c.id AND t.status = 'succeeded'
    ), 0)
  END FROM public.app_challenge c WHERE c.id = p_challenge;
$$;
