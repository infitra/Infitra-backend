-- Expose started_at to the Experience Space (2026-08-09) — live-loop Phase 2.
--
-- WHY: the space decides "Live now" from (live_room_id, status) alone, so a
-- precreated-but-empty room at T-15 is indistinguishable from a room the
-- expert is actually hosting in. Splitting "Doors open" from "Live now"
-- needs the one signal that separates them: app_session.started_at (set by
-- issue_join_token on the expert's first join).
--
-- MECHANICS: load_experience_space is patched surgically — take the live
-- definition, insert 'startedAt' into the sessions payload, re-execute.
-- The function has been amended across many migrations and the repo mirrors
-- lag production; retyping ~250 lines to add one field invites transcription
-- drift, while a guarded replace can only do exactly one thing or abort.
do $patch$
declare
  def text;
  patched text;
begin
  def := pg_get_functiondef('public.load_experience_space(uuid)'::regprocedure);

  patched := replace(
    def,
    $lit$'durationMinutes', s.duration_minutes, 'status', s.status,$lit$,
    $lit$'durationMinutes', s.duration_minutes, 'status', s.status, 'startedAt', s.started_at,$lit$
  );

  if patched = def then
    raise exception 'load_experience_space patch: anchor not found — function shape changed, patch manually';
  end if;
  if (length(patched) - length(def)) <> length($lit$ 'startedAt', s.started_at,$lit$) then
    raise exception 'load_experience_space patch: anchor matched more than once — patch manually';
  end if;

  execute patched;
end
$patch$;
