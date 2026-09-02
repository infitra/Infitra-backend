-- The expert TEAM is entitled to the room (2026-08-11).
--
-- Found in the live rehearsal: every live endpoint recognized only the
-- session's host_id (+ session cohosts for joining), so a challenge
-- owner/cohost could not enter their co-expert's session (Alex was
-- Forbidden from Mira's room), the co-expert 404'd on the dashboard live
-- page, and only THE host could ever press End Session — if the host
-- dropped and never returned, the team was locked out of closing cleanly.
-- Real pilot scenario: Roberta sits in on Maria's session.
--
-- ONE definition, shared by every layer (the material_released_at()
-- precedent — a predicate this load-bearing must not be re-derived per
-- surface): an expert of a session is its host, a session cohost, or the
-- owner/cohost of any challenge containing it. Used by:
--   · issue_join_token  (entitlement + the started_at "Live now" flip)
--   · end_session       (any expert may end, not just the host)
--   · both live pages' UX guards (frontend, via .rpc under the user's JWT)
--
-- SECURITY DEFINER: the page-side callers run under participant RLS, which
-- cannot see other people's cohost rows; the predicate must see structure,
-- not content. Returns a boolean about publicly-presented facts (who runs
-- an experience is on its buyer page), so exposure to authenticated is not
-- a leak.

create or replace function public.is_session_expert(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from app_session s
    where s.id = p_session_id and s.host_id = p_user_id
  )
  or exists (
    select 1 from app_session_cohost sc
    where sc.session_id = p_session_id and sc.cohost_id = p_user_id
  )
  or exists (
    select 1
    from app_challenge_session cs
    join app_challenge c on c.id = cs.challenge_id
    where cs.session_id = p_session_id
      and (
        c.owner_id = p_user_id
        or exists (
          select 1 from app_challenge_cohost cc
          where cc.challenge_id = c.id and cc.cohost_id = p_user_id
        )
      )
  );
$$;

revoke all on function public.is_session_expert(uuid, uuid) from public, anon;
grant execute on function public.is_session_expert(uuid, uuid) to authenticated, service_role;

comment on function public.is_session_expert(uuid, uuid) is
  'True when the user is the session host, a session cohost, or owner/cohost of any challenge containing the session. THE definition of "expert of this session" — join entitlement, the started_at Live-now flip, End Session rights, and the live pages'' guards all derive from it.';
