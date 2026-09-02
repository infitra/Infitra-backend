-- =============================================================================
-- Emergency session rescheduling (2026-08-17)
--
-- Founder constraints: a reason is REQUIRED, the flow is tucked away (it is
-- for emergencies — illness, family emergency, a session that genuinely
-- cannot be held), and participants are notified immediately with the
-- reason and the new time.
--
-- Surface decision (CLAUDE.md rule 8): this is a structured atomic op with
-- side effects across domains -> RPC. It is also the ONLY door: RLS lets
-- experts edit sessions only in draft status, so published sessions have no
-- client edit path that could bypass the reason + notification.
--
-- The three tentacles a moved start_time pulls, all handled atomically:
--   1. ROOMS   live_room_id/stream_url are cleared. Daily names rooms
--              randomly (no collision), the orphaned room expires on its own
--              TTL, and precreate-rooms builds a fresh one at the new
--              15-minute lead.
--   2. REMINDERS old session_reminder outbox rows for this session are
--              deleted so the per-minute cron re-arms for the new time
--              (dedupe = unique (user_id, kind, target_id); deleting is the
--              re-arm). pre_pulse_fired_at resets for the same reason.
--   3. SWEEP   keys off start_time, so the new time IS the new sweep clock.
--
-- Notification: kind='session_reschedule' outbox rows with target_id NULL —
-- deliberately, because the partial unique index on (user_id, kind,
-- target_id) would swallow the notification of a SECOND reschedule of the
-- same session. The RPC enqueues exactly once per event, so no dedupe is
-- needed. Recipients: entitled participants (attendance ∪ challenge members)
-- plus the expert team (host, session cohosts, challenge owner + cohosts),
-- minus the expert who acted.
-- =============================================================================

