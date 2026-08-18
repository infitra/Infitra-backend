-- =============================================================================
-- Security + performance sweep (2026-08-18) — advisor-driven.
--
-- 111 security lints and ~50 performance lints triaged. This file mirrors the
-- two production migrations (security_perf_sweep +
-- security_sweep_public_grant_fix) and RECORDS THE TRIAGE: what changed, and
-- what is deliberate so the next sweep does not re-litigate it.
--
-- ── FIXED ──────────────────────────────────────────────────────────────────
--  1. search_path pinned on trg_material_session_in_challenge,
--     material_released_at, app_html_escape (mutable search_path).
--  2. 29 SECURITY DEFINER functions stripped of PUBLIC+anon EXECUTE and
--     granted back to authenticated+service_role only. First pass revoked
--     just anon and VERIFICATION SHOWED IT CHANGED NOTHING — Postgres grants
--     EXECUTE to PUBLIC by default and anon inherits it. Always strip PUBLIC.
--     The ONE function kept anon-executable: app_validate_creator_invite
--     (expert-door invite check runs pre-signup, i.e. as anon).
--  3. Trigger bodies (trg_dm_message_notify, trg_pilot_application_enqueue_
--     emails, trg_profile_enqueue_welcome) lose ALL client EXECUTE — trigger
--     functions fire with EXECUTE checked at trigger-creation time, never
--     against the DML caller. Internal functions (app_handle_new_user,
--     complete_ended_experiences, resolve_platform_fee_percent) are
--     service_role only (+ supabase_auth_admin for the auth hook).
--  4. vw_session_pre_pulse_aggregate: client SELECT revoked. No frontend
--     consumer, and as a definer view it exposed every session's pulse
--     stats to any logged-in user.
--  5. Covering indexes for the 8 unindexed FKs (admin_action_log.admin_id,
--     challenge.promise_edited_by, challenge_comment.edited_by,
--     challenge_material.uploaded_by, collaboration_invite.challenge_id +
--     dm_conversation_id, pre_pulse_response.user_id,
--     workspace_activity.actor_id).
--  6. app_challenge_material's 4 policies rewritten with (select auth.uid())
--     — the initplan fix; identical semantics, no per-row re-evaluation.
--  7. challenge_session_insert_block DROPPED: permissive WITH CHECK (false)
--     contributes nothing to an OR — it was pure per-insert overhead.
--  8. app_creator_space_member's two SELECT policies merged into one.
--  9. COMMENTs on app_admin_action_log / app_creator_invite / app_setting:
--     RLS deny-all is DELIBERATE (RPC/service access only).
--
-- ── DELIBERATE (accepted, do not re-flag) ──────────────────────────────────
--  · SECURITY DEFINER views (9): vw_my_transactions / vw_my_lifetime_summary
--    / vw_my_earnings_lines are SELF-SCOPED by auth.uid() inside the view —
--    definer semantics are the point (read restricted tables, scoped to the
--    caller; CLAUDE.md rule 12). app_profile_public applies
--    can_view_profile() (rule 11). vw_experience_review_stats /
--    vw_experience_reviews_public / vw_expert_review_stats /
--    vw_challenge_session_team are public-by-design buyer-page data (anon
--    must read them).
--  · 60+ SECURITY DEFINER functions executable by authenticated: this IS the
--    architecture — every RPC guards internally (auth.uid checks,
--    app_admin_assert, is_session_expert). Not churned.
--  · auth_leaked_password_protection: Pro-plan gate; flips with the paid
--    tiers (founder money-gates, before pilot).
--  · multiple_permissive_policies on app_template(_item) and the
--    app_challenge_session SELECT pair: the FOR ALL owner policies overlap
--    role-wide SELECT policies. Splitting ALL into per-command policies is
--    churn for ~zero gain at pilot scale. Revisit at real scale.
--  · unused_index (~24): pilot-stage noise — there is no traffic yet to use
--    them. Dropping now would be premature; revisit with real usage data.
--
-- ── PERFORMANCE ANALYSIS (2026-08-18 snapshot) ─────────────────────────────
--  · Workload is dominated by infrastructure (realtime WAL polling ~15M ms,
--    dashboard introspection, pg_timezone_names). Application queries barely
--    register.
--  · Top app consumer: app_enqueue_session_reminders() at 34.7ms mean ×
--    per-minute cron. Acceptable; app_session already carries
--    ix_session_status_start + the outbox dedupe partial index.
--  · Buyer page SSR: already batched into ~4 Promise.all phases (a previous
--    pass); two remaining single-query hops (creator credentials, materials
--    count) could fold in for ~2 round trips — micro, deferred.
-- =============================================================================

-- 1) Pin search_path.
do $do$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('trg_material_session_in_challenge','material_released_at','app_html_escape')
  loop
    execute format('alter function %s set search_path = ''public''', r.sig);
  end loop;
end $do$;

