-- Atomic claim for the email outbox (deployed 2026-07-29).
--
-- Replaces an inline two-step claim in email_send_receipt that wrote NULL
-- into attempt_count (NOT NULL) as a "placeholder" — Postgres rejected it, so
-- the function 500'd on every real send. It was also not race-safe: two
-- concurrent invocations could claim the same row and send twice.
--
-- FOR UPDATE SKIP LOCKED is the standard queue pattern: the inner select locks
-- one pending row, concurrent callers skip past it, so each row is claimed
-- exactly once. attempt_count is bumped in the same statement.
--
-- Returns SETOF, not a bare composite: a plpgsql function returning
-- app_email_outbox hands back a ROW OF NULLS on an empty queue, which
-- serialises to {"id":null,...} and reads as truthy in JS, defeating the
-- caller's empty-queue guard. SETOF returns zero rows instead.
create or replace function app_claim_email(p_kind text)
returns setof app_email_outbox
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
      order by enqueued_at
        for update skip locked
      limit 1
   )
  returning *;
$$;

revoke all on function app_claim_email(text) from public, anon, authenticated;
grant execute on function app_claim_email(text) to service_role;

comment on function app_claim_email(text) is
  'Claims one pending app_email_outbox row of the given kind, bumping attempt_count. Race-safe via FOR UPDATE SKIP LOCKED. Returns zero rows when the queue is empty. service_role only.';
