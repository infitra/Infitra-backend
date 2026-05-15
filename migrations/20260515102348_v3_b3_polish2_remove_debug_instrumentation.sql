-- Bundle 3 polish v2: remove the temporary debug instrumentation
-- (table + diagnostic insert in update_challenge_workspace).
-- The instrumentation confirmed topic_ownership saves were
-- persisting correctly — the bug was actually partner-side display
-- not adopting prop changes (fixed in the polish v2 commit).

drop table if exists public._debug_rpc_log;

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
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select owner_id, status, contract_id
  into v_owner_id, v_status, v_contract_id
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
end;
$$;
