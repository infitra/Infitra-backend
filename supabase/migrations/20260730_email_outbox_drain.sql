-- Automatic outbox drain + retry cap (2026-07-30).
--
-- WHY THIS EXISTS: a real buyer purchased and never received her receipt.
-- The row was enqueued correctly by the stripe_webhook trigger and then sat
-- in app_email_outbox with attempt_count 0, because NOTHING invoked
-- email_send_receipt. The outbox had no drain: every receipt since launch
-- depended on someone calling the function by hand.
--
-- Two parts:
--
-- 1. Retry cap in app_claim_email. Previously any unsent row was claimable
--    forever, so once a per-minute schedule exists a hard-bouncing address
--    would be retried 1440 times a day indefinitely, burning quota and
--    sending repeated bounces to Resend (which harms sender reputation).
--    Rows are now retired after MAX attempts and left for inspection.
--
-- 2. A pg_cron job invoking the Edge Function every minute. Receipts are
--    transactional, so latency matters: a minute is the coarsest delay a
--    buyer should ever see between paying and being reassured.

-- Keep the signature and grants; add the attempt ceiling.
create or replace function public.app_claim_email(p_kind text)
returns setof public.app_email_outbox
language sql
security definer
set search_path = public
as $$
  update app_email_outbox
     set attempt_count = attempt_count + 1
   where id = (
     select id
       from app_email_outbox
      where kind = p_kind
        and sent_at is null
        and attempt_count < 5   -- retire poison rows; see header
      order by enqueued_at
        for update skip locked
      limit 1
   )
  returning *;
$$;

revoke all on function public.app_claim_email(text) from public, anon, authenticated;
grant execute on function public.app_claim_email(text) to service_role;

comment on function public.app_claim_email(text) is
  'Claims one pending app_email_outbox row of the given kind, bumping attempt_count. Race-safe via FOR UPDATE SKIP LOCKED. Skips rows past 5 attempts and returns zero rows when nothing is claimable. service_role only.';

-- Cron: invoke the sender every minute.
--
-- Uses the ANON key, not service_role: the Edge Function runs verify_jwt, so
-- it only needs a valid JWT, and anon is public by design (it ships in the
-- frontend). Storing service_role here would put a full RLS-bypass key in the
-- database for no added capability.
--
-- Applied against production as:
--
--   select vault.create_secret('<anon jwt>', 'edge_invoke_key',
--     'Anon JWT used by cron jobs to invoke Edge Functions.');
--
--   select cron.schedule(
--     'drain-email-outbox',
--     '* * * * *',
--     $job$
--     select net.http_post(
--       url     := 'https://okcujzmlpwijjxwhuehe.supabase.co/functions/v1/email_send_receipt',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || (
--           select decrypted_secret from vault.decrypted_secrets
--            where name = 'edge_invoke_key')
--       ),
--       body    := '{}'::jsonb,
--       timeout_milliseconds := 25000
--     );
--     $job$
--   );
--
-- Kept as comments because the secret value must not live in git. pg_net is
-- required: create extension if not exists pg_net with schema extensions;
