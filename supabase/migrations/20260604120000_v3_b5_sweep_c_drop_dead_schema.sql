-- Bundle 5 sweep C: drop dead schema (app_order, app_challenge_space_member)
-- and wire app_challenge_member into realtime.
--
-- app_challenge_space_member (0 rows) was NOT pure dead schema: it backed a
-- dormant capability — cohosts of a SHARED experience got space-admin via
-- is_challenge_space_admin clause 2, which ensure_challenge_space_for_published_challenge
-- populated with the owner + cohosts. We re-source that capability from the
-- canonical collaboration table (app_challenge_cohost) so the drop is LOSSLESS,
-- then remove the redundant denormalization.
--
-- app_order (0 rows) is fully dead: no FKs, triggers, views, or function refs.
--
-- Whole migration is one transaction: if anything fails (incl. the empty-table
-- guard), everything rolls back and no table is dropped.

-- 0. Empty-table guard. Defends against rows appearing between the audit and
--    this migration (e.g. a shared-challenge publish via the old function).
do $$
begin
  if (select count(*) from public.app_challenge_space_member) > 0 then
    raise exception 'app_challenge_space_member is not empty - aborting drop';
  end if;
  if (select count(*) from public.app_order) > 0 then
    raise exception 'app_order is not empty - aborting drop';
  end if;
end $$;

-- 1. app_challenge_space SELECT policy: drop the now-redundant space_member
--    clause. Cohosts are already covered by the app_challenge_cohost clause and
--    buyers by the app_challenge_member clause, so this is behavior-preserving.
--    ALTER POLICY preserves the policy's PERMISSIVE flag and role grants.
alter policy challenge_space_select_access on public.app_challenge_space
  using (
    owner_id = (select auth.uid())
    or exists (
        select 1 from public.app_challenge_member cm
        where cm.challenge_id = app_challenge_space.source_challenge_id
          and cm.user_id = (select auth.uid())
    )
    or exists (
        select 1 from public.app_challenge_cohost ch
        where ch.challenge_id = app_challenge_space.source_challenge_id
          and ch.cohost_id = (select auth.uid())
    )
  );

-- 2. is_challenge_space_admin: re-source cohost-admin from app_challenge_cohost.
--    Old clause 2 granted admin to app_challenge_space_member rows with role
--    owner/admin; that table was only ever populated with the space owner
--    (already covered by clause 1) and the source challenge's cohosts, so
--    deriving cohost-admin directly from app_challenge_cohost is equivalent.
create or replace function public.is_challenge_space_admin(p_space uuid, p_user uuid)
 returns boolean
 language sql
 stable
 set search_path to 'public'
as $function$
    select exists (
        select 1
        from public.app_challenge_space s
        where s.id = p_space
          and s.owner_id = p_user
    )
    or exists (
        select 1
        from public.app_challenge_space s
        join public.app_challenge_cohost ch
          on ch.challenge_id = s.source_challenge_id
        where s.id = p_space
          and ch.cohost_id = p_user
    );
$function$;

-- 3. ensure_challenge_space_for_published_challenge: drop the (now pointless)
--    app_challenge_space_member denormalization inserts. The space create/update
--    logic is otherwise unchanged; cohost-admin is derived live in (2).
create or replace function public.ensure_challenge_space_for_published_challenge(
    p_challenge uuid,
    p_actor uuid,
    p_title text default null::text,
    p_description text default null::text,
    p_ownership_type text default null::text
)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
    v_uid uuid := auth.uid();
    v_actor uuid := coalesce(v_uid, p_actor);

    v_challenge public.app_challenge%rowtype;
    v_existing_space_id uuid;
    v_space_id uuid;

    v_title_input text := nullif(btrim(p_title), '');
    v_description_input text := p_description;
    v_ownership_type_input text := nullif(btrim(p_ownership_type), '');

    v_title text;
    v_description text;
    v_ownership_type text;

    v_prev_challenge_id uuid;
    v_prev_space_id uuid;
