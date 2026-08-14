-- Purge technical logs (2026-08-15) — the retention policy, enforced.
--
-- The privacy policy states "Technical and security logs: up to 12
-- months". Before this migration NOTHING purged anything: edge call logs,
-- stream events, stream tokens and sent outbox rows accumulated forever,
-- which would have made the published retention claim false (adversarial
-- review blocker). A stated retention must have a mechanism.
--
-- What is purged, deliberately narrow:
--   · app_edge_call_log   > 12 months   (privileged-function audit trail)
--   · app_stream_event    > 12 months   (live-room webhook events)
--   · app_stream_token    expired > 30 days (short-lived room credentials)
--   · app_email_outbox    SENT > 12 months, EXCEPT kind='receipt' —
--     receipts are order-confirmation records under the 10-year
--     bookkeeping duty (Art. 958f OR) and are kept.
-- NOT touched: app_transaction_audit and every financial table (10-year
-- rule), unsent outbox rows (still owed), anything user-facing.

create or replace function public.app_purge_technical_logs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_n integer;
begin
  delete from app_edge_call_log where created_at < now() - interval '12 months';
  get diagnostics v_n = row_count; v_total := v_total + v_n;

  delete from app_stream_event where created_at < now() - interval '12 months';
  get diagnostics v_n = row_count; v_total := v_total + v_n;

  delete from app_stream_token where expires_at < now() - interval '30 days';
  get diagnostics v_n = row_count; v_total := v_total + v_n;

  delete from app_email_outbox
   where sent_at is not null
     and sent_at < now() - interval '12 months'
     and kind <> 'receipt';
  get diagnostics v_n = row_count; v_total := v_total + v_n;

  return v_total;
end;
$$;

revoke all on function public.app_purge_technical_logs() from public, anon, authenticated;
grant execute on function public.app_purge_technical_logs() to service_role;

comment on function public.app_purge_technical_logs() is
  'Enforces the privacy policy''s stated log retention: 12 months for technical logs, 30 days past expiry for stream tokens, receipts exempt (10-year bookkeeping). Cron/service only.';

select cron.schedule(
  'purge-technical-logs',
  '0 4 * * *',
  $job$ select public.app_purge_technical_logs(); $job$
);

-- First run now: proves the function and starts from a clean slate.
select public.app_purge_technical_logs();
