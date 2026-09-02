-- =============================================================================
-- admin_pulse(): make the alarms mean something (2026-08-17)
--
-- Two false alarms found on the board's first real load. A monitoring surface
-- that is permanently red trains you to ignore it, so both were fixed at the
-- source rather than tolerated:
--
-- 1. CRON STALENESS was a flat "> 120 minutes", which flags every DAILY job
--    every single day. Staleness is now relative to each job's OWN schedule:
--    the expected period is derived from the cron expression and the RPC
--    returns an is_stale flag (the frontend no longer guesses). Tolerance is
--    period*2 + 10min, so per-minute jobs alarm at 12min, */5 at 20min, and a
--    daily job after ~2 days. A job that has never run is stale by definition.
--
-- 2. RECEIPTS MISSING counted 14 succeeded transactions with no receipt row,
--    but every one of them predates the receipt pipeline (newest such tx
--    2026-07-17; earliest receipt ever enqueued 2026-07-29 — no overlap, i.e.
--    the pipeline has never missed one since it shipped). A rolling window was
--    the wrong discriminator (all 14 fall inside 90 days). The real boundary
--    is the receipt-pipeline era, which is derivable from the data itself:
--    min(enqueued_at) over receipts. Receipts are exempt from the log-purge
--    cron (10-year bookkeeping rule), so that minimum is stable forever. With
--    no receipts at all the cutoff collapses to now() — no alarm, the correct
--    default for "nothing has ever been sold".
--
-- The legacy count is still returned as receipts_missing_historical so the
-- board can show it as context.
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
begin
    perform app_admin_assert();

    select coalesce(min(enqueued_at), now()) into v_receipt_era
    from app_email_outbox where kind = 'receipt';

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
              and t.created_at > v_receipt_era
              and not exists (select 1 from app_email_outbox o where o.tx_id = t.id and o.kind = 'receipt')
        ),
        'receipts_missing_historical', (
            select count(*)
            from app_transaction t
            where t.status = 'succeeded'
              and t.created_at <= v_receipt_era
              and not exists (select 1 from app_email_outbox o where o.tx_id = t.id and o.kind = 'receipt')
        ),
        'receipt_era_started', v_receipt_era,
        'cron', (
            select coalesce(jsonb_agg(jsonb_build_object(
                'job', c.jobname,
                'schedule', c.schedule,
                'active', c.active,
                'last_status', c.status,
                'last_run_at', c.end_time,
                'minutes_since_run', c.mins,
                'expected_every_minutes', c.period,
                'is_stale', c.active and (c.mins is null or c.mins > c.period * 2 + 10)
            ) order by c.jobname), '[]'::jsonb)
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
            ) c
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
