-- Make the payment path survive mid-flight failures (2026-07-30).
-- Applied to production as migration webhook_retry_safety; kept here for the
-- repo record. Companion change in functions/stripe_webhook/index.ts (v13).
--
-- Three holes, found by auditing the retry story end to end:
--
-- 1. THE EVENT LOCK SWALLOWED RETRIES. webhook_event_lock recorded only that
--    an event ARRIVED, not that processing FINISHED. The lock row is written
--    before any work happens, so any failure afterwards (DB hiccup, Stripe
--    PI retrieve down, crash) made Stripe's retry hit the 23505 dedupe and
--    get dropped: a paid purchase would never become a transaction or an
--    entitlement, permanently, with no alarm. processed_at distinguishes
--    "arrived" from "finished"; the webhook now reprocesses unfinished
--    events (every step is idempotent) and marks completion on all terminal
--    success paths. Existing rows backfilled as processed (their purchases
--    were verified recorded).
--
-- 2. THE RECEIPT TRIGGER COULD ABORT THE PAYMENT. trg_tx_enqueue_receipt is
--    an AFTER trigger in the same transaction as the tx insert, and
--    admin_email_enqueue_receipt RAISES (e.g. buyer_has_no_email). A raise
--    there rolled back the financial record itself. Now contained to a
--    warning: the payment always survives; the receipt can be enqueued by
--    the webhook's explicit call or by hand.
--
-- 3. DOUBLE-ENQUEUE WAS AN ERROR PATH. The webhook calls the enqueue RPC
--    after the trigger already ran; only ux_email_outbox_kind_tx stopped a
--    duplicate email, surfacing as a logged 23505 and a burned outbox id on
--    every purchase. The function is now idempotent: it returns the existing
--    row's id, with ON CONFLICT DO NOTHING + re-select for races.
--
-- Also in the webhook (v13), entitlement-grant failure now returns 5xx
-- instead of ok:true: the buyer HAS PAID at that point, and a swallowed
-- failure meant charged-but-no-access with only a console line as evidence.
-- With (1), the 5xx makes Stripe retry and the retry actually reprocesses.

alter table public.webhook_event_lock
  add column if not exists processed_at timestamptz;

comment on column public.webhook_event_lock.processed_at is
  'When processing COMPLETED. A lock row with processed_at NULL means a prior attempt died mid-flight; retries of such events must reprocess, not dedupe.';

update public.webhook_event_lock set processed_at = created_at where processed_at is null;

create or replace function public.trg_tx_enqueue_receipt()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_exists boolean;
begin
  if (TG_OP = 'INSERT' and NEW.status = 'succeeded')
     or (TG_OP = 'UPDATE' and NEW.status = 'succeeded' and (OLD.status is distinct from 'succeeded'))
  then
    select exists (
      select 1 from public.app_email_outbox
      where kind='receipt' and tx_id = NEW.id
    ) into v_exists;

    if not v_exists then
      -- Contained: this runs inside the transaction that records the payment.
      -- If enqueueing raises, the payment record must survive.
      begin
        perform public.admin_email_enqueue_receipt(NEW.id);
      exception when others then
        raise warning 'receipt enqueue failed for tx %: %', NEW.id, sqlerrm;
      end;
    end if;
  end if;

  return NEW;
end;
$function$;

-- admin_email_enqueue_receipt: idempotency prologue added (return existing
-- receipt id; ON CONFLICT (kind, tx_id) DO NOTHING + re-select on race) and
-- EXECUTE restricted to service_role. Full body lives in the applied
-- production migration webhook_retry_safety; the receipt template itself is
-- unchanged from 20260730_receipt_real_name.sql.
