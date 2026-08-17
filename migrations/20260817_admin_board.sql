-- =============================================================================
-- Admin board v1 (2026-08-17)
--
-- 1. Closes a real privilege-escalation hole: app_profile.is_admin was
--    client-updatable (column grant + own-row RLS; the role-immutability
--    trigger only guarded `role`). Nobody held the flag yet, so unexploited.
-- 2. Admin is a DATABASE FACT, not a product flow: the flag can only be
--    flipped with infrastructure-owner credentials (dashboard / service
--    role). No signup path, no RPC, nothing on the website grants it.
-- 3. Every admin read/write is a SECURITY DEFINER RPC asserting
--    is_admin(auth.uid()) server-side; the /admin page gate is cosmetic.
-- 4. Every mutating admin action writes app_admin_action_log.
-- 5. app_admin_anonymize_user() is the deletion runbook the privacy policy
--    promises (30 days): scrub PII + content, lock the login, KEEP financial
--    rows (10-year Art. 958f OR; FKs RESTRICT by design). Note the
--    auth.users FK cascades to app_profile, so we never DELETE the auth row.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) Close the is_admin escalation hole
-- ---------------------------------------------------------------------------
revoke insert (is_admin), update (is_admin) on public.app_profile from authenticated, anon;

create or replace function public.enforce_profile_role_immutable()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
    v_jwt_role text;
begin
    if new.role is distinct from old.role then
        raise exception 'profile role is immutable once the account exists: %', new.id
            using errcode = '23514';
    end if;

    -- is_admin can only be changed by the infrastructure owner: dashboard
    -- SQL (no request.jwt claims) or the service role. Any request that
    -- arrives through PostgREST with a user-level JWT is rejected, even if
    -- a future migration accidentally re-grants the column.
    if new.is_admin is distinct from old.is_admin then
        v_jwt_role := coalesce(
            nullif(current_setting('request.jwt.claim.role', true), ''),
            nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
        );
        if v_jwt_role is not null and v_jwt_role <> 'service_role' then
            raise exception 'is_admin can only be changed by the infrastructure owner'
                using errcode = '42501';
        end if;
    end if;

    return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2) Audit log — no client access at all; SECDEF functions write and read it
-- ---------------------------------------------------------------------------
create table if not exists public.app_admin_action_log (
    id          bigint generated always as identity primary key,
    admin_id    uuid not null references public.app_profile(id),
    action      text not null,
    target      text,
    detail      jsonb,
    created_at  timestamptz not null default now()
);
alter table public.app_admin_action_log enable row level security;
revoke all on public.app_admin_action_log from authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3) The gate every admin RPC calls first
-- ---------------------------------------------------------------------------
create or replace function public.app_admin_assert()
returns uuid
language plpgsql
stable
set search_path to 'public'
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null or not is_admin(v_uid) then
        raise exception 'not_admin' using errcode = '42501';
    end if;
    return v_uid;
end;
$$;
revoke all on function public.app_admin_assert() from public, anon;
grant execute on function public.app_admin_assert() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4) Pulse — the alarm strip. Green = relax.
-- ---------------------------------------------------------------------------
create or replace function public.admin_pulse()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select jsonb_build_object(
        'outbox', (
            select jsonb_build_object(
                'queued',        count(*) filter (where sent_at is null),
                'failing',       count(*) filter (where sent_at is null and attempt_count >= 3),
                'oldest_queued_minutes', coalesce(extract(epoch from (now() - min(enqueued_at) filter (where sent_at is null))) / 60, 0)::int,
                'failed_rows', (
                    select coalesce(jsonb_agg(jsonb_build_object(
                        'id', o.id, 'kind', o.kind, 'to_email', o.to_email,
                        'attempts', o.attempt_count, 'last_error', left(coalesce(o.last_error,''), 300),
                        'enqueued_at', o.enqueued_at
                    ) order by o.enqueued_at), '[]'::jsonb)
                    from (
                        select * from app_email_outbox
                        where sent_at is null and attempt_count >= 3
                        order by enqueued_at limit 20
                    ) o
                )
            )
            from app_email_outbox
        ),
        'money_gap', (
            select jsonb_build_object(
                'missing_entitlements', count(*),
                'rows', coalesce(jsonb_agg(jsonb_build_object('tx_id', t.id, 'created_at', t.created_at)), '[]'::jsonb)
            )
            from app_transaction t
            where t.status = 'succeeded'
              and (
                (t.session_id is not null and not exists (
                    select 1 from app_attendance a where a.session_id = t.session_id and a.user_id = t.buyer_id))
                or
                (t.challenge_id is not null and not exists (
                    select 1 from app_challenge_member m where m.challenge_id = t.challenge_id and m.user_id = t.buyer_id))
              )
        ),
        'receipts_missing', (
            select count(*)
            from app_transaction t
            where t.status = 'succeeded'
              and not exists (select 1 from app_email_outbox o where o.tx_id = t.id and o.kind = 'receipt')
        ),
        'cron', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'job', j.jobname,
                'schedule', j.schedule,
                'active', j.active,
                'last_status', d.status,
                'last_run_at', d.end_time,
                'minutes_since_run', case when d.end_time is null then null
                    else (extract(epoch from (now() - d.end_time)) / 60)::int end
            ) order by j.jobname), '[]'::jsonb)
            from cron.job j
            left join lateral (
                select status, end_time from cron.job_run_details
                where jobid = j.jobid order by start_time desc limit 1
            ) d on true
        ),
        'edge_calls_24h', (
            select coalesce(jsonb_agg(jsonb_build_object('fn', fn, 'calls', calls) order by calls desc), '[]'::jsonb)
            from (
                select fn, count(*) as calls from app_edge_call_log
                where created_at > now() - interval '24 hours'
                group by fn
            ) e
        ),
        'counts', jsonb_build_object(
            'participants',   (select count(*) from app_profile where role = 'participant'),
            'experts',        (select count(*) from app_profile where role = 'creator'),
            'experiences_published', (select count(*) from app_challenge where status = 'published'),
            'sessions_upcoming_7d', (
                select count(*) from app_session
                where status in ('published','scheduled') and ended_at is null
                  and start_time between now() and now() + interval '7 days'),
            'live_now', (select count(*) from app_session where started_at is not null and ended_at is null),
            'signups_7d', (select count(*) from app_profile where created_at > now() - interval '7 days')
        )
    ) into v;

    return v;
