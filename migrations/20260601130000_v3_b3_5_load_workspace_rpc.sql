-- Bundle 3.5 Phase 2c — load_workspace(p_challenge_id) consolidated load RPC.
--
-- Collapses the workspace page's ~12 sequential round-trips (challenge,
-- cohosts, profiles, sessions, session-cohosts, contract, acceptances,
-- declines, invites, pending-invitee profiles, activity) into ONE call that
-- returns the fully enriched workspace snapshot as JSON — the exact shape
-- WorkspaceShell's props need (camelCase, names/avatars resolved server-side).
--
-- Used by:
--   * page.tsx initial load (kills the multi-query waterfall → faster open)
--   * the workspace's structural realtime handlers (Phase 2c): on a session/
--     cohost/invite change, refetch this snapshot and seed() the store
--     (one query instead of router.refresh()'s full-page re-render).
--
-- Access: SECURITY DEFINER + explicit owner/cohost gate (mirrors the page's
-- redirect logic and the plan's load_challenge_space pattern). Returns
-- {"authorized": false} for anyone who isn't the owner or a cohost. Reads
-- only collaboration/identity tables the owner/cohost can already see today;
-- never touches financial tables.
CREATE OR REPLACE FUNCTION public.load_workspace(p_challenge_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_user      uuid := (SELECT auth.uid());
  v_challenge app_challenge;
  v_is_owner  boolean;
  v_is_cohost boolean;
  v_space_id  uuid;
  v_owner_split int;
  v_result    jsonb;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  SELECT * INTO v_challenge FROM app_challenge WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  v_is_owner := (v_challenge.owner_id = v_user);
  v_is_cohost := EXISTS (
    SELECT 1 FROM app_challenge_cohost
    WHERE challenge_id = p_challenge_id AND cohost_id = v_user
  );
  IF NOT v_is_owner AND NOT v_is_cohost THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  SELECT id INTO v_space_id
  FROM app_challenge_space WHERE source_challenge_id = p_challenge_id;

  SELECT 100 - COALESCE(SUM(split_percent), 0) INTO v_owner_split
  FROM app_challenge_cohost WHERE challenge_id = p_challenge_id;

  SELECT jsonb_build_object(
    'authorized', true,
    'is_owner', v_is_owner,
    'status', v_challenge.status,
    'space_id', v_space_id,
    'owner_split', v_owner_split,
    'dm_conversation_id', (
      SELECT i.dm_conversation_id FROM app_collaboration_invite i
      WHERE i.challenge_id = p_challenge_id AND i.dm_conversation_id IS NOT NULL
      ORDER BY i.created_at ASC LIMIT 1
    ),
    'challenge', jsonb_build_object(
      'id', v_challenge.id,
      'title', v_challenge.title,
      'description', v_challenge.description,
      'startDate', v_challenge.start_date,
      'endDate', v_challenge.end_date,
      'priceCents', v_challenge.price_cents,
      'capacity', v_challenge.capacity,
      'status', v_challenge.status,
      'imageUrl', v_challenge.image_url,
      'contractId', v_challenge.contract_id,
      'promiseText', v_challenge.promise_text,
      'weeklyArc', COALESCE(v_challenge.weekly_arc, '[]'::jsonb),
      'topicOwnership', COALESCE(v_challenge.topic_ownership, '[]'::jsonb),
      'introPrompt', v_challenge.intro_prompt,
      'promiseEditedAt', v_challenge.promise_edited_at,
      'promiseEditorName', (
        SELECT display_name FROM app_profile WHERE id = v_challenge.promise_edited_by
      )
    ),
    'owner_profile', (
      SELECT jsonb_build_object('id', p.id, 'name', COALESCE(p.display_name, 'Owner'),
        'avatar', p.avatar_url, 'tagline', p.tagline, 'bio', p.bio, 'username', p.username)
      FROM app_profile p WHERE p.id = v_challenge.owner_id
    ),
    'cohosts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', cc.cohost_id,
        'name', COALESCE(p.display_name, 'Creator'),
        'avatar', p.avatar_url,
        'tagline', p.tagline,
        'bio', p.bio,
        'username', p.username,
        'splitPercent', cc.split_percent
      ) ORDER BY cc.cohost_id)
      FROM app_challenge_cohost cc
      LEFT JOIN app_profile p ON p.id = cc.cohost_id
      WHERE cc.challenge_id = p_challenge_id
    ), '[]'::jsonb),
    'sessions', COALESCE((
      SELECT jsonb_agg(sess ORDER BY sort_time, sort_id)
      FROM (
        SELECT s.start_time AS sort_time, s.id AS sort_id, jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'startTime', s.start_time,
          'durationMinutes', s.duration_minutes,
          'hostId', s.host_id,
          'hostName', COALESCE(hp.display_name, 'Host'),
          'hostAvatar', hp.avatar_url,
          'imageUrl', s.image_url,
          'description', s.description,
          'cohosts', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', sc.cohost_id,
              'name', COALESCE(scp.display_name, 'Creator'),
              'avatar', scp.avatar_url,
              'splitPercent', sc.split_percent
            ) ORDER BY sc.cohost_id)
            FROM app_session_cohost sc
            LEFT JOIN app_profile scp ON scp.id = sc.cohost_id
            WHERE sc.session_id = s.id
          ), '[]'::jsonb)
        ) AS sess
        FROM app_challenge_session cs
        JOIN app_session s ON s.id = cs.session_id
        LEFT JOIN app_profile hp ON hp.id = s.host_id
        WHERE cs.challenge_id = p_challenge_id
      ) q
    ), '[]'::jsonb),
    'pending_invites', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id,
        'toId', i.to_id,
        'toName', COALESCE(p.display_name, 'Creator'),
        'toAvatar', p.avatar_url,
        'toTagline', p.tagline,
        'toUsername', p.username,
        'splitPercent', i.initial_split_percent,
        'message', i.message
      ) ORDER BY i.created_at)
      FROM app_collaboration_invite i
      LEFT JOIN app_profile p ON p.id = i.to_id
      WHERE i.challenge_id = p_challenge_id AND i.status = 'pending'
    ), '[]'::jsonb),
    'contract', (
      CASE WHEN v_challenge.contract_id IS NULL THEN NULL
      ELSE (
        SELECT jsonb_build_object(
          'id', con.id,
          'lockedAt', con.locked_at,
          'acceptances', COALESCE((
            SELECT jsonb_agg(a.cohost_id)
            FROM app_collaboration_acceptance a WHERE a.contract_id = con.id
          ), '[]'::jsonb),
          'declines', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('cohostId', d.cohost_id, 'comment', d.comment))
            FROM app_collaboration_decline d WHERE d.contract_id = con.id
          ), '[]'::jsonb)
        )
        FROM app_collaboration_contract con WHERE con.id = v_challenge.contract_id
      ) END
    ),
    'activity', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'actor_id', a.actor_id, 'kind', a.kind,
        'payload', a.payload, 'created_at', a.created_at
      ) ORDER BY a.created_at DESC)
      FROM (
        SELECT * FROM app_workspace_activity
        WHERE challenge_id = p_challenge_id
        ORDER BY created_at DESC LIMIT 50
      ) a
    ), '[]'::jsonb),
    'profile_map', COALESCE((
      SELECT jsonb_object_agg(pid, jsonb_build_object('name', COALESCE(pn, 'Creator'), 'avatar', pa))
      FROM (
        SELECT DISTINCT pr.id AS pid, pr.display_name AS pn, pr.avatar_url AS pa
        FROM app_profile pr
        WHERE pr.id = v_challenge.owner_id
          OR pr.id IN (SELECT cohost_id FROM app_challenge_cohost WHERE challenge_id = p_challenge_id)
          OR pr.id IN (
            SELECT s.host_id FROM app_challenge_session cs
            JOIN app_session s ON s.id = cs.session_id WHERE cs.challenge_id = p_challenge_id
          )
          OR pr.id IN (
            SELECT sc.cohost_id FROM app_challenge_session cs
            JOIN app_session_cohost sc ON sc.session_id = cs.session_id
            WHERE cs.challenge_id = p_challenge_id
          )
      ) m
    ), '{}'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.load_workspace(uuid) TO authenticated;