-- 2) USER RPCs: strip PUBLIC+anon, grant authenticated+service_role.
do $do$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'accept_collab_invite','challenge_remove_session_and_delete',
        'challenge_spots_left','count_challenge_materials',
        'create_challenge_comment','create_challenge_post','experience_review_open',
        'has_attended_session','is_challenge_cohost','list_challenge_posts','list_dm_messages',
        'load_experience_creator_stats','load_experience_space','load_workspace',
        'lock_challenge_contract','log_workspace_field_edit','post_workspace_log',
        'send_additional_collab_invite','send_collab_invite',
        'send_collab_invites_with_draft','submit_intro_post',
        'update_challenge_workspace','update_weekly_arc_themes'
      )
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;

  -- Trigger bodies: no client EXECUTE at all.
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'trg_dm_message_notify','trg_pilot_application_enqueue_emails',
        'trg_profile_enqueue_welcome'
      )
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;

  -- Internal: service_role (+ auth admin for the auth hook).
  for r in
    select p.oid::regprocedure as sig, p.proname
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('app_handle_new_user','complete_ended_experiences','resolve_platform_fee_percent')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
    if r.proname = 'app_handle_new_user' then
      execute format('grant execute on function %s to supabase_auth_admin', r.sig);
    end if;
  end loop;
end $do$;

-- 4) Pulse aggregate view: definer semantics + no client consumer = revoke.
revoke select on public.vw_session_pre_pulse_aggregate from anon, authenticated;

-- 5) FK covering indexes.
create index if not exists idx_admin_action_log_admin_id on public.app_admin_action_log (admin_id);
create index if not exists idx_challenge_promise_edited_by on public.app_challenge (promise_edited_by);
create index if not exists idx_challenge_comment_edited_by on public.app_challenge_comment (edited_by);
create index if not exists idx_challenge_material_uploaded_by on public.app_challenge_material (uploaded_by);
create index if not exists idx_collab_invite_challenge_id on public.app_collaboration_invite (challenge_id);
create index if not exists idx_collab_invite_dm_conversation_id on public.app_collaboration_invite (dm_conversation_id);
create index if not exists idx_pre_pulse_response_user_id on public.app_session_pre_pulse_response (user_id);
create index if not exists idx_workspace_activity_actor_id on public.app_workspace_activity (actor_id);

-- 6) Material policies: identical semantics, initplan-safe auth calls.
drop policy "material experts insert" on public.app_challenge_material;
create policy "material experts insert" on public.app_challenge_material
  for insert to authenticated
  with check (
    (uploaded_by = (select auth.uid()))
    and exists (
      select 1 from app_challenge c
      where c.id = app_challenge_material.challenge_id
        and (c.owner_id = (select auth.uid())
             or exists (select 1 from app_challenge_cohost ch
                        where ch.challenge_id = c.id and ch.cohost_id = (select auth.uid())))
    )
  );

drop policy "material experts update" on public.app_challenge_material;
create policy "material experts update" on public.app_challenge_material
  for update to authenticated
  using (
    exists (
      select 1 from app_challenge c
      where c.id = app_challenge_material.challenge_id
        and (c.owner_id = (select auth.uid())
             or exists (select 1 from app_challenge_cohost ch
                        where ch.challenge_id = c.id and ch.cohost_id = (select auth.uid())))
    )
  );

drop policy "material experts delete" on public.app_challenge_material;
create policy "material experts delete" on public.app_challenge_material
  for delete to authenticated
  using (
    exists (
      select 1 from app_challenge c
      where c.id = app_challenge_material.challenge_id
        and (c.owner_id = (select auth.uid())
             or exists (select 1 from app_challenge_cohost ch
                        where ch.challenge_id = c.id and ch.cohost_id = (select auth.uid())))
    )
  );

drop policy "material tribe select" on public.app_challenge_material;
create policy "material tribe select" on public.app_challenge_material
  for select to authenticated
  using (
    exists (
      select 1 from app_challenge c
      where c.id = app_challenge_material.challenge_id
        and (c.owner_id = (select auth.uid())
             or exists (select 1 from app_challenge_cohost ch
                        where ch.challenge_id = c.id and ch.cohost_id = (select auth.uid()))
             or exists (select 1 from app_challenge_member m
                        where m.challenge_id = c.id and m.user_id = (select auth.uid())))
    )
  );

-- 7) A permissive WITH CHECK (false) policy ORs to nothing: pure overhead.
drop policy "challenge_session_insert_block" on public.app_challenge_session;

-- 8) One SELECT policy instead of two on creator_space_member.
drop policy "creator_space_member_select_creator" on public.app_creator_space_member;
drop policy "creator_space_member_select_self" on public.app_creator_space_member;
create policy "creator_space_member_select" on public.app_creator_space_member
  for select
  using (
    user_id = (select auth.uid())
    or (
      exists (select 1 from app_profile p
              where p.id = (select auth.uid()) and p.role = 'creator')
      and space_id in (select s.id from app_creator_space s
                       where s.creator_id = (select auth.uid()))
    )
  );

-- 9) Deny-all is deliberate on these three.
comment on table public.app_admin_action_log is
  'Admin audit trail. RLS deny-all is DELIBERATE: written and read only by admin_* SECURITY DEFINER RPCs.';
comment on table public.app_creator_invite is
  'Expert invite codes. RLS deny-all is DELIBERATE: validated via app_validate_creator_invite, managed service-side.';
comment on table public.app_setting is
  'System settings (platform fee etc.). RLS deny-all is DELIBERATE: read by internal functions only.';
