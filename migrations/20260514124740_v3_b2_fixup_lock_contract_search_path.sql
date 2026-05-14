-- Bundle 2 fixup: pin search_path on lock_challenge_contract.
--
-- The original implementation didn't set search_path; the rewrite in
-- migration 5 (status-change-notifications) preserved that oversight.
-- This makes the function consistent with the other workspace RPCs and
-- silences the "Function Search Path Mutable" advisor warning.
--
-- Body is identical to the version in migration 5 — the only change is
-- adding `set search_path to 'public'` after `security definer`.

create or replace function public.lock_challenge_contract(
  p_challenge_id uuid,
  p_actor uuid
) returns uuid
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_challenge app_challenge;
  v_snapshot jsonb;
  v_contract_id uuid;
  v_cohost uuid;
begin
  select * into v_challenge from app_challenge where id = p_challenge_id;
  if not found then raise exception 'challenge_not_found'; end if;
  if v_challenge.owner_id != p_actor then raise exception 'only_owner_can_lock'; end if;
  if v_challenge.status != 'draft' then raise exception 'challenge_not_draft'; end if;

  if not exists (select 1 from app_challenge_cohost where challenge_id = p_challenge_id) then
    raise exception 'no_cohosts_to_lock';
  end if;

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

  v_contract_id := lock_contract('challenge', p_challenge_id, p_actor, v_snapshot, null);

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
