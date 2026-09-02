-- Accepting a collab invite was failing when initial_split_percent
-- was 0 or null. The frontend treats 0 as "no split proposed yet"
-- (see CollabInvitations.tsx) and lets the inviter skip proposing a
-- split, expecting the hosts to agree on the terms inside the
-- workspace. But the RPC was blindly inserting that 0 into
-- app_challenge_cohost.split_percent, which has a CHECK constraint
-- enforcing 1 <= split_percent <= 99. Result: every "Open workspace"
-- accept where the inviter didn't propose a split crashed with
-- check-constraint-violation, silently for the user (the redirect
-- never fired) and the invite stayed pending.
--
-- Fix: when initial_split_percent is null or out of the valid 1-99
-- range, fall back to 50%. That's the honest default for "we'll
-- agree on this in the workspace" — equal split until adjusted.
-- The workspace UI lets either host change it before publish.

create or replace function public.accept_collab_invite(p_invite_id uuid, p_actor uuid)
returns uuid
language plpgsql
security definer
as $function$
DECLARE
  v_invite app_collaboration_invite;
  v_challenge_id uuid;
  v_convo_id uuid;
  v_start date := current_date + 7;
  v_end date := current_date + 35;
  v_split int;
BEGIN
  SELECT * INTO v_invite FROM app_collaboration_invite
  WHERE id = p_invite_id AND to_id = p_actor AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'invite_not_found_or_already_responded'; END IF;

  -- Normalize split: null or out-of-range → 50 (sane default, to be
  -- adjusted in the workspace). The check constraint requires 1-99.
  v_split := CASE
    WHEN v_invite.initial_split_percent IS NULL THEN 50
    WHEN v_invite.initial_split_percent < 1 THEN 50
    WHEN v_invite.initial_split_percent > 99 THEN 99
    ELSE v_invite.initial_split_percent
  END;

  IF v_invite.challenge_id IS NOT NULL THEN
    v_challenge_id := v_invite.challenge_id;
    v_convo_id := v_invite.dm_conversation_id;

    INSERT INTO app_challenge_cohost (challenge_id, cohost_id, split_percent)
    VALUES (v_challenge_id, p_actor, v_split)
    ON CONFLICT (challenge_id, cohost_id) DO NOTHING;

    IF v_convo_id IS NOT NULL THEN
      INSERT INTO app_dm_member (conversation_id, user_id)
      VALUES (v_convo_id, p_actor)
      ON CONFLICT DO NOTHING;
    END IF;
  ELSE
    INSERT INTO app_challenge (title, start_date, end_date, price_cents, currency, owner_id)
    VALUES ('Untitled Collaboration', v_start, v_end, 0, 'CHF', v_invite.from_id)
    RETURNING id INTO v_challenge_id;

    INSERT INTO app_challenge_cohost (challenge_id, cohost_id, split_percent)
    VALUES (v_challenge_id, p_actor, v_split);

    INSERT INTO app_dm_conversation (created_by) VALUES (v_invite.from_id)
    RETURNING id INTO v_convo_id;

    INSERT INTO app_dm_member (conversation_id, user_id) VALUES (v_convo_id, v_invite.from_id);
    INSERT INTO app_dm_member (conversation_id, user_id) VALUES (v_convo_id, p_actor);

    INSERT INTO app_dm_message (conversation_id, author_id, body)
    VALUES (v_convo_id, v_invite.from_id, v_invite.message);
  END IF;

  UPDATE app_collaboration_invite SET
    status = 'interested',
    responded_at = now(),
    challenge_id = v_challenge_id,
    dm_conversation_id = v_convo_id
  WHERE id = p_invite_id;

  INSERT INTO app_notification (recipient_id, type, payload)
  VALUES (v_invite.from_id, 'collab_accepted', jsonb_build_object(
    'invite_id', p_invite_id, 'from_id', p_actor, 'challenge_id', v_challenge_id
  ));

  -- Workspace activity log
  PERFORM public.post_workspace_log(v_challenge_id, 'joined the collaboration');

  RETURN v_challenge_id;
END;
$function$;
