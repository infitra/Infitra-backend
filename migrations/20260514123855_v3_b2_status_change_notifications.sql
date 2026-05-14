-- Bundle 2 migration 5/6: status-change notifications.
--
-- The locked notification taxonomy in PILOT_PLAN.md §2.4 includes four
-- collaboration-state events that today are silent:
--   - contract_locked (cohorts: your turn to review)
--   - contract_accepted (owner + other cohosts: you can publish now)
--   - contract_declined (owner: needs your attention)
--   - challenge_published (cohosts: it's live)
--
-- Each is added as a notification insert at the tail of the existing RPC.
-- Behaviour preserved exactly otherwise. Idempotency via the partial
-- UNIQUE indexes from migration 1 (`uniq_notification_recipient_kind_challenge`).

-- ── lock_challenge_contract ──

create or replace function public.lock_challenge_contract(
  p_challenge_id uuid,
  p_actor uuid
) returns uuid
  language plpgsql
  security definer
as $$
declare
  v_challenge app_challenge;
  v_snapshot jsonb;
  v_contract_id uuid;
  v_cohost uuid;
begin
  -- Fetch and validate
  select * into v_challenge from app_challenge where id = p_challenge_id;
  if not found then raise exception 'challenge_not_found'; end if;
  if v_challenge.owner_id != p_actor then raise exception 'only_owner_can_lock'; end if;
  if v_challenge.status != 'draft' then raise exception 'challenge_not_draft'; end if;

  -- Must have at least one cohost
  if not exists (select 1 from app_challenge_cohost where challenge_id = p_challenge_id) then
    raise exception 'no_cohosts_to_lock';
  end if;

  -- Build snapshot from current DB state (not from frontend)
  select jsonb_build_object(
    'title', v_challenge.title,
    'price_cents', v_challenge.price_cents,
    'currency', v_challenge.currency,
    'owner_id', v_challenge.owner_id,
    'cohosts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'cohost_id', cc.cohost_id,
        'split_percent', cc.split_percent
      ))
      from app_challenge_cohost cc where cc.challenge_id = p_challenge_id
    ), '[]'::jsonb)
  ) into v_snapshot;

  -- Delegate to the generic lock_contract RPC
  v_contract_id := lock_contract('challenge', p_challenge_id, p_actor, v_snapshot, null);

  -- Notify each cohost — your turn to review.
  for v_cohost in
    select cohost_id from app_challenge_cohost where challenge_id = p_challenge_id
  loop
    insert into public.app_notification (recipient_id, type, payload)
    values (
      v_cohost,
      'contract_locked',
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'contract_id', v_contract_id,
        'actor_id', p_actor
      )
    )
    on conflict do nothing;
  end loop;

  return v_contract_id;
end;
$$;

-- ── respond_to_contract ──

create or replace function public.respond_to_contract(
  p_contract_id uuid,
  p_actor uuid,
  p_response text,
  p_comment text default null
) returns void
  language plpgsql
  set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_actor uuid := coalesce(v_uid, p_actor);
  v_target_type text;
  v_target_id uuid;
  v_actor_is_cohost boolean;
  v_owner_id uuid;
  v_other_cohost uuid;
