-- Session reminder emails (2026-07-30).
--
-- One hour before a live session starts, every entitled participant gets a
-- short branded reminder. Same outbox architecture as receipts:
--
--   pg_cron (every minute) -> app_enqueue_session_reminders()  [this file]
--   pg_cron (every minute) -> email_outbox_drain Edge Function -> Resend
--
-- Design choices:
--   · Enqueued when a session enters the 60-minute window. The scan is
--     idempotent: uniq_email_outbox_user_kind_target (user_id, kind,
--     target_id) guarantees ONE reminder per participant per session ever,
--     so running every minute is safe and late buyers (purchase at T-30min)
--     are picked up on the next tick.
--   · Relative wording ("in about an hour"), no clock time. Recipients span
--     timezones and the email cannot know the reader's; the space shows the
--     localized time. A wrong-timezone clock reading is worse than none.
--   · Only status published/scheduled, not yet started. Cancelled or ended
--     sessions never remind.
--   · Participants only (attendance holders). Experts run the session and
--     set its time; a host reminder is a later, separate decision.

-- 1) The outbox now carries a second kind.
alter table public.app_email_outbox
  drop constraint app_email_outbox_kind_check;
alter table public.app_email_outbox
  add constraint app_email_outbox_kind_check
  check (kind in ('receipt', 'session_reminder'));

-- 2) The claim function drains any kind when p_kind is null, so one sender
--    serves every email type. Per-kind claiming still works.
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
      where kind = coalesce(p_kind, kind)
        and sent_at is null
        and attempt_count < 5   -- retire poison rows
      order by enqueued_at
        for update skip locked
      limit 1
   )
  returning *;
$$;

revoke all on function public.app_claim_email(text) from public, anon, authenticated;
grant execute on function public.app_claim_email(text) to service_role;

comment on function public.app_claim_email(text) is
  'Claims one pending app_email_outbox row (of the given kind, or any kind when null), bumping attempt_count. Race-safe via FOR UPDATE SKIP LOCKED. Skips rows past 5 attempts; zero rows when nothing claimable. service_role only.';

-- 3) The enqueuer.
create or replace function public.app_enqueue_session_reminders()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r         record;
  v_first   text;
  v_part_of text;
  v_url     text;
  v_subj    text;
  v_html    text;
  v_text    text;
  h_first   text;
  h_title   text;
  h_exp     text;
  v_count   integer := 0;
begin
  for r in
    select s.id          as session_id,
           s.title       as session_title,
           cs.challenge_id,
           ch.title      as experience_title,
           a.user_id,
           au.email      as to_email,
           ap.display_name, ap.full_name, ap.username
      from app_session s
      join app_attendance a          on a.session_id = s.id
      join auth.users au             on au.id = a.user_id
      left join app_profile ap       on ap.id = a.user_id
      left join app_challenge_session cs on cs.session_id = s.id
      left join app_challenge ch     on ch.id = cs.challenge_id
     where s.status in ('published', 'scheduled')
       and s.started_at is null
       and s.start_time >  now()
       and s.start_time <= now() + interval '60 minutes'
       and nullif(au.email, '') is not null
       -- cheap pre-filter; the unique index is the real guarantee
       and not exists (
         select 1 from app_email_outbox o
          where o.kind = 'session_reminder'
            and o.user_id = a.user_id
            and o.target_id = s.id
       )
  loop
    v_first := app_receipt_greeting(
      null, r.display_name, r.full_name, r.username, r.to_email);

    v_url := case when r.challenge_id is not null
                  then 'https://www.infitra.fit/experiences/' || r.challenge_id || '/space'
                  else 'https://www.infitra.fit/me' end;

    h_first := replace(replace(replace(v_first, '&','&amp;'), '<','&lt;'), '>','&gt;');
    h_title := replace(replace(replace(coalesce(r.session_title,'Your live session'), '&','&amp;'), '<','&lt;'), '>','&gt;');
    h_exp   := replace(replace(replace(coalesce(r.experience_title,''), '&','&amp;'), '<','&lt;'), '>','&gt;');

    v_part_of := case when r.experience_title is not null
                      then ', part of <strong>' || h_exp || '</strong>,'
                      else '' end;

    v_subj := 'Starts in about an hour · ' || coalesce(r.session_title, 'your live session');

    v_html := $html$<div style="background:#F2EFE8;padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">
      <tr><td style="padding:36px 32px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#0F2229;">

        <img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">

        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi {FIRST},</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>{TITLE}</strong>{PARTOF} starts in about an hour.</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Your experts and your tribe will be in the live room. Jump in a few minutes early so you start settled.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
          <tr><td style="background:#FF6130;border-radius:10px;">
            <a href="{URL}" style="display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700;font-size:15px;color:#FFFFFF;text-decoration:none;">Go to your session</a>
          </td></tr>
        </table>

        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">Questions? Just reply to this email.</p>

      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>
    <a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a></p>
  </td></tr></table>
</div>$html$;

    v_html := replace(v_html, '{FIRST}',  h_first);
    v_html := replace(v_html, '{TITLE}',  h_title);
    v_html := replace(v_html, '{PARTOF}', v_part_of);
    v_html := replace(v_html, '{URL}',    v_url);

    v_text := $txt$Hi {FIRST},

{TITLE}{PARTOF} starts in about an hour.

Your experts and your tribe will be in the live room. Jump in a
few minutes early so you start settled.

Go to your session: {URL}

Questions? Just reply to this email.

INFITRA · Live experiences by complementary experts
www.infitra.fit$txt$;

    v_text := replace(v_text, '{FIRST}',  v_first);
    v_text := replace(v_text, '{TITLE}',  coalesce(r.session_title, 'Your live session'));
    v_text := replace(v_text, '{PARTOF}', case when r.experience_title is not null
                                               then ', part of ' || r.experience_title || ','
                                               else '' end);
    v_text := replace(v_text, '{URL}',    v_url);

    insert into public.app_email_outbox
      (kind, to_email, subject, html_body, text_body, user_id, target_id)
    values
      ('session_reminder', r.to_email, v_subj, v_html, v_text, r.user_id, r.session_id)
    on conflict (user_id, kind, target_id)
      where user_id is not null and target_id is not null
      do nothing;

    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$function$;

revoke all on function public.app_enqueue_session_reminders() from public, anon, authenticated;
grant execute on function public.app_enqueue_session_reminders() to service_role;

comment on function public.app_enqueue_session_reminders() is
  'Enqueues one session_reminder outbox row per entitled participant for sessions entering the 60-minute pre-start window. Idempotent via uniq_email_outbox_user_kind_target; scheduled every minute by pg_cron.';

-- 4) Cron: scan every minute. Pure SQL, no pg_net needed.
--    Applied against production as:
--      select cron.schedule('enqueue-session-reminders', '* * * * *',
--        'select public.app_enqueue_session_reminders();');
