-- Rating-only reflections (2026-08-11).
--
-- WHY: submit_session_reflection deliberately accepts body OR energy
-- ("reflection requires body or energy value") and inserts
-- coalesce(body, '') — but app_challenge_post_body_check demands
-- length(body) >= 1 for every post. First real participant reflection
-- (energy 8, no text) crashed on the constraint. The design is right:
-- moving the slider and sharing nothing IS a complete reflection; the
-- constraint just never learned that.
--
-- FIX: reflections may carry an empty body; every other post kind keeps
-- the non-empty rule. The RPC's own guard (body or energy required)
-- still prevents a fully empty reflection.

alter table public.app_challenge_post
  drop constraint app_challenge_post_body_check;
alter table public.app_challenge_post
  add constraint app_challenge_post_body_check
  check (
    (length(body) >= 1 and length(body) <= 5000)
    or (kind = 'reflection' and body = '')
  );
