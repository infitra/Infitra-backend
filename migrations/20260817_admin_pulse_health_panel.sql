-- =============================================================================
-- admin_pulse() v3: the full health panel (2026-08-17, founder ask)
--
-- The Pulse becomes a systematic invariant checker: every failure or
-- contradiction OBSERVABLE IN THE DATABASE gets a named check with a count.
-- Green means "these 18 things were verified just now", not "no news".
--
-- The checks (domain / key):
--   money / paid_no_entitlement   buyer paid, entitlement missing (SR-MB4)
--   money / receipts_missing      succeeded tx without receipt, receipt-era only
--   money / webhook_stuck         webhook_event_lock row with processed_at NULL
--                                 older than 10min = webhook ARRIVED, processing
--                                 DIED midway (the idempotency ledger as detector)
--   money / tx_pending_stuck      pending > 1h = checkout started, never resolved
--   money / tx_disputed           any dispute (card declines are business, not system)
--   money / split_math            platform_cut + creator_cut <> gross (SR-I6)
--   money / refunded_still_member refunded buyer still holds membership
--   money / splits_over_100       cohost splits exceed 100% (verifies SR-I4 trigger)
--   money / member_no_purchase    membership without payment, owner/cohost excluded
--   live  / overdue_unswept       session past start+duration+75min not ended =
--                                 sweep-overdue-sessions failed
--   live  / imminent_no_room      published session starting within 10min without a
--                                 room = precreate-rooms (15min lead) failed
--   live  / experience_uncompleted published challenge ended > 1 day ago =
--                                 complete-ended-experiences failed
--   comms / outbox_failing        unsent after >= 3 attempts
--   comms / outbox_stalled        oldest unsent > 10min (drain runs every minute)
--   jobs  / cron_stale            job silent beyond its own schedule*2 + 10min
--   jobs  / cron_failed           latest run of an active job errored
--   accounts / auth_no_profile    auth user without profile = signup trigger failed
--   accounts / consent_missing    account created after the consent machinery
--                                 shipped (2026-08-15) without terms_version
--
-- Known dead spot, accepted deliberately: edge-function RUNTIME errors live in
-- Supabase platform logs, not the DB. Their CONSEQUENCES are what the checks
-- above catch (a dead webhook -> webhook_stuck/paid_no_entitlement; a dead
-- precreate -> imminent_no_room). The board says this out loud.
--
-- Also here: admin_experiences() drops drafts (workspace noise, not oversight).
-- =============================================================================

create or replace function public.admin_pulse()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v jsonb;
    v_receipt_era timestamptz;
    v_cron jsonb;
