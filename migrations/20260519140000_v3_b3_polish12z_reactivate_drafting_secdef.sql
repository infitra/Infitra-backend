-- Bundle 3 polish v12.Z: make reactivate_drafting SECURITY DEFINER
--
-- For consistency with the other contract-flow RPCs (all already
-- SECURITY DEFINER: lock_contract, lock_challenge_contract,
-- respond_to_contract, publish_challenge), align reactivate_drafting.
--
-- The function only updates app_challenge (owner-only RLS allows that
-- as INVOKER) and calls post_workspace_log (already SECURITY DEFINER),
-- so it CAN run as INVOKER today. But making it DEFINER:
--   - removes a class of "why does X work and Y not?" inconsistency
--     that's bitten the project before (v12.V was the same fix for
--     respond_to_contract — broken until aligned)
--   - future-proofs if the function ever needs to write to
--     service_role-only tables (notifications, audit logs)
--
-- Safety: the function already does its own authorization (rejects
-- when auth.uid() does not match p_actor, verifies the actor owns
-- the target). So DEFINER does not widen the access surface.

alter function public.reactivate_drafting(text, uuid, uuid, uuid)
  security definer;
