-- Bundle 5c polish — revert directed_to-on-talk.
--
-- 20260605120000 relaxed create_challenge_post to let directed_to ride on a
-- kind='talk' post, to carry a creator's "tag a co-host" context. That feature
-- was dropped: the Tribe space is the creator<->members room, and a creator
-- pinging a partner inside a public member feed is the wrong channel. With no
-- caller sending directed_to on a talk anymore, the relaxed permission is dead
-- surface — so restore the original invariant: directed_to is question-only.
--
-- Session context on a talk is UNAFFECTED — context_type/context_id still flow
-- for any kind (the creator "Add context" now references a session, rendered as
-- a session card in the post).
--
-- This only governs future inserts; existing talk rows that already carry a
-- directed_to value (a couple of test posts) are untouched and harmless — the
-- frontend no longer reads talk.directed_to.
--
-- SECURITY DEFINER re-declared (CREATE OR REPLACE resets unstated attributes;
-- 20260603130000 made this DEFINER so the question-notification emit can write
-- app_notification). search_path stays pinned to 'public'.

create or replace function public.create_challenge_post(
  p_space uuid,
  p_body text,
  p_media_url text default null,
  p_kind text default 'talk',
  p_context_type text default null,
  p_context_id uuid default null,
  p_directed_to uuid[] default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
  v_post_id uuid;
  v_challenge_id uuid;
  v_recipient uuid;
begin
  if v_actor is null then
    raise exception 'Unauthorized';
  end if;
  if p_space is null then
    raise exception 'space_id is required';
  end if;
  if coalesce(btrim(p_body), '') = '' and p_kind not in ('intro_private') then
    raise exception 'body is required';
  end if;
  if p_kind not in ('talk','intro','intro_private','reflection','question') then
    raise exception 'invalid kind';
  end if;

  -- Resolve the source challenge for this space (used by directed_to validation
  -- and notification emission).
  select source_challenge_id into v_challenge_id
  from public.app_challenge_space
  where id = p_space;
  if v_challenge_id is null then
    raise exception 'Challenge space not found';
  end if;

  if not public.can_post_in_challenge_space(p_space, v_actor) then
    raise exception 'Forbidden: you may not post in this challenge space';
  end if;

  -- Question posts: directed_to required, must reference collaborators only.
  if p_kind = 'question' then
    if p_directed_to is null or array_length(p_directed_to, 1) is null then
      raise exception 'questions must tag at least one collaborator';
    end if;
    -- Reject self-tag
    if v_actor = any(p_directed_to) then
      raise exception 'cannot tag yourself';
    end if;
    -- Each tagged user must be owner OR cohost on the source challenge
    if exists (
      select unnest as u from unnest(p_directed_to) where not (
        exists (select 1 from public.app_challenge c
                where c.id = v_challenge_id and c.owner_id = unnest)
        or exists (select 1 from public.app_challenge_cohost ch
                   where ch.challenge_id = v_challenge_id and ch.cohost_id = unnest)
      )
    ) then
      raise exception 'directed_to must reference creators on this challenge only';
    end if;
  elsif p_directed_to is not null and array_length(p_directed_to, 1) > 0 then
    raise exception 'directed_to is only valid for question posts';
  end if;

  -- Reflection posts: must have context_type='session' and a real context_id.
  if p_kind = 'reflection' then
    if p_context_type is distinct from 'session' or p_context_id is null then
      raise exception 'reflection requires context_type=session and context_id';
    end if;
  end if;

  -- Intro posts: only one per (user, challenge). Enforced by checking
  -- existing rows; race is benign for pilot scale.
  if p_kind in ('intro','intro_private') then
    if exists (
      select 1 from public.app_challenge_post p
      where p.space_id = p_space
        and p.author_id = v_actor
        and p.kind in ('intro','intro_private')
    ) then
      raise exception 'intro already posted for this challenge';
    end if;
  end if;

  insert into public.app_challenge_post (
    space_id, author_id, body, media_url,
    kind, context_type, context_id, directed_to, metadata
  ) values (
    p_space,
    v_actor,
    coalesce(btrim(p_body), ''),
    nullif(btrim(p_media_url), ''),
    p_kind,
    p_context_type,
    p_context_id,
    p_directed_to,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_post_id;

  -- Emit question_for_you notifications for each tagged creator.
  if p_kind = 'question' then
    foreach v_recipient in array p_directed_to loop
      insert into public.app_notification (recipient_id, type, payload)
      values (
        v_recipient,
        'question_for_you',
        jsonb_build_object(
          'post_id', v_post_id,
          'asker_id', v_actor,
          'challenge_id', v_challenge_id
        )
      )
      on conflict do nothing;
    end loop;
  end if;

  return v_post_id;
end;
$$;
