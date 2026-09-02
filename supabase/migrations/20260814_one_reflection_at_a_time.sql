-- One reflection at a time (2026-08-14, rehearsal round 2).
--
-- The action-items block returned EVERY attended-but-unreflected session
-- from the last 48h, so skipped reflections stacked up ("there are two
-- now"). Founder rule: only ever ONE reflection card — the most recent
-- session; an older one is silently superseded the moment a newer session
-- ends. Reflection is a closing pulse, not a to-do backlog.
--
-- Surgical patch (same technique as 20260809_space_sessions_started_at):
-- wrap the reflection jsonb_agg's source in a LIMIT 1 subquery. Guarded so
-- it either does exactly this or aborts.

do $patch$
declare
  def text;
  patched text;
  anchor text := $lit$      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'kind', 'reflection', 'sessionId', s.id, 'sessionTitle', s.title
        ) ORDER BY s.ended_at DESC)
        FROM app_session s
        JOIN app_challenge_session cs3 ON cs3.session_id = s.id AND cs3.challenge_id = v_room_id
        JOIN app_attendance a ON a.session_id = s.id AND a.user_id = v_user AND a.joined_at IS NOT NULL
        WHERE s.ended_at IS NOT NULL
          AND s.ended_at > now() - interval '48 hours'
          AND NOT EXISTS (
            SELECT 1 FROM app_challenge_post p
            WHERE p.author_id = v_user AND p.kind = 'reflection'
              AND p.context_type = 'session' AND p.context_id = s.id
          )
      ), '[]'::jsonb)$lit$;
  replacement text := $lit$      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'kind', 'reflection', 'sessionId', latest.id, 'sessionTitle', latest.title
        ))
        FROM (
          SELECT s.id, s.title
          FROM app_session s
          JOIN app_challenge_session cs3 ON cs3.session_id = s.id AND cs3.challenge_id = v_room_id
          JOIN app_attendance a ON a.session_id = s.id AND a.user_id = v_user AND a.joined_at IS NOT NULL
          WHERE s.ended_at IS NOT NULL
            AND s.ended_at > now() - interval '48 hours'
            AND NOT EXISTS (
              SELECT 1 FROM app_challenge_post p
              WHERE p.author_id = v_user AND p.kind = 'reflection'
                AND p.context_type = 'session' AND p.context_id = s.id
            )
          ORDER BY s.ended_at DESC
          LIMIT 1
        ) latest
      ), '[]'::jsonb)$lit$;
begin
  def := pg_get_functiondef('public.load_experience_space(uuid)'::regprocedure);

  patched := replace(def, anchor, replacement);

  if patched = def then
    raise exception 'load_experience_space reflection patch: anchor not found — patch manually';
  end if;
  if length(replace(patched, replacement, '')) <> length(def) - length(anchor) then
    raise exception 'load_experience_space reflection patch: anchor matched more than once — patch manually';
  end if;

  execute patched;
end
$patch$;
