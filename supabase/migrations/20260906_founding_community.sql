-- ─────────────────────────────────────────────────────────────────────────────
-- Accounts-lite: the founding community without the workspace (6 Sep 2026)
--
-- A founding expert or studio gets a REAL creator account whose home is the
-- community page, not the workspace. The workspace (create, publish) opens
-- only when the founder flips `workspace_enabled` in the anchor conversation.
--
-- Adds to app_profile:
--   workspace_enabled    admin-only flag; hard gate on publishing (trigger)
--   entity_type          'expert' | 'studio', chosen by the member
--   collab_wish          the one sentence "would love to run six weeks on X with
--                        someone who does Y" (<= 200 chars)
--   community_visibility 'none' | 'members' | 'public' (never pre-ticked)
--   community_consent_at stamped by trigger when visibility leaves 'none'
--
-- Admin RPCs: admin_set_workspace_enabled, admin_mint_creator_invite.
-- Reader RPC: load_founding_community(p_public_only) — public list gated at
-- three or more public cards inside the RPC, so an anonymous caller can never
-- enumerate below the threshold. Explicit columns, never email.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.app_profile
  add column if not exists workspace_enabled boolean not null default false,
  add column if not exists entity_type text not null default 'expert',
  add column if not exists collab_wish text,
  add column if not exists community_visibility text not null default 'none',
  add column if not exists community_consent_at timestamptz;

alter table public.app_profile
  drop constraint if exists app_profile_entity_type_check,
  add constraint app_profile_entity_type_check
    check (entity_type in ('expert', 'studio')),
  drop constraint if exists app_profile_community_visibility_check,
  add constraint app_profile_community_visibility_check
    check (community_visibility in ('none', 'members', 'public')),
  drop constraint if exists app_profile_collab_wish_len,
  add constraint app_profile_collab_wish_len
    check (collab_wish is null or char_length(collab_wish) <= 200);

comment on column public.app_profile.workspace_enabled is
  'Admin-only. False = founding-community account (card + directory only); true = full workspace (create, publish). Backfilled true for every creator that existed before 6 Sep 2026.';
comment on column public.app_profile.community_visibility is
  'Founding community card: none (default, nothing shown), members (directory only), public (directory + infitra.fit). Consent is stamped in community_consent_at.';

-- Nobody already on the platform loses the workspace.
update public.app_profile
   set workspace_enabled = true
 where role in ('creator', 'admin');

-- ── Consent stamp ────────────────────────────────────────────────────────────
create or replace function public.trg_profile_community_consent()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.community_visibility = 'none' then
    new.community_consent_at := null;
  elsif tg_op = 'INSERT'
     or old.community_visibility = 'none'
     or new.community_consent_at is null then
    new.community_consent_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_app_profile_community_consent on public.app_profile;
create trigger trg_app_profile_community_consent
  before insert or update of community_visibility on public.app_profile
  for each row execute function public.trg_profile_community_consent();

-- ── workspace_enabled is admin-only (same shape as the immutable role) ───────
create or replace function public.enforce_profile_workspace_flag_admin_only()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.workspace_enabled is distinct from old.workspace_enabled then
    if current_setting('role', true) = 'service_role' then
      return new;
    end if;
    if auth.uid() is null or not is_admin(auth.uid()) then
      raise exception 'workspace_enabled is admin-only' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_workspace_flag on public.app_profile;
create trigger trg_enforce_profile_workspace_flag
  before update of workspace_enabled on public.app_profile
  for each row execute function public.enforce_profile_workspace_flag_admin_only();

-- ── Hard publish gate: a challenge cannot go live under a disabled workspace ─
create or replace function public.enforce_challenge_owner_workspace()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not exists (
      select 1 from public.app_profile p
       where p.id = new.owner_id and p.workspace_enabled
    ) then
      raise exception 'workspace_disabled' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_challenge_owner_workspace on public.app_challenge;
create trigger trg_enforce_challenge_owner_workspace
  before insert or update of status on public.app_challenge
  for each row execute function public.enforce_challenge_owner_workspace();

-- ── Admin: flip the workspace ────────────────────────────────────────────────
create or replace function public.admin_set_workspace_enabled(
  p_user uuid, p_enabled boolean, p_note text default null
) returns void
language plpgsql security definer
set search_path = 'public'
as $$
declare
  v_admin uuid;
begin
  v_admin := app_admin_assert();
  update app_profile
     set workspace_enabled = p_enabled, updated_at = now()
   where id = p_user and role in ('creator', 'admin');
  if not found then raise exception 'creator not found'; end if;
  insert into app_admin_action_log (admin_id, action, target, detail)
  values (v_admin, 'set_workspace_enabled', p_user::text,
          jsonb_build_object('enabled', p_enabled, 'note', nullif(btrim(coalesce(p_note, '')), '')));
end;
$$;

