-- Public launch of the founding network (10 Nov 2026). Five live member
-- cards, the go-visible threshold, so the public branch opens: the landing
-- hero and /founding-network show every card whose member consented to be
-- featured (community_visibility = 'public').
--
-- The 9 Sep lesson stays in force: test accounts are real rows and must
-- never reach a public page. Every test account sits on Resend's sandbox
-- (delivered+<name>@resend.dev, since 20261014), so the public branch skips
-- that domain. A pattern is safe here because it can only hide a card.
-- To close the public view again: restore the early return of 20260909.
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
         and not (p_public_only and exists (
               select 1 from auth.users u
                where u.id = p.id and lower(u.email) like '%@resend.dev'))
    ) cards;

  return jsonb_build_object('authorized', true,
                            'count', case when p_public_only then 0 else v_count end,
                            'members', v_members);
end;
$$;
