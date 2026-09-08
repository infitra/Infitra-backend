-- Founding network: one door (8 Sep 2026)
--
-- A card is either not made yet ('none') or in the network and on
-- infitra.fit ('public'). The members-only tier is gone: being shown on the
-- site and in posts is the deal, decided in the 7 Sep test. The reader
-- keeps the two guards that matter: an anonymous caller sees nothing below
-- three public cards, and the directory needs the caller's own card to be
-- live (or admin).

update public.app_profile
   set community_visibility = 'public'
 where community_visibility = 'members';

alter table public.app_profile
  drop constraint if exists app_profile_community_visibility_check,
  add constraint app_profile_community_visibility_check
    check (community_visibility in ('none', 'public'));

comment on column public.app_profile.community_visibility is
  'Founding network card: none (not made yet), public (live in the network and on infitra.fit). Consent is stamped in community_consent_at.';

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
               'open_to', to_jsonb(p.open_to),
               'brings', p.brings,
               'seeks', p.seeks,
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
         and p.community_visibility = 'public'
    ) cards;

  return jsonb_build_object('authorized', true, 'count', v_count, 'members', v_members);
end;
$$;