begin
    perform app_admin_assert();

    select coalesce(min(enqueued_at), now()) into v_receipt_era
    from app_email_outbox where kind = 'receipt';

    select coalesce(jsonb_agg(jsonb_build_object(
        'job', c.jobname,
        'schedule', c.schedule,
        'active', c.active,
        'last_status', c.status,
        'last_run_at', c.end_time,
        'minutes_since_run', c.mins,
        'expected_every_minutes', c.period,
        'is_stale', c.active and (c.mins is null or c.mins > c.period * 2 + 10)
    ) order by c.jobname), '[]'::jsonb) into v_cron
    from (
        select
            j.jobname, j.schedule, j.active, d.status, d.end_time,
            case when d.end_time is null then null
                 else (extract(epoch from (now() - d.end_time)) / 60)::int end as mins,
            case
                when j.schedule = '* * * * *' then 1
                when j.schedule ~ '^\*/[0-9]+ \* \* \* \*$' then substring(j.schedule from '^\*/([0-9]+)')::int
                when j.schedule ~ '^[0-9]+ \* \* \* \*$' then 60
                when j.schedule ~ '^[0-9]+ [0-9]+ \* \* \*$' then 1440
                else 1440
            end as period
        from cron.job j
        left join lateral (
            select status, end_time from cron.job_run_details
            where jobid = j.jobid order by start_time desc limit 1
        ) d on true
    ) c;

    select jsonb_build_object(
        'checks', (
            select jsonb_agg(jsonb_build_object(
                'key', c.key, 'domain', c.domain, 'label', c.label,
                'count', c.cnt, 'ok', c.cnt = 0, 'hint', c.hint
            ) order by c.domain, c.key)
            from (values
                ('paid_no_entitlement', 'money', 'Paid but no entitlement',
                    (select count(*) from app_transaction t
                     where t.status = 'succeeded' and (
                       (t.session_id is not null and not exists (select 1 from app_attendance a where a.session_id = t.session_id and a.user_id = t.buyer_id))
                       or
                       (t.challenge_id is not null and not exists (select 1 from app_challenge_member m where m.challenge_id = t.challenge_id and m.user_id = t.buyer_id)))),
                    'Webhook succeeded but the buyer got nothing. Repair: Money tab, Re-grant.'),
                ('receipts_missing', 'money', 'Receipt not enqueued',
                    (select count(*) from app_transaction t
                     where t.status = 'succeeded' and t.created_at > v_receipt_era
                       and not exists (select 1 from app_email_outbox o where o.tx_id = t.id and o.kind = 'receipt')),
                    'Receipt is the statutory order confirmation. Repair: Money tab, Re-send.'),
                ('webhook_stuck', 'money', 'Webhook arrived, processing died',
                    (select count(*) from webhook_event_lock
                     where processed_at is null and created_at < now() - interval '10 minutes'),
                    'Idempotency lock taken, never released: the handler crashed midway.'),
                ('tx_pending_stuck', 'money', 'Payment pending > 1h',
                    (select count(*) from app_transaction where status = 'pending' and created_at < now() - interval '1 hour'),
                    'Checkout started, never resolved by a webhook.'),
                ('tx_disputed', 'money', 'Disputed payments',
                    (select count(*) from app_transaction where status = 'disputed'),
                    'A chargeback is running. React within Stripe''s deadline.'),
                ('split_math', 'money', 'Split math broken',
                    (select count(*) from app_transaction where status = 'succeeded'
                       and platform_cut_cents + creator_cut_cents <> amount_gross_cents),
                    'platform + creator must equal gross on every sale (SR-I6).'),
                ('refunded_still_member', 'money', 'Refunded but still member',
                    (select count(*) from app_transaction t
                     where t.status = 'refunded' and t.challenge_id is not null
                       and exists (select 1 from app_challenge_member m where m.challenge_id = t.challenge_id and m.user_id = t.buyer_id)),
                    'Money went back but access remained.'),
                ('splits_over_100', 'money', 'Cohost splits over 100%',
                    (select count(*) from (select challenge_id from app_challenge_cohost group by challenge_id having sum(split_percent) > 100) x),
                    'Should be impossible (SR-I4 trigger). Red here = the trigger broke.'),
                ('member_no_purchase', 'money', 'Membership without payment',
                    (select count(*) from app_challenge_member m
                     join app_challenge c2 on c2.id = m.challenge_id
                     where m.user_id <> c2.owner_id
                       and not exists (select 1 from app_challenge_cohost ch where ch.challenge_id = m.challenge_id and ch.cohost_id = m.user_id)
                       and not exists (select 1 from app_transaction t where t.challenge_id = m.challenge_id and t.buyer_id = m.user_id and t.status = 'succeeded')),
                    'Someone is inside who never paid and is not on the expert team.'),
                ('overdue_unswept', 'live', 'Overdue session not swept',
                    (select count(*) from app_session
                     where status in ('published','scheduled') and ended_at is null
                       and start_time + (coalesce(duration_minutes,60) || ' minutes')::interval + interval '75 minutes' < now()),
                    'sweep-overdue-sessions should have ended this long ago.'),
                ('imminent_no_room', 'live', 'Session imminent, no room',
                    (select count(*) from app_session
                     where status in ('published','scheduled') and ended_at is null and live_room_id is null
                       and start_time between now() and now() + interval '10 minutes'),
                    'precreate-rooms (15min lead) has not delivered. People are about to hit a wall.'),
                ('experience_uncompleted', 'live', 'Ended experience not completed',
                    (select count(*) from app_challenge
                     where status = 'published' and end_date < current_date - 1),
                    'complete-ended-experiences should have closed this.'),
                ('outbox_failing', 'comms', 'Emails failing (3+ attempts)',
                    (select count(*) from app_email_outbox where sent_at is null and attempt_count >= 3),
                    'The drain is retrying and losing. Details below.'),
                ('outbox_stalled', 'comms', 'Outbox stalled > 10min',
                    (select count(*) from app_email_outbox
                     where sent_at is null and enqueued_at < now() - interval '10 minutes'),
                    'Drain runs every minute; anything this old means it is not draining.'),
                ('cron_stale', 'jobs', 'Cron job silent',
                    (select count(*) from jsonb_array_elements(v_cron) c where (c ->> 'is_stale')::bool),
                    'A job missed its own schedule by 2x + 10min.'),
                ('cron_failed', 'jobs', 'Cron job errored',
                    (select count(*) from jsonb_array_elements(v_cron) c
                     where (c ->> 'active')::bool and c ->> 'last_status' is not null and c ->> 'last_status' <> 'succeeded'),
                    'The latest run of an active job did not succeed.'),
                ('auth_no_profile', 'accounts', 'Auth user without profile',
                    (select count(*) from auth.users u
                     where not exists (select 1 from app_profile p where p.id = u.id)
                       and u.created_at < now() - interval '5 minutes'),
                    'Signup trigger failed: the person can log in but has no account.'),
                ('consent_missing', 'accounts', 'Signup without consent stamp',
                    (select count(*) from app_profile p join auth.users u on u.id = p.id
                     where p.created_at > '2026-08-15' and (u.raw_user_meta_data ->> 'terms_version') is null
                       and u.email not like 'deleted+%'),
                    'Every signup since the consent machinery must carry terms_version.')
            ) as c(key, domain, label, cnt, hint)
        ),
        'outbox_failed_rows', (
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
        ),
        'receipts_missing_historical', (
            select count(*) from app_transaction t
            where t.status = 'succeeded' and t.created_at <= v_receipt_era
              and not exists (select 1 from app_email_outbox o where o.tx_id = t.id and o.kind = 'receipt')
        ),
        'receipt_era_started', v_receipt_era,
        'cron', v_cron,
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

-- Experiences tab: drafts are workspace noise, not oversight material.
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
        where c.status <> 'draft'
    ) x;

    return v;
end;
$$;
revoke all on function public.admin_experiences() from public, anon;
grant execute on function public.admin_experiences() to authenticated, service_role;
