-- Bundle 5c fix — the Tribe feed's realtime subscription never fired because
-- app_challenge_post was not in the supabase_realtime publication. New posts
-- only appeared after a hard refresh (which refetches via list_challenge_posts).
-- Add the table so INSERTs broadcast to subscribers (still gated by each
-- subscriber's RLS — members only receive posts in spaces they can read).
--
-- (Likes/comments get published in Ship 2, with REPLICA IDENTITY tuned for
-- their realtime delete/update needs.)
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_challenge_post;
