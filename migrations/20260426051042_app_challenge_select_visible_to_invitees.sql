-- Let pending invitees SELECT the challenge they've been invited to.
--
-- Without this clause, the recipient of a collab invite can't read
-- the challenge row their invite points at (since they're not yet a
-- cohost), which means the dashboard invite card has no title, no
-- description, and no cover image to show — the very things the
-- inviter actually picked. Owner + cohost still gated normally.

DROP POLICY IF EXISTS app_challenge_select_merged ON public.app_challenge;

CREATE POLICY app_challenge_select_merged ON public.app_challenge
FOR SELECT
USING (
  status = ANY (ARRAY['published'::challenge_status, 'completed'::challenge_status])
  OR owner_id = (SELECT auth.uid())
  OR is_challenge_cohost(id, (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.app_collaboration_invite ci
    WHERE ci.challenge_id = app_challenge.id
      AND ci.to_id = (SELECT auth.uid())
      AND ci.status = 'pending'
  )
);
