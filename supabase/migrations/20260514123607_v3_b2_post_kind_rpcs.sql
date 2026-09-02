-- Bundle 2 migration 3/6: post-kind extensions for the engagement primitives.
--
-- The cohort feed primitives (Talk / Intro / Reflection / Question) all live
-- in app_challenge_post differentiated by `kind`. Comments support a
-- coach-answer auto-promotion: the first comment by a directed-to creator
-- on a question post is automatically marked is_coach_answer=true and pins
-- above the regular thread on the participant view.
--
-- Updates:
--   - create_challenge_post: extended signature with kind/context/directed_to/metadata.
--     Validates kind, validates directed_to (collaborators only), emits
--     question_for_you notifications when applicable.
--   - create_challenge_comment: detects auto-promote condition and sets
--     is_coach_answer + emits coach_answered_your_question notification.
--   - list_challenge_posts: returns the new columns so the feed can render
--     kind-aware cards.
--   - update_challenge_comment: NEW — author-only edit with edited_at/by stamps.
--
-- All notification inserts use ON CONFLICT DO NOTHING against the
-- partial UNIQUE indexes from migration 1 — re-firing is safe.

-- ── create_challenge_post: extended ──

drop function if exists public.create_challenge_post(uuid, text, text);

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

-- ── create_challenge_comment: auto-promote first tagged-creator comment ──

drop function if exists public.create_challenge_comment(uuid, text);

create or replace function public.create_challenge_comment(
  p_post uuid,
  p_body text
) returns uuid
  language plpgsql
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
  v_comment_id uuid;
  v_space_id uuid;
  v_post_kind text;
  v_post_directed_to uuid[];
  v_post_author uuid;
  v_already_promoted boolean;
  v_should_promote boolean := false;
  v_challenge_id uuid;
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_post is null then raise exception 'post_id is required'; end if;
  if coalesce(btrim(p_body), '') = '' then raise exception 'body is required'; end if;

  -- Snapshot parent post for auto-promote decision
  select p.space_id, p.kind, p.directed_to, p.author_id
  into v_space_id, v_post_kind, v_post_directed_to, v_post_author
  from public.app_challenge_post p
  where p.id = p_post;

  if v_space_id is null then raise exception 'Challenge post not found'; end if;
  if not public.can_access_challenge_space(v_space_id, v_actor) then
    raise exception 'Forbidden: you may not comment in this challenge space';
  end if;

  -- Auto-promote condition: parent is a question, commenter is among
  -- directed_to, and this commenter has not already produced a coach
  -- answer on this post.
  if v_post_kind = 'question'
     and v_post_directed_to is not null
     and v_actor = any(v_post_directed_to) then
    select exists (
      select 1 from public.app_challenge_comment c
      where c.post_id = p_post
        and c.author_id = v_actor
        and c.is_coach_answer = true
    ) into v_already_promoted;
    v_should_promote := not v_already_promoted;
  end if;

  insert into public.app_challenge_comment (post_id, author_id, body, is_coach_answer)
  values (p_post, v_actor, btrim(p_body), v_should_promote)
  returning id into v_comment_id;

  -- Notify the question's author when a coach answer lands.
  if v_should_promote then
    select cs.source_challenge_id into v_challenge_id
    from public.app_challenge_space cs
    where cs.id = v_space_id;

    insert into public.app_notification (recipient_id, type, payload)
    values (
      v_post_author,
      'coach_answered_your_question',
      jsonb_build_object(
        'post_id', p_post,
        'comment_id', v_comment_id,
        'answerer_id', v_actor,
        'challenge_id', v_challenge_id
      )
    )
    on conflict do nothing;
  end if;

  return v_comment_id;
end;
$$;

-- ── update_challenge_comment: author-only edit ──

create or replace function public.update_challenge_comment(
  p_id uuid,
  p_body text
) returns void
  language plpgsql
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
  v_author uuid;
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_body), '') = '' then raise exception 'body is required'; end if;

  select author_id into v_author from public.app_challenge_comment where id = p_id;
  if v_author is null then raise exception 'comment not found'; end if;
  if v_author <> v_actor then raise exception 'Forbidden'; end if;

  update public.app_challenge_comment
    set body = btrim(p_body),
        edited_at = now(),
        edited_by = v_actor
    where id = p_id;
end;
$$;

-- ── list_challenge_posts: return new columns ──

drop function if exists public.list_challenge_posts(uuid, integer, timestamptz, uuid);

create or replace function public.list_challenge_posts(
  p_space uuid,
  p_limit integer default 20,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
) returns table (
  id uuid,
  space_id uuid,
  author_id uuid,
  body text,
  media_url text,
  kind text,
  context_type text,
  context_id uuid,
  directed_to uuid[],
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
  language sql
  stable
  set search_path to 'public'
as $$
  select
    p.id,
    p.space_id,
    p.author_id,
    p.body,
    p.media_url,
    p.kind,
    p.context_type,
    p.context_id,
    p.directed_to,
    p.metadata,
    p.created_at,
    p.updated_at
  from public.app_challenge_post p
  where p.space_id = p_space
    and (
      p_before_created_at is null
      or (p.created_at, p.id) < (p_before_created_at, p_before_id)
    )
  order by p.created_at desc, p.id desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;