begin
  if v_uid is not null and v_uid <> p_actor then
    raise exception 'caller_mismatch_auth_uid';
  end if;
  if p_contract_id is null then raise exception 'contract_id is required'; end if;
  if v_actor is null then raise exception 'actor is required'; end if;
  if p_response not in ('accept', 'decline') then
    raise exception 'invalid response: %', p_response;
  end if;

  select c.target_type, c.target_id into v_target_type, v_target_id
  from public.app_collaboration_contract c where c.id = p_contract_id;
  if v_target_type is null then raise exception 'contract not found or not visible to actor'; end if;

  if v_target_type = 'session' then
    select exists (
      select 1 from public.app_session_cohost sch
      where sch.session_id = v_target_id and sch.cohost_id = v_actor
    ) into v_actor_is_cohost;
  else
    select exists (
      select 1 from public.app_challenge_cohost cch
      where cch.challenge_id = v_target_id and cch.cohost_id = v_actor
    ) into v_actor_is_cohost;
  end if;

  if not v_actor_is_cohost then
    raise exception 'actor is not a collaborator on this contract target';
  end if;

  if p_response = 'accept' then
    delete from public.app_collaboration_decline
      where contract_id = p_contract_id and cohost_id = v_actor;
    insert into public.app_collaboration_acceptance (contract_id, cohost_id, accepted_at)
    values (p_contract_id, v_actor, now())
    on conflict (contract_id, cohost_id)
      do update set accepted_at = excluded.accepted_at;
  else
    delete from public.app_collaboration_acceptance
      where contract_id = p_contract_id and cohost_id = v_actor;
    insert into public.app_collaboration_decline (contract_id, cohost_id, declined_at, comment)
    values (p_contract_id, v_actor, now(), p_comment)
    on conflict (contract_id, cohost_id)
      do update set declined_at = excluded.declined_at, comment = excluded.comment;
  end if;

  -- Workspace activity log (challenge only)
  if v_target_type = 'challenge' then
    perform public.post_workspace_log(
      v_target_id,
      case when p_response = 'accept' then 'confirmed the terms' else 'requested changes' end
    );

    -- Resolve owner of the challenge for notification recipients
    select owner_id into v_owner_id from public.app_challenge where id = v_target_id;

    if p_response = 'accept' then
      -- Notify owner: a cohost accepted
      if v_owner_id is not null and v_owner_id <> v_actor then
        insert into public.app_notification (recipient_id, type, payload)
        values (
          v_owner_id,
          'contract_accepted',
          jsonb_build_object(
            'challenge_id', v_target_id,
            'contract_id', p_contract_id,
            'actor_id', v_actor
          )
        )
        on conflict do nothing;
      end if;

      -- Notify other cohosts (not the actor) that this cohost accepted
      for v_other_cohost in
        select cohost_id from public.app_challenge_cohost
        where challenge_id = v_target_id and cohost_id <> v_actor
      loop
        insert into public.app_notification (recipient_id, type, payload)
        values (
          v_other_cohost,
          'contract_accepted',
          jsonb_build_object(
            'challenge_id', v_target_id,
            'contract_id', p_contract_id,
            'actor_id', v_actor
          )
        )
        on conflict do nothing;
      end loop;
    else
      -- Decline: notify the owner only (this needs the owner's attention)
      if v_owner_id is not null and v_owner_id <> v_actor then
        insert into public.app_notification (recipient_id, type, payload)
        values (
          v_owner_id,
          'contract_declined',
          jsonb_build_object(
            'challenge_id', v_target_id,
            'contract_id', p_contract_id,
            'actor_id', v_actor,
            'comment', coalesce(p_comment, '')
          )
        )
        on conflict do nothing;
      end if;
    end if;
  end if;
end;
$$;

-- ── publish_challenge ──

create or replace function public.publish_challenge(
  p_challenge uuid,
  p_caller uuid
) returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  errs text[];
  v_title text;

  v_uid uuid := auth.uid();
  v_actor uuid := coalesce(v_uid, p_caller);
  v_now timestamptz := now();

  v_linked_session_errors text[] := array[]::text[];

  v_cohost uuid;
begin
  if v_uid is not null and v_uid <> p_caller then
    return jsonb_build_object('ok', false, 'errors', array['caller_mismatch_auth_uid']);
  end if;

  errs := public.challenge_can_publish(p_challenge, v_actor);
  if array_length(errs, 1) is not null then
    return jsonb_build_object('ok', false, 'errors', errs);
  end if;

  with linked_sessions as (
    select
      s.id,
      s.status,
      s.start_time,
      s.duration_minutes,
      coalesce((
        select sum(sc.split_percent)
        from public.app_session_cohost sc
        where sc.session_id = s.id
      ), 0) as total_split
    from public.app_challenge_session cs
    join public.app_session s on s.id = cs.session_id
    where cs.challenge_id = p_challenge
  ),
  issue_rows as (
    select format('linked_session_status_not_draft:%s', id)::text as issue
    from linked_sessions where status <> 'draft'

    union all

    select format('linked_session_start_time_missing:%s', id)::text
    from linked_sessions where start_time is null

    union all

    select format('linked_session_start_time_must_be_future:%s', id)::text
    from linked_sessions
    where start_time is not null and start_time <= v_now

    union all

    select format('linked_session_duration_invalid:%s', id)::text
    from linked_sessions
    where duration_minutes is null or duration_minutes <= 0

    union all

    select format('linked_session_cohost_split_exceeds_100:%s', id)::text
    from linked_sessions where total_split > 100
  )
  select coalesce(array_agg(issue order by issue), array[]::text[])
  into v_linked_session_errors
  from issue_rows;

  if array_length(v_linked_session_errors, 1) is not null then
    return jsonb_build_object('ok', false, 'errors', v_linked_session_errors);
  end if;

  update public.app_session s
     set status = 'published', published_at = v_now
  where s.id in (
    select cs.session_id
    from public.app_challenge_session cs
    where cs.challenge_id = p_challenge
  );

  update public.app_challenge
     set status = 'published', published_at = v_now
   where id = p_challenge;

  perform public.ensure_challenge_space_for_published_challenge(
    p_challenge, v_actor, null, null, null
  );

  select title into v_title from public.app_challenge where id = p_challenge;

  insert into public.app_feed_event (type, actor_id, session_id, challenge_id, metadata)
  values (
    'challenge_published',
    v_actor,
    null,
    p_challenge,
    jsonb_build_object('title', v_title)
  );

  -- Notify each cohost — the program is live.
  for v_cohost in
    select cohost_id from public.app_challenge_cohost
    where challenge_id = p_challenge and cohost_id <> v_actor
  loop
    insert into public.app_notification (recipient_id, type, payload)
    values (
      v_cohost,
      'challenge_published',
      jsonb_build_object(
        'challenge_id', p_challenge,
        'title', v_title,
        'actor_id', v_actor
      )
    )
    on conflict do nothing;
  end loop;

  return jsonb_build_object('ok', true, 'challenge_id', p_challenge);
end;
$$;
