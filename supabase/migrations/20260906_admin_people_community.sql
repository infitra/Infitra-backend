-- admin_people carries the founding-community columns (6 Sep 2026) so the
-- People tab can show and flip the workspace flag and read card visibility.
-- Same body as admin_board_v1, four columns added.

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
            p.workspace_enabled, p.entity_type, p.community_visibility, p.collab_wish,
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
