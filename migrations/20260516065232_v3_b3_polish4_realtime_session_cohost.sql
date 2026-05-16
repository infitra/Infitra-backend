-- Bundle 3 polish v4: add app_session_cohost to the supabase_realtime
-- publication so removing a cohost from a session (or adding one)
-- propagates to the partner without a manual refresh. REPLICA IDENTITY
-- FULL so the DELETE payload carries session_id + cohost_id (otherwise
-- the consumer would only know "something was deleted" without enough
-- info to know whether it matters to them).
alter publication supabase_realtime add table public.app_session_cohost;
alter table public.app_session_cohost replica identity full;