create or replace function public.app_enqueue_session_reschedule_emails(
    p_session uuid,
    p_old_start timestamptz,
    p_new_start timestamptz,
    p_reason text,
    p_actor uuid
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    r         record;
    v_s       record;
    v_tz      text := 'Asia/Phnom_Penh';  -- Project display convention (see
                                          -- project memory: sessions entered +
                                          -- displayed in this zone). Becomes a
                                          -- per-experience setting if/when
                                          -- experiences carry their own zone.
    v_old     text;
    v_new     text;
    v_url     text;
    v_subj    text;
    v_first   text;
    v_part_of text;
    v_html    text;
    v_text    text;
    h_first   text;
    h_title   text;
    h_exp     text;
    h_reason  text;
    v_count   integer := 0;
begin
    select s.id, s.title, cs.challenge_id, ch.title as experience_title
      into v_s
      from app_session s
      left join app_challenge_session cs on cs.session_id = s.id
      left join app_challenge ch on ch.id = cs.challenge_id
     where s.id = p_session;
    if not found then return 0; end if;

    v_old := to_char(p_old_start at time zone v_tz, 'Dy DD Mon · HH24:MI') || ' (GMT+7)';
    v_new := to_char(p_new_start at time zone v_tz, 'Dy DD Mon · HH24:MI') || ' (GMT+7)';
    v_url := case when v_s.challenge_id is not null
                  then 'https://www.infitra.fit/experiences/' || v_s.challenge_id || '/space'
                  else 'https://www.infitra.fit/me' end;
    v_subj := 'New time · ' || coalesce(v_s.title, 'your live session');

    h_title  := replace(replace(replace(coalesce(v_s.title,'Your live session'), '&','&amp;'), '<','&lt;'), '>','&gt;');
    h_exp    := replace(replace(replace(coalesce(v_s.experience_title,''), '&','&amp;'), '<','&lt;'), '>','&gt;');
    h_reason := replace(replace(replace(coalesce(p_reason,''), '&','&amp;'), '<','&lt;'), '>','&gt;');

    for r in
        select distinct ids.user_id,
               au.email as to_email,
               ap.display_name, ap.full_name, ap.username
          from (
            select a.user_id from app_attendance a where a.session_id = p_session
            union
            select m.user_id
              from app_challenge_member m
              join app_challenge_session cs on cs.challenge_id = m.challenge_id
             where cs.session_id = p_session
            union
            select s.host_id from app_session s where s.id = p_session
            union
            select sc.cohost_id from app_session_cohost sc where sc.session_id = p_session
            union
            select ch.owner_id
              from app_challenge ch
              join app_challenge_session cs2 on cs2.challenge_id = ch.id
             where cs2.session_id = p_session
            union
            select cc.cohost_id
              from app_challenge_cohost cc
              join app_challenge_session cs3 on cs3.challenge_id = cc.challenge_id
             where cs3.session_id = p_session
          ) ids
          join auth.users au on au.id = ids.user_id
          left join app_profile ap on ap.id = ids.user_id
         where ids.user_id <> p_actor
           and nullif(au.email, '') is not null
           and au.email not like 'deleted+%'
    loop
        v_first := app_receipt_greeting(null, r.display_name, r.full_name, r.username, r.to_email);
        h_first := replace(replace(replace(v_first, '&','&amp;'), '<','&lt;'), '>','&gt;');
        v_part_of := case when v_s.experience_title is not null
                          then ', part of <strong>' || h_exp || '</strong>,'
                          else '' end;

        v_html := $html$<div style="background:#F2EFE8;padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:14px;">
      <tr><td style="padding:36px 32px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;color:#0F2229;">

        <img src="https://www.infitra.fit/email-logo.png" width="150" alt="INFITRA" style="display:block;height:auto;border:0;margin-bottom:28px;">

        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hi {FIRST},</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>{TITLE}</strong>{PARTOF} has a new time. Your experts could not hold the original slot:</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;font-style:italic;">&ldquo;{REASON}&rdquo;</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
          <tr><td style="padding:14px 18px;background:#F8F7F3;border-radius:10px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;">
            <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#94a3b8;text-decoration:line-through;">{OLD}</p>
            <p style="margin:0;font-size:15px;line-height:1.6;font-weight:700;color:#0F2229;">{NEW}</p>
          </td></tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
          <tr><td style="background:#FF6130;border-radius:10px;">
            <a href="{URL}" style="display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700;font-size:15px;color:#FFFFFF;text-decoration:none;">See it in your space</a>
          </td></tr>
        </table>

        <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">Questions? Just reply to this email.</p>

      </td></tr>
    </table>
    <p style="margin:20px 0 0;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-size:12px;line-height:1.7;color:#475569;">INFITRA · Live experiences by complementary experts<br>Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland<br>
    <a href="https://www.infitra.fit" style="color:#0891b2;text-decoration:none;">www.infitra.fit</a> · <a href="https://www.infitra.fit/imprint" style="color:#0891b2;text-decoration:none;">Legal Notice</a></p>
  </td></tr></table>
</div>$html$;

        v_html := replace(v_html, '{FIRST}',  h_first);
        v_html := replace(v_html, '{TITLE}',  h_title);
        v_html := replace(v_html, '{PARTOF}', v_part_of);
        v_html := replace(v_html, '{REASON}', h_reason);
        v_html := replace(v_html, '{OLD}',    v_old);
        v_html := replace(v_html, '{NEW}',    v_new);
        v_html := replace(v_html, '{URL}',    v_url);

        v_text := $txt$Hi {FIRST},

{TITLE}{PARTOF} has a new time. Your experts could not hold the
original slot: "{REASON}"

Was:    {OLD}
Now:    {NEW}

See it in your space: {URL}

Questions? Just reply to this email.

INFITRA · Live experiences by complementary experts
Yves Oliver Imhasly · Flühstrasse 40 · 4114 Hofstetten SO · Switzerland
www.infitra.fit · Legal notice: www.infitra.fit/imprint$txt$;

        v_text := replace(v_text, '{FIRST}',  v_first);
        v_text := replace(v_text, '{TITLE}',  coalesce(v_s.title, 'Your live session'));
        v_text := replace(v_text, '{PARTOF}', case when v_s.experience_title is not null
                                                   then ', part of ' || v_s.experience_title || ','
                                                   else '' end);
        v_text := replace(v_text, '{REASON}', coalesce(p_reason,''));
        v_text := replace(v_text, '{OLD}',    v_old);
        v_text := replace(v_text, '{NEW}',    v_new);
        v_text := replace(v_text, '{URL}',    v_url);

        -- target_id NULL on purpose: see header comment (repeat reschedules).
        insert into public.app_email_outbox
            (kind, to_email, subject, html_body, text_body, user_id, target_id)
        values
            ('session_reschedule', r.to_email, v_subj, v_html, v_text, r.user_id, null);

        v_count := v_count + 1;
    end loop;

    return v_count;
end;
$$;
-- Internal helper: only ever called from app_reschedule_session (definer).
revoke all on function public.app_enqueue_session_reschedule_emails(uuid, timestamptz, timestamptz, text, uuid) from public, anon, authenticated;

create or replace function public.app_reschedule_session(
    p_session uuid,
    p_new_start timestamptz,
    p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_uid uuid := auth.uid();
    v_s app_session%rowtype;
    v_reason text := btrim(coalesce(p_reason, ''));
    v_notified integer;
begin
    if v_uid is null then
        raise exception 'not_authenticated' using errcode = '42501';
    end if;

    select * into v_s from app_session where id = p_session for update;
    if not found then
        raise exception 'session not found';
    end if;

    if not is_session_expert(p_session, v_uid) then
        raise exception 'only the experts of this session can reschedule it'
            using errcode = '42501';
    end if;

    if v_s.status not in ('published', 'scheduled') then
        raise exception 'only published sessions can be rescheduled (drafts are edited directly)';
    end if;
    if v_s.started_at is not null or v_s.ended_at is not null then
        raise exception 'this session already ran or is running; it cannot be rescheduled';
    end if;

    if p_new_start is null or p_new_start <= now() + interval '5 minutes' then
        raise exception 'the new time must be in the future';
    end if;
    if p_new_start > now() + interval '365 days' then
        raise exception 'the new time is too far out';
    end if;
    if p_new_start = v_s.start_time then
        raise exception 'that is the current time of the session';
    end if;

    -- A reason is required, and it has to be a real one — this flow exists
    -- for emergencies, and participants read this sentence in their email.
    if length(v_reason) < 10 then
        raise exception 'please give participants a real reason (a short sentence)';
    end if;
    if length(v_reason) > 300 then
        raise exception 'please keep the reason under 300 characters';
    end if;

    update app_session
       set start_time         = p_new_start,
           change_reason      = v_reason,
           live_room_id       = null,
           stream_url         = null,
           pre_pulse_fired_at = null,
           updated_at         = now()
     where id = p_session;

    -- Re-arm the reminder for the new time (dedupe = row existence).
    delete from app_email_outbox
     where kind = 'session_reminder' and target_id = p_session;

    v_notified := app_enqueue_session_reschedule_emails(
        p_session, v_s.start_time, p_new_start, v_reason, v_uid);

    return jsonb_build_object(
        'ok', true,
        'old_start', v_s.start_time,
        'new_start', p_new_start,
        'notified', v_notified
    );
end;
$$;
revoke all on function public.app_reschedule_session(uuid, timestamptz, text) from public, anon;
grant execute on function public.app_reschedule_session(uuid, timestamptz, text) to authenticated, service_role;
