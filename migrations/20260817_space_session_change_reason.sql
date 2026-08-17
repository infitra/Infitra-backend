-- =============================================================================
-- load_experience_space: sessions carry changeReason (2026-08-17)
--
-- Founder feedback on rescheduling: the reason must be readable in full,
-- in place — a truncated notification row defeats requiring a reason at
-- all. The session detail popup now shows a "this session was moved" note,
-- which needs change_reason in the space payload.
--
-- Production's load_experience_space is ahead of the repo mirror, so this
-- is a guarded surgical patch (pg_get_functiondef -> replace -> execute)
-- rather than a full redefinition. Idempotent: skips if already patched.
-- Applied to production 2026-08-17 via MCP.
-- =============================================================================

do $do$
declare
    v_def text;
    v_anchor text := '''durationMinutes'', s.duration_minutes, ''status'', s.status, ''startedAt'', s.started_at,';
    v_new text := '''durationMinutes'', s.duration_minutes, ''status'', s.status, ''startedAt'', s.started_at, ''changeReason'', s.change_reason,';
begin
    select pg_get_functiondef(p.oid) into v_def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'load_experience_space';

    if v_def is null then raise exception 'load_experience_space not found'; end if;
    if v_def like '%changeReason%' then
        raise notice 'already patched, skipping';
        return;
    end if;
    if (length(v_def) - length(replace(v_def, v_anchor, ''))) / length(v_anchor) <> 1 then
        raise exception 'anchor count != 1, aborting patch';
    end if;

    v_def := replace(v_def, v_anchor, v_new);
    execute v_def;
    raise notice 'patched';
end $do$;

-- Backfill (2026-08-17, one-time): older session_time_changed notification
-- payloads lacked session_title/challenge_id/experience_title. Rows whose
-- session still exists were enriched; rows pointing at deleted test sessions
-- keep the neutral fallback copy.
update app_notification n
set payload = n.payload || jsonb_build_object(
    'session_title', s.title,
    'challenge_id', cs.challenge_id,
    'experience_title', ch.title
)
from app_session s
left join app_challenge_session cs on cs.session_id = s.id
left join app_challenge ch on ch.id = cs.challenge_id
where n.payload ->> 'kind' = 'session_time_changed'
  and (n.payload ->> 'session_id')::uuid = s.id
  and n.payload ->> 'session_title' is null;
