-- =============================================================================
-- Continuation flow: copy the design, re-run the consent, re-derive the dates.
-- (2026-08-28, after the founder's first real "next run" attempt broke on all
-- three fronts.)
--
-- What was wrong, verified against production:
--  1. CONTENT DROPPED — create_challenge_continuation_draft's explicit INSERT
--     predated five later workspace fields (image_url, promise_text,
--     weekly_arc, topic_ownership, intro_prompt) and the session-level
--     image_url. Covers, outcome, weekly focus and intro prompt silently
--     vanished from the draft.
--  2. TEAM WITHOUT CONSENT — the RPC copied app_challenge_cohost rows
--     directly: the cohost became a full member of the new draft at click
--     time, with no invite, no DM, no notification. The publish gate
--     (challenge_can_publish: locked contract + acceptance from every cohost)
--     held, so nothing could go live behind their back, but the consent
--     MOMENT never existed. The confirmation dialog always promised an
--     invitation; now it is one.
--  3. DATES DID NOT FOLLOW — sessions were cloned onto the old grid and
--     nothing moved them when the workspace start date changed. Verified:
--     draft said Sep 1 while its sessions started Aug 24 (week "-1").
--
-- The redesign in this file:
--  · The RPC copies the full design (all content fields, sessions incl.
--    covers, per-session roles as STRUCTURE) but no longer copies
--    app_challenge_cohost. Instead each source cohost gets a real
--    collaboration invite bound to the new draft: same machinery as
--    send_additional_collab_invite (DM conversation reuse from the source
--    thread where possible, notification), with NO split on the invite
--    (founder call: the split left invitations for good; terms are set
--    together in the workspace). The notification payload carries
--    continuation:true so the bell can say "invites you back".
--  · update_challenge_workspace now SHIFTS every linked draft session by the
--    same day-delta whenever the draft's start_date changes. Draft-only:
--    published sessions keep going through app_reschedule_session with its
--    notifications. This is what "you set the new dates" always implied.
--  · The action-side default start becomes "same weekday the source started
--    on, at least a week out" (web/app/actions/challenge.ts) so the copied
--    week pattern stays aligned by construction.
--
-- Deliberate:
--  · Reschedule scars in the source (as-run times) are copied as-is; the
--    system cannot know design from emergency. The workspace can adjust
--    individual sessions.
--  · If the invited cohost declines, their per-session roles remain in the
--    draft for the owner to reassign in the workspace; publish is impossible
--    with a challenge-level cohost row absent only if none exists — a decline
--    simply leaves the owner to restructure or re-invite.
-- =============================================================================