revoke all on function public.admin_set_workspace_enabled(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_workspace_enabled(uuid, boolean, text) to authenticated, service_role;

-- ── Admin: mint an expert invite (codes were hand-minted until now) ──────────
create or replace function public.admin_mint_creator_invite(
  p_note text default null, p_days integer default 60
) returns jsonb
language plpgsql security definer
set search_path = 'public'
as $$
declare
  v_admin uuid;
  v_code text;
  v_exp timestamptz;
begin
  v_admin := app_admin_assert();
  insert into app_creator_invite (note, expires_at)
  values (nullif(btrim(coalesce(p_note, '')), ''),
          now() + make_interval(days => least(greatest(coalesce(p_days, 60), 1), 180)))
  returning code, expires_at into v_code, v_exp;
  insert into app_admin_action_log (admin_id, action, target, detail)
  values (v_admin, 'mint_creator_invite', v_code,
          jsonb_build_object('note', p_note, 'expires_at', v_exp));
  return jsonb_build_object(
    'code', v_code,
    'url', 'https://www.infitra.fit/join-as-expert?code=' || v_code,
    'expires_at', v_exp
  );
end;
$$;

revoke all on function public.admin_mint_creator_invite(text, integer) from public, anon;
grant execute on function public.admin_mint_creator_invite(text, integer) to authenticated, service_role;

-- ── Admin: list invites (open and redeemed) for the People tab ───────────────
create or replace function public.admin_creator_invites()
returns jsonb
language sql security definer stable
set search_path = 'public'
as $$
  select case when app_admin_assert() is not null then
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', i.code, 'note', i.note, 'created_at', i.created_at,
        'expires_at', i.expires_at, 'redeemed_by', i.redeemed_by,
        'redeemed_at', i.redeemed_at, 'revoked', i.revoked,
        'redeemed_name', p.display_name
      ) order by i.created_at desc)
      from app_creator_invite i
      left join app_profile p on p.id = i.redeemed_by
    ), '[]'::jsonb)
  end;
$$;

revoke all on function public.admin_creator_invites() from public, anon;
grant execute on function public.admin_creator_invites() to authenticated, service_role;

-- ── The directory and the public list ────────────────────────────────────────
-- One reader for both surfaces. p_public_only = true is anon-executable and
-- returns [] until three public cards exist. p_public_only = false requires a
-- signed-in member whose own card is at least members-visible (reciprocity),
-- or an admin, and returns members-or-public cards.
create or replace function public.load_founding_community(p_public_only boolean default true)
returns jsonb
language plpgsql security definer stable
set search_path = 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_min_vis text;
  v_count integer;
  v_self_vis text;
  v_self_admin boolean := false;
  v_members jsonb;
begin
  if p_public_only then
    v_min_vis := 'public';
  else
    if v_uid is null then
      return jsonb_build_object('authorized', false, 'reason', 'not_authenticated',
                                'count', 0, 'members', '[]'::jsonb);
    end if;
    select community_visibility, coalesce(is_admin, false)
      into v_self_vis, v_self_admin
      from app_profile where id = v_uid;
    if not v_self_admin and coalesce(v_self_vis, 'none') = 'none' then
      select count(*) into v_count
        from app_profile
       where role in ('creator', 'admin') and community_visibility in ('members', 'public');
      return jsonb_build_object('authorized', false, 'reason', 'card_not_visible',
                                'count', v_count, 'members', '[]'::jsonb);
    end if;
    v_min_vis := 'members';
  end if;

  select count(*) into v_count
    from app_profile p
   where p.role in ('creator', 'admin')
     and (p.community_visibility = 'public'
          or (v_min_vis = 'members' and p.community_visibility = 'members'));

  if p_public_only and v_count < 3 then
    return jsonb_build_object('authorized', true, 'count', v_count, 'members', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(card order by consent_at asc nulls last), '[]'::jsonb)
    into v_members
    from (
      select p.community_consent_at as consent_at,
             jsonb_build_object(
               'id', p.id,
               'display_name', p.display_name,
               'avatar_url', p.avatar_url,
               'tagline', p.tagline,
               'bio', p.bio,
               'username', p.username,
               'entity_type', p.entity_type,
               'is_founding_expert', p.is_founding_expert,
               'visibility', p.community_visibility,
               'collab_wish', p.collab_wish,
               'facts', jsonb_build_object(
                 'city', p.profile_facts->>'city',
                 'disciplines', coalesce(p.profile_facts->'disciplines', '[]'::jsonb),
                 'focus', p.profile_facts->>'focus'
               ),
               'credentials', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'kind', c.kind, 'title', c.title, 'org', c.org,
                          'year', c.year, 'year_end', c.year_end)
                        order by c.sort_order, c.created_at)
                   from app_expert_credential c
                  where c.profile_id = p.id
               ), '[]'::jsonb)
             ) as card
        from app_profile p
       where p.role in ('creator', 'admin')
         and p.display_name is not null
         and (p.community_visibility = 'public'
              or (v_min_vis = 'members' and p.community_visibility = 'members'))
    ) cards;

  return jsonb_build_object('authorized', true, 'count', v_count, 'members', v_members);
end;
$$;

revoke all on function public.load_founding_community(boolean) from public;
grant execute on function public.load_founding_community(boolean) to anon, authenticated, service_role;