end;
$$;
revoke all on function public.admin_pulse() from public, anon;
grant execute on function public.admin_pulse() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5) Money — totals + recent transactions with repair state
-- ---------------------------------------------------------------------------
create or replace function public.admin_money()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select jsonb_build_object(
        'totals', (
            select jsonb_build_object(
                'gross_all',      coalesce(sum(amount_gross_cents) filter (where status = 'succeeded'), 0),
                'gross_30d',      coalesce(sum(amount_gross_cents) filter (where status = 'succeeded' and created_at > now() - interval '30 days'), 0),
                'gross_7d',       coalesce(sum(amount_gross_cents) filter (where status = 'succeeded' and created_at > now() - interval '7 days'), 0),
                'platform_cut_all', coalesce(sum(platform_cut_cents) filter (where status = 'succeeded'), 0),
                'creator_cut_all',  coalesce(sum(creator_cut_cents) filter (where status = 'succeeded'), 0),
                'refunded_all',   coalesce(sum(amount_gross_cents) filter (where status = 'refunded'), 0),
                'refunded_count', count(*) filter (where status = 'refunded'),
                'succeeded_count', count(*) filter (where status = 'succeeded')
            )
            from app_transaction
        ),
        'recent', (
            select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]'::jsonb)
            from (
                select
                    t.id, t.created_at, t.status::text, t.amount_gross_cents,
                    t.platform_cut_cents, t.creator_cut_cents, t.currency,
                    t.provider_payment_id,
                    coalesce(t.buyer_name, p.display_name) as buyer_name,
                    u.email as buyer_email,
                    coalesce(c.title, s.title) as target_title,
                    case when t.challenge_id is not null then 'experience' else 'session' end as target_kind,
                    case
                        when t.status <> 'succeeded' then null
                        when t.session_id is not null then exists (
                            select 1 from app_attendance a where a.session_id = t.session_id and a.user_id = t.buyer_id)
                        when t.challenge_id is not null then exists (
                            select 1 from app_challenge_member m where m.challenge_id = t.challenge_id and m.user_id = t.buyer_id)
                        else null
                    end as entitled,
                    exists (select 1 from app_email_outbox o where o.tx_id = t.id and o.kind = 'receipt' and o.sent_at is not null) as receipt_sent
                from app_transaction t
                left join app_profile p on p.id = t.buyer_id
                left join auth.users u on u.id = t.buyer_id
                left join app_challenge c on c.id = t.challenge_id
                left join app_session s on s.id = t.session_id
                order by t.created_at desc
                limit 100
            ) r
        )
    ) into v;

    return v;
