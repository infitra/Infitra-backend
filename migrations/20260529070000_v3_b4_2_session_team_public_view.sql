-- Bundle 4.2: public-safe per-session team view for the buyer page.
--
-- The buyer page needs to show each session's host AND any session
-- cohosts (so co-led sessions like "Meet your Experts" read as shared).
-- app_session_cohost cannot be read on a public page: it is RLS-
-- restricted to the session host/cohost and carries split_percent
-- (revenue data). This view exposes ONLY identity columns
-- (challenge_id, session_id, host_id, cohost_id) and is restricted to
-- published/completed challenges. security_invoker = false so it runs
-- as the view owner, bypassing app_session_cohost's row policies while
-- leaking no economic data.
create or replace view public.vw_challenge_session_team
with (security_invoker = false) as
select cs.challenge_id, cs.session_id, s.host_id, sc.cohost_id
from app_challenge_session cs
join app_challenge c on c.id = cs.challenge_id
join app_session s on s.id = cs.session_id
left join app_session_cohost sc on sc.session_id = cs.session_id
where c.status in ('published'::challenge_status, 'completed'::challenge_status);

grant select on public.vw_challenge_session_team to anon, authenticated;
