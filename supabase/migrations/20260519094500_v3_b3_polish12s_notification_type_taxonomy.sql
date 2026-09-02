-- Bundle 3 polish v12.S: extend app_notification_type_check to cover
-- the contract-flow and publish notification types that existing
-- production RPCs already write.
--
-- Symptom: Lock Terms for Review failed with
--   `new row for relation "app_notification" violates check constraint
--    "app_notification_type_check"`
-- because `lock_challenge_contract` inserts a notification with
-- type='contract_locked', which wasn't in the allow-list. The same
-- bug was lurking in three other code paths that the user hadn't hit
-- yet (respond_to_contract → 'contract_accepted' / 'contract_declined',
-- publish_challenge → 'challenge_published') — fixing them all in one
-- pass so the user doesn't trip into them downstream.
--
-- SR-I1: keep the schema constraint as the canonical guardrail —
-- extending the explicit allow-list instead of loosening to ANY value.

alter table public.app_notification
  drop constraint app_notification_type_check;

alter table public.app_notification
  add constraint app_notification_type_check
  check (type = any (array[
    -- existing
    'review_new',
    'dm_new',
    'system',
    'badge_awarded',
    'badge_monthly_digest',
    'collab_invite',
    'collab_accepted',
    -- polish v12.S — types already emitted by existing RPCs:
    'contract_locked',      -- lock_challenge_contract → cohost
    'contract_accepted',    -- respond_to_contract (accept) → owner + other cohosts
    'contract_declined',    -- respond_to_contract (decline) → owner
    'challenge_published'   -- publish_challenge → cohosts
  ]));
