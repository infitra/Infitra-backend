-- Bundle 6 + 7 — Pre-Session Pulse & Post-Session Reflection wiring.
--
-- The engagement loop (pulse before a session, reflection after) is driven by
-- the on-page-load action-item path — NOT cron (deferred). This extends
-- load_experience_space:
--   1. sessions slice: each session gains a `prePulse` aggregate {count, avg,
--      canShow}. canShow uses a 3-response floor (pilot cohorts are tiny; the
--      spec's 5 floor would never trip). Individual values stay private —
--      only the aggregate is exposed here.
--   2. action_items slice: in addition to `intro`, emits
--        - `pre_pulse`  for sessions the viewer is attending that start within
--          4h, aren't ended, and they haven't pulsed yet;
--        - `reflection` for sessions the viewer attended (joined_at set) that
--          ended in the last 48h and they haven't reflected on yet.
--
-- submit_pre_pulse / submit_session_reflection already exist (§3.9). No cron,
-- no trigger here (push notifications deferred) — the cards appear from the
-- action items the moment the participant opens the space.
--
-- Every other slice is identical to 20260605140000 (session cohosts).
CREATE OR REPLACE FUNCTION public.load_experience_space(p_challenge_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_user      uuid := (SELECT auth.uid());
  v_space     app_challenge_space;
  v_challenge app_challenge;
  v_is_owner  boolean;
  v_is_cohost boolean;
  v_is_member boolean;
  v_result    jsonb;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  SELECT * INTO v_space
  FROM app_challenge_space WHERE source_challenge_id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  SELECT * INTO v_challenge FROM app_challenge WHERE id = p_challenge_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  IF NOT can_access_challenge_space(v_space.id, v_user) THEN
    RETURN jsonb_build_object('authorized', false);
  END IF;

  v_is_owner := (v_challenge.owner_id = v_user);
  v_is_cohost := EXISTS (
    SELECT 1 FROM app_challenge_cohost
    WHERE challenge_id = p_challenge_id AND cohost_id = v_user
  );
  v_is_member := EXISTS (
    SELECT 1 FROM app_challenge_member
    WHERE challenge_id = p_challenge_id AND user_id = v_user
  );

  SELECT jsonb_build_object(
    'authorized', true,
    'is_creator', (v_is_owner OR v_is_cohost),
    'is_owner', v_is_owner,
    'is_member', v_is_member,
    'space_id', v_space.id,
    'viewer', jsonb_build_object(
      'id', v_user,
      'name', COALESCE((SELECT display_name FROM app_profile WHERE id = v_user), 'You'),
      'avatar', (SELECT avatar_url FROM app_profile WHERE id = v_user),
      'joinedAt', (
        SELECT joined_at FROM app_challenge_member
        WHERE challenge_id = p_challenge_id AND user_id = v_user
      ),
      'postCount', (
        SELECT COUNT(*) FROM app_challenge_post
        WHERE space_id = v_space.id AND author_id = v_user
          AND kind IS DISTINCT FROM 'intro_private'
      )
    ),
    'progress', (
      SELECT jsonb_build_object(
        'totalSessions', cp.total_sessions,
        'pastSessions', cp.past_sessions,
        'attendedSessions', cp.attended_sessions,
        'attendedPastSessions', cp.attended_past_sessions,
        'upcomingSessions', cp.upcoming_sessions,
        'attendancePercent', cp.attendance_so_far_percent,
        'completionPercent', cp.completion_percent,
        'progressPercent', cp.challenge_progress_percent
      )
      FROM vw_my_challenges_progress cp WHERE cp.challenge_id = p_challenge_id
    ),
    'experience', jsonb_build_object(
      'id', v_challenge.id,
      'title', v_challenge.title,
      'description', v_challenge.description,
      'imageUrl', v_challenge.image_url,
      'startDate', v_challenge.start_date,
      'endDate', v_challenge.end_date,
      'status', v_challenge.status,
      'priceCents', v_challenge.price_cents,
      'currency', v_challenge.currency,
      'promiseText', v_challenge.promise_text,
      'weeklyArc', COALESCE(v_challenge.weekly_arc, '[]'::jsonb),
      'topicOwnership', COALESCE(v_challenge.topic_ownership, '[]'::jsonb),
      'introPrompt', v_challenge.intro_prompt
    ),
    'program_state', (
      SELECT jsonb_build_object(
        'currentWeek', ps.current_week_number,
        'totalWeeks', ps.total_weeks,
        'currentWeekTheme', ps.current_week_theme,
        'weeksCompleted', ps.weeks_completed,
        'weeksRemaining', ps.weeks_remaining
      )
      FROM vw_challenge_program_state ps WHERE ps.challenge_id = p_challenge_id
    ),
    'creators', COALESCE((
      SELECT jsonb_agg(obj ORDER BY sort_order, nm)
      FROM (
        SELECT 0 AS sort_order, COALESCE(p.display_name, 'Creator') AS nm,
          jsonb_build_object('id', p.id, 'name', COALESCE(p.display_name, 'Creator'),
            'avatar', p.avatar_url, 'role', 'owner', 'tagline', p.tagline, 'bio', p.bio) AS obj
        FROM app_profile p WHERE p.id = v_challenge.owner_id
        UNION ALL
        SELECT 1, COALESCE(p.display_name, 'Creator'),
          jsonb_build_object('id', p.id, 'name', COALESCE(p.display_name, 'Creator'),
            'avatar', p.avatar_url, 'role', 'cohost', 'tagline', p.tagline, 'bio', p.bio)
        FROM app_challenge_cohost cc JOIN app_profile p ON p.id = cc.cohost_id
        WHERE cc.challenge_id = p_challenge_id
      ) q
    ), '[]'::jsonb),
    'sessions', COALESCE((
      SELECT jsonb_agg(sess ORDER BY sort_time, sort_id)
      FROM (
        SELECT s.start_time AS sort_time, s.id AS sort_id, jsonb_build_object(
          'id', s.id, 'title', s.title, 'startTime', s.start_time,
          'durationMinutes', s.duration_minutes, 'status', s.status,
          'liveRoomId', s.live_room_id, 'imageUrl', s.image_url, 'description', s.description,
          'hostId', s.host_id, 'hostName', COALESCE(hp.display_name, 'Host'), 'hostAvatar', hp.avatar_url,
          'cohosts', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', cp.id, 'name', COALESCE(cp.display_name, 'Co-host'), 'avatar', cp.avatar_url
            ) ORDER BY cp.display_name)
            FROM app_session_cohost sc JOIN app_profile cp ON cp.id = sc.cohost_id
            WHERE sc.session_id = s.id
          ), '[]'::jsonb),
          -- Pre-session pulse aggregate (cohort signal). Individual values stay
          -- private; only count/avg are exposed, and only "show" past a 3-floor.
          'prePulse', (
            SELECT jsonb_build_object(
              'count', COUNT(*)::int,
              'avg', COALESCE(ROUND(AVG(r.value)::numeric, 1), 0),
              'canShow', COUNT(*) >= 3
            )
            FROM app_session_pre_pulse_response r WHERE r.session_id = s.id
          )
        ) AS sess
        FROM app_challenge_session cs
        JOIN app_session s ON s.id = cs.session_id
        LEFT JOIN app_profile hp ON hp.id = s.host_id
        WHERE cs.challenge_id = p_challenge_id
      ) q
    ), '[]'::jsonb),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', COALESCE(p.display_name, 'Member'), 'avatar', p.avatar_url
      ) ORDER BY p.display_name)
      FROM app_challenge_member m JOIN app_profile p ON p.id = m.user_id
      WHERE m.challenge_id = p_challenge_id
    ), '[]'::jsonb),
    'member_count', (SELECT COUNT(*) FROM app_challenge_member WHERE challenge_id = p_challenge_id),
    'action_items', (
      -- intro: member who hasn't introduced themselves yet
      (CASE WHEN v_is_member AND NOT EXISTS (
        SELECT 1 FROM app_challenge_post pp
        WHERE pp.space_id = v_space.id AND pp.author_id = v_user
          AND pp.kind IN ('intro', 'intro_private')
      )
      THEN jsonb_build_array(jsonb_build_object(
        'kind', 'intro',
        'introPrompt', COALESCE(v_challenge.intro_prompt, 'Introduce yourself to the Tribe.')
      ))
      ELSE '[]'::jsonb END)
      ||
      -- pre_pulse: attending a session that starts within 4h, not yet ended,
      -- not yet pulsed
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'kind', 'pre_pulse', 'sessionId', s.id, 'sessionTitle', s.title, 'startTime', s.start_time
        ) ORDER BY s.start_time)
        FROM app_session s
        JOIN app_challenge_session cs2 ON cs2.session_id = s.id AND cs2.challenge_id = p_challenge_id
        JOIN app_attendance a ON a.session_id = s.id AND a.user_id = v_user
        WHERE s.start_time BETWEEN now() AND now() + interval '4 hours'
          AND s.status <> 'ended'
          AND NOT EXISTS (
            SELECT 1 FROM app_session_pre_pulse_response r
            WHERE r.session_id = s.id AND r.user_id = v_user
          )
      ), '[]'::jsonb)
      ||
      -- reflection: attended (joined) a session that ended in the last 48h,
      -- not yet reflected
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'kind', 'reflection', 'sessionId', s.id, 'sessionTitle', s.title
        ) ORDER BY s.ended_at DESC)
        FROM app_session s
        JOIN app_challenge_session cs3 ON cs3.session_id = s.id AND cs3.challenge_id = p_challenge_id
        JOIN app_attendance a ON a.session_id = s.id AND a.user_id = v_user AND a.joined_at IS NOT NULL
        WHERE s.ended_at IS NOT NULL
          AND s.ended_at > now() - interval '48 hours'
          AND NOT EXISTS (
            SELECT 1 FROM app_challenge_post p
            WHERE p.author_id = v_user AND p.kind = 'reflection'
              AND p.context_type = 'session' AND p.context_id = s.id
          )
      ), '[]'::jsonb)
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
