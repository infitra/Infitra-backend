-- Pilot application emails (2026-08-09).
--
-- WHY: submitPilotApplication inserted a row and stopped. No email to the
-- founder, no confirmation to the applicant. Seven applications sat in
-- app_pilot_application discoverable only by hand-written SQL; with the
-- first LinkedIn post live, a silent funnel now costs pilot experts.
-- Same failure shape as the receipt bug: the write succeeds, so the
-- pipeline LOOKS complete.
--
-- Two emails per application, enqueued by an AFTER INSERT trigger
-- (mutation surface 4: a notification must be a consequence of the row
-- existing, not of which code path inserted it):
--
--   pilot_application_founder → yves@infitra.fit. Every field, so the
--     founder can judge fit from the inbox. Reply goes to hello@ (the
--     drain's global reply-to); the applicant's address is a mailto link.
--   pilot_application_confirm → the applicant. Founder-voice note: the
--     application arrived, Yves reads every one personally, reply works.
--     Applying into silence is where a supply-side funnel leaks.
--
-- Mechanics, all inherited from the welcome-email pattern:
--   · exception-guarded: an email failure must NEVER break the submit
--   · rides the existing outbox + per-minute drain; no new cron, sender,
--     or Edge Function (email_outbox_drain sends every kind)
--   · target_id = the application id; user_id stays null (applicants
--     rarely have accounts). One trigger firing per row = one email pair;
--     a re-submission is a new row and correctly notifies again.
--   · NO backfill: the 7 pre-existing applications are known to the
--     founder; mailing stale confirmations weeks later would read as a
--     malfunction.

-- Shared HTML-escape helper. Every enqueue function so far inlined the
-- same replace chain per field; this mail has ~9 user-supplied fields and
-- a missed one is an HTML-injection hole in the founder's inbox.
create or replace function public.app_html_escape(t text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$$;

comment on function public.app_html_escape(text) is
  'HTML-escapes &, <, > for embedding user text in outbox email bodies. Null-safe (null → empty string).';

alter table public.app_email_outbox
  drop constraint app_email_outbox_kind_check;
alter table public.app_email_outbox
  add constraint app_email_outbox_kind_check
  check (kind in ('receipt', 'session_reminder', 'welcome',
                  'pilot_application_founder', 'pilot_application_confirm'));

create or replace function public.app_enqueue_pilot_application_emails(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  a           record;
  v_first     text;
  v_audience  text;
  v_rows_html text := '';
  v_rows_text text := '';
  v_html      text;
  v_text      text;
begin
  select * into a from app_pilot_application where id = p_application_id;
  if not found then
    return;
  end if;

  v_audience := case a.audience_size_range
    when 'under_500'  then 'Under 500'
    when '500_to_2k'  then '500 to 2,000'
    when '2k_to_10k'  then '2,000 to 10,000'
    when '10k_to_50k' then '10,000 to 50,000'
    when 'over_50k'   then 'Over 50,000'
    else a.audience_size_range
  end;

  -- ── Founder notification ────────────────────────────────────────────
  -- Label/value rows, built only for fields the applicant filled.
  v_rows_html :=
       '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;white-space:nowrap;vertical-align:top;">Name</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.name) || '</td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Email</td>'
    || '<td style="padding:6px 0;font-size:14px;"><a href="mailto:' || app_html_escape(a.email) || '" style="color:#0891b2;text-decoration:none;">' || app_html_escape(a.email) || '</a></td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Expertise</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.expertise) || '</td></tr>';

  v_rows_text := 'Name:      ' || a.name || E'\n'
              || 'Email:     ' || a.email || E'\n'
              || 'Expertise: ' || a.expertise || E'\n';

  if a.channel_url is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Channel</td>'
      || '<td style="padding:6px 0;font-size:14px;">'
      || case when a.channel_url ~* '^https?://'
              then '<a href="' || app_html_escape(a.channel_url) || '" style="color:#0891b2;text-decoration:none;">' || app_html_escape(a.channel_url) || '</a>'
              else '<span style="color:#0F2229;">' || app_html_escape(a.channel_url) || '</span>'
         end
      || '</td></tr>';
    v_rows_text := v_rows_text || 'Channel:   ' || a.channel_url || E'\n';
  end if;

  if v_audience is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Audience</td>'
      || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(v_audience) || '</td></tr>';
    v_rows_text := v_rows_text || 'Audience:  ' || v_audience || E'\n';
  end if;

  if a.location is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Location</td>'
      || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.location) || '</td></tr>';
    v_rows_text := v_rows_text || 'Location:  ' || a.location || E'\n';
  end if;

  v_rows_html := v_rows_html
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Partner</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">'
    || case when a.has_partner
            then 'Has someone in mind' || case when a.partner_info is not null then ': ' || app_html_escape(a.partner_info) else '' end
            else 'Looking for a complement' || case when a.complement_interest is not null then ': ' || app_html_escape(a.complement_interest) else '' end
       end
    || '</td></tr>';
  v_rows_text := v_rows_text
    || 'Partner:   '
    || case when a.has_partner
            then 'has someone in mind' || coalesce(': ' || a.partner_info, '')
            else 'looking for a complement' || coalesce(': ' || a.complement_interest, '')
       end || E'\n';

  if a.success_description is not null then
    v_rows_html := v_rows_html
      || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Success</td>'
      || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.success_description) || '</td></tr>';
    v_rows_text := v_rows_text || 'Success:   ' || a.success_description || E'\n';
  end if;

  v_html := '<div style="background:#F2EFE8;padding:32px 12px;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">'
    || '<tr><td style="padding:36px 32px;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;color:#0F2229;">'
    || '<img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">'
    || '<p style="margin:0 0 20px;font-size:16px;font-weight:700;">New pilot application</p>'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' || v_rows_html || '</table>'
    || '</td></tr></table></td></tr></table></div>';

  v_text := 'New pilot application' || E'\n\n' || v_rows_text;

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
  values ('pilot_application_founder', 'yves@infitra.fit',
          'Pilot application: ' || a.name, v_html, v_text, a.id);

  -- ── Applicant confirmation ──────────────────────────────────────────
  if nullif(a.email, '') is null then
    return;
  end if;

  v_first := coalesce(nullif(split_part(a.name, ' ', 1), ''), a.name);

  v_html := '<div style="background:#F2EFE8;padding:32px 12px;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">'
    || '<tr><td style="padding:36px 32px;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;color:#0F2229;">'
    || '<img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ' || app_html_escape(v_first) || ',</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your application for the founding pilot has arrived. Thank you for taking the time.</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">I read every application myself and reply personally, usually within a few days.</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">In the meantime, the pilot terms are public: <a href="https://www.infitra.fit/pilot-terms" style="color:#0891b2;text-decoration:none;">www.infitra.fit/pilot-terms</a>. And if anything comes to mind, just reply to this email.</p>'
    || '<p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Speak soon,</p>'
    || '<p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Yves<br>'
    || '<span style="color:#475569;font-size:13px;">Founder, INFITRA</span></p>'
    || '</td></tr></table>'
    || '<p style="margin:20px 0 0;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>'
    || '<a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a></p>'
    || '</td></tr></table></div>';

  v_text := 'Hi ' || v_first || ',' || E'\n\n'
    || 'Your application for the founding pilot has arrived. Thank you' || E'\n'
    || 'for taking the time.' || E'\n\n'
    || 'I read every application myself and reply personally, usually' || E'\n'
    || 'within a few days.' || E'\n\n'
    || 'In the meantime, the pilot terms are public:' || E'\n'
    || 'https://www.infitra.fit/pilot-terms' || E'\n'
    || 'And if anything comes to mind, just reply to this email.' || E'\n\n'
    || 'Speak soon,' || E'\n\n'
    || 'Yves' || E'\n'
    || 'Founder, INFITRA' || E'\n\n'
    || 'INFITRA · Live experiences by complementary experts' || E'\n'
    || 'www.infitra.fit';

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
  values ('pilot_application_confirm', a.email,
          'Your INFITRA pilot application', v_html, v_text, a.id);
end;
$function$;

revoke all on function public.app_enqueue_pilot_application_emails(uuid) from public, anon, authenticated;
grant execute on function public.app_enqueue_pilot_application_emails(uuid) to service_role;

comment on function public.app_enqueue_pilot_application_emails(uuid) is
  'Enqueues the founder notification + applicant confirmation for one pilot application. Trigger/service_role only; content rides the outbox drain.';

create or replace function public.trg_pilot_application_enqueue_emails()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Contained: this runs inside the applicant's submit transaction. If
  -- enqueueing fails for any reason, the application itself must survive.
  begin
    perform public.app_enqueue_pilot_application_emails(NEW.id);
  exception when others then
    raise warning 'pilot application email enqueue failed for %: %', NEW.id, sqlerrm;
  end;
  return NEW;
end;
$function$;

drop trigger if exists trg_app_pilot_application_emails on public.app_pilot_application;
create trigger trg_app_pilot_application_emails
  after insert on public.app_pilot_application
  for each row execute function public.trg_pilot_application_enqueue_emails();
