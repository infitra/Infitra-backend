-- Bundle 3 polish v2:
--
-- 1. Add app_challenge_cohost and app_collaboration_invite to the
--    supabase_realtime publication. The first creator's view stayed
--    on "Awaiting" after the partner accepted because we weren't
--    subscribed to either table; the second creator joined the cohort
--    list but the first creator's UI never knew.
--
-- 2. Fix the dm_message notification trigger to SKIP kind='system'
--    messages. The trigger was firing dm_new notifications for every
--    chat post, including system-generated ones (e.g. "Yves Imhasly
--    joined the collaboration"). Notifications should fire on direct
--    asks (real chat messages from a human), not on framework chatter.

alter publication supabase_realtime add table public.app_challenge_cohost;
alter publication supabase_realtime add table public.app_collaboration_invite;

alter table public.app_challenge_cohost replica identity full;
alter table public.app_collaboration_invite replica identity full;

create or replace function public.trg_dm_message_notify()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
as $$
begin
  if new.kind is not null and new.kind <> 'user' then
    return new;
  end if;

  insert into app_notification (recipient_id, type, payload)
  select
    m.user_id,
    'dm_new',
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'message_id', new.id,
      'actor_id', new.author_id,
      'preview', left(coalesce(new.body, ''), 140)
    )
  from app_dm_member m
  where m.conversation_id = new.conversation_id
    and m.user_id <> new.author_id
  on conflict do nothing;

  return new;
end;
$$;
