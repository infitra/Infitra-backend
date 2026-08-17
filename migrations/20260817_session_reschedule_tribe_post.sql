-- =============================================================================
-- Reschedule posts to the Tribe (2026-08-17, founder ask)
--
-- The reason should live where the tribe lives: alongside the email and the
-- bell notification, the reschedule now drops a real expert post into the
-- experience's Tribe feed — kind='talk' (native rendering), with
-- context_type='session' so the feed shows the referenced session chip, the
-- reason quoted underneath, and the new time. Space resolved exactly like
-- load_experience_space does (source challenge, else shared lineage).
-- Standalone sessions (no challenge/space) simply skip the post.
--
-- Applied to production 2026-08-17 via MCP; verified with a rolled-back
-- impersonated dry-run (post lands as the acting expert with the session
-- chip; 20 emails enqueued; everything rolled back).
-- =============================================================================

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
    v_tz text := 'Asia/Phnom_Penh';  -- project display convention, same as the email
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
    -- for when there is no other way, and participants read this sentence
    -- in their email and in the Tribe.
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

    -- The Tribe post: the reason lives where the tribe lives. Resolved and
    -- inserted exactly once; standalone sessions have no space and skip it.
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
                    || chr(8220) || v_reason || chr(8221) || e'\n\n'
                    || 'New time: '
                    || to_char(p_new_start at time zone v_tz, 'Dy DD Mon · HH24:MI')
                    || ' (GMT+7)',
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
