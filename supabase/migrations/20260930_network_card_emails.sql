-- Founding-network card emails + participant welcome refresh (2026-09-30).
--
-- WHY: a card going live was silent on both sides. The member saw "Your
-- card is live" once and kept nothing; the founder learned about a new
-- member only by querying the database (Marco's and Michael's invites sat
-- unused for weeks, and nobody would have noticed the moment they flipped).
--
-- Two emails, enqueued the moment a card FIRST goes live
-- (community_consent_at goes NULL -> set, i.e. visibility leaves 'none'):
--   network_card_founder -> yves@infitra.fit: name, expert or studio, email,
--     one line, both card answers, city (profile_facts.city), link. Judge the
--     fit from the inbox.
--   network_welcome -> the member: a welcome into a network that is young
--     and taking shape with them. Company voice, signed by Yves as founder.
--     Wording approved by Yves on 30 Sep 2026.
--
-- This deliberately revisits one July decision: 20260730_welcome_email
-- kept creators out of automated mail because a canned FOUNDER note to
-- someone Yves recruited personally would read as fake. This is not a
-- founder note: it speaks as INFITRA ("we"), fires on the member's own
-- action, and says only what is true of their card.
--
-- Mechanics (the welcome / pilot-application pattern):
--   · AFTER UPDATE trigger WHEN (old.community_consent_at is null and
--     new.community_consent_at is not null). Not "UPDATE OF
--     community_consent_at": that column is set by the BEFORE trigger
--     trg_app_profile_community_consent, and a column list only sees the
--     UPDATE's own SET list, so it would never fire. Card edits (consent
--     already set) and re-consent to a new wording version (old not null)
--     do not fire.
--   · once per member, ever: the welcome dedupes on
--     uniq_email_outbox_user_kind_target; the founder mail on a NOT EXISTS
--     guard (its user_id stays null, as on the pilot mail: user_id is the
--     recipient's account). A withdraw-and-rejoin sends nothing twice.
--   · exception-guarded: an email failure never blocks joining.
--   · every member-typed field is HTML-escaped (app_html_escape).
--   · rides the existing outbox + per-minute drain; replies go to the
--     drain's global reply-to (hello@), which is what "just reply and tell
--     us" relies on.
--   · no backfill: Roberta's card went live on 9 Sep; a welcome now would
--     read as a malfunction.
--
-- Also: the participant welcome (app_enqueue_welcome_email) gets the
-- ecosystem paragraph approved on 30 Sep (studios, gyms and experts joining
-- forces; the add-on to training at your gym; what the participant gets),
-- "still looking" and a shorter closing question. Voice and footer unchanged.

alter table public.app_email_outbox
  drop constraint app_email_outbox_kind_check;
alter table public.app_email_outbox
  add constraint app_email_outbox_kind_check
  check (kind in ('receipt', 'session_reminder', 'session_reschedule', 'welcome',
                  'pilot_application_founder', 'pilot_application_confirm',
                  'network_card_founder', 'network_welcome'));

create or replace function public.app_enqueue_network_card_emails(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  p           record;
  v_type      text;
  v_first     text;
  v_rows_html text;
  v_rows_text text;
  v_html      text;
  v_text      text;
  lbl constant text := '<tr><td style="padding:6px 16px 6px 0;color:#475569;font-size:13px;white-space:nowrap;vertical-align:top;">';
  val constant text := '</td><td style="padding:6px 0;font-size:14px;color:#0F2229;">';
  shell_open constant text :=
       '<div style="background:#F2EFE8;padding:32px 12px;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">'
    || '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">'
    || '<tr><td style="padding:36px 32px;font-family:Inter,-apple-system,''Segoe UI'',Arial,sans-serif;color:#0F2229;">'
    || '<img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">';
begin
  select ap.display_name, ap.full_name, ap.username, ap.entity_type, ap.tagline,
         ap.brings, ap.seeks, ap.profile_facts ->> 'city' as city, ap.link_url, au.email
    into p
    from app_profile ap
    join auth.users au on au.id = ap.id
   where ap.id = p_profile_id;

  if not found then
    return;
  end if;

  v_type := case p.entity_type when 'studio' then 'Studio' when 'expert' then 'Expert' else 'Member' end;

  -- ── Founder notification: once per member, ever ─────────────────────
  if not exists (select 1 from app_email_outbox
                  where kind = 'network_card_founder' and target_id = p_profile_id) then
    v_rows_html := lbl || 'Name' || val || app_html_escape(p.display_name) || '</td></tr>'
                || lbl || 'Type' || val || v_type || '</td></tr>';
    v_rows_text := 'Name:        ' || coalesce(p.display_name, '') || E'\n'
                || 'Type:        ' || v_type || E'\n';

    if nullif(p.email, '') is not null then
      v_rows_html := v_rows_html || lbl || 'Email' || val
        || '<a href="mailto:' || app_html_escape(p.email) || '" style="color:#0891b2;text-decoration:none;">'
        || app_html_escape(p.email) || '</a></td></tr>';
      v_rows_text := v_rows_text || 'Email:       ' || p.email || E'\n';
    end if;
    if nullif(p.tagline, '') is not null then
      v_rows_html := v_rows_html || lbl || 'One line' || val || app_html_escape(p.tagline) || '</td></tr>';
      v_rows_text := v_rows_text || 'One line:    ' || p.tagline || E'\n';
    end if;
    if nullif(p.brings, '') is not null then
      v_rows_html := v_rows_html || lbl || 'Brings' || val || app_html_escape(p.brings) || '</td></tr>';
      v_rows_text := v_rows_text || 'Brings:      ' || p.brings || E'\n';
    end if;
    if nullif(p.seeks, '') is not null then
      v_rows_html := v_rows_html || lbl || 'Wants next' || val || app_html_escape(p.seeks) || '</td></tr>';
      v_rows_text := v_rows_text || 'Wants next:  ' || p.seeks || E'\n';
    end if;
    if nullif(p.city, '') is not null then
      v_rows_html := v_rows_html || lbl || 'City' || val || app_html_escape(p.city) || '</td></tr>';
      v_rows_text := v_rows_text || 'City:        ' || p.city || E'\n';
    end if;
    if nullif(p.link_url, '') is not null then
      v_rows_html := v_rows_html || lbl || 'Link' || val
        || case when p.link_url ~* '^https?://'
                then '<a href="' || app_html_escape(p.link_url) || '" style="color:#0891b2;text-decoration:none;">' || app_html_escape(p.link_url) || '</a>'
                else app_html_escape(p.link_url)
           end || '</td></tr>';
      v_rows_text := v_rows_text || 'Link:        ' || p.link_url || E'\n';
    end if;

    v_html := shell_open
      || '<p style="margin:0 0 20px;font-size:16px;font-weight:700;">New member in the founding network</p>'
      || '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">' || v_rows_html || '</table>'
      || '<p style="margin:24px 0 0;font-size:14px;"><a href="https://www.infitra.fit/network/explore" style="color:#0891b2;text-decoration:none;">See every card in the network</a></p>'
      || '</td></tr></table></td></tr></table></div>';
    v_text := 'New member in the founding network' || E'\n\n' || v_rows_text
           || E'\nSee every card: https://www.infitra.fit/network/explore\n';

    insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, target_id)
    values ('network_card_founder', 'yves@infitra.fit',
            coalesce(nullif(p.display_name, ''), 'A new member') || ' joined the founding network · ' || v_type,
            v_html, v_text, p_profile_id);
  end if;

  -- ── Member welcome: once per member, ever ───────────────────────────
  if nullif(p.email, '') is null then
    return;
  end if;

  v_first := app_receipt_greeting(null, p.display_name, p.full_name, p.username, p.email);

  v_html := shell_open || $html$
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi {FIRST},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Welcome to INFITRA's founding network. Your card is live.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">The network is young and taking shape right now, one member at a time: experts and studios who want to create together. What gets built here, the matches and the experiences, grows out of the people in it, and you are one of them. Your card carries the founding member badge, and it stays with you.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">The next member might be someone you already know: a colleague you admire, a studio you believe in, someone you would love to create something with. Just reply and tell us.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We are already looking for matches for you. And once the group has grown, the network opens to discovery, where every member sees the others and can show interest in working together.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">You can change your card any time: <a href="https://www.infitra.fit/network/edit" style="color:#0891b2;text-decoration:none;">infitra.fit/network/edit</a></p>
        <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Yves<br>
        <span style="color:#475569;font-size:13px;">Founder, INFITRA</span></p>

      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Professional collaboration in fitness and health, made easy<br>Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland<br>
    <a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a> · <a href="https://www.infitra.fit/imprint" style="color:#0891b2;text-decoration:none;">Legal Notice</a></p>
  </td></tr></table>
</div>$html$;
  v_html := replace(v_html, '{FIRST}', app_html_escape(v_first));

  v_text := $txt$Hi {FIRST},

Welcome to INFITRA's founding network. Your card is live.

The network is young and taking shape right now, one member at a time:
experts and studios who want to create together. What gets built here,
the matches and the experiences, grows out of the people in it, and you
are one of them. Your card carries the founding member badge, and it
stays with you.

The next member might be someone you already know: a colleague you
admire, a studio you believe in, someone you would love to create
something with. Just reply and tell us.

We are already looking for matches for you. And once the group has
grown, the network opens to discovery, where every member sees the
others and can show interest in working together.

You can change your card any time: https://www.infitra.fit/network/edit

Yves
Founder, INFITRA

INFITRA · Professional collaboration in fitness and health, made easy
Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland
www.infitra.fit · Legal notice: www.infitra.fit/imprint$txt$;
  v_text := replace(v_text, '{FIRST}', v_first);

  insert into public.app_email_outbox (kind, to_email, subject, html_body, text_body, user_id, target_id)
  values ('network_welcome', p.email, 'Welcome to INFITRA''s founding network', v_html, v_text, p_profile_id, p_profile_id)
  on conflict (user_id, kind, target_id)
    where user_id is not null and target_id is not null
    do nothing;
end;
$function$;

revoke all on function public.app_enqueue_network_card_emails(uuid) from public, anon, authenticated;
grant execute on function public.app_enqueue_network_card_emails(uuid) to service_role;

comment on function public.app_enqueue_network_card_emails(uuid) is
  'Enqueues the founder notification + member welcome when a founding-network card first goes live. Once per member ever. Trigger/service_role only; content rides the outbox drain.';

create or replace function public.trg_profile_network_card_emails()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Contained: this runs inside the member's join transaction. If
  -- enqueueing fails for any reason, the card still goes live.
  begin
    perform public.app_enqueue_network_card_emails(NEW.id);
  exception when others then
    raise warning 'network card email enqueue failed for %: %', NEW.id, sqlerrm;
  end;
  return NEW;
end;
$function$;

drop trigger if exists trg_app_profile_network_card_emails on public.app_profile;
create trigger trg_app_profile_network_card_emails
  after update on public.app_profile
  for each row
  when (old.community_consent_at is null and new.community_consent_at is not null)
  execute function public.trg_profile_network_card_emails();

-- ── Participant welcome: the ecosystem paragraph (30 Sep 2026) ─────────
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
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">I'm Yves, founder of INFITRA. Welcome, and thank you for being one of our Pioneers.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">On INFITRA, studios, gyms and experts join forces to offer you more complete and immersive experiences. Whether you add one to the training you already do at your gym or join one on its own, it runs live and online over several weeks. What you get is experts who go all in on their craft, direct access to them for your questions, and a group that moves with you.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">If you've already joined an experience, everything is waiting in your experience space. If you're still looking, take your time. The next ones are being built right now.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">What brought you here? Just reply, I read every answer myself.</p>
        <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">See you inside,</p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">Yves<br>
        <span style="color:#475569;font-size:13px;">Founder, INFITRA</span></p>

      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Professional collaboration in fitness and health, made easy<br>Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland<br>
    <a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a> · <a href="https://www.infitra.fit/imprint" style="color:#0891b2;text-decoration:none;">Legal Notice</a></p>
  </td></tr></table>
</div>$html$;

  v_html := replace(v_html, '{FIRST}', h_first);

  v_text := $txt$Hi {FIRST},

I'm Yves, founder of INFITRA. Welcome, and thank you for being one of
our Pioneers.

On INFITRA, studios, gyms and experts join forces to offer you more
complete and immersive experiences. Whether you add one to the training
you already do at your gym or join one on its own, it runs live and
online over several weeks. What you get is experts who go all in on
their craft, direct access to them for your questions, and a group that
moves with you.

If you've already joined an experience, everything is waiting in your
experience space. If you're still looking, take your time. The next
ones are being built right now.

What brought you here? Just reply, I read every answer myself.

See you inside,

Yves
Founder, INFITRA

INFITRA · Professional collaboration in fitness and health, made easy
Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland
www.infitra.fit · Legal notice: www.infitra.fit/imprint$txt$;

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
