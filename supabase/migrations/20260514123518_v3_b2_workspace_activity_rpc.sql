-- Bundle 2 migration 2/6: workspace activity logging + extended workspace editor.
--
-- Two pieces:
--   1. log_workspace_field_edit — audit-log insert into app_workspace_activity.
--      Replaces the current pattern where every field-level update calls
--      post_workspace_log (which posts a system message into the chat
--      thread). Field edits go to the audit log; chat stays for human +
--      milestone messages only.
--   2. update_challenge_workspace — extended with Promise / Weekly Arc /
--      Topic Ownership / Intro Prompt params. Existing call sites that
--      omit the new params still work (all defaulted to NULL).
--   3. update_weekly_arc_themes — narrow surface for the post-publish theme
--      edits creators retain on the live program (per PILOT_PLAN.md call 1).

-- ── 1. log_workspace_field_edit ──

create or replace function public.log_workspace_field_edit(
  p_challenge_id uuid,
  p_field text,
  p_old jsonb,
  p_new jsonb
) returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_actor uuid := (select auth.uid());
  v_is_party boolean;
begin
  if v_actor is null then return; end if;
  if p_challenge_id is null then return; end if;

  -- Verify actor is owner or cohost (silent no-op if not — defensive).
  select (c.owner_id = v_actor) or exists (
    select 1 from public.app_challenge_cohost ch
    where ch.challenge_id = p_challenge_id
      and ch.cohost_id = v_actor
  ) into v_is_party
  from public.app_challenge c
  where c.id = p_challenge_id;

  if v_is_party is not true then return; end if;

  insert into public.app_workspace_activity(challenge_id, actor_id, kind, payload)
  values (
    p_challenge_id,
    v_actor,
    'field_edit',
    jsonb_build_object(
      'field', p_field,
      'old', coalesce(p_old, 'null'::jsonb),
      'new', coalesce(p_new, 'null'::jsonb)
    )
  );
end;
$$;

-- ── 2. update_challenge_workspace — extended with Promise/Arc/Ownership/intro ──
--
-- Drop the old signature first (CREATE OR REPLACE only works when args
-- match exactly). Then re-create with the new optional params.

drop function if exists public.update_challenge_workspace(
  uuid, text, text, text, date, date, integer, integer
);

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
) returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_actor uuid := auth.uid();
  v_owner_id uuid;
  v_status challenge_status;
  v_contract_id uuid;
  v_is_party boolean;
  v_promise_changed boolean := false;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;

  -- Snapshot challenge state
  select owner_id, status, contract_id
  into v_owner_id, v_status, v_contract_id
  from public.app_challenge
  where id = p_challenge_id;

  if v_owner_id is null then
    raise exception 'challenge_not_found';
  end if;

  -- Only drafts are editable; locking freezes editing
  if v_status <> 'draft' then
    raise exception 'challenge_not_draft';
  end if;
  if v_contract_id is not null then
    raise exception 'challenge_locked';
  end if;

  -- Owner OR any cohost may edit
  v_is_party := (v_owner_id = v_actor)
    or exists (
      select 1 from public.app_challenge_cohost
      where challenge_id = p_challenge_id and cohost_id = v_actor
    );
  if not v_is_party then
    raise exception 'not_a_collaborator';
  end if;

  -- Validation (matches the previous version + new fields are loose)
  if p_title is null or length(trim(p_title)) < 3 then
    raise exception 'title_too_short';
  end if;
  if p_start_date is null or p_end_date is null then
    raise exception 'dates_required';
  end if;
  if p_end_date <= p_start_date then
    raise exception 'end_before_start';
  end if;
  if p_capacity is not null and (p_capacity < 1 or p_capacity > 10000) then
    raise exception 'capacity_out_of_range';
  end if;
  if p_price_cents is null or p_price_cents < 0 then
    raise exception 'invalid_price';
  end if;
  if p_promise_text is not null and length(p_promise_text) > 600 then
    raise exception 'promise_too_long';
  end if;
  if p_weekly_arc is not null and jsonb_typeof(p_weekly_arc) <> 'array' then
    raise exception 'weekly_arc_must_be_array';
  end if;
  if p_topic_ownership is not null and jsonb_typeof(p_topic_ownership) <> 'array' then
    raise exception 'topic_ownership_must_be_array';
  end if;
  if p_intro_prompt is not null and length(p_intro_prompt) > 500 then
    raise exception 'intro_prompt_too_long';
  end if;

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
end;
$$;

-- ── 3. update_weekly_arc_themes — narrow post-publish surface ──
--
-- After publish, the workspace as a whole is frozen, but the Weekly Arc
-- theme strings remain editable as live narrative guidance for the cohort
-- space header. Owner OR cohost can update; everything else is read-only.

create or replace function public.update_weekly_arc_themes(
  p_challenge_id uuid,
  p_weekly_arc jsonb
) returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_actor uuid := (select auth.uid());
  v_is_party boolean;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if p_weekly_arc is null or jsonb_typeof(p_weekly_arc) <> 'array' then
    raise exception 'weekly_arc_must_be_array';
  end if;

  select (c.owner_id = v_actor) or exists (
    select 1 from public.app_challenge_cohost ch
    where ch.challenge_id = p_challenge_id and ch.cohost_id = v_actor
  ) into v_is_party
  from public.app_challenge c
  where c.id = p_challenge_id;

  if v_is_party is not true then
    raise exception 'not_a_collaborator';
  end if;

  update public.app_challenge set
    weekly_arc = p_weekly_arc,
    promise_edited_at = now(),
    promise_edited_by = v_actor
  where id = p_challenge_id;
end;
$$;
