-- Bundle 3 polish v12.W: realtime for contract accept / decline.
--
-- The owner's locked-state workspace didn't react when the cohost
-- accepted or declined — they had to refresh to see the banner
-- update (or notice the chat system message). The lock event itself
-- has two realtime triggers (app_challenge UPDATE + the new
-- app_collaboration_contract INSERT from v12.U.1), but the cohost's
-- response was silent on the owner's side.
--
-- Adding INSERT realtime for both acceptance and decline so the
-- owner's banner flips to "All signatures in" (acceptance) or
-- "Changes requested — agreement on hold" (decline) the moment the
-- cohost submits, without the owner refreshing.
--
-- REPLICA IDENTITY FULL: the subscriber filters client-side by
-- contract_id (not the primary key on these tables, so default
-- replica identity wouldn't reliably surface it in the payload).

alter publication supabase_realtime add table public.app_collaboration_acceptance;
alter publication supabase_realtime add table public.app_collaboration_decline;

alter table public.app_collaboration_acceptance replica identity full;
alter table public.app_collaboration_decline replica identity full;
