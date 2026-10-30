-- The admin board tells a pending card from a live or withdrawn one
-- (2026-10-30).
--
-- An expert who redeems an invite and signs up shows as "redeemed" in green,
-- but the card only goes live when they publish it. Jutta signed up on 29 Oct
-- and never published: the board looked done and the missing card-live email
-- looked like a failure.
--
-- community_consent_at is cleared when a card goes back to 'none', so it
-- cannot tell "never published" from "withdrawn". The member welcome can: it
-- is enqueued once per member ever, the moment a card first goes live
-- (20260930_network_card_emails), and outbox rows are kept. So:
--   card_was_live = a network_welcome row exists for the member.
-- Lookup rides uniq_email_outbox_user_kind_target (user_id, kind, target_id).
-- Every member live today has that row (checked 30 Oct), so no backfill.
--
-- Read-only addition to admin_people; privileges survive CREATE OR REPLACE.

create or replace function public.admin_people(p_query text default null::text, p_limit integer default 200)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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
            exists (select 1 from app_email_outbox o
                     where o.user_id = p.id and o.kind = 'network_welcome' and o.target_id = p.id) as card_was_live,
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
$function$;
