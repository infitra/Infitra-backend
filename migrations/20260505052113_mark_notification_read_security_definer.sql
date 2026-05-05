-- The mark-read RPCs were silently failing for end users: the
-- `authenticated` role only has SELECT on app_notification, so the
-- inline UPDATE inside the SECURITY INVOKER function was rejected at
-- the privilege layer (before RLS even ran). Result: clicking a
-- notification or "Mark all read" never persisted — items kept
-- showing the unread accent rule on every reload.
--
-- Fix: switch both functions to SECURITY DEFINER. The owner
-- (postgres) has UPDATE, so the function body runs successfully.
-- Access stays scoped to the caller via the explicit
-- `recipient_id = auth.uid()` predicate inside each function — the
-- caller can still only mark their own notifications.

create or replace function public.mark_notification_read(p_id uuid)
  returns void
  language sql
  security definer
  set search_path to 'public'
as $$
  update public.app_notification
     set read_at = now()
   where id = p_id
     and recipient_id = auth.uid();
$$;

create or replace function public.mark_all_notifications_read()
  returns void
  language sql
  security definer
  set search_path to 'public'
as $$
  update public.app_notification
     set read_at = now()
   where recipient_id = auth.uid()
     and read_at is null;
$$;