end;
$$;
revoke all on function public.admin_money() from public, anon;
grant execute on function public.admin_money() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) Payout sheet — per experience: net creator cut → per-expert amounts
-- ---------------------------------------------------------------------------
create or replace function public.admin_payouts()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select jsonb_build_object(
        'experiences', (
            select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.end_date desc nulls last), '[]'::jsonb)
            from (
                select
                    c.id, c.title, c.status::text, c.start_date, c.end_date,
                    (select count(*) from app_challenge_member m where m.challenge_id = c.id) as members,
                    coalesce((select sum(t.amount_gross_cents) from app_transaction t
                        where t.challenge_id = c.id and t.status = 'succeeded'), 0) as gross_cents,
                    coalesce((select sum(t.creator_cut_cents) from app_transaction t
                        where t.challenge_id = c.id and t.status = 'succeeded'), 0) as creator_cut_cents,
                    coalesce((select sum(t.platform_cut_cents) from app_transaction t
                        where t.challenge_id = c.id and t.status = 'succeeded'), 0) as platform_cut_cents,
                    (select count(*) from app_transaction t
                        where t.challenge_id = c.id and t.status = 'refunded') as refunded_count,
                    op.display_name as owner_name,
                    (100 - coalesce((select sum(ch.split_percent) from app_challenge_cohost ch
                        where ch.challenge_id = c.id), 0)) as owner_percent,
                    (
                        select coalesce(jsonb_agg(jsonb_build_object(
                            'name', cp.display_name, 'percent', ch.split_percent)), '[]'::jsonb)
                        from app_challenge_cohost ch
                        join app_profile cp on cp.id = ch.cohost_id
                        where ch.challenge_id = c.id
                    ) as cohosts
                from app_challenge c
                join app_profile op on op.id = c.owner_id
                where exists (select 1 from app_transaction t where t.challenge_id = c.id)
            ) x
        ),
        'payout_history', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'id', po.id, 'creator', pp.display_name, 'amount', po.amount,
                'currency', po.currency, 'note', po.note, 'created_at', po.created_at
            ) order by po.created_at desc), '[]'::jsonb)
            from app_payout po
            join app_profile pp on pp.id = po.creator_id
        )
    ) into v;

    return v;
end;
$$;
revoke all on function public.admin_payouts() from public, anon;
grant execute on function public.admin_payouts() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7) People — list incl. email + consent stamps (the legal evidence file)
-- ---------------------------------------------------------------------------
create or replace function public.admin_people(p_query text default null, p_limit int default 200)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]'::jsonb) into v
    from (
        select
            p.id, p.display_name, p.username, p.role, p.is_admin, p.visibility,
            p.created_at, p.is_founding_expert,
            u.email,
            u.banned_until,
            u.raw_user_meta_data ->> 'terms_version' as terms_version,
            u.raw_user_meta_data ->> 'terms_accepted_at' as terms_accepted_at,
            u.raw_user_meta_data ->> 'health_consent_at' as health_consent_at,
            (select count(*) from app_transaction t where t.buyer_id = p.id and t.status = 'succeeded') as purchases,
            (select count(*) from app_challenge_member m where m.user_id = p.id) as memberships
        from app_profile p
        left join auth.users u on u.id = p.id
        where p_query is null or p_query = ''
           or p.display_name ilike '%' || p_query || '%'
           or p.username ilike '%' || p_query || '%'
           or u.email ilike '%' || p_query || '%'
        order by p.created_at desc
        limit least(greatest(coalesce(p_limit, 200), 1), 500)
    ) r;

    return v;
end;
$$;
revoke all on function public.admin_people(text, int) from public, anon;
grant execute on function public.admin_people(text, int) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8) Applications + waitlist
-- ---------------------------------------------------------------------------
create or replace function public.admin_applications()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select jsonb_build_object(
        'applications', (
            select coalesce(jsonb_agg(row_to_json(a)::jsonb order by a.created_at desc), '[]'::jsonb)
            from (select * from app_pilot_application order by created_at desc limit 200) a
        ),
        'waitlist', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'id', w.id, 'email', w.email, 'source', w.source, 'created_at', w.created_at
            ) order by w.created_at desc), '[]'::jsonb)
            from (select * from app_participant_waitlist order by created_at desc limit 200) w
        )
    ) into v;

    return v;
end;
$$;
revoke all on function public.admin_applications() from public, anon;
grant execute on function public.admin_applications() to authenticated, service_role;

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
    if p_status not in ('new', 'contacted', 'onboarded', 'passed') then
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

