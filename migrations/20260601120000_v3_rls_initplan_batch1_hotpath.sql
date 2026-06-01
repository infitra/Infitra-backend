-- Batch 1: RLS auth_rls_initplan fix — hot read path (workspace/dashboard load)
--
-- Wrap bare auth.uid() in (select auth.uid()) so Postgres evaluates it ONCE
-- per query (an InitPlan) instead of re-running it per row. This is the
-- documented Supabase remediation for the `auth_rls_initplan` advisor warning.
--
-- LOGIC-PRESERVING: identical access semantics — only the evaluation strategy
-- changes. ALTER POLICY updates in place (no window without a policy); cmd and
-- roles are untouched. app_challenge is already optimized and intentionally
-- omitted. Covers the 21 hot-path policies the workspace + dashboard reads hit.

-- app_session
ALTER POLICY app_session_select_merged ON public.app_session USING (
  (status = 'published'::session_status)
  OR (((select auth.uid()) IS NOT NULL) AND (
    (host_id = (select auth.uid()))
    OR EXISTS (SELECT 1 FROM app_session_cohost sc WHERE sc.session_id = app_session.id AND sc.cohost_id = (select auth.uid()))
    OR has_attended_session(id, (select auth.uid()))
    OR EXISTS (SELECT 1 FROM app_challenge_session cs JOIN app_challenge c ON c.id = cs.challenge_id
               WHERE cs.session_id = app_session.id
               AND (c.owner_id = (select auth.uid())
                    OR EXISTS (SELECT 1 FROM app_challenge_cohost cch WHERE cch.challenge_id = c.id AND cch.cohost_id = (select auth.uid()))))
  ))
);
ALTER POLICY session_delete_owner_draft ON public.app_session
  USING ((host_id = (select auth.uid())) AND (status = 'draft'::session_status));
ALTER POLICY session_update_owner_draft ON public.app_session
  USING ((host_id = (select auth.uid())) AND (status = 'draft'::session_status))
  WITH CHECK ((host_id = (select auth.uid())) AND (status = 'draft'::session_status));

-- app_challenge_session
ALTER POLICY challenge_session_select_flat ON public.app_challenge_session USING (
  EXISTS (SELECT 1 FROM app_challenge c WHERE c.id = app_challenge_session.challenge_id
          AND (c.status = ANY (ARRAY['published'::challenge_status,'completed'::challenge_status])
               OR c.owner_id = (select auth.uid())
               OR EXISTS (SELECT 1 FROM app_challenge_cohost cc WHERE cc.challenge_id = c.id AND cc.cohost_id = (select auth.uid()))))
);
ALTER POLICY "owner manages challenge sessions" ON public.app_challenge_session
  USING (((SELECT app_challenge.owner_id FROM app_challenge WHERE app_challenge.id = app_challenge_session.challenge_id) = (select auth.uid())))
  WITH CHECK (((SELECT app_challenge.owner_id FROM app_challenge WHERE app_challenge.id = app_challenge_session.challenge_id) = (select auth.uid())));

-- app_challenge_cohost
ALTER POLICY challenge_cohost_delete_owner_only ON public.app_challenge_cohost
  USING (is_challenge_owner_nors(challenge_id, (select auth.uid())));
ALTER POLICY challenge_cohost_insert_owner_only ON public.app_challenge_cohost
  WITH CHECK (is_challenge_owner_nors(challenge_id, (select auth.uid())));
ALTER POLICY challenge_cohost_update_owner_only ON public.app_challenge_cohost
  USING (is_challenge_owner_nors(challenge_id, (select auth.uid())))
  WITH CHECK (is_challenge_owner_nors(challenge_id, (select auth.uid())));

-- app_session_cohost
ALTER POLICY session_cohost_delete ON public.app_session_cohost
  USING (is_session_host(session_id, (select auth.uid())));
ALTER POLICY session_cohost_insert ON public.app_session_cohost
  WITH CHECK (is_session_host(session_id, (select auth.uid())));
ALTER POLICY session_cohost_select ON public.app_session_cohost
  USING (is_session_host(session_id, (select auth.uid())) OR cohost_id = (select auth.uid()));
ALTER POLICY session_cohost_update ON public.app_session_cohost
  USING (is_session_host(session_id, (select auth.uid())))
  WITH CHECK (is_session_host(session_id, (select auth.uid())));

-- app_challenge_space
ALTER POLICY challenge_space_delete_admin ON public.app_challenge_space
  USING (is_challenge_space_admin(id, (select auth.uid())));
ALTER POLICY challenge_space_select_access ON public.app_challenge_space USING (
  owner_id = (select auth.uid())
  OR EXISTS (SELECT 1 FROM app_challenge_space_member m WHERE m.space_id = app_challenge_space.id AND m.user_id = (select auth.uid()))
  OR EXISTS (SELECT 1 FROM app_challenge_member cm WHERE cm.challenge_id = app_challenge_space.source_challenge_id AND cm.user_id = (select auth.uid()))
  OR EXISTS (SELECT 1 FROM app_challenge_cohost ch WHERE ch.challenge_id = app_challenge_space.source_challenge_id AND ch.cohost_id = (select auth.uid()))
);
ALTER POLICY challenge_space_update_admin ON public.app_challenge_space
  USING (is_challenge_space_admin(id, (select auth.uid())))
  WITH CHECK (is_challenge_space_admin(id, (select auth.uid())));

-- app_challenge_space_member
ALTER POLICY challenge_space_member_delete_admin ON public.app_challenge_space_member
  USING (is_challenge_space_admin(space_id, (select auth.uid())));
ALTER POLICY challenge_space_member_insert_admin ON public.app_challenge_space_member
  WITH CHECK (is_challenge_space_admin(space_id, (select auth.uid())));
ALTER POLICY challenge_space_member_select_access ON public.app_challenge_space_member
  USING (can_access_challenge_space(space_id, (select auth.uid())));
ALTER POLICY challenge_space_member_update_admin ON public.app_challenge_space_member
  USING (is_challenge_space_admin(space_id, (select auth.uid())))
  WITH CHECK (is_challenge_space_admin(space_id, (select auth.uid())));

-- app_profile
ALTER POLICY app_profile_select_merged ON public.app_profile
  USING ((visibility = 'public'::text) OR (id = (select auth.uid())));
ALTER POLICY app_profile_update_merged ON public.app_profile
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));
