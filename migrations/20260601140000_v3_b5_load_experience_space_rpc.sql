-- Bundle 5a — load_experience_space(p_challenge_id): consolidated load for the
-- Experience Space (the participant locker room).
--
-- One round-trip returning the structural data the locker-room IA needs:
-- experience + space + current-week program state + creators + sessions + tribe
-- members + the intro action item. (The Tribe FEED paginates separately via its
-- own list RPC.) Mirrors the verified load_workspace pattern.
--
-- Terminology (brand → internal): Experience = app_challenge, Experience Space =
-- app_challenge_space, Tribe = app_challenge_post/members. Brand lives in the UI;
-- the schema names are unchanged.
--
-- Access: SECURITY DEFINER, gated by can_access_challenge_space (owner / cohost /
-- enrolled member / space member). Returns {"authorized": false} otherwise.
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

  -- The space exists only for published experiences (created on publish).
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
          'hostId', s.host_id, 'hostName', COALESCE(hp.display_name, 'Host'), 'hostAvatar', hp.avatar_url
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
      FROM app_challenge_space_member m JOIN app_profile p ON p.id = m.user_id
      WHERE m.space_id = v_space.id
    ), '[]'::jsonb),
    'member_count', (SELECT COUNT(*) FROM app_challenge_space_member WHERE space_id = v_space.id),
    'action_items', (
      CASE WHEN v_is_member AND NOT EXISTS (
        SELECT 1 FROM app_challenge_post pp
        WHERE pp.space_id = v_space.id AND pp.author_id = v_user
          AND pp.kind IN ('intro', 'intro_private')
      )
      THEN jsonb_build_array(jsonb_build_object(
        'kind', 'intro',
        'introPrompt', COALESCE(v_challenge.intro_prompt, 'Introduce yourself to the Tribe.')
      ))
      ELSE '[]'::jsonb END
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.load_experience_space(uuid) TO authenticated;
