-- Apply form cut to one screen (2026-09-17).
--
-- WHY: /apply had drifted into something between a contact form and
-- onboarding. Two fields carried the onboarding weight without earning it:
--
--   location            · the channel link usually says where someone is,
--                         and the personal reply asks when it doesn't
--   success_description · "What would a successful collaboration look like
--                         for you?", an essay question standing at the last
--                         step before submit, which is exactly where people
--                         leave. The answer arrives in the first reply.
--
-- Both are gone from the form and the server action, so the columns go in
-- the same migration (no dead code) along with their rows in the founder
-- notification. Nothing else reads them: admin_applications returns
-- row_to_json(a) and adapts on its own; the admin board's Location column
-- and Successful-collaboration tooltip were removed with the form.
--
-- app_pilot_application is empty today, so no data is lost.

alter table public.app_pilot_application
  drop column if exists location,
  drop column if exists success_description;

-- The notification, minus the two rows those columns fed. Everything else
-- is the deployed function verbatim.
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
  v_type      text;
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
  v_type := case when a.applicant_type = 'studio' then 'Studio or gym' else 'Expert' end;

  v_rows_html :=
       '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;white-space:nowrap;vertical-align:top;">Name</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.name) || '</td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Type</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || v_type || '</td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Email</td>'
    || '<td style="padding:6px 0;font-size:14px;"><a href="mailto:' || app_html_escape(a.email) || '" style="color:#0891b2;text-decoration:none;">' || app_html_escape(a.email) || '</a></td></tr>'
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Expertise</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">' || app_html_escape(a.expertise) || '</td></tr>';

  v_rows_text := 'Name:      ' || a.name || E'\n'
              || 'Type:      ' || v_type || E'\n'
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

  v_rows_html := v_rows_html
    || '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;vertical-align:top;">Featuring</td>'
    || '<td style="padding:6px 0;font-size:14px;color:#0F2229;">'
    || case when a.announce_consent then 'Yes: card on infitra.fit and in posts' else 'Switched off' end
    || '</td></tr>';
  v_rows_text := v_rows_text || 'Featuring: '
    || case when a.announce_consent then 'yes' else 'switched off' end || E'\n';

  v_html := '<div style="background:#F2EFE8;padding:32px 12px;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">'
    || '<tr><td style="padding:36px 32px;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;color:#0F2229;">'
    || '<img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">'
    || '<p style="margin:0 0 20px;font-size:16px;font-weight:700;">New founding network application</p>'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' || v_rows_html || '</table>'
    || '</td></tr></table></td></tr></table></div>';

  v_text := 'New founding network application' || E'\n\n' || v_rows_text;

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
  values ('pilot_application_founder', 'yves@infitra.fit',
          'Founding network (' || lower(v_type) || '): ' || a.name, v_html, v_text, a.id);

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
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your application for the founding network has arrived. Thank you for taking the time.</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We read every application personally and reply within a few days.</p>'
    || '<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">In the meantime, the pilot terms are public: <a href="https://www.infitra.fit/pilot-terms" style="color:#0891b2;text-decoration:none;">www.infitra.fit/pilot-terms</a>. And if anything comes to mind, just reply to this email.</p>'
    || '<p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Speak soon,</p>'
    || '<p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Yves<br>'
    || '<span style="color:#475569;font-size:13px;">Founder, INFITRA</span></p>'
    || '</td></tr></table>'
    || '<p style="margin:20px 0 0;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland<br>'
    || '<a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a> · <a href="https://www.infitra.fit/imprint" style="color:#0891b2;text-decoration:none;">Legal Notice</a></p>'
    || '</td></tr></table></div>';

  v_text := 'Hi ' || v_first || ',' || E'\n\n'
    || 'Your application for the founding network has arrived. Thank you' || E'\n'
    || 'for taking the time.' || E'\n\n'
    || 'We read every application personally and reply within a few days.' || E'\n\n'
    || 'In the meantime, the pilot terms are public:' || E'\n'
    || 'https://www.infitra.fit/pilot-terms' || E'\n'
    || 'And if anything comes to mind, just reply to this email.' || E'\n\n'
    || 'Speak soon,' || E'\n\n'
    || 'Yves' || E'\n'
    || 'Founder, INFITRA' || E'\n\n'
    || 'INFITRA · Live experiences by complementary experts' || E'\n'
    || 'Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland' || E'\n'
    || 'www.infitra.fit · Legal notice: www.infitra.fit/imprint';

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
  values ('pilot_application_confirm', a.email,
          'Your INFITRA founding network application', v_html, v_text, a.id);
end;
$function$;

revoke all on function public.app_enqueue_pilot_application_emails(uuid) from public, anon, authenticated;
grant execute on function public.app_enqueue_pilot_application_emails(uuid) to service_role;

comment on function public.app_enqueue_pilot_application_emails(uuid) is
  'Enqueues the founder notification + applicant confirmation for one founding network application. Trigger/service_role only; content rides the outbox drain.';