create or replace function public.create_challenge_continuation_draft(
    p_source_challenge uuid,
    p_start_date date,
    p_end_date date
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_actor uuid := auth.uid();
    v_source public.app_challenge%rowtype;
    v_group_id uuid;
    v_new_challenge_id uuid;

    v_item record;
    v_new_session_id uuid;
    v_shift_days integer;
    v_new_start_time timestamptz;

    v_cohost record;
    v_convo_id uuid;
    v_invite_id uuid;
    v_invite_message text;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_source_challenge is null then
        raise exception 'source_challenge is required';
    end if;

    if p_start_date is null or p_end_date is null then
        raise exception 'start_date and end_date are required';
    end if;

    if p_end_date < p_start_date then
        raise exception 'end_date must be on or after start_date';
    end if;

    select *
    into v_source
    from public.app_challenge
    where id = p_source_challenge;

    if v_source.id is null then
        raise exception 'Source challenge not found';
    end if;

    if v_source.owner_id <> v_actor then
        raise exception 'Only the challenge owner may create a continuation draft';
    end if;

    v_group_id := coalesce(v_source.continuation_group_id, gen_random_uuid());

    update public.app_challenge
    set continuation_group_id = v_group_id
    where id = v_source.id
      and continuation_group_id is null;

    -- The full design travels: content fields included (their absence was
    -- defect 1). status is draft, contract_id deliberately NOT copied — a new
    -- run is a new agreement (SR-I5).
    insert into public.app_challenge (
        title,
        description,
        start_date,
        end_date,
        owner_id,
        price_cents,
        currency,
        status,
        capacity,
        config,
        image_url,
        promise_text,
        weekly_arc,
        topic_ownership,
        intro_prompt,
        continuation_group_id,
        continued_from_challenge_id
    )
    values (
        v_source.title,
        v_source.description,
        p_start_date,
        p_end_date,
        v_source.owner_id,
        v_source.price_cents,
        v_source.currency,
        'draft',
        v_source.capacity,
        v_source.config,
        v_source.image_url,
        v_source.promise_text,
        v_source.weekly_arc,
        v_source.topic_ownership,
        v_source.intro_prompt,
        v_group_id,
        v_source.id
    )
    returning id into v_new_challenge_id;

    -- NOTE: no app_challenge_cohost copy here any more. Membership of the new
    -- run is consent, not data: it is created by accept_collab_invite when
    -- the invited expert says yes (defect 2).

    for v_item in
        select
            s.*
        from public.app_challenge_session cs
        join public.app_session s
          on s.id = cs.session_id
        where cs.challenge_id = v_source.id
        order by s.start_time asc, s.created_at asc, s.id asc
    loop
        v_shift_days := greatest(
            (v_item.start_time::date - v_source.start_date),
            0
        );

        v_new_start_time :=
            (
                p_start_date
                + v_shift_days
                + (v_item.start_time::time)
            )::timestamptz;

        insert into public.app_session (
            title,
            description,
            start_time,
            duration_minutes,
            capacity,
            price_cents,
            currency,
            host_id,
            status,
            live_provider,
            config,
            image_url,
            continuation_group_id,
            continued_from_session_id
        )
        values (
            v_item.title,
            v_item.description,
            v_new_start_time,
            v_item.duration_minutes,
            v_item.capacity,
            v_item.price_cents,
            v_item.currency,
            v_item.host_id,
            'draft',
            v_item.live_provider,
            v_item.config,
            v_item.image_url,
            coalesce(v_item.continuation_group_id, gen_random_uuid()),
            v_item.id
        )
        returning id into v_new_session_id;

        -- Per-session roles are STRUCTURE (who leads what), not membership —
        -- they travel with the design. If the invite is declined the owner
        -- reassigns these in the workspace.
        insert into public.app_session_cohost (session_id, cohost_id, split_percent)
        select v_new_session_id, cohost_id, split_percent
        from public.app_session_cohost
        where session_id = v_item.id;

        update public.app_session
        set continuation_group_id = (
            select continuation_group_id
            from public.app_session
            where id = v_new_session_id
        )
        where id = v_item.id
          and continuation_group_id is null;

        perform set_config('app.via_rpc', '1', true);

        insert into public.app_challenge_session (challenge_id, session_id)
        values (v_new_challenge_id, v_new_session_id);
    end loop;

    -- THE CONSENT: every source cohost gets a real continuation invitation,
    -- same machinery as send_additional_collab_invite. No split on the invite
    -- (terms are set together in the workspace). The DM thread from the
    -- source collaboration is reused where one exists, so the conversation
    -- continues instead of forking.
    v_invite_message := 'I am running "' || v_source.title || '" again. Join me for the next run?';

    for v_cohost in
        select ch.cohost_id
        from public.app_challenge_cohost ch
        where ch.challenge_id = v_source.id
          and ch.cohost_id <> v_actor
    loop
        select i.dm_conversation_id
        into v_convo_id
        from public.app_collaboration_invite i
        where i.challenge_id = v_source.id
          and i.dm_conversation_id is not null
        limit 1;

        if v_convo_id is null then
            insert into public.app_dm_conversation (created_by)
            values (v_actor)
            returning id into v_convo_id;

            insert into public.app_dm_member (conversation_id, user_id)
            values (v_convo_id, v_actor)
            on conflict do nothing;
        end if;

        insert into public.app_collaboration_invite (
            from_id, to_id, message, initial_split_percent,
            challenge_id, dm_conversation_id
        )
        values (
            v_actor, v_cohost.cohost_id, v_invite_message, 0,
            v_new_challenge_id, v_convo_id
        )
        returning id into v_invite_id;

        insert into public.app_notification (recipient_id, type, payload)
        values (
            v_cohost.cohost_id,
            'collab_invite',
            jsonb_build_object(
                'invite_id', v_invite_id,
                'from_id', v_actor,
                'challenge_id', v_new_challenge_id,
                'continuation', true,
                'title', v_source.title
            )
        );
    end loop;

    return v_new_challenge_id;
end;
$function$;

-- ── Date changes move the draft's sessions with them ─────────────────────────

create or replace function public.update_challenge_workspace(
    p_challenge_id uuid,
    p_title text,
    p_description text,
    p_image_url text,
    p_start_date date,
    p_end_date date,
    p_capacity integer,
    p_price_cents integer,
    p_promise_text text default null,
    p_weekly_arc jsonb default null,
    p_topic_ownership jsonb default null,
    p_intro_prompt text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_owner_id uuid;
  v_status challenge_status;
  v_contract_id uuid;
  v_old_start date;
  v_is_party boolean;
  v_promise_changed boolean := false;
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select owner_id, status, contract_id, start_date
  into v_owner_id, v_status, v_contract_id, v_old_start
  from public.app_challenge
  where id = p_challenge_id;

  if v_owner_id is null then raise exception 'challenge_not_found'; end if;
  if v_status <> 'draft' then raise exception 'challenge_not_draft'; end if;
  if v_contract_id is not null then raise exception 'challenge_locked'; end if;

  v_is_party := (v_owner_id = v_actor)
    or exists (
      select 1 from public.app_challenge_cohost
      where challenge_id = p_challenge_id and cohost_id = v_actor
    );
  if not v_is_party then raise exception 'not_a_collaborator'; end if;

  if p_title is null or length(trim(p_title)) < 3 then raise exception 'title_too_short'; end if;
  if p_start_date is null or p_end_date is null then raise exception 'dates_required'; end if;
  if p_end_date <= p_start_date then raise exception 'end_before_start'; end if;
  if p_capacity is not null and (p_capacity < 1 or p_capacity > 10000) then raise exception 'capacity_out_of_range'; end if;
  if p_price_cents is null or p_price_cents < 0 then raise exception 'invalid_price'; end if;
  if p_promise_text is not null and length(p_promise_text) > 600 then raise exception 'promise_too_long'; end if;
  if p_weekly_arc is not null and jsonb_typeof(p_weekly_arc) <> 'array' then raise exception 'weekly_arc_must_be_array'; end if;
  if p_topic_ownership is not null and jsonb_typeof(p_topic_ownership) <> 'array' then raise exception 'topic_ownership_must_be_array'; end if;
  if p_intro_prompt is not null and length(p_intro_prompt) > 500 then raise exception 'intro_prompt_too_long'; end if;

  v_promise_changed := (
    p_promise_text is not null
    or p_weekly_arc is not null
    or p_topic_ownership is not null
    or p_intro_prompt is not null
  );

  update public.app_challenge set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    image_url = nullif(trim(coalesce(p_image_url, '')), ''),
    start_date = p_start_date,
    end_date = p_end_date,
    capacity = p_capacity,
    price_cents = p_price_cents,
    promise_text = case when p_promise_text is not null
      then nullif(trim(p_promise_text), '')
      else promise_text end,
    weekly_arc = case when p_weekly_arc is not null
      then p_weekly_arc
      else weekly_arc end,
    topic_ownership = case when p_topic_ownership is not null
      then p_topic_ownership
      else topic_ownership end,
    intro_prompt = case when p_intro_prompt is not null
      then nullif(trim(p_intro_prompt), '')
      else intro_prompt end,
    promise_edited_at = case when v_promise_changed then now()
      else promise_edited_at end,
    promise_edited_by = case when v_promise_changed then v_actor
      else promise_edited_by end
  where id = p_challenge_id;

  -- Moving a DRAFT's start date moves its whole plan: every linked draft
  -- session shifts by the same day-delta, so the designed week pattern
  -- arrives intact at the new dates. Published sessions are untouched by
  -- design — those move one at a time through app_reschedule_session, which
  -- notifies the tribe.
  if v_old_start is not null and p_start_date <> v_old_start then
    update public.app_session s
    set start_time = s.start_time + make_interval(days => (p_start_date - v_old_start))
    where s.status = 'draft'
      and s.id in (
        select cs.session_id
        from public.app_challenge_session cs
        where cs.challenge_id = p_challenge_id
      );
  end if;
end;
$function$;

-- ── Grant hygiene (same posture as the 2026-08-18 sweep) ─────────────────────
do $do$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_challenge_continuation_draft','update_challenge_workspace')
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated, service_role', r.sig);
  end loop;
end $do$;
