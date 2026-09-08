-- Founding network card v4 (8 Sep 2026, third test): the card carries no
-- disciplines and no focus. The reader exposes only what the card renders:
-- facts = city. profile_facts itself is untouched (the workspace profile
-- editor and the participant-facing profile still use it).

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
               'bio', p.bio,
               'username', p.username,
               'entity_type', p.entity_type,
               'is_founding_expert', p.is_founding_expert,
               'brings', p.brings,
               'seeks', p.seeks,
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
