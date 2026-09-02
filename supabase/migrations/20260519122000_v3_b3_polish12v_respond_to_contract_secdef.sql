-- Bundle 3 polish v12.V: make respond_to_contract SECURITY DEFINER
--
-- Symptom: clicking "Send request" (or Accept) on the locked-state
-- workspace returned `permission denied for table app_notification`.
--
-- Root cause: `respond_to_contract` runs as INVOKER (no SECURITY
-- DEFINER), but the `authenticated` role only has SELECT on
-- `app_notification` — INSERT is reserved for `service_role`. Both
-- the accept and decline branches insert a notification for the
-- counterpart, so Postgres denied at the table GRANT layer before
-- RLS ran. The cohost-side accept/decline flow was effectively
-- broken any time it actually tried to fire.
--
-- The two sibling contract-flow functions (`lock_challenge_contract`,
-- `publish_challenge`) are both already SECURITY DEFINER — that's
-- why locking and publishing have been working. `respond_to_contract`
-- was the outlier. Bringing it in line.
--
-- Safety: the function does its own authorization:
--   - rejects when auth.uid() does not match p_actor (caller spoof)
--   - verifies the actor is a cohort on the target via
--     app_session_cohost or app_challenge_cohost
-- So escalating to DEFINER does not loosen the access surface —
-- callers still can only act for themselves on contracts they're a
-- party to.

alter function public.respond_to_contract(uuid, uuid, text, text)
  security definer;
