-- Bundle 5c fix (2/2) — allow the directed-question notification types.
--
-- create_challenge_post emits 'question_for_you' and create_challenge_comment
-- emits 'coach_answered_your_question', but app_notification_type_check never
-- included them (added by Bundle 2's RPCs, never whitelisted on the table). So
-- even with the privilege fix, the insert failed a CHECK constraint. Add the
-- two types to the allowed set; everything else is unchanged.
ALTER TABLE public.app_notification DROP CONSTRAINT IF EXISTS app_notification_type_check;
ALTER TABLE public.app_notification ADD CONSTRAINT app_notification_type_check
  CHECK (type = ANY (ARRAY[
    'review_new','dm_new','system','badge_awarded','badge_monthly_digest',
    'collab_invite','collab_accepted','contract_locked','contract_accepted',
    'contract_declined','challenge_published',
    'question_for_you','coach_answered_your_question'
  ]::text[]));
