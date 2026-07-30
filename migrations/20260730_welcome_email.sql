-- Founder welcome email on account creation (2026-07-30).
--
-- Every new PARTICIPANT account gets one short, personal note from Yves:
-- what INFITRA is, why it exists, and an invitation to reply. Deliberately
-- not sent to creators: founding experts join via personal invite links
-- after direct conversations with Yves, and an automated founder welcome to
-- someone he recruited personally would read as canned.
--
-- Deliberately minimal (email fatigue is real, per founder):
--   · no notification settings, no preferences: one email, once, at signup
--   · no CTA button: it is a note from a person, not a campaign; the only
--     ask is "reply and tell me what brought you here", which is also the
--     strongest deliverability signal a young domain can earn
--   · rides the existing outbox + drain; no new cron, no new sender
--
-- Mechanics:
--   · AFTER INSERT trigger on app_profile (created by app_handle_new_user in
--     the signup transaction)
--   · exception-guarded: a welcome-email failure must NEVER break signup
--     (same lesson as the receipt trigger, which could abort payments)
--   · dedupe: user_id + target_id = the profile id, so
--     uniq_email_outbox_user_kind_target guarantees one welcome ever
--   · no backfill: existing accounts (seed/test users) get nothing

alter table public.app_email_outbox
  drop constraint app_email_outbox_kind_check;
alter table public.app_email_outbox
  add constraint app_email_outbox_kind_check
  check (kind in ('receipt', 'session_reminder', 'welcome'));

create or replace function public.app_enqueue_welcome_email(p_user_id uuid)
returns bigint
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text;
  v_first text;
  v_html  text;
  v_text  text;
  v_id    bigint;
  h_first text;
  r       record;
begin
  select ap.display_name, ap.full_name, ap.username, au.email
    into r
    from app_profile ap
    join auth.users au on au.id = ap.id
   where ap.id = p_user_id;

  if not found or nullif(r.email, '') is null then
    return null;
  end if;

  v_email := r.email;
  v_first := app_receipt_greeting(null, r.display_name, r.full_name, r.username, v_email);
  h_first := replace(replace(replace(v_first, '&','&amp;'), '<','&lt;'), '>','&gt;');

  v_html := $html$<div style="background:#F2EFE8;padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">
      <tr><td style="padding:36px 32px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#0F2229;">

        <img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">

        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi {FIRST},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">I'm Yves, the founder of INFITRA. Thanks for being here this early.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">A short word on why this exists. Fitness moved online and became endless content, and it changed very little. What actually works is live: real experts with complementary skills in one room, and a group that shows up with you. That is what INFITRA is for: live experiences, built and run by two experts together.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">If you have already joined an experience, everything happens in your experience space. If you are just looking around, that is exactly right too.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">One thing I mean sincerely: reply to this email and tell me what brought you here. I read every answer myself.</p>
        <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Yves<br>
        <span style="color:#475569;font-size:13px;">Founder, INFITRA</span></p>

      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>
    <a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a></p>
  </td></tr></table>
</div>$html$;

  v_html := replace(v_html, '{FIRST}', h_first);

  v_text := $txt$Hi {FIRST},

I'm Yves, the founder of INFITRA. Thanks for being here this early.

A short word on why this exists. Fitness moved online and became
endless content, and it changed very little. What actually works is
live: real experts with complementary skills in one room, and a group
that shows up with you. That is what INFITRA is for: live experiences,
built and run by two experts together.

If you have already joined an experience, everything happens in your
experience space. If you are just looking around, that is exactly
right too.

One thing I mean sincerely: reply to this email and tell me what
brought you here. I read every answer myself.

Yves
Founder, INFITRA

INFITRA · Live experiences by complementary experts
www.infitra.fit$txt$;

  v_text := replace(v_text, '{FIRST}', v_first);

  insert into public.app_email_outbox
    (kind, to_email, subject, html_body, text_body, user_id, target_id)
  values
    ('welcome', v_email, 'Welcome to INFITRA', v_html, v_text, p_user_id, p_user_id)
  on conflict (user_id, kind, target_id)
    where user_id is not null and target_id is not null
    do nothing
  returning id into v_id;

  return v_id;
end;
$function$;

revoke all on function public.app_enqueue_welcome_email(uuid) from public, anon, authenticated;
grant execute on function public.app_enqueue_welcome_email(uuid) to service_role;

comment on function public.app_enqueue_welcome_email(uuid) is
  'Enqueues the one-time founder welcome email for a participant account. Idempotent via uniq_email_outbox_user_kind_target (target = the user themself). service_role/trigger only.';

create or replace function public.trg_profile_enqueue_welcome()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if NEW.role = 'participant' then
    -- Contained: this runs inside the signup transaction. If enqueueing
    -- fails for any reason, account creation must survive.
    begin
      perform public.app_enqueue_welcome_email(NEW.id);
    exception when others then
      raise warning 'welcome enqueue failed for profile %: %', NEW.id, sqlerrm;
    end;
  end if;
  return NEW;
end;
$function$;

drop trigger if exists trg_app_profile_enqueue_welcome on public.app_profile;
create trigger trg_app_profile_enqueue_welcome
  after insert on public.app_profile
  for each row execute function public.trg_profile_enqueue_welcome();

-- Found during the live test of this feature: app_email_outbox.user_id
-- referenced app_profile with no ON DELETE action, so an account that had
-- ever been emailed could not be deleted (23503). Email history must never
-- block account deletion; sent rows stay as delivery history, detached.
alter table public.app_email_outbox
  drop constraint app_email_outbox_user_id_fkey;
alter table public.app_email_outbox
  add constraint app_email_outbox_user_id_fkey
  foreign key (user_id) references public.app_profile(id) on delete set null;
