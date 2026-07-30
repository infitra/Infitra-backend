-- Greet buyers by their real name (2026-07-30).
--
-- Receipts said "Hi there" even to a buyer who had set a display name, and
-- structurally always would. trg_tx_enqueue_receipt fires in the SAME
-- statement that inserts the transaction, so the receipt body is baked the
-- instant payment succeeds. The buy-intent signup (web/app/actions/auth.ts)
-- puts the email local part in display_name and leaves full_name null; the
-- buyer only chooses a real name afterwards, on the checkout success page.
-- Verified on a live purchase: tx_at and receipt_enqueued_at were identical
-- to the microsecond, and display_name was still "yves.imhasly" at that
-- moment even though "Yves" was set seconds later.
--
-- So the profile can never supply a name at receipt time. Stripe can:
-- checkout.session.completed carries customer_details.name, which the webhook
-- now persists to app_transaction.buyer_name.
--
-- KEY DISTINCTION, and the bug caught in review before shipping: the
-- email-handle test must NOT be applied to the Stripe name. Signup COPIES the
-- address into the profile, which is why that test exists. Stripe's name is
-- typed by a human into the card form. Testing it rejects legitimate names
-- that happen to match the address: "Yves Imhasly" from
-- yves.imhasly@outlook.com reduces to identical letters, so the buyer would
-- STILL have got "Hi there" from their own real name.
create or replace function public.app_receipt_greeting(
  p_buyer_name text, p_display_name text, p_full_name text,
  p_username text, p_email text
) returns text
language plpgsql immutable
as $$
declare
  v_local text;
  v_cand  text;
  v_first text;
begin
  v_local := lower(regexp_replace(split_part(coalesce(p_email,''), '@', 1), '[^a-zA-Z]', '', 'g'));
  v_first := null;

  if nullif(trim(coalesce(p_buyer_name, '')), '') is not null then
    -- Human-typed at checkout: real by construction, no handle test.
    v_first := split_part(trim(p_buyer_name), ' ', 1);
  else
    -- Auto-populated fields: presence proves nothing, so test each one and
    -- take the first that is not just the address.
    foreach v_cand in array array[p_display_name, p_full_name, p_username] loop
      v_cand := nullif(trim(coalesce(v_cand, '')), '');
      continue when v_cand is null;
      continue when lower(regexp_replace(v_cand, '[^a-zA-Z]', '', 'g')) = v_local;
      v_first := split_part(v_cand, ' ', 1);
      exit;
    end loop;
  end if;

  if v_first is null or v_first = '' then
    return 'there';
  end if;

  -- Cards often carry all-caps names ("YVES"); normalise those. Otherwise
  -- lift only the first letter, so "McKenna" and "d'Angelo" survive.
  if v_first = upper(v_first) then
    return upper(left(v_first, 1)) || lower(substr(v_first, 2));
  end if;
  return upper(left(v_first, 1)) || substr(v_first, 2);
end;
$$;

comment on function public.app_receipt_greeting(text,text,text,text,text) is
  'First name for a receipt greeting, or "there". Trusts the Stripe cardholder name outright; treats profile fields as suspect because signup copies the email local part into them.';

-- admin_email_enqueue_receipt() now calls the helper above instead of
-- inlining the rule. Applied to production in the same change; see
-- 20260730_receipt_greeting_fallback.sql for the full function body.