begin
    if v_uid is not null and v_uid <> p_actor then
        raise exception 'caller_mismatch_auth_uid';
    end if;

    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_challenge is null then
        raise exception 'challenge_id is required';
    end if;

    select *
    into v_challenge
    from public.app_challenge
    where id = p_challenge;

    if v_challenge.id is null then
        raise exception 'Challenge not found';
    end if;

    if v_challenge.owner_id <> v_actor then
        raise exception 'Only the challenge owner may ensure challenge space';
    end if;

    if v_challenge.status <> 'published' then
        raise exception 'Challenge space can only be ensured for published challenges';
    end if;

    if v_ownership_type_input is not null
       and v_ownership_type_input not in ('solo', 'shared') then
        raise exception 'ownership_type must be solo or shared';
    end if;

    select s.id
    into v_existing_space_id
    from public.app_challenge_space s
    where s.source_challenge_id = v_challenge.id
    limit 1;

    if v_existing_space_id is not null then
        update public.app_challenge_space s
        set
            title = coalesce(v_title_input, s.title),
            description = coalesce(v_description_input, s.description),
            ownership_type = coalesce(v_ownership_type_input, s.ownership_type),
            continuation_group_id = coalesce(s.continuation_group_id, v_challenge.continuation_group_id),
            updated_at = now()
        where s.id = v_existing_space_id;

        return v_existing_space_id;
    end if;

    if v_challenge.continuation_group_id is not null then
        select c.continued_from_challenge_id
        into v_prev_challenge_id
        from public.app_challenge c
        where c.id = v_challenge.id;

        if v_prev_challenge_id is not null then
            select s.id
            into v_prev_space_id
            from public.app_challenge_space s
            where s.source_challenge_id = v_prev_challenge_id
               or s.continuation_group_id is not distinct from v_challenge.continuation_group_id
            order by s.created_at asc, s.id asc
            limit 1;

            if v_prev_space_id is not null then
                update public.app_challenge_space s
                set
                    continuation_group_id = coalesce(s.continuation_group_id, v_challenge.continuation_group_id),
                    title = coalesce(v_title_input, s.title),
                    description = coalesce(v_description_input, s.description),
                    ownership_type = coalesce(v_ownership_type_input, s.ownership_type),
                    updated_at = now()
                where s.id = v_prev_space_id;

                return v_prev_space_id;
            end if;
        end if;
    end if;

    v_title := coalesce(v_title_input, v_challenge.title);
    v_description := coalesce(v_description_input, v_challenge.description);
    v_ownership_type := coalesce(v_ownership_type_input, 'solo');

    insert into public.app_challenge_space (
        continuation_group_id,
        kind,
        title,
        description,
        ownership_type,
        owner_id,
        created_by,
        source_challenge_id
    )
    values (
        v_challenge.continuation_group_id,
        'challenge',
        v_title,
        v_description,
        v_ownership_type,
        v_challenge.owner_id,
        v_actor,
        v_challenge.id
    )
    returning id into v_space_id;

    return v_space_id;
end;
$function$;

-- 4. Drop the dead tables. No CASCADE: after (1)-(3) nothing references them, so
--    a plain DROP must succeed; if it fails, an unseen dependency exists and the
--    whole migration rolls back (fail loud). RLS policies drop with the tables.
drop table public.app_challenge_space_member;
drop table public.app_order;

-- 5. Wire app_challenge_member into realtime so useExperienceSpaceRealtime sees
--    the tribe grow/shrink. REPLICA IDENTITY FULL so DELETE payloads carry
--    challenge_id (the subscription's filter column). Note: under the
--    "read challenge membership" RLS policy, peer INSERT/DELETE is delivered
--    live only to the owner/cohosts; participants pick up roster changes via the
--    DEFINER snapshot on channel-recover / tab-return — by design.
alter publication supabase_realtime add table public.app_challenge_member;
alter table public.app_challenge_member replica identity full;
