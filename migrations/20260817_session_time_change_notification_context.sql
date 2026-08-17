-- =============================================================================
-- Reschedule notifications carry their context (2026-08-17, founder feedback)
--
-- The in-app notification for a moved session was cold: "Session rescheduled,
-- new time X" — no session name, no reason, no sender, no link. The payload
-- now carries everything the bell needs to render a warm, useful row:
-- session_title, experience context, the acting expert (actor_id — the bell
-- already resolves actor avatars/names generically), the reason, and
-- challenge_id for a deep link into the space. auth.uid() resolves through
-- the reschedule RPC's request context; service-role/SQL moves leave it null
-- and the bell falls back to neutral copy.
-- =============================================================================

create or replace function public.on_published_session_time_change()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if old.status = 'published'
     and new.start_time is distinct from old.start_time then

    if coalesce(new.change_reason, '') = '' then
      raise exception 'Changing start_time on a published session requires change_reason.'
        using errcode = '23514';
    end if;

    insert into public.app_notification (recipient_id, type, payload)
    select distinct
      recipients.recipient_id,
      'system',
      jsonb_build_object(
        'kind', 'session_time_changed',
        'session_id', new.id,
        'session_title', new.title,
        'challenge_id', (select cs.challenge_id from public.app_challenge_session cs
                         where cs.session_id = new.id limit 1),
        'experience_title', (select ch.title from public.app_challenge_session cs
                             join public.app_challenge ch on ch.id = cs.challenge_id
                             where cs.session_id = new.id limit 1),
        'actor_id', auth.uid(),
        'old_start_time', old.start_time,
        'new_start_time', new.start_time,
        'reason', new.change_reason
      )
    from (
      -- direct session buyers
      select t.buyer_id as recipient_id
      from public.app_transaction t
      where t.session_id = new.id
        and t.status = 'succeeded'

      union

      -- challenge bundle buyers for any parent challenge containing this session
      select t.buyer_id as recipient_id
      from public.app_challenge_session cs
      join public.app_transaction t
        on t.challenge_id = cs.challenge_id
      where cs.session_id = new.id
        and t.status = 'succeeded'

      union

      -- session host
      select new.host_id as recipient_id

      union

      -- session cohosts
      select sc.cohost_id as recipient_id
      from public.app_session_cohost sc
      where sc.session_id = new.id

      union

      -- challenge owners for any parent challenge containing this session
      select c.owner_id as recipient_id
      from public.app_challenge_session cs
      join public.app_challenge c
        on c.id = cs.challenge_id
      where cs.session_id = new.id

      union

      -- challenge cohosts for any parent challenge containing this session
      select cc.cohost_id as recipient_id
      from public.app_challenge_session cs
      join public.app_challenge_cohost cc
        on cc.challenge_id = cs.challenge_id
      where cs.session_id = new.id
    ) recipients
    where recipients.recipient_id is not null;

  end if;

  return new;
end;
$function$;
