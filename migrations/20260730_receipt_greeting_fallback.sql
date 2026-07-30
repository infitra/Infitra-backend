-- Don't greet people by their email handle (2026-07-30).
--
-- Signup auto-populates display_name and full_name from the email local part,
-- so "no real name" is indistinguishable from "real name" by presence alone.
-- A live purchase produced "Hi Krasavicaable," from krasavicaable@gmail.com:
-- display_name, full_name AND username were all variants of the handle.
--
-- Rule: if the best available name reduces to the same letters as the email
-- local part, it was derived from the address rather than chosen, so greet
-- "there" instead. Letters-only comparison so krasavicaable2599 also matches.
--
-- Deliberately conservative: someone genuinely called John at john@x.com gets
-- "Hi there," which is warm and never wrong. The failure it prevents ("Hi
-- Krasavicaable,") is worse than the one it causes.

create or replace function public.admin_email_enqueue_receipt(p_tx_id uuid)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tx        record;
  v_name      text;
  v_local     text;
  v_first     text;
  v_title     text;
  v_noun      text;   -- 'experience' | 'session'
  v_around    text;   -- what "everything" is, per kind
  v_fee_cents bigint;
  v_price     text;
  v_fee       text;
  v_total     text;
  v_date      text;
  v_subj      text;
  v_html      text;
  v_text      text;
  v_id        bigint;
  h_first     text;
  h_title     text;
begin
  select t.*,
         coalesce(nullif(ap.display_name, ''), nullif(ap.full_name, ''),
                  nullif(ap.username, ''))          as buyer_name,
         au.email                                    as buyer_email,
         coalesce(ch.title, s.title)                 as item_title
    into v_tx
    from public.app_transaction t
    left join public.app_profile   ap on ap.id = t.buyer_id
    left join auth.users           au on au.id = t.buyer_id
    left join public.app_challenge ch on ch.id = t.challenge_id
    left join public.app_session   s  on s.id  = t.session_id
   where t.id = p_tx_id;

  if not found then
    raise exception 'tx_not_found';
  end if;

  if v_tx.status <> 'succeeded' then
    raise exception 'only_succeeded_supported';
  end if;

  if nullif(v_tx.buyer_email, '') is null then
    raise exception 'buyer_has_no_email';
  end if;

  -- Buyer-facing vocabulary only. Never the type enums.
  v_noun   := case when v_tx.session_id is not null then 'session' else 'experience' end;
  v_around := case when v_tx.session_id is not null
                   then 'the live room, your host and the tribe'
                   else 'the live sessions, your tribe space and your experts' end;
  v_title  := coalesce(v_tx.item_title, 'your purchase');

  -- Greeting. See header: a "name" that is just the email handle is no name.
  v_name  := nullif(trim(coalesce(v_tx.buyer_name, '')), '');
  v_local := split_part(v_tx.buyer_email, '@', 1);
  if v_name is null
     or lower(regexp_replace(v_name,  '[^a-zA-Z]', '', 'g'))
      = lower(regexp_replace(v_local, '[^a-zA-Z]', '', 'g'))
  then
    v_first := 'there';
  else
    v_first := split_part(v_name, ' ', 1);
    -- Usernames are lowercase; greet "Astrid", not "astrid". First letter
    -- only, so "McKenna" survives (initcap would flatten it).
    v_first := upper(left(v_first, 1)) || substr(v_first, 2);
  end if;

  -- What the card was charged. nullif: the column defaults to 0 and the
  -- webhook never sets it, so 0 means "not recorded"; a genuine fee is never
  -- 0 under the live model (minimum 30 cents plus gross-up). Reconstruction
  -- mirrors create_checkout_session: total = ceil((base + 30) / 0.97).
  v_fee_cents := coalesce(
    nullif(v_tx.buyer_processing_fee_cents, 0),
    ceil((v_tx.amount_gross_cents + 30)::numeric / 0.97)::bigint - v_tx.amount_gross_cents
  );

  v_price := v_tx.currency || ' ' || to_char(v_tx.amount_gross_cents::numeric / 100, 'FM999999990.00');
  v_fee   := v_tx.currency || ' ' || to_char(v_fee_cents::numeric / 100, 'FM999999990.00');
  v_total := v_tx.currency || ' ' || to_char((v_tx.amount_gross_cents + v_fee_cents)::numeric / 100, 'FM999999990.00');
  v_date  := to_char(v_tx.created_at at time zone 'Europe/Zurich', 'FMDD FMMonth YYYY');

  v_subj := 'Your receipt · ' || v_title;

  -- Escape the two user-controlled strings that land in HTML.
  h_first := replace(replace(replace(v_first, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
  h_title := replace(replace(replace(v_title, '&', '&amp;'), '<', '&lt;'), '>', '&gt;');

  -- Token-substituted template rather than format(): the markup is full of
  -- literal '%' (widths), which format() would try to parse.
  v_html := $html$<div style="background:#F2EFE8;padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">
      <tr><td style="padding:36px 32px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#0F2229;">

        <img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">

        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi {FIRST},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Your spot in <strong>{TITLE}</strong> is confirmed. This email is your receipt.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4ED;border-radius:10px;">
          <tr><td style="padding:20px 24px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#0F2229;">
              <tr>
                <td style="padding:3px 0;color:#475569;">{NOUNCAP} price</td>
                <td style="padding:3px 0;text-align:right;font-weight:600;">{PRICE}</td>
              </tr>
              <tr>
                <td style="padding:3px 0 12px;color:#475569;">Card processing</td>
                <td style="padding:3px 0 12px;text-align:right;font-weight:600;">{FEE}</td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;border-top:1px solid #E5E0D5;font-weight:700;font-size:15px;">Total paid</td>
                <td style="padding:12px 0 0;border-top:1px solid #E5E0D5;text-align:right;font-weight:700;font-size:15px;">{TOTAL}</td>
              </tr>
            </table>
          </td></tr>
        </table>

        <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#475569;">Paid on {DATE}<br>Reference {REF}</p>

        <p style="margin:32px 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#0891b2;">What happens next</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Everything around your {NOUN} happens in one place on INFITRA: {AROUND}. Log in to see where things stand, add a photo and introduce yourself.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
          <tr><td style="background:#FF6130;border-radius:10px;">
            <a href="https://www.infitra.fit/login" style="display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700;font-size:15px;color:#FFFFFF;text-decoration:none;">Log in to INFITRA</a>
          </td></tr>
        </table>

        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">Questions? Just reply to this email.</p>

      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>
    <a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a></p>
  </td></tr></table>
</div>$html$;

  v_html := replace(v_html, '{FIRST}',   h_first);
  v_html := replace(v_html, '{TITLE}',   h_title);
  v_html := replace(v_html, '{NOUNCAP}', initcap(v_noun));
  v_html := replace(v_html, '{NOUN}',    v_noun);
  v_html := replace(v_html, '{AROUND}',  v_around);
  v_html := replace(v_html, '{PRICE}',   v_price);
  v_html := replace(v_html, '{FEE}',     v_fee);
  v_html := replace(v_html, '{TOTAL}',   v_total);
  v_html := replace(v_html, '{DATE}',    v_date);
  v_html := replace(v_html, '{REF}',     v_tx.id::text);

  v_text := $txt$Hi {FIRST},

Your spot in {TITLE} is confirmed. This email is your receipt.

  {ROW1}
  {ROW2}
  {ROW3}

  Paid on {DATE}
  Reference {REF}

What happens next
Everything around your {NOUN} happens in one place on INFITRA:
{AROUND}. Log in to see where things
stand, add a photo and introduce yourself.

Log in: https://www.infitra.fit/login

Questions? Just reply to this email.

INFITRA · Live experiences by complementary experts
www.infitra.fit$txt$;

  v_text := replace(v_text, '{FIRST}',   v_first);
  v_text := replace(v_text, '{TITLE}',   v_title);
  -- rpad keeps the money column aligned whatever the label length
  v_text := replace(v_text, '{ROW1}',    rpad(initcap(v_noun) || ' price', 18) || v_price);
  v_text := replace(v_text, '{ROW2}',    rpad('Card processing', 18) || v_fee);
  v_text := replace(v_text, '{ROW3}',    rpad('Total paid', 18) || v_total);
  v_text := replace(v_text, '{NOUN}',    v_noun);
  v_text := replace(v_text, '{AROUND}',  v_around);
  v_text := replace(v_text, '{DATE}',    v_date);
  v_text := replace(v_text, '{REF}',     v_tx.id::text);

  insert into public.app_email_outbox (kind, tx_id, to_email, subject, html_body, text_body)
  values ('receipt', p_tx_id, v_tx.buyer_email, v_subj, v_html, v_text)
  returning id into v_id;

  return v_id;
end;
$function$;
