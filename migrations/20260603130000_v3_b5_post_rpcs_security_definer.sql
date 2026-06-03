-- Bundle 5c fix — directed questions (and coach answers) failed with
-- "permission denied for table app_notification".
--
-- create_challenge_post / create_challenge_comment run as the CALLER
-- (SECURITY INVOKER). A question post and a coach-answer comment each emit an
-- app_notification row, but `authenticated` only has SELECT on app_notification
-- (notifications are system-emitted, service_role-only). So the post/comment
-- inserted, then the notification insert was denied and the whole call rolled
-- back — questions could never be asked.
--
-- Both functions already FULLY authorize the caller themselves before writing:
--   create_challenge_post   → actor check + can_post_in_challenge_space + the
--                             directed_to "creators only" validation.
--   create_challenge_comment→ actor check + can_access_challenge_space.
-- They're owned by postgres, so running them SECURITY DEFINER lets the
-- notification emit succeed while the in-function checks keep authorization
-- intact. search_path is already pinned to 'public' (safe for DEFINER).
ALTER FUNCTION public.create_challenge_post(uuid, text, text, text, text, uuid, uuid[], jsonb)
  SECURITY DEFINER;

ALTER FUNCTION public.create_challenge_comment(uuid, text)
  SECURITY DEFINER;
