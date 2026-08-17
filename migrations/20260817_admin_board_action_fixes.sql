-- =============================================================================
-- Admin board action fixes (2026-08-17) — first real founder session found
-- both write actions broken:
--
-- 1. admin_set_application_status used statuses ('onboarded','passed') that
--    the table's CHECK constraint does not allow. The table's own vocabulary
--    is new/contacted/accepted/declined — the RPC now speaks it instead of
--    altering the schema. (AdminShell.tsx APP_STATUSES mirrors this list.)
--
-- 2. admin_anonymize_user failed on Supabase's protect_objects_delete
--    trigger: storage.objects rows cannot be deleted via SQL, only via the
--    Storage API. The scrub already nulls avatar_url/cover_image_url so the
--    files become unreferenced; the function now COUNTS the orphaned objects
--    into the audit detail instead of deleting them (physical cleanup via
--    the dashboard if a real deletion request ever demands it — pilot-lean).
--    Also fixed before it ever fired: app_profile has a CHECK that creators
--    must stay visibility='public', so the scrub sets 'private' only for
--    non-creators.
--
-- Both verified end-to-end against production (status cycled and audited;
-- the disposable e2e test account genuinely anonymized: profile scrubbed,
-- email scrambled, banned until 3000, password nulled).
-- =============================================================================

create or replace function public.admin_set_application_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_admin uuid;
begin
    v_admin := app_admin_assert();
    -- Must match app_pilot_application_status_check exactly.
    if p_status not in ('new', 'contacted', 'accepted', 'declined') then
        raise exception 'invalid status %', p_status;
    end if;
    update app_pilot_application set status = p_status where id = p_id;
    if not found then raise exception 'application not found'; end if;
    insert into app_admin_action_log (admin_id, action, target, detail)
    values (v_admin, 'set_application_status', p_id::text, jsonb_build_object('status', p_status));
end;
$$;
revoke all on function public.admin_set_application_status(uuid, text) from public, anon;
grant execute on function public.admin_set_application_status(uuid, text) to authenticated, service_role;

create or replace function public.admin_anonymize_user(p_user uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_admin uuid;
    v_target app_profile%rowtype;
    v_counts jsonb;
    n_posts int; n_comments int; n_chat int; n_dm int; n_outbox int; n_reviews int;
    n_storage int;
begin
    v_admin := app_admin_assert();

    select * into v_target from app_profile where id = p_user;
    if not found then raise exception 'profile not found'; end if;
    if v_target.is_admin then raise exception 'refusing to anonymize an admin account'; end if;

    -- 1) Profile scrub (row stays: financial FKs reference it).
    --    Creators must remain visibility='public' (table CHECK) — the name
    --    and every identifying field are scrubbed either way.
    update app_profile set
        display_name    = 'Former member',
        full_name       = null,
        username        = null,
        avatar_url      = null,
        cover_image_url = null,
        bio             = null,
        tagline         = null,
        visibility      = case when role = 'creator' then 'public' else 'private' end,
        profile_facts   = '{}'::jsonb
    where id = p_user;

    -- 2) Community content: keep structure, remove voice
    update app_challenge_post   set body = '[removed]', media_url = null where author_id = p_user;
    get diagnostics n_posts = row_count;
    update app_creator_post     set body = '[removed]', media_url = null where author_id = p_user;
    update app_challenge_comment set body = '[removed]' where author_id = p_user;
    get diagnostics n_comments = row_count;
    update app_creator_comment  set body = '[removed]' where author_id = p_user;
    update app_chat_message     set body = '[removed]' where author_id = p_user;
    get diagnostics n_chat = row_count;
    update app_dm_message       set body = '[removed]', metadata = '{}'::jsonb,
        deleted_at = coalesce(deleted_at, now()) where author_id = p_user;
    get diagnostics n_dm = row_count;
    update app_review           set comment = null where reviewer_id = p_user;
    get diagnostics n_reviews = row_count;
    update app_collab_review    set comment = null where reviewer_id = p_user;

    -- 3) Unsent emails die; sent receipts stay (financial record)
    delete from app_email_outbox where user_id = p_user and sent_at is null;
    get diagnostics n_outbox = row_count;

    -- 4) Storage: rows cannot be deleted via SQL (protect_objects_delete).
    --    The scrub above unlinks every file; count the orphans for the log.
    select count(*) into n_storage from storage.objects
    where owner = p_user or owner_id = p_user::text;

    -- 5) Lock the login: scramble identity, ban forever, kill sessions.
    --    (Never DELETE auth.users: cascade would take app_profile with it.)
    update auth.users set
        email = 'deleted+' || left(p_user::text, 8) || '@anonymized.infitra.fit',
        raw_user_meta_data = jsonb_build_object('anonymized_at', now()),
        encrypted_password = null,
        phone = null,
        banned_until = '3000-01-01'::timestamptz
    where id = p_user;
    delete from auth.identities where user_id = p_user;
    delete from auth.sessions where user_id = p_user;
    delete from auth.refresh_tokens where user_id = p_user::text;

    v_counts := jsonb_build_object(
        'posts', n_posts, 'comments', n_comments, 'chat_messages', n_chat,
        'dm_messages', n_dm, 'queued_emails_deleted', n_outbox, 'reviews_scrubbed', n_reviews,
        'storage_objects_orphaned', n_storage,
        'reason', p_reason
    );

    insert into app_admin_action_log (admin_id, action, target, detail)
    values (v_admin, 'anonymize_user', p_user::text, v_counts);

    return v_counts;
end;
$$;
revoke all on function public.admin_anonymize_user(uuid, text) from public, anon;
grant execute on function public.admin_anonymize_user(uuid, text) to authenticated, service_role;