-- ---------------------------------------------------------------------------
-- 9) Experiences & sessions — structure + liveness at a glance
-- ---------------------------------------------------------------------------
create or replace function public.admin_experiences()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select coalesce(jsonb_agg(row_to_json(x)::jsonb order by x.created_at desc), '[]'::jsonb) into v
    from (
        select
            c.id, c.title, c.status::text, c.start_date, c.end_date, c.created_at,
            op.display_name as owner_name,
            (select count(*) from app_challenge_member m where m.challenge_id = c.id) as members,
            coalesce((select sum(t.amount_gross_cents) from app_transaction t
                where t.challenge_id = c.id and t.status = 'succeeded'), 0) as gross_cents,
            (
                select coalesce(jsonb_agg(jsonb_build_object(
                    'id', s.id, 'title', s.title, 'start_time', s.start_time,
                    'duration_minutes', s.duration_minutes, 'status', s.status::text,
                    'has_room', s.live_room_id is not null,
                    'started_at', s.started_at, 'ended_at', s.ended_at
                ) order by s.start_time), '[]'::jsonb)
                from app_session s
                join app_challenge_session cs on cs.session_id = s.id
                where cs.challenge_id = c.id
            ) as sessions
        from app_challenge c
        join app_profile op on op.id = c.owner_id
    ) x;

    return v;
end;
$$;
revoke all on function public.admin_experiences() from public, anon;
grant execute on function public.admin_experiences() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 10) Repair + force actions (audited)
-- ---------------------------------------------------------------------------
create or replace function public.admin_regrant_tx(p_tx uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_admin uuid;
    v_result jsonb;
begin
    v_admin := app_admin_assert();
    select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb) into v_result
    from admin_regrant_entitlements_tx(p_tx) r;
    insert into app_admin_action_log (admin_id, action, target, detail)
    values (v_admin, 'regrant_entitlements', p_tx::text, v_result);
    return v_result;
end;
$$;
revoke all on function public.admin_regrant_tx(uuid) from public, anon;
grant execute on function public.admin_regrant_tx(uuid) to authenticated, service_role;

create or replace function public.admin_resend_receipt(p_tx uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_admin uuid;
begin
    v_admin := app_admin_assert();
    perform admin_email_enqueue_receipt(p_tx);
    insert into app_admin_action_log (admin_id, action, target)
    values (v_admin, 'resend_receipt', p_tx::text);
end;
$$;
revoke all on function public.admin_resend_receipt(uuid) from public, anon;
grant execute on function public.admin_resend_receipt(uuid) to authenticated, service_role;

create or replace function public.admin_force_end_session(p_session uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_admin uuid;
begin
    v_admin := app_admin_assert();
    update app_session
       set ended_at = now(), status = 'ended'
     where id = p_session and ended_at is null;
    if not found then raise exception 'session not found or already ended'; end if;
    insert into app_admin_action_log (admin_id, action, target)
    values (v_admin, 'force_end_session', p_session::text);
end;
$$;
revoke all on function public.admin_force_end_session(uuid) from public, anon;
grant execute on function public.admin_force_end_session(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 11) The deletion runbook — anonymize, never delete
--
-- The privacy policy promises account deletion/anonymization within 30 days.
-- Financial rows are kept for the 10-year bookkeeping duty (Art. 958f OR):
-- that is why this anonymizes the person and locks the login instead of
-- deleting rows. auth.users is NEVER deleted (its FK cascades to
-- app_profile, which financial FKs must keep).
-- ---------------------------------------------------------------------------
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
begin
    v_admin := app_admin_assert();

    select * into v_target from app_profile where id = p_user;
    if not found then raise exception 'profile not found'; end if;
    if v_target.is_admin then raise exception 'refusing to anonymize an admin account'; end if;

    -- 1) Profile scrub (row stays: financial FKs reference it)
    update app_profile set
        display_name    = 'Former member',
        full_name       = null,
        username        = null,
        avatar_url      = null,
        cover_image_url = null,
        bio             = null,
        tagline         = null,
        visibility      = 'private',
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

    -- 4) Storage objects owned by the user (avatars, covers)
    delete from storage.objects where owner = p_user or owner_id = p_user::text;

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
        'reason', p_reason
    );

    insert into app_admin_action_log (admin_id, action, target, detail)
    values (v_admin, 'anonymize_user', p_user::text, v_counts);

    return v_counts;
end;
$$;
revoke all on function public.admin_anonymize_user(uuid, text) from public, anon;
grant execute on function public.admin_anonymize_user(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 12) Audit log reader
-- ---------------------------------------------------------------------------
create or replace function public.admin_action_log(p_limit int default 100)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();
    select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]'::jsonb) into v
    from (
        select l.id, l.action, l.target, l.detail, l.created_at, p.display_name as admin_name
        from app_admin_action_log l
        join app_profile p on p.id = l.admin_id
        order by l.created_at desc
        limit least(greatest(coalesce(p_limit, 100), 1), 500)
    ) r;
    return v;
end;
$$;
revoke all on function public.admin_action_log(int) from public, anon;
grant execute on function public.admin_action_log(int) to authenticated, service_role;
