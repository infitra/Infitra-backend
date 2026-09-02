-- Bundle 3 polish v12.U.1: add app_collaboration_contract to the
-- supabase_realtime publication so the cohost's workspace can
-- subscribe to INSERT events directly when terms are locked.
--
-- Today the cohost relies on the UPDATE event on app_challenge
-- (contract_id flipping from null to a uuid) to detect a lock and
-- call router.refresh(). That works in principle but the propagation
-- was reported as unreliable — the cohost could keep editing in the
-- window between the lock and the UI flipping to read-only.
--
-- Adding a second realtime signal — the contract INSERT itself —
-- gives the cohost a more direct "a contract was just locked for
-- this challenge" event to react to. Belt and suspenders: either
-- signal arriving will trigger router.refresh().

alter publication supabase_realtime add table public.app_collaboration_contract;

-- REPLICA IDENTITY FULL so the cohost subscriber can filter by
-- target_id (target_id isn't a primary key, so default replica
-- identity wouldn't include it in the broadcast payload reliably).
alter table public.app_collaboration_contract replica identity full;
