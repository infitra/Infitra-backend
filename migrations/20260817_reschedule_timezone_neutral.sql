-- =============================================================================
-- Reschedule goes timezone-neutral (2026-08-17, founder doctrine:
-- "time zones always show the device's zone")
--
-- Server-composed text (the Tribe post body, the email) is written once for
-- ALL readers, so it cannot know any reader's device timezone — the founder's
-- first live test printed "21:00 (GMT+7)" next to a session chip that
-- correctly said 16:00 in his device zone. Two sources of truth, one wrong.
--
-- Fix: absolute times are removed from server-composed text entirely. The
-- surfaces that know the device render the time: the session chip on the
-- Tribe post, the bell notification, the session popup, the space schedule.
-- The email says the session moved, quotes the reason, and sends the reader
-- to their space ("shown in your timezone") — the same pattern the reminder
-- email has always used (no absolute times). If exact times in email are
-- wanted later, the right upgrade is storing each participant's timezone
-- and rendering per recipient.
--
-- Replaces both functions from 20260817_session_reschedule.sql and
-- 20260817_session_reschedule_tribe_post.sql. Applied to production
-- 2026-08-17 via MCP; verified with a rolled-back impersonated dry-run
-- (no timezone strings in any newly composed text).
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
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>{TITLE}</strong>{PARTOF} has a new time. A word from your experts:</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;font-style:italic;">&ldquo;{REASON}&rdquo;</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">The new time is in your space, shown in your timezone:</p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
          <tr><td style="background:#FF6130;border-radius:10px;">
            <a href="{URL}" style="display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:700;font-size:15px;color:#FFFFFF;text-decoration:none;">See the new time</a>
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
        v_html := replace(v_html, '{URL}',    v_url);

        v_text := $txt$Hi {FIRST},

{TITLE}{PARTOF} has a new time. A word from your experts:
"{REASON}"

The new time is in your space, shown in your timezone:
{URL}

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
        v_text := replace(v_text, '{URL}',    v_url);

        -- target_id NULL on purpose: repeat reschedules must still notify
        -- (partial unique index on user_id/kind/target_id would swallow them).
        insert into public.app_email_outbox
            (kind, to_email, subject, html_body, text_body, user_id, target_id)
        values
            ('session_reschedule', r.to_email, v_subj, v_html, v_text, r.user_id, null);

        v_count := v_count + 1;
    end loop;

    return v_count;
end;
$$;
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
    v_challenge app_challenge%rowtype;
    v_space_id uuid;
    v_posted boolean := false;
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

    delete from app_email_outbox
     where kind = 'session_reminder' and target_id = p_session;

    v_notified := app_enqueue_session_reschedule_emails(
        p_session, v_s.start_time, p_new_start, v_reason, v_uid);

    -- Tribe post: no absolute time in the body — the session chip below the
    -- post renders the new time in each reader's device timezone.
    select c.* into v_challenge
    from app_challenge c
    join app_challenge_session cs on cs.challenge_id = c.id
    where cs.session_id = p_session
    limit 1;

    if found then
        select s.id into v_space_id
        from app_challenge_space s
        where s.source_challenge_id = v_challenge.id
           or (v_challenge.continuation_group_id is not null
               and s.continuation_group_id = v_challenge.continuation_group_id)
        order by (s.source_challenge_id = v_challenge.id) desc, s.created_at asc
        limit 1;

        if v_space_id is not null then
            insert into app_challenge_post
                (space_id, author_id, kind, body, context_type, context_id, metadata)
            values (
                v_space_id,
                v_uid,
                'talk',
                'Rescheduled: ' || coalesce(v_s.title, 'our session') || e'\n\n'
                    || chr(8220) || v_reason || chr(8221),
                'session',
                p_session,
                jsonb_build_object(
                    'reschedule', true,
                    'old_start', v_s.start_time,
                    'new_start', p_new_start
                )
            );
            v_posted := true;
        end if;
    end if;

    return jsonb_build_object(
        'ok', true,
        'old_start', v_s.start_time,
        'new_start', p_new_start,
        'notified', v_notified,
        'posted', v_posted
    );
end;
$$;
revoke all on function public.app_reschedule_session(uuid, timestamptz, text) from public, anon;
grant execute on function public.app_reschedule_session(uuid, timestamptz, text) to authenticated, service_role;
