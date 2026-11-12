-- The public view of the founding network carries the face only (12 Nov 2026).
--
-- A card went live on infitra.fit as an initial, with a misread second answer.
-- From now on:
--   * public pages show only cards with a photo (the join form requires one;
--     this also covers cards saved before that rule);
--   * the public branch returns the face (photo, name, one line, city, type,
--     founding badge) and nothing else: what a member brings, who they would
--     want next to them and their background are for signed-in members.
-- Members and admins (p_public_only = false) are unchanged.
create or replace function public.load_founding_community(p_public_only boolean default true) returns jsonb
    language plpgsql stable security definer
    set search_path to 'public'
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

  if not p_public_only then
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
               'brings', case when p_public_only then null else p.brings end,
               'seeks', case when p_public_only then null else p.seeks end,
               'link_url', case when p_public_only then null else p.link_url end,
               'facts', jsonb_build_object('city', p.profile_facts->>'city'),
               'credentials', case when p_public_only then '[]'::jsonb else coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'kind', c.kind, 'title', c.title, 'org', c.org,
                          'year', c.year, 'year_end', c.year_end)
                        order by c.sort_order, c.created_at)
                   from app_expert_credential c
                  where c.profile_id = p.id
               ), '[]'::jsonb) end
             ) as card
        from app_profile p
       where p.role in ('creator', 'admin')
         and p.display_name is not null
         and p.community_visibility = 'public'
         and not (p_public_only and p.avatar_url is null)
         and not (p_public_only and exists (
               select 1 from auth.users u
                where u.id = p.id and lower(u.email) like '%@resend.dev'))
    ) cards;

  return jsonb_build_object('authorized', true,
                            'count', case when p_public_only then 0 else v_count end,
                            'members', v_members);
end;
$$;
