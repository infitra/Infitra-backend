-- Founding network: one link on the card (8 Sep 2026)
--
-- "Where to find me": a website or an Instagram page, one column, optional.
-- Shown inside the network only (the logged-in reader), never on the public
-- surfaces, so the homepage does not become an outbound directory.

alter table public.app_profile
  add column if not exists link_url text,
  drop constraint if exists app_profile_link_url_check,
  add constraint app_profile_link_url_check
    check (link_url is null or (length(link_url) <= 200 and link_url ~* '^https?://'));

comment on column public.app_profile.link_url is
  'Founding card: where to find them (website or Instagram), normalised to a URL. Network-only; the public reader omits it.';

create or replace function public.enforce_profile_side_fields()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.role = 'participant' then
    new.entity_type := null;
    new.workspace_enabled := false;
    new.community_visibility := 'none';
    new.brings := null;
    new.seeks := null;
    new.link_url := null;
    new.announce_ok := false;
  else
    if new.entity_type is null then
      new.entity_type := 'expert';
    end if;
  end if;
  return new;
end;
$$;

alter table public.app_profile
  drop constraint if exists app_profile_participant_no_supply_fields,
  add constraint app_profile_participant_no_supply_fields
    check (
      role <> 'participant'
      or (workspace_enabled = false and community_visibility = 'none'
          and brings is null and seeks is null and link_url is null and announce_ok = false)
    );

create or replace function public.load_founding_community(p_public_only boolean default true)
returns jsonb
language plpgsql security definer stable
set search_path = 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_self_vis text;
  v_self_admin boolean := false;
  v_members jsonb;
begin
  select count(*) into v_count
    from app_profile p
   where p.role in ('creator', 'admin')
     and p.display_name is not null
     and p.community_visibility = 'public';

  if p_public_only then
    if v_count < 3 then
      return jsonb_build_object('authorized', true, 'count', v_count, 'members', '[]'::jsonb);
    end if;
  else
    if v_uid is null then
      return jsonb_build_object('authorized', false, 'reason', 'not_authenticated',
                                'count', 0, 'members', '[]'::jsonb);
    end if;
    select community_visibility, coalesce(is_admin, false)
      into v_self_vis, v_self_admin
      from app_profile where id = v_uid;
    if not v_self_admin and coalesce(v_self_vis, 'none') <> 'public' then
      return jsonb_build_object('authorized', false, 'reason', 'card_not_visible',
                                'count', v_count, 'members', '[]'::jsonb);
    end if;
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
               'username', p.username,
               'entity_type', p.entity_type,
               'is_founding_expert', p.is_founding_expert,
               'brings', p.brings,
               'seeks', p.seeks,
               'link_url', case when p_public_only then null else p.link_url end,
               'facts', jsonb_build_object('city', p.profile_facts->>'city'),
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
         and p.community_visibility = 'public'
    ) cards;

  return jsonb_build_object('authorized', true, 'count', v_count, 'members', v_members);
end;
$$;

create or replace function public.admin_people(p_query text default null, p_limit integer default 200)
returns jsonb
language plpgsql security definer
set search_path = 'public'
as $$
declare
    v jsonb;
begin
    perform app_admin_assert();

    select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]'::jsonb) into v
    from (
        select
            p.id, p.display_name, p.username, p.role, p.is_admin, p.visibility,
            p.created_at, p.is_founding_expert,
            p.workspace_enabled, p.entity_type, p.community_visibility, p.announce_ok,
            p.brings, p.seeks, p.link_url,
            u.email,
            u.banned_until,
            u.raw_user_meta_data ->> 'terms_version' as terms_version,
            u.raw_user_meta_data ->> 'terms_accepted_at' as terms_accepted_at,
            u.raw_user_meta_data ->> 'health_consent_at' as health_consent_at,
            (select count(*) from app_transaction t where t.buyer_id = p.id and t.status = 'succeeded') as purchases,
            (select count(*) from app_challenge_member m where m.user_id = p.id) as memberships
        from app_profile p
        left join auth.users u on u.id = p.id
        where p_query is null or p_query = ''
           or p.display_name ilike '%' || p_query || '%'
           or p.username ilike '%' || p_query || '%'
           or u.email ilike '%' || p_query || '%'
        order by p.created_at desc
        limit least(greatest(coalesce(p_limit, 200), 1), 500)
    ) r;

    return v;
end;
$$;
