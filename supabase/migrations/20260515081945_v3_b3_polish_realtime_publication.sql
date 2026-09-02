-- Bundle 3 polish: add tables to the supabase_realtime publication so
-- the workspace can subscribe to live changes from the partner.
--
-- Already in publication: app_dm_message (workspace chat).
-- Adding:
--   - app_workspace_activity (audit log; INSERTs power Recent Changes
--     expander + per-section attribution chips)
--   - app_challenge (UPDATEs trigger router.refresh so partner's saves
--     flow through props)
--   - app_challenge_session (INSERT/DELETE → reflect partner's session
--     add/remove)
--   - app_session (UPDATE → reflect partner's session edits;
--     broad subscription, filtered client-side)
--
-- REPLICA IDENTITY FULL on app_workspace_activity so the INSERT payload
-- carries the full row (actor_id, kind, payload jsonb) — the consumer
-- needs these to render without re-fetching.
-- Other tables keep the default identity (PK only is enough since the
-- consumer just calls router.refresh on change).

alter publication supabase_realtime add table public.app_workspace_activity;
alter publication supabase_realtime add table public.app_challenge;
alter publication supabase_realtime add table public.app_challenge_session;
alter publication supabase_realtime add table public.app_session;

alter table public.app_workspace_activity replica identity full;
