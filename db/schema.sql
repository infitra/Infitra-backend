


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."challenge_status" AS ENUM (
    'draft',
    'published',
    'completed',
    'canceled'
);


ALTER TYPE "public"."challenge_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'succeeded',
    'refunded',
    'failed',
    'disputed',
    'canceled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_type" AS ENUM (
    'ticket',
    'subscription',
    'tip',
    'bundle'
);


ALTER TYPE "public"."payment_type" OWNER TO "postgres";


CREATE TYPE "public"."session_status" AS ENUM (
    'draft',
    'published',
    'ended',
    'completed',
    'canceled',
    'scheduled'
);


ALTER TYPE "public"."session_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_debug_list_collab_reviews"("p_challenge" "uuid") RETURNS TABLE("id" "uuid", "challenge_id" "uuid", "reviewer_id" "uuid", "subject_id" "uuid", "rating" integer, "comment" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select id, challenge_id, reviewer_id, subject_id, rating, comment, created_at
  from public.app_collab_review
  where challenge_id = p_challenge
  order by created_at desc;
$$;


ALTER FUNCTION "public"."_debug_list_collab_reviews"("p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_collab_invite"("p_invite_id" "uuid", "p_actor" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."accept_collab_invite"("p_invite_id" "uuid", "p_actor" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_user_badge" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "awarded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "awarded_by" "uuid",
    "context" "jsonb",
    "is_permanent" boolean DEFAULT false NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_reason" "text",
    "visible_on_profile" boolean DEFAULT true NOT NULL,
    "pinned_on_profile" boolean DEFAULT false NOT NULL,
    "period" "text"
);


ALTER TABLE "public"."app_user_badge" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_user_badge" IS 'Concrete awards of badges to users. Holds who got what, when, and under which context (e.g. monthly period).';



COMMENT ON COLUMN "public"."app_user_badge"."context" IS 'Freeform metadata for this award: e.g. {"period_month":"2025-10","rank":10,"scope":"global"}.';



CREATE OR REPLACE FUNCTION "public"."admin_award_creator_badge"("p_creator_id" "uuid", "p_badge_id" "uuid", "p_target_user_id" "uuid") RETURNS "public"."app_user_badge"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_badge        public.app_badge;
  v_target_role  text;
  v_existing     public.app_user_badge;
  v_award        public.app_user_badge;
begin
  ------------------------------------------------------------------
  -- 1) Load and validate badge
  ------------------------------------------------------------------
  select *
  into v_badge
  from public.app_badge
  where id = p_badge_id;

  if not found then
    raise exception 'admin_award_creator_badge: badge not found';
  end if;

  if v_badge.source <> 'creator_defined' then
    raise exception 'admin_award_creator_badge: badge must be creator_defined';
  end if;

  if v_badge.created_by is distinct from p_creator_id then
    raise exception 'admin_award_creator_badge: badge does not belong to this creator';
  end if;

  if v_badge.audience <> 'participant' then
    raise exception 'admin_award_creator_badge: badge must have audience = participant';
  end if;

  if v_badge.is_monthly or not v_badge.is_event_based then
    raise exception 'admin_award_creator_badge: badge must be a permanent event-based badge';
  end if;

  if not v_badge.is_active then
    raise exception 'admin_award_creator_badge: badge is not active';
  end if;

  ------------------------------------------------------------------
  -- 2) Validate target user role (must NOT be a creator)
  ------------------------------------------------------------------
  select role
  into v_target_role
  from public.app_profile
  where id = p_target_user_id;

  if not found then
    raise exception 'admin_award_creator_badge: target user not found';
  end if;

  if v_target_role = 'creator' then
    raise exception 'admin_award_creator_badge: cannot award creator-defined participant badges to creators';
  end if;

  ------------------------------------------------------------------
  -- 3) Idempotency: if already awarded & not revoked, return existing
  ------------------------------------------------------------------
  select *
  into v_existing
  from public.app_user_badge ub
  where ub.user_id = p_target_user_id
    and ub.badge_id = p_badge_id
    and ub.revoked_at is null
  limit 1;

  if found then
    return v_existing;
  end if;

  ------------------------------------------------------------------
  -- 4) Insert award (same shape as manual creator award)
  --    Notifications are already handled by fn_notify_badge_awarded()
  ------------------------------------------------------------------
  insert into public.app_user_badge (
    user_id,
    badge_id,
    awarded_at,
    awarded_by,
    context,
    is_permanent,
    visible_on_profile,
    pinned_on_profile,
    period
  )
  values (
    p_target_user_id,
    p_badge_id,
    now(),
    p_creator_id,
    '{}'::jsonb,
    true,
    true,
    false,
    null
  )
  returning * into v_award;

  return v_award;
end;
$$;


ALTER FUNCTION "public"."admin_award_creator_badge"("p_creator_id" "uuid", "p_badge_id" "uuid", "p_target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_badge_award"("p_user_id" "uuid", "p_badge_slug" "text", "p_context" "jsonb" DEFAULT '{}'::"jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_badge  app_badge%ROWTYPE;
  v_id     bigint;
BEGIN
  SELECT *
  INTO v_badge
  FROM app_badge
  WHERE slug = p_badge_slug;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'badge_not_found: %', p_badge_slug;
  END IF;

  IF NOT v_badge.is_active THEN
    RAISE EXCEPTION 'badge_inactive: %', p_badge_slug;
  END IF;

  IF NOT v_badge.is_auto_awarded THEN
    RAISE EXCEPTION 'badge_not_auto_awarded: %', p_badge_slug;
  END IF;

  -----------------------------------------------------------------------
  -- Monthly badges
  -----------------------------------------------------------------------
  IF v_badge.is_monthly THEN
    INSERT INTO public.app_user_badge (
      user_id,
      badge_id,
      awarded_at,
      awarded_by,
      context,
      is_permanent,
      visible_on_profile,
      period
    )
    VALUES (
      p_user_id,
      v_badge.id,
      now(),
      NULL,
      COALESCE(p_context, '{}'::jsonb),
      FALSE,
      TRUE,
      p_context->>'period'
    )
    ON CONFLICT (user_id, badge_id, COALESCE(period,''))
    DO NOTHING
    RETURNING id INTO v_id;

  -----------------------------------------------------------------------
  -- Permanent badges
  -----------------------------------------------------------------------
  ELSE
    INSERT INTO public.app_user_badge (
      user_id,
      badge_id,
      awarded_at,
      awarded_by,
      context,
      is_permanent,
      visible_on_profile,
      period
    )
    VALUES (
      p_user_id,
      v_badge.id,
      now(),
      NULL,
      COALESCE(p_context, '{}'::jsonb),
      TRUE,
      TRUE,
      NULL
    )
    ON CONFLICT (user_id, badge_id, COALESCE(period,''))
    DO NOTHING
    RETURNING id INTO v_id;
  END IF;

  RETURN COALESCE(v_id, 0);
END;
$$;


ALTER FUNCTION "public"."admin_badge_award"("p_user_id" "uuid", "p_badge_slug" "text", "p_context" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_email_enqueue_receipt"("p_tx_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_tx    record;
  v_email text;
  v_subj  text;
  v_html  text;
  v_text  text;
  v_id    bigint;
begin
  -- Load tx & buyer email/username
  select t.*,
         coalesce(ap.username, 'User') as buyer_username,
         au.email                      as buyer_email
  into v_tx
  from public.app_transaction t
  left join public.app_profile ap on ap.id = t.buyer_id
  left join auth.users au on au.id = t.buyer_id
  where t.id = p_tx_id;

  if not found then
    raise exception 'tx_not_found';
  end if;

  if v_tx.status <> 'succeeded' then
    raise exception 'only_succeeded_supported';
  end if;

  v_email := nullif(v_tx.buyer_email, '');
  if v_email is null then
    raise exception 'buyer_has_no_email';
  end if;

  v_subj := format(
    'Your receipt · %s %s',
    v_tx.type::text,
    case when v_tx.session_id is not null then 'session' else 'challenge' end
  );

  -- Use to_char for money formatting (no %.2f in PostgreSQL format)
  v_text := format(
'Hi %s,

Thanks for your purchase.

Amount: %s %s
Item:   %s
Date:   %s
Tx Id:  %s

— Team',
    v_tx.buyer_username,
    to_char((v_tx.amount_gross_cents)::numeric/100.0, 'FM999999990.00'),
    v_tx.currency,
    case
      when v_tx.session_id   is not null then 'Session'
      when v_tx.challenge_id is not null then 'Challenge'
      else 'Purchase'
    end,
    to_char(v_tx.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS "UTC"'),
    v_tx.id
  );

  v_html := replace(v_text, E'\n', '<br/>');

  insert into public.app_email_outbox(kind, tx_id, to_email, subject, html_body, text_body)
  values ('receipt', p_tx_id, v_email, v_subj, v_html, v_text)
  returning id into v_id;

  return v_id;
end;
$$;


ALTER FUNCTION "public"."admin_email_enqueue_receipt"("p_tx_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_generate_monthly_badge_digest"("p_period" "text", "p_admin_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid    uuid;
  u        record;
  v_summary jsonb;
  v_awarded jsonb;
  v_revoked jsonb;
begin
  -- Determine effective admin user:
  --  - if p_admin_id is passed (edge job) → use that
  --  - else fallback to auth.uid() (manual admin call from SQL)
  v_uid := coalesce(p_admin_id, auth.uid());

  if not public.is_admin(v_uid) then
    raise exception 'admin_generate_monthly_badge_digest: not authorized (requires admin)';
  end if;

  -- Loop over all users with monthly badges for this period that don't yet have a digest row
  for u in
    select distinct ub.user_id
    from public.app_user_badge ub
    join public.app_badge b on b.id = ub.badge_id
    where b.is_monthly = true
      and ub.period = p_period
      and not exists (
        select 1
        from public.app_badge_monthly_digest d
        where d.user_id = ub.user_id
          and d.period  = p_period
      )
  loop
    -- Aggregate awarded (revoked_at is null)
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_badge_id',   ub.id,
            'badge_id',        ub.badge_id,
            'badge_slug',      b.slug,
            'badge_label',     b.label,
            'tier',            b.tier,
            'audience',        b.audience,
            'rank',            (ub.context ->> 'rank')::int,
            'period',          ub.period,
            'context',         coalesce(ub.context, '{}'::jsonb),
            'awarded_at',      ub.awarded_at,
            'badge_color_hex', b.color_hex,
            'badge_icon',      b.icon
          )
          order by ub.awarded_at
        ) filter (where ub.revoked_at is null),
        '[]'::jsonb
      )
    into v_awarded
    from public.app_user_badge ub
    join public.app_badge b on b.id = ub.badge_id
    where b.is_monthly = true
      and ub.period    = p_period
      and ub.user_id   = u.user_id;

    -- Aggregate revoked (revoked_at is not null)
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'user_badge_id',   ub.id,
            'badge_id',        ub.badge_id,
            'badge_slug',      b.slug,
            'badge_label',     b.label,
            'tier',            b.tier,
            'audience',        b.audience,
            'rank',            (ub.context ->> 'rank')::int,
            'period',          ub.period,
            'context',         coalesce(ub.context, '{}'::jsonb),
            'awarded_at',      ub.awarded_at,
            'revoked_at',      ub.revoked_at,
            'revoked_reason',  ub.revoked_reason,
            'badge_color_hex', b.color_hex,
            'badge_icon',      b.icon
          )
          order by ub.revoked_at nulls last, ub.awarded_at
        ) filter (where ub.revoked_at is not null),
        '[]'::jsonb
      )
    into v_revoked
    from public.app_user_badge ub
    join public.app_badge b on b.id = ub.badge_id
    where b.is_monthly = true
      and ub.period    = p_period
      and ub.user_id   = u.user_id;

    -- Build summary (mirrors vw_my_monthly_summary, but for arbitrary user_id)
    select
      jsonb_build_object(
        'total_badges',
          (jsonb_array_length(v_awarded) + jsonb_array_length(v_revoked)),
        'awarded_count',
          jsonb_array_length(v_awarded),
        'revoked_count',
          jsonb_array_length(v_revoked),
        'best_rank',
          min( (ub.context ->> 'rank')::int )
            filter (where ub.context ? 'rank'),
        'has_attendance_rank',
          bool_or(b.slug like 'system:top_%attendance%'),
        'has_revenue_rank',
          bool_or(b.slug like 'system:top_%revenue%'),
        'has_follower_rank',
          bool_or(b.slug like 'system:top_%followers%'),
        'has_growth_badge',
          bool_or(b.slug like 'system:monthly_%_growth%')
      )
    into v_summary
    from public.app_user_badge ub
    join public.app_badge b on b.id = ub.badge_id
    where b.is_monthly = true
      and ub.period    = p_period
      and ub.user_id   = u.user_id;

    -- Fallback if user has no rows (should not happen)
    if v_summary is null then
      v_summary := jsonb_build_object(
        'total_badges',           0,
        'awarded_count',          0,
        'revoked_count',          0,
        'best_rank',              null,
        'has_attendance_rank',    false,
        'has_revenue_rank',       false,
        'has_follower_rank',      false,
        'has_growth_badge',       false
      );
    end if;

    -- Insert digest log row (idempotent by (user_id, period))
    insert into public.app_badge_monthly_digest (
      user_id,
      period,
      summary,
      awarded,
      revoked
    )
    values (
      u.user_id,
      p_period,
      v_summary,
      v_awarded,
      v_revoked
    )
    on conflict (user_id, period) do nothing;

    -- Insert one notification per user/period
    insert into public.app_notification (
      recipient_id,
      type,
      payload
    )
    values (
      u.user_id,
      'badge_monthly_digest',
      jsonb_build_object(
        'period',  p_period,
        'summary', v_summary,
        'awarded', v_awarded,
        'revoked', v_revoked
      )
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."admin_generate_monthly_badge_digest"("p_period" "text", "p_admin_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_attendance" (
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone,
    "left_at" timestamp with time zone
);


ALTER TABLE "public"."app_attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_session" (
    "challenge_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL
);


ALTER TABLE "public"."app_challenge_session" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_transaction" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "challenge_id" "uuid",
    "type" "public"."payment_type" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "provider" "text" DEFAULT 'manual'::"text" NOT NULL,
    "provider_payment_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "buyer_processing_fee_cents" integer DEFAULT 0,
    "amount_gross_cents" bigint NOT NULL,
    "processing_fee_fixed_cents" bigint NOT NULL,
    "processing_fee_percent_cents" bigint NOT NULL,
    "platform_cut_cents" bigint NOT NULL,
    "creator_cut_cents" bigint NOT NULL,
    "amount_after_stripe_cents" bigint NOT NULL,
    "currency" "text" NOT NULL,
    CONSTRAINT "app_transaction_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "app_transaction_quantity_check" CHECK (("quantity" >= 1))
);


ALTER TABLE "public"."app_transaction" OWNER TO "postgres";


COMMENT ON COLUMN "public"."app_transaction"."amount_gross_cents" IS 'Sticker/base price in cents (before Stripe fees).';



COMMENT ON COLUMN "public"."app_transaction"."processing_fee_fixed_cents" IS 'Fixed per-charge fee (e.g. 30 CHF cents) charged to buyer and kept by platform to cover Stripe flat fee.';



COMMENT ON COLUMN "public"."app_transaction"."processing_fee_percent_cents" IS 'Percent fee portion Stripe charges (~2.9% of gross), stored in cents.';



COMMENT ON COLUMN "public"."app_transaction"."platform_cut_cents" IS 'Platform 20% revenue share on gross (excludes buyer fixed fee).';



COMMENT ON COLUMN "public"."app_transaction"."creator_cut_cents" IS 'Creators 80% revenue share on gross.';



COMMENT ON COLUMN "public"."app_transaction"."amount_after_stripe_cents" IS 'Gross minus Stripe fees (for reporting). NOT what creators split.';



CREATE OR REPLACE VIEW "public"."vw_entitlement_gaps" WITH ("security_invoker"='true') AS
 WITH "tx" AS (
         SELECT "t"."id",
            "t"."buyer_id",
            "t"."challenge_id",
            "t"."status",
            "t"."created_at"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."provider" = 'stripe'::"text") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."challenge_id" IS NOT NULL))
        ), "sess" AS (
         SELECT "cs"."challenge_id",
            "cs"."session_id"
           FROM "public"."app_challenge_session" "cs"
        ), "att" AS (
         SELECT "a_1"."session_id",
            "a_1"."user_id"
           FROM "public"."app_attendance" "a_1"
        )
 SELECT "tx"."id" AS "transaction_id",
    "tx"."buyer_id",
    "tx"."challenge_id",
    "count"("s"."session_id") AS "sessions_in_bundle",
    "count"("a"."session_id") FILTER (WHERE ("a"."user_id" = "tx"."buyer_id")) AS "attendance_rows_for_buyer",
    ("count"("s"."session_id") - "count"("a"."session_id") FILTER (WHERE ("a"."user_id" = "tx"."buyer_id"))) AS "missing_rows",
    "tx"."created_at"
   FROM (("tx"
     LEFT JOIN "sess" "s" ON (("s"."challenge_id" = "tx"."challenge_id")))
     LEFT JOIN "att" "a" ON ((("a"."session_id" = "s"."session_id") AND ("a"."user_id" = "tx"."buyer_id"))))
  GROUP BY "tx"."id", "tx"."buyer_id", "tx"."challenge_id", "tx"."created_at"
 HAVING ("count"("a"."session_id") FILTER (WHERE ("a"."user_id" = "tx"."buyer_id")) < "count"("s"."session_id"))
  ORDER BY "tx"."created_at" DESC;


ALTER VIEW "public"."vw_entitlement_gaps" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_health_entitlements"() RETURNS SETOF "public"."vw_entitlement_gaps"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  RETURN QUERY
  SELECT * FROM public.vw_entitlement_gaps;
END;
$$;


ALTER FUNCTION "public"."admin_health_entitlements"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."session_has_priced_parent_challenge"("p_session_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_challenge_session cs
        join public.app_challenge c
          on c.id = cs.challenge_id
        where cs.session_id = p_session_id
          and c.price_cents > 0
    );
$$;


ALTER FUNCTION "public"."session_has_priced_parent_challenge"("p_session_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_session" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "duration_minutes" integer NOT NULL,
    "capacity" integer,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'CHF'::"text" NOT NULL,
    "stream_url" "text",
    "host_id" "uuid" NOT NULL,
    "status" "public"."session_status" DEFAULT 'draft'::"public"."session_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "live_provider" "text" DEFAULT 'daily'::"text",
    "live_room_id" "text",
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "ticket_price" numeric(10,2),
    "published_at" timestamp with time zone,
    "change_reason" "text",
    "updated_at" timestamp with time zone,
    "contract_id" "uuid",
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "continuation_group_id" "uuid",
    "continued_from_session_id" "uuid",
    "image_url" "text",
    "pre_pulse_fired_at" timestamp with time zone,
    CONSTRAINT "app_session_currency_check" CHECK (("currency" = 'CHF'::"text")),
    CONSTRAINT "app_session_ticket_price_check" CHECK ((("ticket_price" IS NULL) OR ("ticket_price" > (0)::numeric))),
    CONSTRAINT "chk_session_capacity_positive" CHECK ((("capacity" IS NULL) OR ("capacity" > 0))),
    CONSTRAINT "chk_session_currency_iso" CHECK (("currency" ~ '^[A-Z]{3}$'::"text")),
    CONSTRAINT "chk_session_duration_5_240" CHECK ((("duration_minutes" >= 5) AND ("duration_minutes" <= 240))),
    CONSTRAINT "chk_session_ended_sync" CHECK (((("status" = 'ended'::"public"."session_status") AND ("ended_at" IS NOT NULL)) OR (("status" <> 'ended'::"public"."session_status") AND ("ended_at" IS NULL)))),
    CONSTRAINT "chk_session_price_cents_nonneg" CHECK (("price_cents" >= 0)),
    CONSTRAINT "chk_session_room_has_provider" CHECK ((("live_room_id" IS NULL) OR ("live_provider" IS NOT NULL))),
    CONSTRAINT "ck_session_not_continue_self" CHECK ((("continued_from_session_id" IS NULL) OR ("continued_from_session_id" <> "id"))),
    CONSTRAINT "ck_session_published_requires_price" CHECK ((("status" <> 'published'::"public"."session_status") OR ("price_cents" > 0) OR "public"."session_has_priced_parent_challenge"("id")))
);


ALTER TABLE "public"."app_session" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_sessions_requiring_room" WITH ("security_invoker"='true') AS
 SELECT "id",
    "title",
    "status",
    "started_at",
    "live_provider",
    "live_room_id"
   FROM "public"."app_session"
  WHERE (("started_at" IS NOT NULL) AND ("live_room_id" IS NULL))
  ORDER BY "started_at" DESC NULLS LAST;


ALTER VIEW "public"."vw_sessions_requiring_room" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_health_rooms"() RETURNS SETOF "public"."vw_sessions_requiring_room"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  RETURN QUERY
  SELECT * FROM public.vw_sessions_requiring_room;
END;
$$;


ALTER FUNCTION "public"."admin_health_rooms"() OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_tx_health" WITH ("security_invoker"='true') AS
 SELECT "id",
    "buyer_id",
    "provider",
    "type",
    "status",
    "amount_gross_cents",
    "currency",
    "created_at"
   FROM "public"."app_transaction"
  WHERE ("status" <> 'succeeded'::"public"."payment_status")
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."vw_tx_health" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_health_tx"() RETURNS SETOF "public"."vw_tx_health"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  RETURN QUERY
  SELECT * FROM public.vw_tx_health;
END;
$$;


ALTER FUNCTION "public"."admin_health_tx"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_regrant_entitlements_for"("p_buyer_id" "uuid", "p_session_id" "uuid" DEFAULT NULL::"uuid", "p_challenge_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("session_id" "uuid", "user_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
DECLARE
  v_admin uuid := auth.uid();
BEGIN
  -- Gate: admin only
  IF v_admin IS NULL OR NOT public.is_admin(v_admin) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  IF p_buyer_id IS NULL THEN
    RAISE EXCEPTION 'invalid: buyer_id is required';
  END IF;
  IF (p_session_id IS NULL AND p_challenge_id IS NULL) OR
     (p_session_id IS NOT NULL AND p_challenge_id IS NOT NULL) THEN
    RAISE EXCEPTION 'invalid: provide exactly one of (session_id) or (challenge_id)';
  END IF;

  RETURN QUERY
  WITH target AS (
    SELECT DISTINCT
      COALESCE(p_session_id, cs.session_id) AS session_id
    FROM public.app_challenge_session cs
    WHERE (p_challenge_id IS NOT NULL AND cs.challenge_id = p_challenge_id)
       OR (p_session_id IS NOT NULL)
  ),
  ins AS (
    INSERT INTO public.app_attendance (session_id, user_id, joined_at)
    SELECT t.session_id, p_buyer_id, NULL
    FROM target t
    ON CONFLICT (session_id, user_id) DO NOTHING
    RETURNING session_id
  )
  SELECT
    t.session_id,
    p_buyer_id AS user_id,
    CASE WHEN i.session_id IS NOT NULL THEN 'created' ELSE 'already_exists' END AS status
  FROM target t
  LEFT JOIN ins i USING (session_id)
  ORDER BY t.session_id;
END;
$$;


ALTER FUNCTION "public"."admin_regrant_entitlements_for"("p_buyer_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_regrant_entitlements_tx"("p_tx_id" "uuid") RETURNS TABLE("session_id" "uuid", "user_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_buyer        uuid;
  v_tx_type      text;
  v_tx_status    text;
  v_session_id   uuid;
  v_challenge_id uuid;
  v_exists       boolean;
BEGIN
  -- Admin gate
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden: admin only';
  END IF;

  -- Fetch tx fields with fully-qualified aliasing to avoid ambiguity
  SELECT
      t.buyer_id,
      t.type,
      t.status,
      t.session_id,
      t.challenge_id
  INTO
      v_buyer,
      v_tx_type,
      v_tx_status,
      v_session_id,
      v_challenge_id
  FROM public.app_transaction AS t
  WHERE t.id = p_tx_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found: transaction %', p_tx_id;
  END IF;

  -- Only re-grant for succeeded transactions
  IF v_tx_status <> 'succeeded' THEN
    RETURN QUERY
      SELECT v_session_id, v_buyer, 'skipped_not_succeeded'::text;
    RETURN;
  END IF;

  -- Single-session ticket
  IF v_tx_type = 'ticket' AND v_session_id IS NOT NULL THEN
    SELECT TRUE
    INTO v_exists
    FROM public.app_attendance a
    WHERE a.session_id = v_session_id
      AND a.user_id    = v_buyer;

    IF v_exists THEN
      RETURN QUERY SELECT v_session_id, v_buyer, 'already_exists'::text;
    ELSE
      INSERT INTO public.app_attendance (session_id, user_id, joined_at)
      VALUES (v_session_id, v_buyer, NULL)
      ON CONFLICT (session_id, user_id) DO NOTHING;

      RETURN QUERY SELECT v_session_id, v_buyer, 'created'::text;
    END IF;

    RETURN;
  END IF;

  -- Challenge bundle: grant for all sessions linked to the challenge
  IF v_tx_type = 'bundle' AND v_challenge_id IS NOT NULL THEN
    FOR v_session_id IN
      SELECT cs.session_id
      FROM public.app_challenge_session cs
      WHERE cs.challenge_id = v_challenge_id
    LOOP
      SELECT TRUE
      INTO v_exists
      FROM public.app_attendance a
      WHERE a.session_id = v_session_id
        AND a.user_id    = v_buyer;

      IF v_exists THEN
        RETURN QUERY SELECT v_session_id, v_buyer, 'already_exists'::text;
      ELSE
        INSERT INTO public.app_attendance (session_id, user_id, joined_at)
        VALUES (v_session_id, v_buyer, NULL)
        ON CONFLICT (session_id, user_id) DO NOTHING;

        RETURN QUERY SELECT v_session_id, v_buyer, 'created'::text;
      END IF;
    END LOOP;

    RETURN;
  END IF;

  -- Fallback: unknown shape
  RETURN QUERY SELECT v_session_id, v_buyer, 'skipped_unknown_type'::text;
END;
$$;


ALTER FUNCTION "public"."admin_regrant_entitlements_tx"("p_tx_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_run_monthly_attendance_badges"("p_year" integer, "p_month" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_period text := lpad(p_year::text, 4, '0') || '-' || lpad(p_month::text, 2, '0');
  v_start  date := make_date(p_year, p_month, 1);
  v_end    date := (make_date(p_year, p_month, 1) + interval '1 month')::date;
  v_badge_top1     uuid;
  v_badge_top10    uuid;
  v_badge_top100   uuid;
  v_badge_consist  uuid;
  v_consistency_threshold int := 8; -- configurable later
begin
  -- =============================================================
  -- Fetch badge IDs
  -- =============================================================
  select id into v_badge_top1
  from app_badge
  where slug = 'system:top_1_attendance_global';

  select id into v_badge_top10
  from app_badge
  where slug = 'system:top_10_attendance_global';

  select id into v_badge_top100
  from app_badge
  where slug = 'system:top_100_attendance_global';

  select id into v_badge_consist
  from app_badge
  where slug = 'system:monthly_consistency';

  if v_badge_top1 is null or v_badge_top10 is null
     or v_badge_top100 is null or v_badge_consist is null then
     raise exception 'Monthly attendance badges missing in app_badge table';
  end if;

  -- =============================================================
  -- Ranking: attendance counts per user within the period
  -- =============================================================
  drop table if exists tmp_month_attendance;
  create temporary table tmp_month_attendance as
  select
    a.user_id,
    count(*)::int as total_attended
  from app_attendance a
  where a.joined_at >= v_start
    and a.joined_at <  v_end
  group by a.user_id;

  -- =============================================================
  -- Revoke all previous monthly attendance badges for this period
  -- (idempotent)
  -- =============================================================
  update app_user_badge ub
  set revoked_at = now(), revoked_reason = 'period refresh: ' || v_period
  from app_badge b
  where ub.badge_id = b.id
    and b.slug in (
      'system:top_1_attendance_global',
      'system:top_10_attendance_global',
      'system:top_100_attendance_global',
      'system:monthly_consistency'
    )
    and ub.context->>'period' = v_period
    and ub.revoked_at is null;

  -- =============================================================
  -- Award Top 1
  -- =============================================================
  perform admin_badge_award(
    (select user_id from tmp_month_attendance order by total_attended desc, user_id limit 1),
    'system:top_1_attendance_global',
    jsonb_build_object(
      'period', v_period,
      'rank', 1,
      'total_attendance', (select total_attended from tmp_month_attendance order by total_attended desc limit 1)
    )
  );

  -- =============================================================
  -- Award Top 10
  -- =============================================================
  perform (
    select json_agg(admin_badge_award(
      user_id,
      'system:top_10_attendance_global',
      jsonb_build_object(
        'period', v_period,
        'rank', rn,
        'total_attendance', total_attended
      )
    ))
    from (
      select user_id, total_attended,
             row_number() over (order by total_attended desc, user_id) as rn
      from tmp_month_attendance
      order by total_attended desc
      limit 10
    ) t
  );

  -- =============================================================
  -- Award Top 100
  -- =============================================================
  perform (
    select json_agg(admin_badge_award(
      user_id,
      'system:top_100_attendance_global',
      jsonb_build_object(
        'period', v_period,
        'rank', rn,
        'total_attendance', total_attended
      )
    ))
    from (
      select user_id, total_attended,
             row_number() over (order by total_attended desc, user_id) as rn
      from tmp_month_attendance
      order by total_attended desc
      limit 100
    ) t
  );

  -- =============================================================
  -- Award monthly consistency
  -- =============================================================
  perform (
    select json_agg(admin_badge_award(
      user_id,
      'system:monthly_consistency',
      jsonb_build_object(
        'period', v_period,
        'total_attendance', total_attended
      )
    ))
    from tmp_month_attendance
    where total_attended >= v_consistency_threshold
  );

end;
$$;


ALTER FUNCTION "public"."admin_run_monthly_attendance_badges"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_run_monthly_creator_attendance_badges"("p_year" integer, "p_month" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_period text := lpad(p_year::text, 4, '0') || '-' || lpad(p_month::text, 2, '0');
  v_start  date := make_date(p_year, p_month, 1);
  v_end    date := (make_date(p_year, p_month, 1) + interval '1 month')::date;

  v_badge_top1    uuid;
  v_badge_top10   uuid;
  v_badge_top100  uuid;
  v_badge_growth  uuid;
  v_badge_builder uuid;
  v_badge_leader  uuid;
begin
  -- -----------------------------------------------------------
  -- 0) Look up badge IDs (sanity)
  -- -----------------------------------------------------------
  select id into v_badge_top1
  from app_badge
  where slug = 'system:top_1_attendance_global_creator';

  select id into v_badge_top10
  from app_badge
  where slug = 'system:top_10_attendance_global_creator';

  select id into v_badge_top100
  from app_badge
  where slug = 'system:top_100_attendance_global_creator';

  select id into v_badge_growth
  from app_badge
  where slug = 'system:monthly_attendance_growth';

  select id into v_badge_builder
  from app_badge
  where slug = 'system:community_builder';

  select id into v_badge_leader
  from app_badge
  where slug = 'system:community_leader';

  if v_badge_top1    is null
     or v_badge_top10   is null
     or v_badge_top100  is null
     or v_badge_growth  is null
     or v_badge_builder is null
     or v_badge_leader  is null then
    raise exception 'Monthly creator attendance badges missing in app_badge table';
  end if;

  -- -----------------------------------------------------------
  -- 1) Build current-period attendance per creator
  -- -----------------------------------------------------------
  drop table if exists tmp_creator_attendance_month;
  create temporary table tmp_creator_attendance_month as
  select
    s.host_id                         as creator_id,
    count(*)::int                     as total_attendance,
    count(distinct a.user_id)::int    as unique_attendees
  from app_attendance a
  join app_session s on s.id = a.session_id
  where a.joined_at >= v_start
    and a.joined_at <  v_end
  group by s.host_id;

  -- -----------------------------------------------------------
  -- 2) Build previous-period attendance per creator
  -- -----------------------------------------------------------
  drop table if exists tmp_creator_attendance_prev;
  create temporary table tmp_creator_attendance_prev as
  with prev_dates as (
    select
      (make_date(p_year, p_month, 1) - interval '1 month')::date as prev_start,
      make_date(p_year, p_month, 1)::date                        as prev_end
  )
  select
    s.host_id                      as creator_id,
    count(*)::int                  as total_attendance
  from app_attendance a
  join app_session s on s.id = a.session_id
  cross join prev_dates d
  where a.joined_at >= d.prev_start
    and a.joined_at <  d.prev_end
  group by s.host_id;

  -- -----------------------------------------------------------
  -- 3) Revoke existing attendance badges for this period
  -- -----------------------------------------------------------
  update app_user_badge ub
  set revoked_at     = now(),
      revoked_reason = 'period refresh: ' || v_period
  from app_badge b
  where ub.badge_id = b.id
    and b.slug in (
      'system:top_1_attendance_global_creator',
      'system:top_10_attendance_global_creator',
      'system:top_100_attendance_global_creator',
      'system:monthly_attendance_growth',
      'system:community_builder',
      'system:community_leader'
    )
    and ub.period   = v_period
    and ub.revoked_at is null;

  -- -----------------------------------------------------------
  -- 4) Award Top 1 / Top 10 / Top 100 by total_attendance
  -- -----------------------------------------------------------
  if exists (select 1 from tmp_creator_attendance_month) then
    -- Top 1
    perform admin_badge_award(
      (select creator_id
       from tmp_creator_attendance_month
       order by total_attendance desc, creator_id
       limit 1),
      'system:top_1_attendance_global_creator',
      jsonb_build_object(
        'period', v_period,
        'rank', 1,
        'total_attendance',
          (select total_attendance
           from tmp_creator_attendance_month
           order by total_attendance desc
           limit 1)
      )
    );
  end if;

  -- Top 10
  perform (
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:top_10_attendance_global_creator',
        jsonb_build_object(
          'period', v_period,
          'rank', rn,
          'total_attendance', total_attendance,
          'unique_attendees', unique_attendees
        )
      )
    )
    from (
      select
        creator_id,
        total_attendance,
        unique_attendees,
        row_number() over (order by total_attendance desc, creator_id) as rn
      from tmp_creator_attendance_month
      order by total_attendance desc
      limit 10
    ) t
  );

  -- Top 100
  perform (
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:top_100_attendance_global_creator',
        jsonb_build_object(
          'period', v_period,
          'rank', rn,
          'total_attendance', total_attendance,
          'unique_attendees', unique_attendees
        )
      )
    )
    from (
      select
        creator_id,
        total_attendance,
        unique_attendees,
        row_number() over (order by total_attendance desc, creator_id) as rn
      from tmp_creator_attendance_month
      order by total_attendance desc
      limit 100
    ) t
  );

  -- -----------------------------------------------------------
  -- 5) Award community_builder / community_leader
  -- -----------------------------------------------------------
  perform (
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:community_builder',
        jsonb_build_object(
          'period', v_period,
          'unique_attendees', unique_attendees
        )
      )
    )
    from tmp_creator_attendance_month
    where unique_attendees >= 100
  );

  perform (
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:community_leader',
        jsonb_build_object(
          'period', v_period,
          'unique_attendees', unique_attendees
        )
      )
    )
    from tmp_creator_attendance_month
    where unique_attendees >= 1000
  );

  -- -----------------------------------------------------------
  -- 6) Award Monthly Attendance Growth (≥ +10% vs previous month)
  -- -----------------------------------------------------------
  perform (
    with growth as (
      select
        cur.creator_id,
        cur.total_attendance   as current_attendance,
        coalesce(prev.total_attendance, 0)::int as previous_attendance,
        case
          when coalesce(prev.total_attendance, 0) > 0 then
            (cur.total_attendance::numeric - prev.total_attendance::numeric)
              / prev.total_attendance::numeric
          else null::numeric
        end as growth_ratio
      from tmp_creator_attendance_month cur
      left join tmp_creator_attendance_prev prev
        on prev.creator_id = cur.creator_id
    )
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:monthly_attendance_growth',
        jsonb_build_object(
          'period', v_period,
          'current_attendance',  current_attendance,
          'previous_attendance', previous_attendance,
          'growth_ratio',        growth_ratio
        )
      )
    )
    from growth
    where growth_ratio is not null
      and growth_ratio >= 0.10    -- ≥ +10%
  );

end;
$$;


ALTER FUNCTION "public"."admin_run_monthly_creator_attendance_badges"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_run_monthly_creator_follower_badges"("p_year" integer, "p_month" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_period text := lpad(p_year::text, 4, '0') || '-' || lpad(p_month::text, 2, '0');
  v_start  date := make_date(p_year, p_month, 1);
  v_end    date := (make_date(p_year, p_month, 1) + interval '1 month')::date;

  v_badge_top1   uuid;
  v_badge_top10  uuid;
  v_badge_top100 uuid;
  v_badge_growth uuid;
begin
  -- -----------------------------------------------------------
  -- 0) Look up badge IDs
  -- -----------------------------------------------------------
  select id into v_badge_top1
  from public.app_badge
  where slug = 'system:top_1_followers_global';

  select id into v_badge_top10
  from public.app_badge
  where slug = 'system:top_10_followers_global';

  select id into v_badge_top100
  from public.app_badge
  where slug = 'system:top_100_followers_global';

  select id into v_badge_growth
  from public.app_badge
  where slug = 'system:monthly_follower_growth';

  if v_badge_top1 is null
     or v_badge_top10 is null
     or v_badge_top100 is null
     or v_badge_growth is null then
    raise exception 'Monthly creator follower badges missing in app_badge table';
  end if;

  -- -----------------------------------------------------------
  -- 1) Current creator tribe member count (as of end of period)
  -- -----------------------------------------------------------
  drop table if exists tmp_creator_followers_current;
  create temporary table tmp_creator_followers_current as
  select
    s.creator_id as creator_id,
    count(m.user_id)::bigint as follower_count
  from public.app_creator_space s
  left join public.app_creator_space_member m
    on m.space_id = s.id
   and m.created_at < v_end
  group by s.creator_id;

  -- -----------------------------------------------------------
  -- 2) Previous creator tribe member count (as of end prev month)
  -- -----------------------------------------------------------
  drop table if exists tmp_creator_followers_prev;
  create temporary table tmp_creator_followers_prev as
  with prev_dates as (
    select
      (make_date(p_year, p_month, 1) - interval '1 month')::date as prev_end
  )
  select
    s.creator_id as creator_id,
    count(m.user_id)::bigint as follower_count
  from public.app_creator_space s
  cross join prev_dates d
  left join public.app_creator_space_member m
    on m.space_id = s.id
   and m.created_at < d.prev_end
  group by s.creator_id;

  -- -----------------------------------------------------------
  -- 3) Revoke existing follower badges for this period
  -- -----------------------------------------------------------
  update public.app_user_badge ub
  set revoked_at     = now(),
      revoked_reason = 'period refresh: ' || v_period
  from public.app_badge b
  where ub.badge_id = b.id
    and b.slug in (
      'system:top_1_followers_global',
      'system:top_10_followers_global',
      'system:top_100_followers_global',
      'system:monthly_follower_growth'
    )
    and ub.period = v_period
    and ub.revoked_at is null;

  -- -----------------------------------------------------------
  -- 4) Award Top 1 / Top 10 / Top 100 by creator tribe size
  -- -----------------------------------------------------------
  if exists (
      select 1
      from tmp_creator_followers_current
      where follower_count > 0
  ) then
    perform public.admin_badge_award(
      (
        select creator_id
        from tmp_creator_followers_current
        where follower_count > 0
        order by follower_count desc, creator_id
        limit 1
      ),
      'system:top_1_followers_global',
      jsonb_build_object(
        'period', v_period,
        'rank', 1,
        'follower_count',
          (
            select follower_count
            from tmp_creator_followers_current
            where follower_count > 0
            order by follower_count desc, creator_id
            limit 1
          )
      )
    );
  end if;

  perform (
    select json_agg(
      public.admin_badge_award(
        creator_id,
        'system:top_10_followers_global',
        jsonb_build_object(
          'period', v_period,
          'rank', rn,
          'follower_count', follower_count
        )
      )
    )
    from (
      select
        creator_id,
        follower_count,
        row_number() over (order by follower_count desc, creator_id) as rn
      from tmp_creator_followers_current
      where follower_count > 0
      order by follower_count desc, creator_id
      limit 10
    ) t
  );

  perform (
    select json_agg(
      public.admin_badge_award(
        creator_id,
        'system:top_100_followers_global',
        jsonb_build_object(
          'period', v_period,
          'rank', rn,
          'follower_count', follower_count
        )
      )
    )
    from (
      select
        creator_id,
        follower_count,
        row_number() over (order by follower_count desc, creator_id) as rn
      from tmp_creator_followers_current
      where follower_count > 0
      order by follower_count desc, creator_id
      limit 100
    ) t
  );

  -- -----------------------------------------------------------
  -- 5) Monthly creator tribe growth (≥ +10% vs previous month)
  -- -----------------------------------------------------------
  perform (
    with growth as (
      select
        cur.creator_id,
        cur.follower_count as current_followers,
        coalesce(prev.follower_count, 0)::bigint as previous_followers,
        case
          when coalesce(prev.follower_count, 0) > 0 then
            (cur.follower_count::numeric - prev.follower_count::numeric)
              / prev.follower_count::numeric
          else null::numeric
        end as growth_ratio
      from tmp_creator_followers_current cur
      left join tmp_creator_followers_prev prev
        on prev.creator_id = cur.creator_id
    )
    select json_agg(
      public.admin_badge_award(
        creator_id,
        'system:monthly_follower_growth',
        jsonb_build_object(
          'period', v_period,
          'current_followers', current_followers,
          'previous_followers', previous_followers,
          'growth_ratio', growth_ratio
        )
      )
    )
    from growth
    where growth_ratio is not null
      and growth_ratio >= 0.10
  );

end;
$$;


ALTER FUNCTION "public"."admin_run_monthly_creator_follower_badges"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_run_monthly_creator_revenue_badges"("p_year" integer, "p_month" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_period text := lpad(p_year::text, 4, '0') || '-' || lpad(p_month::text, 2, '0');
  v_start  date := make_date(p_year, p_month, 1);
  v_end    date := (make_date(p_year, p_month, 1) + interval '1 month')::date;

  v_badge_top1   uuid;
  v_badge_top10  uuid;
  v_badge_top100 uuid;
  v_badge_growth uuid;
begin
  -- -----------------------------------------------------------
  -- 0) Look up badge IDs (sanity)
  -- -----------------------------------------------------------
  select id into v_badge_top1
  from app_badge
  where slug = 'system:top_1_revenue_global';

  select id into v_badge_top10
  from app_badge
  where slug = 'system:top_10_revenue_global';

  select id into v_badge_top100
  from app_badge
  where slug = 'system:top_100_revenue_global';

  select id into v_badge_growth
  from app_badge
  where slug = 'system:monthly_revenue_growth';

  if v_badge_top1 is null
     or v_badge_top10 is null
     or v_badge_top100 is null
     or v_badge_growth is null then
    raise exception 'Monthly creator revenue badges missing in app_badge table';
  end if;

  -- -----------------------------------------------------------
  -- 1) Build monthly revenue per creator (current period)
  -- -----------------------------------------------------------
  drop table if exists tmp_creator_revenue_month;
  create temporary table tmp_creator_revenue_month as
  select
    t.creator_id,
    sum(t.amount_gross_cents)::bigint              as total_gross_cents,
    count(distinct t.buyer_id)::int                as unique_buyers
  from app_transaction t
  where t.status = 'succeeded'
    and t.creator_id is not null
    and t.type in ('ticket', 'bundle')     -- adjust if you add more paid types
    and t.created_at >= v_start
    and t.created_at <  v_end
  group by t.creator_id;

  -- -----------------------------------------------------------
  -- 2) Build previous-month revenue per creator
  -- -----------------------------------------------------------
  drop table if exists tmp_creator_revenue_prev;
  create temporary table tmp_creator_revenue_prev as
  with prev_dates as (
    select
      (make_date(p_year, p_month, 1) - interval '1 month')::date as prev_start,
      make_date(p_year, p_month, 1)::date                        as prev_end
  )
  select
    t.creator_id,
    sum(t.amount_gross_cents)::bigint as total_gross_cents
  from app_transaction t
  cross join prev_dates d
  where t.status = 'succeeded'
    and t.creator_id is not null
    and t.type in ('ticket', 'bundle')
    and t.created_at >= d.prev_start
    and t.created_at <  d.prev_end
  group by t.creator_id;

  -- -----------------------------------------------------------
  -- 3) Revoke existing revenue badges for this period (idempotent)
  -- -----------------------------------------------------------
  update app_user_badge ub
  set revoked_at     = now(),
      revoked_reason = 'period refresh: ' || v_period
  from app_badge b
  where ub.badge_id = b.id
    and b.slug in (
      'system:top_1_revenue_global',
      'system:top_10_revenue_global',
      'system:top_100_revenue_global',
      'system:monthly_revenue_growth'
    )
    and ub.period   = v_period
    and ub.revoked_at is null;

  -- -----------------------------------------------------------
  -- 4) Award Top 1 / Top 10 / Top 100 by gross revenue
  -- -----------------------------------------------------------
  if exists (select 1 from tmp_creator_revenue_month) then
    -- Top 1
    perform admin_badge_award(
      (select creator_id
       from tmp_creator_revenue_month
       order by total_gross_cents desc, creator_id
       limit 1),
      'system:top_1_revenue_global',
      jsonb_build_object(
        'period', v_period,
        'rank', 1,
        'total_gross_cents',
          (select total_gross_cents
           from tmp_creator_revenue_month
           order by total_gross_cents desc
           limit 1)
      )
    );
  end if;

  -- Top 10
  perform (
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:top_10_revenue_global',
        jsonb_build_object(
          'period', v_period,
          'rank', rn,
          'total_gross_cents', total_gross_cents,
          'unique_buyers', unique_buyers
        )
      )
    )
    from (
      select
        creator_id,
        total_gross_cents,
        unique_buyers,
        row_number() over (order by total_gross_cents desc, creator_id) as rn
      from tmp_creator_revenue_month
      order by total_gross_cents desc
      limit 10
    ) t
  );

  -- Top 100
  perform (
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:top_100_revenue_global',
        jsonb_build_object(
          'period', v_period,
          'rank', rn,
          'total_gross_cents', total_gross_cents,
          'unique_buyers', unique_buyers
        )
      )
    )
    from (
      select
        creator_id,
        total_gross_cents,
        unique_buyers,
        row_number() over (order by total_gross_cents desc, creator_id) as rn
      from tmp_creator_revenue_month
      order by total_gross_cents desc
      limit 100
    ) t
  );

  -- -----------------------------------------------------------
  -- 5) Award Monthly Revenue Growth (>10% vs previous month)
  -- -----------------------------------------------------------
  perform (
    with growth as (
      select
        cur.creator_id,
        cur.total_gross_cents      as current_gross_cents,
        coalesce(prev.total_gross_cents, 0)::bigint as previous_gross_cents,
        case
          when coalesce(prev.total_gross_cents, 0) > 0 then
            (cur.total_gross_cents::numeric - prev.total_gross_cents::numeric)
              / prev.total_gross_cents::numeric
          else null::numeric
        end as growth_ratio
      from tmp_creator_revenue_month cur
      left join tmp_creator_revenue_prev prev
        on prev.creator_id = cur.creator_id
    )
    select json_agg(
      admin_badge_award(
        creator_id,
        'system:monthly_revenue_growth',
        jsonb_build_object(
          'period', v_period,
          'current_gross_cents',  current_gross_cents,
          'previous_gross_cents', previous_gross_cents,
          'growth_ratio',         growth_ratio
        )
      )
    )
    from growth
    where growth_ratio is not null
      and growth_ratio >= 0.10           -- ≥ +10% vs previous month
  );

end;
$$;


ALTER FUNCTION "public"."admin_run_monthly_creator_revenue_badges"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_run_monthly_participant_growth_badges"("p_year" integer, "p_month" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_period       text;
  v_start        date;
  v_end          date;
  v_prev_start   date;
  v_prev_end     date;

  v_badge_sess_growth     uuid;
  v_badge_creators_growth uuid;

  v_growth_threshold numeric := 0.10; -- 10% growth
BEGIN
  --------------------------------------------------------------------
  -- Period calculations
  --------------------------------------------------------------------
  v_period     := lpad(p_year::text, 4, '0') || '-' || lpad(p_month::text, 2, '0');
  v_start      := make_date(p_year, p_month, 1);
  v_end        := (make_date(p_year, p_month, 1) + interval '1 month')::date;

  v_prev_start := (v_start - interval '1 month')::date;
  v_prev_end   := v_start;

  --------------------------------------------------------------------
  -- Fetch badge IDs
  --------------------------------------------------------------------
  SELECT id INTO v_badge_sess_growth
  FROM public.app_badge
  WHERE slug = 'system:monthly_sessions_growth_participant';

  SELECT id INTO v_badge_creators_growth
  FROM public.app_badge
  WHERE slug = 'system:monthly_creators_growth_participant';

  IF v_badge_sess_growth IS NULL OR v_badge_creators_growth IS NULL THEN
    RAISE EXCEPTION 'Participant growth badges missing in app_badge table';
  END IF;

  --------------------------------------------------------------------
  -- Build temp table of per-user growth metrics
  --------------------------------------------------------------------
  DROP TABLE IF EXISTS tmp_participant_growth;
  CREATE TEMPORARY TABLE tmp_participant_growth AS
  WITH prev_stats AS (
    SELECT
      a.user_id,
      COUNT(*)::int                       AS prev_sessions,
      COUNT(DISTINCT s.host_id)::int      AS prev_creators
    FROM public.app_attendance a
    JOIN public.app_session s ON s.id = a.session_id
    WHERE a.joined_at >= v_prev_start
      AND a.joined_at <  v_prev_end
    GROUP BY a.user_id
  ),
  curr_stats AS (
    SELECT
      a.user_id,
      COUNT(*)::int                       AS curr_sessions,
      COUNT(DISTINCT s.host_id)::int      AS curr_creators
    FROM public.app_attendance a
    JOIN public.app_session s ON s.id = a.session_id
    WHERE a.joined_at >= v_start
      AND a.joined_at <  v_end
    GROUP BY a.user_id
  )
  SELECT
    COALESCE(c.user_id, p.user_id)                           AS user_id,
    COALESCE(p.prev_sessions,  0)                            AS prev_sessions,
    COALESCE(c.curr_sessions,  0)                            AS curr_sessions,
    COALESCE(p.prev_creators,  0)                            AS prev_creators,
    COALESCE(c.curr_creators,  0)                            AS curr_creators
  FROM prev_stats p
  FULL OUTER JOIN curr_stats c
    ON p.user_id = c.user_id;

  --------------------------------------------------------------------
  -- Revoke existing participant growth badges for this period
  -- (idempotent)
  --------------------------------------------------------------------
  UPDATE public.app_user_badge ub
  SET revoked_at     = now(),
      revoked_reason = 'period refresh: ' || v_period
  FROM public.app_badge b
  WHERE ub.badge_id = b.id
    AND b.slug IN (
      'system:monthly_sessions_growth_participant',
      'system:monthly_creators_growth_participant'
    )
    AND ub.period = v_period
    AND ub.revoked_at IS NULL;

  --------------------------------------------------------------------
  -- Award monthly_sessions_growth_participant
  -- Condition: prev_sessions > 0 AND curr_sessions >= prev_sessions * (1 + threshold)
  --------------------------------------------------------------------
  PERFORM (
    SELECT json_agg(public.admin_badge_award(
      user_id,
      'system:monthly_sessions_growth_participant',
      jsonb_build_object(
        'period',          v_period,
        'prev_sessions',   prev_sessions,
        'curr_sessions',   curr_sessions,
        'growth_ratio',    (curr_sessions::numeric / NULLIF(prev_sessions,0))
      )
    ))
    FROM tmp_participant_growth
    WHERE prev_sessions > 0
      AND curr_sessions > prev_sessions
      AND curr_sessions::numeric >= prev_sessions::numeric * (1 + v_growth_threshold)
  );

  --------------------------------------------------------------------
  -- Award monthly_creators_growth_participant
  -- Condition: prev_creators > 0 AND curr_creators >= prev_creators * (1 + threshold)
  --------------------------------------------------------------------
  PERFORM (
    SELECT json_agg(public.admin_badge_award(
      user_id,
      'system:monthly_creators_growth_participant',
      jsonb_build_object(
        'period',          v_period,
        'prev_creators',   prev_creators,
        'curr_creators',   curr_creators,
        'growth_ratio',    (curr_creators::numeric / NULLIF(prev_creators,0))
      )
    ))
    FROM tmp_participant_growth
    WHERE prev_creators > 0
      AND curr_creators > prev_creators
      AND curr_creators::numeric >= prev_creators::numeric * (1 + v_growth_threshold)
  );

END;
$$;


ALTER FUNCTION "public"."admin_run_monthly_participant_growth_badges"("p_year" integer, "p_month" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."app_handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  _role text;
  _display_name text;
  _username text;
BEGIN
  -- Read role from metadata, validate it, default to participant
  _role := coalesce(
    nullif(trim(new.raw_user_meta_data->>'role'), ''),
    'participant'
  );
  IF _role NOT IN ('participant', 'creator') THEN
    _role := 'participant';
  END IF;

  -- Read display_name from metadata if provided
  _display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');

  -- Generate unique username from email local-part + 4 random chars
  _username := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
               || substring(replace(gen_random_uuid()::text, '-', '') for 4);

  INSERT INTO public.app_profile (id, full_name, username, display_name, role, creator_verified)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    _username,
    _display_name,
    _role,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."app_handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."app_session_assert_within_challenge_window"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_offender record;
begin
  -- Find any linked challenge whose window does NOT contain NEW.start_time.
  -- end_date is inclusive (a session may start any time on the end date),
  -- so the upper bound is (end_date + 1 day) exclusive.
  select c.id, c.start_date, c.end_date
    into v_offender
  from public.app_challenge_session cs
  join public.app_challenge c on c.id = cs.challenge_id
  where cs.session_id = new.id
    and (
      new.start_time <  c.start_date::timestamptz
      or new.start_time >= (c.end_date + interval '1 day')::timestamptz
    )
  limit 1;

  if found then
    raise exception
      'Session start_time % falls outside challenge % window [%, %]',
      new.start_time, v_offender.id, v_offender.start_date, v_offender.end_date
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."app_session_assert_within_challenge_window"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_creator_badge"("p_badge_id" "uuid", "p_target_user_id" "uuid") RETURNS "public"."app_user_badge"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_creator_id uuid;
  v_role       text;
  v_badge      public.app_badge;
  v_target_role text;
  v_existing   public.app_user_badge;
  v_award      public.app_user_badge;
begin
  -- Auth check
  select auth.uid() into v_creator_id;
  if v_creator_id is null then
    raise exception 'award_creator_badge: not authenticated';
  end if;

  -- Must be a creator
  select role into v_role
  from public.app_profile
  where id = v_creator_id;

  if v_role is distinct from 'creator' then
    raise exception 'award_creator_badge: only creators can award their badges';
  end if;

  -- Load and validate badge
  select *
  into v_badge
  from public.app_badge
  where id = p_badge_id;

  if not found then
    raise exception 'award_creator_badge: badge not found';
  end if;

  if v_badge.source <> 'creator_defined' then
    raise exception 'award_creator_badge: badge must be creator_defined';
  end if;

  if v_badge.created_by is distinct from v_creator_id then
    raise exception 'award_creator_badge: you can only award your own badges';
  end if;

  if v_badge.audience <> 'participant' then
    raise exception 'award_creator_badge: badge must have audience = participant';
  end if;

  if v_badge.is_monthly or not v_badge.is_event_based then
    raise exception 'award_creator_badge: badge must be a permanent event-based badge';
  end if;

  if not v_badge.is_active then
    raise exception 'award_creator_badge: badge is not active';
  end if;

  -- Validate target user and role (must not be a creator)
  select role
  into v_target_role
  from public.app_profile
  where id = p_target_user_id;

  if not found then
    raise exception 'award_creator_badge: target user not found';
  end if;

  if v_target_role = 'creator' then
    raise exception 'award_creator_badge: cannot award creator badges to creators (participants only)';
  end if;

  -- Idempotency: if this user already has this badge, return existing row
  select *
  into v_existing
  from public.app_user_badge ub
  where ub.user_id = p_target_user_id
    and ub.badge_id = p_badge_id
    and ub.revoked_at is null
  limit 1;

  if found then
    return v_existing;
  end if;

  -- Insert award (RLS policy will enforce all invariants)
  insert into public.app_user_badge (
    user_id,
    badge_id,
    awarded_at,
    awarded_by,
    context,
    is_permanent,
    visible_on_profile,
    pinned_on_profile,
    period
  )
  values (
    p_target_user_id,
    p_badge_id,
    now(),
    v_creator_id,
    '{}'::jsonb,
    true,     -- must match RLS policy
    true,
    false,
    null
  )
  returning * into v_award;

  return v_award;
end;
$$;


ALTER FUNCTION "public"."award_creator_badge"("p_badge_id" "uuid", "p_target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."build_transaction_row"("p_buyer_id" "uuid", "p_creator_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid", "p_type" "public"."payment_type", "p_currency" "text", "p_amount_gross_cents" bigint, "p_processing_fee_fixed_cents" bigint, "p_processing_fee_percent_cents" bigint) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with calc as (
    select
      p_amount_gross_cents                                         as amount_gross_cents,
      p_processing_fee_fixed_cents                                 as processing_fee_fixed_cents,
      p_processing_fee_percent_cents                               as processing_fee_percent_cents,

      /* platform 20% of sticker (floor for creator, ceil for platform so sum = gross) */
      floor(p_amount_gross_cents * 80 / 100.0)::bigint             as creator_cut_cents,
      ceil (p_amount_gross_cents * 20 / 100.0)::bigint             as platform_cut_cents,

      /* gross minus Stripe fees (for reporting / sanity only) */
      (
        p_amount_gross_cents
        - (p_processing_fee_fixed_cents + p_processing_fee_percent_cents)
      )::bigint                                                    as amount_after_stripe_cents
  )
  select jsonb_build_object(
    'buyer_id',                         p_buyer_id,
    'creator_id',                       p_creator_id,
    'session_id',                       p_session_id,
    'challenge_id',                     p_challenge_id,
    'type',                             p_type::text,
    'status',                           'succeeded',
    'quantity',                         1,
    'provider',                         'stripe',
    'currency',                         p_currency,
    'amount_gross_cents',               calc.amount_gross_cents,
    'processing_fee_fixed_cents',       calc.processing_fee_fixed_cents,
    'processing_fee_percent_cents',     calc.processing_fee_percent_cents,
    'platform_cut_cents',               calc.platform_cut_cents,
    'creator_cut_cents',                calc.creator_cut_cents,
    'amount_after_stripe_cents',        calc.amount_after_stripe_cents
  )
  from calc;
$$;


ALTER FUNCTION "public"."build_transaction_row"("p_buyer_id" "uuid", "p_creator_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid", "p_type" "public"."payment_type", "p_currency" "text", "p_amount_gross_cents" bigint, "p_processing_fee_fixed_cents" bigint, "p_processing_fee_percent_cents" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_challenge_space"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    with target as (
        select
            s.continuation_group_id,
            s.source_challenge_id
        from public.app_challenge_space s
        where s.id = p_space
    )
    select
        public.is_challenge_space_admin(p_space, p_user)
        or exists (
            select 1
            from target t
            join public.app_transaction tx
              on tx.buyer_id = p_user
             and tx.status = 'succeeded'
             and tx.type = 'bundle'
            where (
                t.source_challenge_id is not null
                and tx.challenge_id = t.source_challenge_id
            )
            or (
                t.continuation_group_id is not null
                and exists (
                    select 1
                    from public.app_challenge c
                    where c.id = tx.challenge_id
                      and c.continuation_group_id = t.continuation_group_id
                )
            )
        );
$$;


ALTER FUNCTION "public"."can_access_challenge_space"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_creator_space"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select
        public.is_creator_space_owner(p_space, p_user)
        or public.is_creator_space_member(p_space, p_user)
        or exists (
            select 1
            from public.app_creator_space s
            where s.id = p_space
              and public.has_creator_participation(s.creator_id, p_user)
        );
$$;


ALTER FUNCTION "public"."can_access_creator_space"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_interact_creator_space"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select
        public.is_creator_space_owner(p_space, p_user)
        or public.is_creator_space_member(p_space, p_user);
$$;


ALTER FUNCTION "public"."can_interact_creator_space"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_join_challenge"("p_user" "uuid", "p_challenge" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  result boolean;
begin
  /* SECURITY DEFINER is enough to avoid RLS loops if the owner is table owner */
  select
    exists (
      select 1
      from public.app_transaction t
      where t.buyer_id = p_user
        and t.challenge_id = p_challenge
        and t.type = 'bundle'::payment_type
        and t.status = 'succeeded'
    )
    or
    exists (
      select 1
      from public.app_user_subscription s
      join public.app_subscription_inclusion i
        on i.plan_id = s.plan_id
       and i.challenge_id = p_challenge
      where s.user_id = p_user
        and s.status in ('active','trialing')
        and (s.current_period_end is null or s.current_period_end > now())
    )
  into result;

  return coalesce(result, false);
end;
$$;


ALTER FUNCTION "public"."can_join_challenge"("p_user" "uuid", "p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_join_session"("p_user" "uuid", "p_session" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with
  is_host as (
    select 1
    from public.app_session s
    where s.id = p_session
      and s.host_id = p_user
    limit 1
  ),
  is_cohost as (
    select 1
    from public.app_session_cohost sc
    where sc.session_id = p_session
      and sc.cohost_id = p_user
    limit 1
  ),
  has_attendance as (
    select 1
    from public.app_attendance a
    where a.session_id = p_session
      and a.user_id = p_user
    limit 1
  )
  select exists(select 1 from is_host)
      or exists(select 1 from is_cohost)
      or exists(select 1 from has_attendance);
$$;


ALTER FUNCTION "public"."can_join_session"("p_user" "uuid", "p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_post_in_challenge_space"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    with target as (
        select
            s.continuation_group_id,
            s.source_challenge_id
        from public.app_challenge_space s
        where s.id = p_space
    ),
    active_target as (
        select
            case
                when t.continuation_group_id is not null
                    then public.current_active_challenge_in_group(t.continuation_group_id)
                else t.source_challenge_id
            end as challenge_id
        from target t
    )
    select
        public.is_challenge_space_admin(p_space, p_user)
        or exists (
            select 1
            from active_target a
            join public.app_transaction tx
              on tx.challenge_id = a.challenge_id
            where tx.buyer_id = p_user
              and tx.status = 'succeeded'
              and tx.type = 'bundle'
        );
$$;


ALTER FUNCTION "public"."can_post_in_challenge_space"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_post_in_creator_space"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select public.is_creator_space_owner(p_space, p_user);
$$;


ALTER FUNCTION "public"."can_post_in_creator_space"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_profile"("p_profile_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
  select exists (
    select 1
    from public.app_profile p
    where p.id = p_profile_id
      and (
        p.visibility = 'public'
        or p.id = auth.uid()
      )
  );
$$;


ALTER FUNCTION "public"."can_view_profile"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."challenge_add_session"("p_challenge" "uuid", "p_session" "uuid") RETURNS "public"."app_challenge_session"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_contract_id uuid;
  v_session_host uuid;
  v_session_status text;
  v_is_challenge_cohost boolean;
  v_row public.app_challenge_session%rowtype;
begin
  if v_actor is null then
    raise exception 'Unauthorized';
  end if;

  select
      c.owner_id,
      c.status,
      c.contract_id
  into
      v_owner,
      v_status,
      v_contract_id
  from public.app_challenge c
  where c.id = p_challenge;

  if v_owner is null then
    raise exception 'Challenge not found';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft challenges can be edited';
  end if;

  if v_contract_id is not null then
    raise exception 'Challenge is locked; unlock before editing draft structure';
  end if;

  select
      s.host_id,
      s.status
  into
      v_session_host,
      v_session_status
  from public.app_session s
  where s.id = p_session;

  if v_session_host is null then
    raise exception 'Session not found';
  end if;

  if v_session_status <> 'draft' then
    raise exception 'Only draft sessions can be linked to a draft challenge';
  end if;

  if v_actor <> v_owner then
    select exists (
      select 1
      from public.app_challenge_cohost ch
      where ch.challenge_id = p_challenge
        and ch.cohost_id = v_actor
    )
    into v_is_challenge_cohost;

    if not v_is_challenge_cohost then
      raise exception 'Forbidden: only challenge owner or listed challenge cohost may link sessions';
    end if;

    if v_session_host <> v_actor then
      raise exception 'Challenge cohost may only link draft sessions they host';
    end if;
  end if;

  perform set_config('app.via_rpc', '1', true);

  insert into public.app_challenge_session (challenge_id, session_id)
  values (p_challenge, p_session)
  on conflict do nothing
  returning * into v_row;

  if v_row.challenge_id is null then
    select *
    into v_row
    from public.app_challenge_session cs
    where cs.challenge_id = p_challenge
      and cs.session_id = p_session;
  end if;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."challenge_add_session"("p_challenge" "uuid", "p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."challenge_can_publish"("p_challenge" "uuid", "p_caller" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  issues text[] := array[]::text[];

  v_owner uuid;
  v_status text;
  v_start_date date;
  v_price int;
  v_session_count int;
  v_total_split int;
  v_orphan_cohosts int;

  v_contract_id uuid;
  v_contract_target_type text;
  v_contract_target_id uuid;
  v_contract_locked_at timestamptz;

  v_required_cohost_count int;
  v_accepted_cohost_count int;
  v_decline_count int;
begin
  select
    owner_id,
    status,
    start_date,
    price_cents,
    contract_id
  into
    v_owner,
    v_status,
    v_start_date,
    v_price,
    v_contract_id
  from public.app_challenge
  where id = p_challenge;

  if v_owner is null then
    issues := issues || array['challenge_not_found'];
    return issues;
  end if;

  if v_owner <> p_caller then
    issues := issues || array['only_owner_can_publish'];
  end if;

  if v_status <> 'draft' then
    issues := issues || array[format('status_must_be_draft_current=%s', v_status)];
  end if;

  if v_start_date is null then
    issues := issues || array['start_date_missing'];
  elsif v_start_date < current_date then
    issues := issues || array['start_date_cannot_be_past'];
  end if;

  if coalesce(v_price, 0) <= 0 then
    issues := issues || array['price_must_be_positive'];
  end if;

  select count(*)
  into v_session_count
  from public.app_challenge_session cs
  where cs.challenge_id = p_challenge;

  if v_session_count < 3 then
    issues := issues || array['not_enough_sessions_min_3'];
  end if;

  -- Count cohosts early — needed for SR-C8 solo bypass
  select count(*)
  into v_required_cohost_count
  from public.app_challenge_cohost ch
  where ch.challenge_id = p_challenge;

  select coalesce(sum(split_percent), 0)
  into v_total_split
  from public.app_challenge_cohost
  where challenge_id = p_challenge;

  if v_total_split > 100 then
    issues := issues || array[format('cohost_split_exceeds_100_total=%s', v_total_split)];
  end if;

  select count(*)
  into v_orphan_cohosts
  from public.app_challenge_cohost ch
  where ch.challenge_id = p_challenge
    and not exists (
      select 1
      from public.app_challenge_session cs
      join public.app_session s
        on s.id = cs.session_id
      where cs.challenge_id = p_challenge
        and (
          public.is_session_host(s.id, ch.cohost_id)
          or exists (
            select 1
            from public.app_session_cohost sc
            where sc.session_id = s.id
              and sc.cohost_id = ch.cohost_id
          )
        )
    );

  if v_orphan_cohosts > 0 then
    issues := issues || array['cohost_without_session'];
  end if;

  -- SR-C8: Solo challenges (no cohosts) bypass contract checks entirely
  if v_required_cohost_count > 0 then
    -- Contract-lifecycle gate for collaborative challenge publication
    if v_contract_id is null then
      issues := issues || array['contract_id_missing'];
      return issues;
    end if;

    select
      c.target_type,
      c.target_id,
      c.locked_at
    into
      v_contract_target_type,
      v_contract_target_id,
      v_contract_locked_at
    from public.app_collaboration_contract c
    where c.id = v_contract_id;

    if v_contract_target_type is null then
      issues := issues || array['bound_contract_not_found'];
      return issues;
    end if;

    if v_contract_target_type <> 'challenge'
       or v_contract_target_id is distinct from p_challenge then
      issues := issues || array['bound_contract_target_mismatch'];
    end if;

    if v_contract_locked_at is null then
      issues := issues || array['bound_contract_not_locked'];
    end if;

    select count(*)
    into v_decline_count
    from public.app_collaboration_decline d
    where d.contract_id = v_contract_id;

    if v_decline_count > 0 then
      issues := issues || array['contract_has_decline'];
    end if;

    select count(distinct a.cohost_id)
    into v_accepted_cohost_count
    from public.app_collaboration_acceptance a
    join public.app_challenge_cohost ch
      on ch.cohost_id = a.cohost_id
     and ch.challenge_id = p_challenge
    where a.contract_id = v_contract_id;

    if coalesce(v_accepted_cohost_count, 0) <> v_required_cohost_count then
      issues := issues || array['challenge_cohosts_not_all_accepted_bound_contract'];
    end if;
  end if;
  -- End contract checks

  return issues;
end;
$$;


ALTER FUNCTION "public"."challenge_can_publish"("p_challenge" "uuid", "p_caller" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."challenge_has_purchases"("p_challenge" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1 from public.app_transaction t
    where t.challenge_id = p_challenge and t.status='succeeded'
  );
$$;


ALTER FUNCTION "public"."challenge_has_purchases"("p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."challenge_remove_session"("p_challenge" "uuid", "p_session" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_contract_id uuid;
  v_session_host uuid;
  v_link_exists boolean;
  v_is_challenge_cohost boolean;
begin
  if v_actor is null then
    raise exception 'Unauthorized';
  end if;

  select
      c.owner_id,
      c.status,
      c.contract_id
  into
      v_owner,
      v_status,
      v_contract_id
  from public.app_challenge c
  where c.id = p_challenge;

  if v_owner is null then
    raise exception 'Challenge not found';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft challenges can be edited';
  end if;

  if v_contract_id is not null then
    raise exception 'Challenge is locked; unlock before editing draft structure';
  end if;

  select exists (
    select 1
    from public.app_challenge_session cs
    where cs.challenge_id = p_challenge
      and cs.session_id = p_session
  )
  into v_link_exists;

  if not v_link_exists then
    raise exception 'Challenge-session link not found';
  end if;

  select s.host_id
  into v_session_host
  from public.app_session s
  where s.id = p_session;

  if v_session_host is null then
    raise exception 'Session not found';
  end if;

  if v_actor <> v_owner then
    select exists (
      select 1
      from public.app_challenge_cohost ch
      where ch.challenge_id = p_challenge
        and ch.cohost_id = v_actor
    )
    into v_is_challenge_cohost;

    if not v_is_challenge_cohost then
      raise exception 'Forbidden: only challenge owner or listed challenge cohost may unlink sessions';
    end if;

    if v_session_host <> v_actor then
      raise exception 'Challenge cohost may only unlink sessions they host';
    end if;
  end if;

  perform set_config('app.via_rpc', '1', true);

  delete from public.app_challenge_session
  where challenge_id = p_challenge
    and session_id = p_session;
end;
$$;


ALTER FUNCTION "public"."challenge_remove_session"("p_challenge" "uuid", "p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."challenge_remove_session_and_delete"("p_challenge" "uuid", "p_session" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_contract_id uuid;
  v_session_host uuid;
  v_session_status text;
  v_is_challenge_cohost boolean;
begin
  if v_actor is null then
    raise exception 'Unauthorized';
  end if;

  select c.owner_id, c.status, c.contract_id
  into v_owner, v_status, v_contract_id
  from public.app_challenge c
  where c.id = p_challenge;

  if v_owner is null then
    raise exception 'Challenge not found';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft challenges can be edited';
  end if;

  if v_contract_id is not null then
    raise exception 'Challenge is locked; unlock before editing';
  end if;

  select s.host_id, s.status into v_session_host, v_session_status
  from public.app_session s where s.id = p_session;

  if v_session_host is null then
    raise exception 'Session not found';
  end if;

  -- Authorization: actor must be challenge owner OR the session host
  if v_actor <> v_owner and v_actor <> v_session_host then
    raise exception 'Only the challenge owner or the session host can remove this session';
  end if;

  -- Set via_rpc flag so the guard trigger allows the operations
  perform set_config('app.via_rpc', '1', true);

  -- Unlink from challenge
  delete from public.app_challenge_session
  where challenge_id = p_challenge and session_id = p_session;

  -- Delete the session row (must be draft; deletes regardless of who hosts since
  -- we already authorized above and the session is fully unlinked)
  delete from public.app_session
  where id = p_session and status = 'draft';
end;
$$;


ALTER FUNCTION "public"."challenge_remove_session_and_delete"("p_challenge" "uuid", "p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."challenge_spots_left"("p_challenge" "uuid") RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT CASE WHEN c.capacity IS NULL THEN NULL
    ELSE greatest(c.capacity - (
      SELECT count(DISTINCT t.buyer_id) FROM public.app_transaction t
      WHERE t.challenge_id = c.id AND t.status = 'succeeded'
    ), 0)
  END FROM public.app_challenge c WHERE c.id = p_challenge;
$$;


ALTER FUNCTION "public"."challenge_spots_left"("p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."collab_had_shared_work"("p_reviewer" "uuid", "p_subject" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_challenge c
    where c.status = 'published'
      and public.is_in_challenge(c.id, p_reviewer)
      and public.is_in_challenge(c.id, p_subject)
  );
$$;


ALTER FUNCTION "public"."collab_had_shared_work"("p_reviewer" "uuid", "p_subject" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_collab_review" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "app_collab_review_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "chk_app_collab_review_rating_range" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."app_collab_review" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."collab_review_create"("p_challenge" "uuid", "p_subject" "uuid", "p_rating" integer, "p_comment" "text") RETURNS "public"."app_collab_review"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  v_row public.app_collab_review%rowtype;
begin
  -- RLS on app_collab_review enforces:
  -- - reviewer_id = auth.uid()
  -- - both users are creators
  -- - shared work + in challenge
  insert into public.app_collab_review
    (challenge_id, reviewer_id, subject_id, rating, comment)
  values
    (p_challenge, auth.uid(), p_subject, p_rating, p_comment)
  on conflict (challenge_id, reviewer_id, subject_id) do update
    set rating     = excluded.rating,
        comment    = excluded.comment,
        updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."collab_review_create"("p_challenge" "uuid", "p_subject" "uuid", "p_rating" integer, "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."collab_review_delete"("p_review_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  DELETE FROM public.app_collab_review r
   WHERE r.id = p_review_id
     AND r.reviewer_id = auth.uid()
     AND now() - r.created_at <= interval '15 minutes';
$$;


ALTER FUNCTION "public"."collab_review_delete"("p_review_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."collab_review_update"("p_review_id" "uuid", "p_rating" integer, "p_comment" "text") RETURNS "public"."app_collab_review"
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  UPDATE public.app_collab_review r
     SET rating  = COALESCE(p_rating,  r.rating),
         comment = COALESCE(p_comment, r.comment)
   WHERE r.id = p_review_id
     AND r.reviewer_id = auth.uid()
     AND now() - r.created_at <= interval '24 hours'
  RETURNING *;
$$;


ALTER FUNCTION "public"."collab_review_update"("p_review_id" "uuid", "p_rating" integer, "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."collab_reviews_for_creator"("p_subject" "uuid", "p_limit" integer DEFAULT 20, "p_after" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS SETOF "public"."app_collab_review"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select *
  from public.app_collab_review r
  where r.subject_id = p_subject
    and (p_after is null or r.created_at < p_after)
  order by r.created_at desc
  limit greatest(1, least(coalesce(p_limit,20), 100));
$$;


ALTER FUNCTION "public"."collab_reviews_for_creator"("p_subject" "uuid", "p_limit" integer, "p_after" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_challenge_comment"("p_post" "uuid", "p_body" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_comment_id uuid;
  v_space_id uuid;
  v_post_kind text;
  v_post_directed_to uuid[];
  v_post_author uuid;
  v_already_promoted boolean;
  v_should_promote boolean := false;
  v_challenge_id uuid;
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_post is null then raise exception 'post_id is required'; end if;
  if coalesce(btrim(p_body), '') = '' then raise exception 'body is required'; end if;

  select p.space_id, p.kind, p.directed_to, p.author_id
  into v_space_id, v_post_kind, v_post_directed_to, v_post_author
  from public.app_challenge_post p
  where p.id = p_post;

  if v_space_id is null then raise exception 'Challenge post not found'; end if;
  if not public.can_access_challenge_space(v_space_id, v_actor) then
    raise exception 'Forbidden: you may not comment in this challenge space';
  end if;

  if v_post_kind = 'question'
     and v_post_directed_to is not null
     and v_actor = any(v_post_directed_to) then
    select exists (
      select 1 from public.app_challenge_comment c
      where c.post_id = p_post
        and c.author_id = v_actor
        and c.is_coach_answer = true
    ) into v_already_promoted;
    v_should_promote := not v_already_promoted;
  end if;

  insert into public.app_challenge_comment (post_id, author_id, body, is_coach_answer)
  values (p_post, v_actor, btrim(p_body), v_should_promote)
  returning id into v_comment_id;

  if v_should_promote then
    select cs.source_challenge_id into v_challenge_id
    from public.app_challenge_space cs
    where cs.id = v_space_id;

    insert into public.app_notification (recipient_id, type, payload)
    values (
      v_post_author,
      'coach_answered_your_question',
      jsonb_build_object(
        'post_id', p_post,
        'comment_id', v_comment_id,
        'answerer_id', v_actor,
        'challenge_id', v_challenge_id
      )
    )
    on conflict do nothing;
  end if;

  return v_comment_id;
end;
$$;


ALTER FUNCTION "public"."create_challenge_comment"("p_post" "uuid", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_challenge_continuation_draft"("p_source_challenge" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_source public.app_challenge%rowtype;
    v_group_id uuid;
    v_new_challenge_id uuid;

    v_item record;
    v_new_session_id uuid;
    v_shift_days integer;
    v_new_start_time timestamptz;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_source_challenge is null then
        raise exception 'source_challenge is required';
    end if;

    if p_start_date is null or p_end_date is null then
        raise exception 'start_date and end_date are required';
    end if;

    if p_end_date < p_start_date then
        raise exception 'end_date must be on or after start_date';
    end if;

    select *
    into v_source
    from public.app_challenge
    where id = p_source_challenge;

    if v_source.id is null then
        raise exception 'Source challenge not found';
    end if;

    if v_source.owner_id <> v_actor then
        raise exception 'Only the challenge owner may create a continuation draft';
    end if;

    v_group_id := coalesce(v_source.continuation_group_id, gen_random_uuid());

    update public.app_challenge
    set continuation_group_id = v_group_id
    where id = v_source.id
      and continuation_group_id is null;

    insert into public.app_challenge (
        title,
        description,
        start_date,
        end_date,
        owner_id,
        price_cents,
        currency,
        status,
        capacity,
        config,
        continuation_group_id,
        continued_from_challenge_id
    )
    values (
        v_source.title,
        v_source.description,
        p_start_date,
        p_end_date,
        v_source.owner_id,
        v_source.price_cents,
        v_source.currency,
        'draft',
        v_source.capacity,
        v_source.config,
        v_group_id,
        v_source.id
    )
    returning id into v_new_challenge_id;

    for v_item in
        select
            s.*
        from public.app_challenge_session cs
        join public.app_session s
          on s.id = cs.session_id
        where cs.challenge_id = v_source.id
        order by s.start_time asc, s.created_at asc, s.id asc
    loop
        v_shift_days := greatest(
            (v_item.start_time::date - v_source.start_date),
            0
        );

        v_new_start_time :=
            (
                p_start_date
                + v_shift_days
                + (v_item.start_time::time)
            )::timestamptz;

        insert into public.app_session (
            title,
            description,
            start_time,
            duration_minutes,
            capacity,
            price_cents,
            currency,
            host_id,
            status,
            live_provider,
            config,
            continuation_group_id,
            continued_from_session_id
        )
        values (
            v_item.title,
            v_item.description,
            v_new_start_time,
            v_item.duration_minutes,
            v_item.capacity,
            v_item.price_cents,
            v_item.currency,
            v_actor,
            'draft',
            v_item.live_provider,
            v_item.config,
            coalesce(v_item.continuation_group_id, gen_random_uuid()),
            v_item.id
        )
        returning id into v_new_session_id;

        update public.app_session
        set continuation_group_id = (
            select continuation_group_id
            from public.app_session
            where id = v_new_session_id
        )
        where id = v_item.id
          and continuation_group_id is null;

        perform set_config('app.via_rpc', '1', true);

        insert into public.app_challenge_session (challenge_id, session_id)
        values (v_new_challenge_id, v_new_session_id);
    end loop;

    return v_new_challenge_id;
end;
$$;


ALTER FUNCTION "public"."create_challenge_continuation_draft"("p_source_challenge" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_challenge_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text" DEFAULT NULL::"text", "p_kind" "text" DEFAULT 'talk'::"text", "p_context_type" "text" DEFAULT NULL::"text", "p_context_id" "uuid" DEFAULT NULL::"uuid", "p_directed_to" "uuid"[] DEFAULT NULL::"uuid"[], "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_post_id uuid;
  v_challenge_id uuid;
  v_recipient uuid;
begin
  if v_actor is null then
    raise exception 'Unauthorized';
  end if;
  if p_space is null then
    raise exception 'space_id is required';
  end if;
  if coalesce(btrim(p_body), '') = '' and p_kind not in ('intro_private') then
    raise exception 'body is required';
  end if;
  if p_kind not in ('talk','intro','intro_private','reflection','question') then
    raise exception 'invalid kind';
  end if;

  select source_challenge_id into v_challenge_id
  from public.app_challenge_space
  where id = p_space;
  if v_challenge_id is null then
    raise exception 'Challenge space not found';
  end if;

  if not public.can_post_in_challenge_space(p_space, v_actor) then
    raise exception 'Forbidden: you may not post in this challenge space';
  end if;

  -- Question posts: directed_to required, must reference collaborators only.
  if p_kind = 'question' then
    if p_directed_to is null or array_length(p_directed_to, 1) is null then
      raise exception 'questions must tag at least one collaborator';
    end if;
    if v_actor = any(p_directed_to) then
      raise exception 'cannot tag yourself';
    end if;
    if exists (
      select unnest as u from unnest(p_directed_to) where not (
        exists (select 1 from public.app_challenge c
                where c.id = v_challenge_id and c.owner_id = unnest)
        or exists (select 1 from public.app_challenge_cohost ch
                   where ch.challenge_id = v_challenge_id and ch.cohost_id = unnest)
      )
    ) then
      raise exception 'directed_to must reference creators on this challenge only';
    end if;
  elsif p_directed_to is not null and array_length(p_directed_to, 1) > 0 then
    raise exception 'directed_to is only valid for question posts';
  end if;

  if p_kind = 'reflection' then
    if p_context_type is distinct from 'session' or p_context_id is null then
      raise exception 'reflection requires context_type=session and context_id';
    end if;
  end if;

  if p_kind in ('intro','intro_private') then
    if exists (
      select 1 from public.app_challenge_post p
      where p.space_id = p_space
        and p.author_id = v_actor
        and p.kind in ('intro','intro_private')
    ) then
      raise exception 'intro already posted for this challenge';
    end if;
  end if;

  insert into public.app_challenge_post (
    space_id, author_id, body, media_url,
    kind, context_type, context_id, directed_to, metadata
  ) values (
    p_space,
    v_actor,
    coalesce(btrim(p_body), ''),
    nullif(btrim(p_media_url), ''),
    p_kind,
    p_context_type,
    p_context_id,
    p_directed_to,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_post_id;

  if p_kind = 'question' then
    foreach v_recipient in array p_directed_to loop
      insert into public.app_notification (recipient_id, type, payload)
      values (
        v_recipient,
        'question_for_you',
        jsonb_build_object(
          'post_id', v_post_id,
          'asker_id', v_actor,
          'challenge_id', v_challenge_id
        )
      )
      on conflict do nothing;
    end loop;
  end if;

  return v_post_id;
end;
$$;


ALTER FUNCTION "public"."create_challenge_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_kind" "text", "p_context_type" "text", "p_context_id" "uuid", "p_directed_to" "uuid"[], "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_challenge_session"("p_challenge_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_duration_minutes" integer DEFAULT 60, "p_price_cents" integer DEFAULT 0, "p_currency" "text" DEFAULT 'CHF'::"text") RETURNS TABLE("session_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_contract_id uuid;
  v_is_challenge_cohost boolean;
begin
  if v_actor is null then
    raise exception 'Unauthorized';
  end if;

  select
      c.owner_id,
      c.status,
      c.contract_id
  into
      v_owner,
      v_status,
      v_contract_id
  from public.app_challenge c
  where c.id = p_challenge_id;

  if v_owner is null then
    raise exception 'Challenge not found';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft challenges can accept new linked sessions';
  end if;

  if v_contract_id is not null then
    raise exception 'Challenge is locked; unlock before editing draft structure';
  end if;

  select exists (
    select 1
    from public.app_challenge_cohost ch
    where ch.challenge_id = p_challenge_id
      and ch.cohost_id = v_actor
  )
  into v_is_challenge_cohost;

  if not (v_actor = v_owner or v_is_challenge_cohost) then
    raise exception 'Forbidden: only challenge owner or listed challenge cohost may create linked sessions';
  end if;

  insert into public.app_session (
      host_id,
      title,
      status,
      start_time,
      duration_minutes,
      price_cents,
      currency
  )
  values (
      v_actor,
      p_title,
      'draft',
      p_start_time,
      p_duration_minutes,
      p_price_cents,
      p_currency
  )
  returning id into session_id;

  perform set_config('app.via_rpc', '1', true);

  insert into public.app_challenge_session (challenge_id, session_id)
  values (p_challenge_id, session_id);

  return next;
end;
$$;


ALTER FUNCTION "public"."create_challenge_session"("p_challenge_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_duration_minutes" integer, "p_price_cents" integer, "p_currency" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_badge" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "audience" "text" NOT NULL,
    "source" "text" NOT NULL,
    "tier" "text" NOT NULL,
    "is_event_based" boolean DEFAULT false NOT NULL,
    "is_monthly" boolean DEFAULT false NOT NULL,
    "is_auto_awarded" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "color_hex" "text",
    "icon" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_badge_audience_check" CHECK (("audience" = ANY (ARRAY['participant'::"text", 'creator'::"text", 'both'::"text"]))),
    CONSTRAINT "app_badge_source_check" CHECK (("source" = ANY (ARRAY['system'::"text", 'creator_defined'::"text"]))),
    CONSTRAINT "app_badge_tier_check" CHECK (("tier" = ANY (ARRAY['common'::"text", 'advanced'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text", 'seasonal'::"text"])))
);


ALTER TABLE "public"."app_badge" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_badge" IS 'Catalog of all badge types (system + creator-defined). Each row defines behavior and visual attributes, not a specific award instance.';



COMMENT ON COLUMN "public"."app_badge"."slug" IS 'Canonical identifier, e.g. system:first_session_attended or creator:custom:xyz. Must be unique.';



CREATE OR REPLACE FUNCTION "public"."create_creator_badge"("p_label" "text", "p_description" "text", "p_color_hex" "text" DEFAULT NULL::"text", "p_icon" "text" DEFAULT NULL::"text") RETURNS "public"."app_badge"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid   uuid;
  v_role  text;
  v_slug  text;
  v_badge public.app_badge;
begin
  -- Auth check
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'create_creator_badge: not authenticated';
  end if;

  -- Must be a creator
  select role into v_role
  from public.app_profile
  where id = v_uid;

  if v_role is distinct from 'creator' then
    raise exception 'create_creator_badge: only creators can create badges';
  end if;

  -- Basic validation
  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'create_creator_badge: label is required';
  end if;

  -- Generate a namespaced slug:
  -- creator:<creatorid_no_dashes>:<sanitized_label>_<random>
  v_slug :=
    'creator:' ||
    replace(v_uid::text, '-', '') || ':' ||
    regexp_replace(lower(trim(p_label)), '[^a-z0-9]+', '_', 'g') ||
    '_' ||
    substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);

  -- Insert badge (will be checked again by RLS policy)
  insert into public.app_badge (
    slug,
    label,
    description,
    audience,
    source,
    tier,
    is_event_based,
    is_monthly,
    is_auto_awarded,
    is_active,
    color_hex,
    icon,
    created_by
  )
  values (
    v_slug,
    p_label,
    p_description,
    'participant',
    'creator_defined',
    'common',
    true,
    false,
    false,
    true,
    p_color_hex,
    p_icon,
    v_uid
  )
  returning * into v_badge;

  return v_badge;
end;
$$;


ALTER FUNCTION "public"."create_creator_badge"("p_label" "text", "p_description" "text", "p_color_hex" "text", "p_icon" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_badge_trigger" (
    "id" bigint NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "trigger_type" "text" NOT NULL,
    "params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "creator_badge_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['first_session_with_creator'::"text", 'nth_session_with_creator'::"text", 'challenge_completion'::"text", 'top_attendance_in_challenge'::"text"])))
);


ALTER TABLE "public"."app_creator_badge_trigger" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_creator_badge_trigger" IS 'Defines auto-award triggers for creator-defined badges.';



CREATE OR REPLACE FUNCTION "public"."create_creator_badge_trigger"("p_badge_id" "uuid", "p_trigger_type" "text", "p_params" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."app_creator_badge_trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid   uuid;
  v_badge public.app_badge;
  v_row   public.app_creator_badge_trigger;
begin
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- verify badge exists and belongs to creator
  select *
  into v_badge
  from public.app_badge
  where id = p_badge_id;

  if not found then
    raise exception 'badge not found';
  end if;

  if v_badge.source <> 'creator_defined'
     or v_badge.created_by <> v_uid then
    raise exception 'you may only attach triggers to your own creator-defined badges';
  end if;

  -- insert
  insert into public.app_creator_badge_trigger (
    badge_id,
    creator_id,
    trigger_type,
    params
  )
  values (
    p_badge_id,
    v_uid,
    p_trigger_type,
    coalesce(p_params, '{}'::jsonb)
  )
  returning * into v_row;

  return v_row;
end;
$$;


ALTER FUNCTION "public"."create_creator_badge_trigger"("p_badge_id" "uuid", "p_trigger_type" "text", "p_params" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_creator_comment"("p_post" "uuid", "p_body" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_comment_id uuid;
    v_space_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_post is null then
        raise exception 'post_id is required';
    end if;

    if coalesce(btrim(p_body), '') = '' then
        raise exception 'body is required';
    end if;

    select p.space_id
    into v_space_id
    from public.app_creator_post p
    where p.id = p_post;

    if v_space_id is null then
        raise exception 'Creator post not found';
    end if;

    if not public.can_interact_creator_space(v_space_id, v_actor) then
        raise exception 'Forbidden: you may not comment in this creator tribe';
    end if;

    insert into public.app_creator_comment (
        post_id,
        author_id,
        body
    )
    values (
        p_post,
        v_actor,
        btrim(p_body)
    )
    returning id into v_comment_id;

    return v_comment_id;
end;
$$;


ALTER FUNCTION "public"."create_creator_comment"("p_post" "uuid", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_post_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_space is null then
        raise exception 'space_id is required';
    end if;

    if coalesce(btrim(p_body), '') = '' then
        raise exception 'body is required';
    end if;

    if not exists (
        select 1
        from public.app_creator_space s
        where s.id = p_space
    ) then
        raise exception 'Creator space not found';
    end if;

    if not public.can_post_in_creator_space(p_space, v_actor) then
        raise exception 'Forbidden: only creator may post in creator tribe';
    end if;

    insert into public.app_creator_post (
        space_id,
        author_id,
        body,
        media_url
    )
    values (
        p_space,
        v_actor,
        btrim(p_body),
        nullif(btrim(p_media_url), '')
    )
    returning id into v_post_id;

    return v_post_id;
end;
$$;


ALTER FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text" DEFAULT NULL::"text", "p_context_type" "text" DEFAULT NULL::"text", "p_context_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_post_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_space is null then
        raise exception 'space_id is required';
    end if;

    if coalesce(btrim(p_body), '') = '' then
        raise exception 'body is required';
    end if;

    if not exists (
        select 1 from public.app_creator_space s where s.id = p_space
    ) then
        raise exception 'Creator space not found';
    end if;

    if not public.can_post_in_creator_space(p_space, v_actor) then
        raise exception 'Forbidden: only creator may post in creator tribe';
    end if;

    -- Validate context if provided
    if p_context_type is not null then
        if p_context_type not in ('session', 'challenge') then
            raise exception 'Invalid context_type';
        end if;
        if p_context_id is null then
            raise exception 'context_id required when context_type is set';
        end if;
        if p_context_type = 'session' and not exists (
            select 1 from public.app_session where id = p_context_id and host_id = v_actor
        ) then
            raise exception 'Session not found or not owned';
        end if;
        if p_context_type = 'challenge' and not exists (
            select 1 from public.app_challenge where id = p_context_id and owner_id = v_actor
        ) then
            raise exception 'Challenge not found or not owned';
        end if;
    end if;

    insert into public.app_creator_post (
        space_id, author_id, body, media_url, context_type, context_id
    )
    values (
        p_space, v_actor, btrim(p_body), nullif(btrim(p_media_url), ''),
        p_context_type, p_context_id
    )
    returning id into v_post_id;

    return v_post_id;
end;
$$;


ALTER FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_context_type" "text", "p_context_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_session_continuation_draft"("p_source_session" "uuid", "p_start_time" timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_source public.app_session%rowtype;
    v_new_session_id uuid;
    v_group_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_source_session is null then
        raise exception 'source_session is required';
    end if;

    if p_start_time is null then
        raise exception 'start_time is required';
    end if;

    if p_start_time <= now() then
        raise exception 'start_time must be in the future';
    end if;

    select *
    into v_source
    from public.app_session
    where id = p_source_session;

    if v_source.id is null then
        raise exception 'Source session not found';
    end if;

    if v_source.host_id <> v_actor then
        raise exception 'Only the session host may create a continuation draft';
    end if;

    v_group_id := coalesce(v_source.continuation_group_id, gen_random_uuid());

    update public.app_session
    set continuation_group_id = v_group_id
    where id = v_source.id
      and continuation_group_id is null;

    insert into public.app_session (
        title,
        description,
        start_time,
        duration_minutes,
        capacity,
        price_cents,
        currency,
        host_id,
        status,
        live_provider,
        config,
        continuation_group_id,
        continued_from_session_id
    )
    values (
        v_source.title,
        v_source.description,
        p_start_time,
        v_source.duration_minutes,
        v_source.capacity,
        v_source.price_cents,
        v_source.currency,
        v_source.host_id,
        'draft',
        v_source.live_provider,
        v_source.config,
        v_group_id,
        v_source.id
    )
    returning id into v_new_session_id;

    return v_new_session_id;
end;
$$;


ALTER FUNCTION "public"."create_session_continuation_draft"("p_source_session" "uuid", "p_start_time" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."creator_collab_reputation"("p_subject" "uuid", "limit_recent" integer DEFAULT 3) RETURNS TABLE("subject_id" "uuid", "reviews_count" integer, "avg_rating" numeric, "last_reviewed_at" timestamp with time zone, "recent" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
begin
  if auth.uid() is null or not public.is_creator(auth.uid()) then
    raise exception 'forbidden: only creators can access collab reputation';
  end if;
  if p_subject is null or not public.is_creator(p_subject) then
    raise exception 'not_found: subject must be a creator';
  end if;

  return query
  with mine as (
    select
      acr.id,
      acr.reviewer_id,
      acr.subject_id,
      acr.rating,
      acr.comment,
      acr.created_at,
      acr.updated_at
    from public.app_collab_review as acr
    where acr.subject_id = p_subject
  ),
  agg as (
    select
      p_subject::uuid                     as subject_id_out,
      count(*)::int                       as reviews_count,
      round(avg(mine.rating)::numeric, 2) as avg_rating,
      max(mine.created_at)                as last_reviewed_at
    from mine
  ),
  recent as (
    select coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'id', id,
                 'reviewer_id', reviewer_id,
                 'rating', rating,
                 'comment', comment,
                 'created_at', created_at,
                 'updated_at', updated_at
               )
               order by created_at desc
             ),
             '[]'::jsonb
           ) as recent
    from (select * from mine order by created_at desc limit limit_recent) x
  )
  select
    a.subject_id_out                        as subject_id,
    coalesce(a.reviews_count, 0)            as reviews_count,
    coalesce(a.avg_rating, 0)::numeric(4,2) as avg_rating,
    a.last_reviewed_at,
    r.recent
  from agg a
  cross join recent r;
end;
$$;


ALTER FUNCTION "public"."creator_collab_reputation"("p_subject" "uuid", "limit_recent" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_active_challenge_in_group"("p_continuation_group" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    with candidates as (
        select c.id, c.start_date, c.end_date, c.published_at
        from public.app_challenge c
        where c.continuation_group_id = p_continuation_group
          and c.status = 'published'
    ),
    preferred as (
        select id
        from candidates
        where end_date >= current_date
        order by start_date desc, published_at desc nulls last, id desc
        limit 1
    ),
    fallback as (
        select id
        from candidates
        order by start_date desc, published_at desc nulls last, id desc
        limit 1
    )
    select coalesce(
        (select id from preferred),
        (select id from fallback)
    );
$$;


ALTER FUNCTION "public"."current_active_challenge_in_group"("p_continuation_group" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_mark_read"("p_conversation" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'unauthorized';
  end if;

  -- Update DM read marker for this user in this conversation
  update public.app_dm_member
     set last_read_at = now()
   where conversation_id = p_conversation
     and user_id        = v_user;

  -- Mark related DM notifications as read
  update public.app_notification
     set read_at = now()
   where recipient_id = v_user
     and type         = 'dm_new'
     and coalesce(payload->>'conversation_id','') = p_conversation::text
     and read_at is null;
end;
$$;


ALTER FUNCTION "public"."dm_mark_read"("p_conversation" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_send"("p_conversation_id" "uuid", "p_body" "text") RETURNS TABLE("id" "uuid", "conversation_id" "uuid", "author_id" "uuid", "body" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_author uuid := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub',
    null
  )::uuid;

  v_msg_id         uuid;
  v_msg_conv_id    uuid;
  v_msg_author_id  uuid;
  v_msg_body       text;
  v_msg_created_at timestamptz;
begin
  if v_author is null then
    raise exception 'Unauthorized';
  end if;

  -- Verify membership
  if not exists (
    select 1
    from public.app_dm_member mm
    where mm.conversation_id = p_conversation_id
      and mm.user_id = v_author
  ) then
    raise exception 'Forbidden (not a member of this conversation)';
  end if;

  -- Insert the message
  insert into public.app_dm_message (conversation_id, author_id, body)
  values (p_conversation_id, v_author, p_body)
  returning app_dm_message.id,
            app_dm_message.conversation_id,
            app_dm_message.author_id,
            app_dm_message.body,
            app_dm_message.created_at
  into v_msg_id, v_msg_conv_id, v_msg_author_id, v_msg_body, v_msg_created_at;

  -- Return the inserted message row
  id              := v_msg_id;
  conversation_id := v_msg_conv_id;
  author_id       := v_msg_author_id;
  body            := v_msg_body;
  created_at      := v_msg_created_at;
  return next;
end;
$$;


ALTER FUNCTION "public"."dm_send"("p_conversation_id" "uuid", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_start_or_get"("p_other_user" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  v_me   uuid := auth.uid();
  v_conv uuid;
begin
  if v_me is null then
    raise exception 'Unauthorized';
  end if;

  if p_other_user = v_me then
    raise exception 'Cannot DM yourself';
  end if;

  -- Find existing 1:1 conversation where both are members
  select c.id
    into v_conv
  from public.app_dm_conversation c
  join public.app_dm_member m1
    on m1.conversation_id = c.id
   and m1.user_id         = v_me
  join public.app_dm_member m2
    on m2.conversation_id = c.id
   and m2.user_id         = p_other_user
  where c.is_group = false
  limit 1;

  if v_conv is not null then
    return v_conv;
  end if;

  -- Create new conversation and two members (caller = owner)
  insert into public.app_dm_conversation (created_by, is_group)
  values (v_me, false)
  returning id into v_conv;

  insert into public.app_dm_member (conversation_id, user_id, role)
  values (v_conv, v_me, 'owner'),
         (v_conv, p_other_user, 'member')
  on conflict do nothing;

  return v_conv;
end;
$$;


ALTER FUNCTION "public"."dm_start_or_get"("p_other_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."edge_rate_limit_use"("p_fn" "text", "p_window_seconds" integer, "p_limit_per_user" integer, "p_limit_per_ip" integer, "p_user_id" "uuid", "p_ip" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_now   timestamptz := now();
  v_since timestamptz := v_now - make_interval(secs => greatest(p_window_seconds, 1));
  v_user_ct int := 0;
  v_ip_ct   int := 0;
begin
  -- Defensive clamps
  p_window_seconds := greatest(coalesce(p_window_seconds, 60), 1);
  p_limit_per_user := greatest(coalesce(p_limit_per_user, 5), 1);
  p_limit_per_ip   := greatest(coalesce(p_limit_per_ip, 20), 1);

  -- Count in window (user)
  if p_user_id is not null then
    select count(*) into v_user_ct
    from public.app_edge_call_log
    where fn = p_fn
      and user_id = p_user_id
      and created_at >= v_since;
    if v_user_ct >= p_limit_per_user then
      raise exception 'rate_limited_user';
    end if;
  end if;

  -- Count in window (ip)
  if p_ip is not null then
    select count(*) into v_ip_ct
    from public.app_edge_call_log
    where fn = p_fn
      and ip = p_ip
      and created_at >= v_since;
    if v_ip_ct >= p_limit_per_ip then
      raise exception 'rate_limited_ip';
    end if;
  end if;

  -- Record the call only if not limited
  insert into public.app_edge_call_log (fn, user_id, ip, created_at)
  values (p_fn, p_user_id, p_ip, v_now);
end;
$$;


ALTER FUNCTION "public"."edge_rate_limit_use"("p_fn" "text", "p_window_seconds" integer, "p_limit_per_user" integer, "p_limit_per_ip" integer, "p_user_id" "uuid", "p_ip" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_challenge_cohost_creator_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    if not public.is_creator_profile(new.cohost_id) then
        raise exception 'challenge cohost must be a creator profile: %', new.cohost_id
            using errcode = '23514';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_challenge_cohost_creator_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_challenge_split"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_total int;
begin
  select coalesce(sum(split_percent),0)
  into v_total
  from public.app_challenge_cohost
  where challenge_id = new.challenge_id;

  if v_total > 100 then
    raise exception 'Cohost split total % exceeds 100%% for challenge %', v_total, new.challenge_id;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."enforce_challenge_split"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_challenge_split_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_total int;
  v_challenge uuid;
begin
  -- handle DELETE where NEW is null
  v_challenge := coalesce(NEW.challenge_id, OLD.challenge_id);

  select coalesce(sum(split_percent),0)
  into v_total
  from public.app_challenge_cohost
  where challenge_id = v_challenge;

  if v_total > 100 then
    raise exception 'Cohost split exceeds 100%% for challenge % (total=%)', v_challenge, v_total
      using errcode = '23514';
  end if;

  return coalesce(NEW, OLD);
end; $$;


ALTER FUNCTION "public"."enforce_challenge_split_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_creator_contract_identity_creator_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    if not public.is_creator_profile(new.creator_id) then
        raise exception 'creator contract identity requires creator role: %', new.creator_id
            using errcode = '23514';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_creator_contract_identity_creator_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_profile_role_collaboration_integrity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    if old.role = 'creator' and new.role <> 'creator' then
        if exists (
            select 1
            from public.app_session_cohost sc
            where sc.cohost_id = new.id
        )
        or exists (
            select 1
            from public.app_challenge_cohost cc
            where cc.cohost_id = new.id
        )
        or exists (
            select 1
            from public.app_creator_contract_identity ci
            where ci.creator_id = new.id
        ) then
            raise exception 'cannot downgrade creator role while profile is referenced in collaboration surfaces: %', new.id
                using errcode = '23514';
        end if;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_profile_role_collaboration_integrity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_profile_role_immutable"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    if new.role is distinct from old.role then
        raise exception 'profile role is immutable once the account exists: %', new.id
            using errcode = '23514';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_profile_role_immutable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_session_cohost_creator_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
    if not public.is_creator_profile(new.cohost_id) then
        raise exception 'session cohost must be a creator profile: %', new.cohost_id
            using errcode = '23514';
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."enforce_session_cohost_creator_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_session_split"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_bundled boolean;
  v_total int;
BEGIN
  -- A session is "bundled" if it's linked to any challenge
  SELECT EXISTS (
    SELECT 1 FROM public.app_challenge_session WHERE session_id = NEW.session_id
  ) INTO v_is_bundled;

  IF v_is_bundled THEN
    -- Bundled sessions: split_percent is informational only, allow NULL or any value.
    -- Revenue is governed by the challenge contract. No validation needed here.
    RETURN NEW;
  END IF;

  -- Standalone sessions: enforce 1-99 per row + sum <= 100
  IF NEW.split_percent IS NULL OR NEW.split_percent < 1 OR NEW.split_percent > 99 THEN
    RAISE EXCEPTION 'Standalone session cohost split must be between 1 and 99 (got %)', NEW.split_percent
      USING errcode = '23514';
  END IF;

  SELECT coalesce(sum(split_percent), 0) INTO v_total
  FROM public.app_session_cohost
  WHERE session_id = NEW.session_id;

  IF v_total > 100 THEN
    RAISE EXCEPTION 'Cohost split total % exceeds 100%% for standalone session %', v_total, NEW.session_id
      USING errcode = '23514';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_session_split"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_session_split_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_bundled boolean;
  v_total int;
  v_session uuid := COALESCE(NEW.session_id, OLD.session_id);
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.app_challenge_session WHERE session_id = v_session
  ) INTO v_is_bundled;

  IF v_is_bundled THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT coalesce(sum(split_percent), 0) INTO v_total
  FROM public.app_session_cohost
  WHERE session_id = v_session;

  IF v_total > 100 THEN
    RAISE EXCEPTION 'Cohost split exceeds 100%% for standalone session % (total=%)', v_session, v_total
      USING errcode = '23514';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."enforce_session_split_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_tx_currency_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_session_curr   text;
  v_challenge_curr text;
begin
  -- If this is a session ticket, currency must match the session’s currency
  if NEW.session_id is not null and NEW.type = 'ticket' then
    select s.currency into v_session_curr
    from public.app_session s
    where s.id = NEW.session_id;

    if v_session_curr is null then
      raise exception 'Session % has no currency set', NEW.session_id;
    end if;

    if NEW.currency is distinct from v_session_curr then
      raise exception 'Transaction currency % must equal session % currency %',
        NEW.currency, NEW.session_id, v_session_curr;
    end if;
  end if;

  -- If this is a challenge bundle, currency must match the challenge’s currency
  if NEW.challenge_id is not null and NEW.type = 'bundle' then
    select c.currency into v_challenge_curr
    from public.app_challenge c
    where c.id = NEW.challenge_id;

    if v_challenge_curr is null then
      raise exception 'Challenge % has no currency set', NEW.challenge_id;
    end if;

    if NEW.currency is distinct from v_challenge_curr then
      raise exception 'Transaction currency % must equal challenge % currency %',
        NEW.currency, NEW.challenge_id, v_challenge_curr;
    end if;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."enforce_tx_currency_consistency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_challenge_space_for_published_challenge"("p_challenge" "uuid", "p_actor" "uuid", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_ownership_type" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_uid uuid := auth.uid();
    v_actor uuid := coalesce(v_uid, p_actor);

    v_challenge public.app_challenge%rowtype;
    v_existing_space_id uuid;
    v_space_id uuid;

    v_title_input text := nullif(btrim(p_title), '');
    v_description_input text := p_description;
    v_ownership_type_input text := nullif(btrim(p_ownership_type), '');

    v_title text;
    v_description text;
    v_ownership_type text;

    v_prev_challenge_id uuid;
    v_prev_space_id uuid;
begin
    if v_uid is not null and v_uid <> p_actor then
        raise exception 'caller_mismatch_auth_uid';
    end if;

    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_challenge is null then
        raise exception 'challenge_id is required';
    end if;

    select *
    into v_challenge
    from public.app_challenge
    where id = p_challenge;

    if v_challenge.id is null then
        raise exception 'Challenge not found';
    end if;

    if v_challenge.owner_id <> v_actor then
        raise exception 'Only the challenge owner may ensure challenge space';
    end if;

    if v_challenge.status <> 'published' then
        raise exception 'Challenge space can only be ensured for published challenges';
    end if;

    if v_ownership_type_input is not null
       and v_ownership_type_input not in ('solo', 'shared') then
        raise exception 'ownership_type must be solo or shared';
    end if;

    select s.id
    into v_existing_space_id
    from public.app_challenge_space s
    where s.source_challenge_id = v_challenge.id
    limit 1;

    if v_existing_space_id is not null then
        update public.app_challenge_space s
        set
            title = coalesce(v_title_input, s.title),
            description = coalesce(v_description_input, s.description),
            ownership_type = coalesce(v_ownership_type_input, s.ownership_type),
            continuation_group_id = coalesce(s.continuation_group_id, v_challenge.continuation_group_id),
            updated_at = now()
        where s.id = v_existing_space_id;

        return v_existing_space_id;
    end if;

    if v_challenge.continuation_group_id is not null then
        select c.continued_from_challenge_id
        into v_prev_challenge_id
        from public.app_challenge c
        where c.id = v_challenge.id;

        if v_prev_challenge_id is not null then
            select s.id
            into v_prev_space_id
            from public.app_challenge_space s
            where s.source_challenge_id = v_prev_challenge_id
               or s.continuation_group_id is not distinct from v_challenge.continuation_group_id
            order by s.created_at asc, s.id asc
            limit 1;

            if v_prev_space_id is not null then
                update public.app_challenge_space s
                set
                    continuation_group_id = coalesce(s.continuation_group_id, v_challenge.continuation_group_id),
                    title = coalesce(v_title_input, s.title),
                    description = coalesce(v_description_input, s.description),
                    ownership_type = coalesce(v_ownership_type_input, s.ownership_type),
                    updated_at = now()
                where s.id = v_prev_space_id;

                return v_prev_space_id;
            end if;
        end if;
    end if;

    v_title := coalesce(v_title_input, v_challenge.title);
    v_description := coalesce(v_description_input, v_challenge.description);
    v_ownership_type := coalesce(v_ownership_type_input, 'solo');

    insert into public.app_challenge_space (
        continuation_group_id,
        kind,
        title,
        description,
        ownership_type,
        owner_id,
        created_by,
        source_challenge_id
    )
    values (
        v_challenge.continuation_group_id,
        'challenge',
        v_title,
        v_description,
        v_ownership_type,
        v_challenge.owner_id,
        v_actor,
        v_challenge.id
    )
    returning id into v_space_id;

    return v_space_id;
end;
$$;


ALTER FUNCTION "public"."ensure_challenge_space_for_published_challenge"("p_challenge" "uuid", "p_actor" "uuid", "p_title" "text", "p_description" "text", "p_ownership_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_creator_space"("p_creator" "uuid", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_uid uuid := auth.uid();
    v_actor uuid := coalesce(v_uid, p_creator);

    v_space_id uuid;
    v_profile public.app_profile%rowtype;
    v_title text := nullif(btrim(p_title), '');
    v_description text := p_description;
begin
    if p_creator is null then
        raise exception 'creator_id is required';
    end if;

    if v_uid is not null and v_uid <> p_creator then
        raise exception 'caller_mismatch_auth_uid';
    end if;

    select *
    into v_profile
    from public.app_profile
    where id = p_creator;

    if v_profile.id is null then
        raise exception 'Creator not found';
    end if;

    select s.id
    into v_space_id
    from public.app_creator_space s
    where s.creator_id = p_creator
    limit 1;

    if v_space_id is not null then
        update public.app_creator_space s
        set
            title = coalesce(v_title, s.title),
            description = coalesce(v_description, s.description),
            updated_at = now()
        where s.id = v_space_id;

        return v_space_id;
    end if;

    insert into public.app_creator_space (
        creator_id,
        title,
        description
    )
    values (
        p_creator,
        coalesce(v_title, coalesce(v_profile.display_name, v_profile.full_name, v_profile.username, 'Creator Tribe')),
        v_description
    )
    returning id into v_space_id;

    return v_space_id;
end;
$$;


ALTER FUNCTION "public"."ensure_creator_space"("p_creator" "uuid", "p_title" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."f_check_creator_auto_badges_challenge_completion"("p_user_id" "uuid", "p_challenge_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_challenge public.app_challenge;
  v_trigger  record;
begin
  select *
  into v_challenge
  from public.app_challenge
  where id = p_challenge_id;

  if not found then
    return;
  end if;

  for v_trigger in
    select *
    from public.app_creator_badge_trigger
    where creator_id = v_challenge.owner_id
      and trigger_type = 'challenge_completion'
      and is_active
  loop
    perform public.admin_award_creator_badge(
      v_challenge.owner_id,
      v_trigger.badge_id,
      p_user_id
    );
  end loop;
end;
$$;


ALTER FUNCTION "public"."f_check_creator_auto_badges_challenge_completion"("p_user_id" "uuid", "p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."f_check_creator_auto_badges_for_attendance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_session       public.app_session;
  v_creator_id    uuid;
  v_count         int;
  v_trigger       record;
begin
  -- get session info
  select *
  into v_session
  from public.app_session
  where id = new.session_id;

  if not found then
    return new;
  end if;

  v_creator_id := v_session.host_id;

  -- loop all triggers for this creator
  for v_trigger in
    select *
    from public.app_creator_badge_trigger
    where creator_id = v_creator_id
      and is_active
  loop
    -- 1) FIRST SESSION WITH CREATOR
    if v_trigger.trigger_type = 'first_session_with_creator' then
      select count(*)
      into v_count
      from public.app_attendance att
      join public.app_session s on s.id = att.session_id
      where att.user_id = new.user_id
        and s.host_id = v_creator_id;

      if v_count = 1 then
        perform public.admin_award_creator_badge(
          v_creator_id,
          v_trigger.badge_id,
          new.user_id
        );
      end if;
    end if;

    -- 2) Nth SESSION WITH CREATOR
    if v_trigger.trigger_type = 'nth_session_with_creator' then
      select count(*)
      into v_count
      from public.app_attendance att
      join public.app_session s on s.id = att.session_id
      where att.user_id = new.user_id
        and s.host_id = v_creator_id;

      if v_count = (v_trigger.params->>'n')::int then
        perform public.admin_award_creator_badge(
          v_creator_id,
          v_trigger.badge_id,
          new.user_id
        );
      end if;
    end if;

  end loop;

  return new;
end;
$$;


ALTER FUNCTION "public"."f_check_creator_auto_badges_for_attendance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_badge_on_attendance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id                     uuid;
  v_total_sessions_attended     bigint;
  v_completed_challenges        bigint;
  v_full_attendance_challenges  bigint;
  v_completed_challenge_ids     uuid[];
  v_challenge_id                uuid;
begin
  v_user_id := new.user_id;

  -------------------------------------------------------------------
  -- 1) Session-based participant badges
  --    - system:first_session_attended
  --    - system:10_sessions_attended
  --    - system:100_sessions_attended
  -------------------------------------------------------------------
  select count(*)::bigint
  into v_total_sessions_attended
  from public.app_attendance a
  where a.user_id = v_user_id;

  if v_total_sessions_attended = 1 then
    perform public.admin_badge_award(v_user_id, 'system:first_session_attended');
  end if;

  if v_total_sessions_attended = 10 then
    perform public.admin_badge_award(v_user_id, 'system:10_sessions_attended');
  end if;

  if v_total_sessions_attended = 100 then
    perform public.admin_badge_award(v_user_id, 'system:100_sessions_attended');
  end if;

  -------------------------------------------------------------------
  -- 2) Challenge-based participant badges
  --    - system:first_challenge_completed
  --    - system:10_challenges_completed
  --    - system:100_challenges_completed
  --    - system:first_100_percent_attendance_challenge_completed
  --
  -- Definition of "completed" challenge:
  --   challenge_status = 'completed'::challenge_status
  --
  -- We aggregate per challenge:
  --   total_sessions          = # sessions in the challenge
  --   attended_sessions       = # of those that this user attended
  --   challenge_status        = max(c.status) (challenge_status enum)
  -------------------------------------------------------------------
  with per_challenge as (
    select
      cs.challenge_id,
      count(distinct cs.session_id)                    as total_sessions,
      count(distinct a.session_id)                     as attended_sessions,
      max(c.status)                                    as challenge_status
    from public.app_challenge_session cs
    join public.app_challenge c
      on c.id = cs.challenge_id
    left join public.app_attendance a
      on a.session_id = cs.session_id
     and a.user_id    = v_user_id
    group by cs.challenge_id
  )
  select
    count(*) filter (
      where challenge_status = 'completed'
        and total_sessions > 0
        and attended_sessions >= 1
    )::bigint                                        as completed_challenges,
    count(*) filter (
      where challenge_status = 'completed'
        and total_sessions > 0
        and attended_sessions = total_sessions
    )::bigint                                        as full_attendance_challenges,
    array_agg(challenge_id) filter (
      where challenge_status = 'completed'
        and total_sessions > 0
        and attended_sessions >= 1
    )                                                as completed_ids
  into
    v_completed_challenges,
    v_full_attendance_challenges,
    v_completed_challenge_ids
  from per_challenge;

  -- At least one completed challenge
  if v_completed_challenges >= 1 then
    perform public.admin_badge_award(v_user_id, 'system:first_challenge_completed');
  end if;

  -- 10 completed challenges
  if v_completed_challenges >= 10 then
    perform public.admin_badge_award(v_user_id, 'system:10_challenges_completed');
  end if;

  -- 100 completed challenges
  if v_completed_challenges >= 100 then
    perform public.admin_badge_award(v_user_id, 'system:100_challenges_completed');
  end if;

  -- At least one challenge with 100% attendance
  if v_full_attendance_challenges >= 1 then
    perform public.admin_badge_award(
      v_user_id,
      'system:first_100_percent_attendance_challenge_completed'
    );
  end if;

  -------------------------------------------------------------------
  -- 3) Creator custom badge auto-awards on challenge completion
  --
  -- For every challenge that is "completed" for this user (same
  -- definition as above), run the creator auto-badge engine.
  -- f_check_creator_auto_badges_challenge_completion() will:
  --   - find triggers of type 'challenge_completion' for that challenge's owner
  --   - call award_creator_badge() (which is idempotent per badge+user)
  -------------------------------------------------------------------
  if v_completed_challenge_ids is not null then
    foreach v_challenge_id in array v_completed_challenge_ids loop
      perform public.f_check_creator_auto_badges_challenge_completion(
        v_user_id,
        v_challenge_id
      );
    end loop;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."fn_badge_on_attendance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_badge_on_challenge_published"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count bigint;
BEGIN
  IF tg_op = 'UPDATE'
     AND new.status = 'published'
     AND (old.status IS DISTINCT FROM new.status) THEN

    SELECT count(*)::bigint INTO v_count
    FROM public.app_challenge c
    WHERE c.owner_id = new.owner_id AND c.status = 'published';

    BEGIN
      IF coalesce(v_count, 0) >= 1 THEN
        PERFORM public.admin_badge_award(new.owner_id, 'system:first_challenge_published');
      END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
      IF coalesce(v_count, 0) >= 10 THEN
        PERFORM public.admin_badge_award(new.owner_id, 'system:10_challenges_published');
      END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
      IF coalesce(v_count, 0) >= 100 THEN
        PERFORM public.admin_badge_award(new.owner_id, 'system:100_challenges_published');
      END IF;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."fn_badge_on_challenge_published"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_badge_on_session_cohost_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_host uuid;
begin
  -- Find the host of this session
  select s.host_id
  into v_host
  from public.app_session s
  where s.id = new.session_id;

  if v_host is not null
     and v_host <> new.cohost_id then
    -- award to host
    perform public.admin_badge_award(v_host, 'system:first_collaboration');
    -- and to cohost
    perform public.admin_badge_award(new.cohost_id, 'system:first_collaboration');
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."fn_badge_on_session_cohost_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_badge_on_session_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count bigint;
BEGIN
  SELECT count(*)::bigint INTO v_count
  FROM public.app_session s
  WHERE s.host_id = new.host_id;

  BEGIN
    IF coalesce(v_count, 0) >= 1 THEN
      PERFORM public.admin_badge_award(new.host_id, 'system:first_session_hosted');
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    IF coalesce(v_count, 0) >= 10 THEN
      PERFORM public.admin_badge_award(new.host_id, 'system:10_sessions_hosted');
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    IF coalesce(v_count, 0) >= 100 THEN
      PERFORM public.admin_badge_award(new.host_id, 'system:100_sessions_hosted');
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."fn_badge_on_session_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_notify_badge_awarded"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  b record;
begin
  -- Fetch badge metadata
  select
    id,
    slug,
    label,
    audience,
    tier,
    is_event_based,
    is_monthly,
    color_hex,
    icon
  into b
  from public.app_badge
  where id = new.badge_id;

  if not found then
    -- Should never happen, but fail silently to not break awards
    return new;
  end if;

  -- Insert notification with enriched, UI-friendly payload
  insert into public.app_notification (
    recipient_id,
    type,
    payload
  ) values (
    new.user_id,
    'badge_awarded',
    jsonb_build_object(
      'user_badge_id', new.id,
      'badge_id', new.badge_id,
      'badge_slug', b.slug,
      'badge_label', b.label,
      'audience', b.audience,
      'tier', b.tier,
      'is_event_based', b.is_event_based,
      'is_monthly', b.is_monthly,
      'period', new.period,
      'context', coalesce(new.context, '{}'::jsonb),
      'awarded_at', new.awarded_at,
      'badge_color_hex', b.color_hex,
      'badge_icon', b.icon
    )
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."fn_notify_badge_awarded"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_challenge_space_by_challenge"("p_challenge" "uuid") RETURNS TABLE("id" "uuid", "continuation_group_id" "uuid", "source_challenge_id" "uuid", "kind" "text", "title" "text", "description" "text", "ownership_type" "text", "owner_id" "uuid", "created_by" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    with target as (
        select
            c.id as challenge_id,
            c.continuation_group_id
        from public.app_challenge c
        where c.id = p_challenge
    )
    (
        select
            s.id,
            s.continuation_group_id,
            s.source_challenge_id,
            s.kind,
            s.title,
            s.description,
            s.ownership_type,
            s.owner_id,
            s.created_by,
            s.created_at,
            s.updated_at
        from public.app_challenge_space s
        join target t
          on s.source_challenge_id = t.challenge_id
        limit 1
    )
    union all
    (
        select
            s.id,
            s.continuation_group_id,
            s.source_challenge_id,
            s.kind,
            s.title,
            s.description,
            s.ownership_type,
            s.owner_id,
            s.created_by,
            s.created_at,
            s.updated_at
        from public.app_challenge_space s
        join target t
          on t.continuation_group_id is not null
         and s.continuation_group_id = t.continuation_group_id
        where not exists (
            select 1
            from public.app_challenge_space sx
            where sx.source_challenge_id = t.challenge_id
        )
        limit 1
    );
$$;


ALTER FUNCTION "public"."get_challenge_space_by_challenge"("p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_challenge_split_map"("p_challenge" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with base as (
    select owner_id from public.app_challenge where id = p_challenge
  ),
  sums as (
    select coalesce(sum(split_percent),0) as total_cohost
    from public.app_challenge_cohost
    where challenge_id = p_challenge
  ),
  cohosts as (
    select cohost_id as user_id, split_percent as pct
    from public.app_challenge_cohost
    where challenge_id = p_challenge
  )
  select
    jsonb_object_agg(user_id::text, pct)
    || jsonb_build_object(
         (select owner_id::text from base),
         greatest(0, 100 - (select total_cohost from sums))
       )
  from cohosts;
$$;


ALTER FUNCTION "public"."get_challenge_split_map"("p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_creator_dashboard_stats"("p_creator_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
  with tx as (
    select
      coalesce(sum(case when status='succeeded' then amount_gross end),0) as gross_all_time,
      coalesce(sum(case when status='succeeded' then amount_fee   end),0) as fees_all_time,
      coalesce(sum(case when status='succeeded' then amount_net   end),0) as net_all_time,
      coalesce(count(distinct case when status='succeeded' then buyer_id end),0) as unique_buyers_all_time,
      coalesce(sum(case when status='succeeded' and created_at >= now() - interval '30 days' then amount_net end),0) as net_last_30d
    from app_transaction
    where creator_id = p_creator_id
  ),
  sess as (
    select
      count(*) as sessions_total,
      count(*) filter (where status='published') as sessions_published,
      count(*) filter (where status='ended') as sessions_ended
    from app_session
    where host_id = p_creator_id
  )
  select jsonb_build_object(
    'gross_all_time', tx.gross_all_time,
    'fees_all_time',  tx.fees_all_time,
    'net_all_time',   tx.net_all_time,
    'unique_buyers_all_time', tx.unique_buyers_all_time,
    'net_last_30d',   tx.net_last_30d,
    'sessions_total', sess.sessions_total,
    'sessions_published', sess.sessions_published,
    'sessions_ended', sess.sessions_ended
  )
  from tx, sess;
$$;


ALTER FUNCTION "public"."get_creator_dashboard_stats"("p_creator_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_creator_space_by_creator"("p_creator" "uuid") RETURNS TABLE("id" "uuid", "creator_id" "uuid", "title" "text", "description" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select
        s.id,
        s.creator_id,
        s.title,
        s.description,
        s.created_at,
        s.updated_at
    from public.app_creator_space s
    where s.creator_id = p_creator
    limit 1;
$$;


ALTER FUNCTION "public"."get_creator_space_by_creator"("p_creator" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_latest_unseen_monthly_digest"() RETURNS TABLE("period" "text", "summary" "jsonb", "awarded" "jsonb", "revoked" "jsonb", "digest_created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  v_uid    uuid;
  v_period text;
begin
  -- Auth check
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'get_my_latest_unseen_monthly_digest: not authenticated';
  end if;

  -- Find latest period where we have a digest for this user
  select d.period
  into v_period
  from public.app_badge_monthly_digest d
  where d.user_id = v_uid
  order by d.period desc
  limit 1;

  -- No digest at all → return empty set
  if v_period is null then
    return;
  end if;

  -- Already seen this period?
  if exists (
    select 1
    from public.app_user_period_seen s
    where s.user_id = v_uid
      and s.period = v_period
  ) then
    return;
  end if;

  -- Mark as seen (use PK constraint to avoid naming ambiguity)
  insert into public.app_user_period_seen (user_id, period)
  values (v_uid, v_period)
  on conflict on constraint app_user_period_seen_pkey do nothing;

  -- Return the digest row for this period
  return query
  select
    d.period,
    d.summary,
    d.awarded,
    d.revoked,
    d.created_at as digest_created_at
  from public.app_badge_monthly_digest d
  where d.user_id = v_uid
    and d.period = v_period;
end;
$$;


ALTER FUNCTION "public"."get_my_latest_unseen_monthly_digest"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_my_latest_unseen_monthly_digest"() IS 'Returns the latest monthly badge digest for auth.uid() only once (first time). Marks this period as seen in app_user_period_seen. Subsequent calls return no rows.';



CREATE OR REPLACE FUNCTION "public"."get_my_monthly_digest"("p_period" "text") RETURNS TABLE("period" "text", "summary" "jsonb", "awarded" "jsonb", "revoked" "jsonb", "digest_created_at" timestamp with time zone, "seen_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  v_uid     uuid;
  v_seen_at timestamptz;
begin
  -- Auth check
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'get_my_monthly_digest: not authenticated';
  end if;

  -- If no digest for this period, return nothing
  if not exists (
    select 1
    from public.app_badge_monthly_digest d
    where d.user_id = v_uid
      and d.period = p_period
  ) then
    return;
  end if;

  -- Seen timestamp (nullable)
  select s.seen_at
  into v_seen_at
  from public.app_user_period_seen s
  where s.user_id = v_uid
    and s.period = p_period;

  return query
  select
    d.period,
    d.summary,
    d.awarded,
    d.revoked,
    d.created_at,
    v_seen_at
  from public.app_badge_monthly_digest d
  where d.user_id = v_uid
    and d.period = p_period;
end;
$$;


ALTER FUNCTION "public"."get_my_monthly_digest"("p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_my_monthly_digest"("p_period" "text") IS 'Returns the monthly badge digest for auth.uid() and the given period (YYYY-MM), if it exists, plus when it was first seen (if ever). Does not change seen-state.';



CREATE OR REPLACE FUNCTION "public"."get_session_split_map"("p_session" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
with
parent as (
  select cs.challenge_id
  from public.app_challenge_session cs
  where cs.session_id = p_session
  limit 1
),
challenge_split as (
  -- if there is a parent challenge, build split map from challenge cohosts + owner remainder
  select
    jsonb_object_agg(u::text, pct::text) as map_txt
  from (
    select c.owner_id as u, greatest(0, 100 - coalesce(sum(ch.split_percent),0)) as pct
    from public.app_challenge c
    left join public.app_challenge_cohost ch on ch.challenge_id = c.id
    where c.id = (select challenge_id from parent)
    group by c.owner_id

    union all

    select ch.cohost_id as u, ch.split_percent as pct
    from public.app_challenge_cohost ch
    where ch.challenge_id = (select challenge_id from parent)
  ) t
),
session_split as (
  -- fallback: use per-session cohosts if no parent challenge
  select
    jsonb_object_agg(u::text, pct::text) as map_txt
  from (
    select s.host_id as u, greatest(0, 100 - coalesce(sum(sc.split_percent),0)) as pct
    from public.app_session s
    left join public.app_session_cohost sc on sc.session_id = s.id
    where s.id = p_session
    group by s.host_id

    union all

    select sc.cohost_id as u, sc.split_percent as pct
    from public.app_session_cohost sc
    where sc.session_id = p_session
  ) t
)
select coalesce(
  (select map_txt from challenge_split),
  (select map_txt from session_split),
  '{}'::jsonb
);
$$;


ALTER FUNCTION "public"."get_session_split_map"("p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_challenge_access"("p_buyer" "uuid", "p_challenge" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  insert into public.app_attendance (session_id, user_id, joined_at)
  select cs.session_id, p_buyer, now()
  from public.app_challenge_session cs
  where cs.challenge_id = p_challenge
  on conflict (session_id, user_id) do nothing;
$$;


ALTER FUNCTION "public"."grant_challenge_access"("p_buyer" "uuid", "p_challenge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_link_via_rpc"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Only allow when our RPC marks this transaction
  if current_setting('app.via_rpc', true) <> '1' then
    raise exception 'Linking sessions to a challenge is only allowed via RPC.';
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."guard_link_via_rpc"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_subscription"("p_user" "uuid", "p_creator" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_user_subscription s
    where s.user_id = p_user
      and s.creator_id = p_creator
      and s.status in ('active','trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;


ALTER FUNCTION "public"."has_active_subscription"("p_user" "uuid", "p_creator" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_attended_session"("p_session" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    (p_user = auth.uid())
    and exists (
      select 1
      from public.app_attendance a
      where a.session_id = p_session
        and a.user_id    = p_user
    );
$$;


ALTER FUNCTION "public"."has_attended_session"("p_session" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_creator_participation"("p_creator" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_transaction t
        where t.creator_id = p_creator
          and t.buyer_id = p_user
          and t.status = 'succeeded'
    );
$$;


ALTER FUNCTION "public"."has_creator_participation"("p_creator" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.app_profile WHERE id = p_user),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"("p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_challenge_cohost"("p_challenge" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM app_challenge_cohost 
    WHERE challenge_id = p_challenge AND cohost_id = p_user
  );
$$;


ALTER FUNCTION "public"."is_challenge_cohost"("p_challenge" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_challenge_owner"("p_challenge_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_challenge c
    where c.id = p_challenge_id
      and c.owner_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_challenge_owner"("p_challenge_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_challenge_owner_nors"("p_challenge" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_challenge c
    where c.id = p_challenge
      and c.owner_id = p_user
  );
$$;


ALTER FUNCTION "public"."is_challenge_owner_nors"("p_challenge" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_challenge_space_admin"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_challenge_space s
        where s.id = p_space
          and s.owner_id = p_user
    )
    or exists (
        select 1
        from public.app_challenge_space s
        join public.app_challenge_cohost ch
          on ch.challenge_id = s.source_challenge_id
        where s.id = p_space
          and ch.cohost_id = p_user
    );
$$;


ALTER FUNCTION "public"."is_challenge_space_admin"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_creator"("p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_profile
    where id = p_user
      and role = 'creator'
  );
$$;


ALTER FUNCTION "public"."is_creator"("p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_creator_profile"("p_profile_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_profile p
        where p.id = p_profile_id
          and p.role = 'creator'
    );
$$;


ALTER FUNCTION "public"."is_creator_profile"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_creator_space_member"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_creator_space_member m
        where m.space_id = p_space
          and m.user_id = p_user
    );
$$;


ALTER FUNCTION "public"."is_creator_space_member"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_creator_space_owner"("p_space" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select exists (
        select 1
        from public.app_creator_space s
        where s.id = p_space
          and s.creator_id = p_user
    );
$$;


ALTER FUNCTION "public"."is_creator_space_owner"("p_space" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_dm_member_nors"("p_conversation" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select
    (p_user = auth.uid())
    and exists (
      select 1
      from public.app_dm_member m
      where m.conversation_id = p_conversation
        and m.user_id         = p_user
    );
$$;


ALTER FUNCTION "public"."is_dm_member_nors"("p_conversation" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_host_or_cohost"("p_session" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_session s
    where s.id = p_session
      and (s.host_id = p_user
           or exists (
                select 1
                from public.app_session_cohost c
                where c.session_id = s.id
                  and c.cohost_id = p_user
           ))
  );
$$;


ALTER FUNCTION "public"."is_host_or_cohost"("p_session" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_in_challenge"("p_challenge" "uuid", "p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    -- challenge owner
    select 1 from public.app_challenge c
    where c.id = p_challenge and c.owner_id = p_user

    union all
    -- challenge cohost
    select 1 from public.app_challenge_cohost ch
    where ch.challenge_id = p_challenge and ch.cohost_id = p_user

    union all
    -- host of any session linked to the challenge
    select 1
    from public.app_challenge_session cs
    join public.app_session s on s.id = cs.session_id
    where cs.challenge_id = p_challenge
      and public.is_session_host(s.id, p_user)

    union all
    -- session cohost of any session linked to the challenge
    select 1
    from public.app_challenge_session cs
    join public.app_session_cohost sc on sc.session_id = cs.session_id
    where cs.challenge_id = p_challenge
      and sc.cohost_id = p_user
  );
$$;


ALTER FUNCTION "public"."is_in_challenge"("p_challenge" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_session_host"("p_session_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.app_session s
    where s.id = p_session_id
      and s.host_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_session_host"("p_session_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_creator_space"("p_space" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_space is null then
        raise exception 'space_id is required';
    end if;

    if not exists (
        select 1
        from public.app_creator_space s
        where s.id = p_space
    ) then
        raise exception 'Creator space not found';
    end if;

    insert into public.app_creator_space_member (
        space_id,
        user_id
    )
    values (
        p_space,
        v_actor
    )
    on conflict do nothing;
end;
$$;


ALTER FUNCTION "public"."join_creator_space"("p_space" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_creator_space"("p_space" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_space is null then
        raise exception 'space_id is required';
    end if;

    delete from public.app_creator_space_member
    where space_id = p_space
      and user_id = v_actor;
end;
$$;


ALTER FUNCTION "public"."leave_creator_space"("p_space" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."like_challenge_post"("p_post" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_space_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_post is null then
        raise exception 'post_id is required';
    end if;

    select p.space_id
    into v_space_id
    from public.app_challenge_post p
    where p.id = p_post;

    if v_space_id is null then
        raise exception 'Challenge post not found';
    end if;

    if not public.can_access_challenge_space(v_space_id, v_actor) then
        raise exception 'Forbidden: you may not like posts in this challenge space';
    end if;

    insert into public.app_challenge_post_like (
        post_id,
        user_id
    )
    values (
        p_post,
        v_actor
    )
    on conflict (post_id, user_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."like_challenge_post"("p_post" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."like_creator_post"("p_post" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_space_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_post is null then
        raise exception 'post_id is required';
    end if;

    select p.space_id
    into v_space_id
    from public.app_creator_post p
    where p.id = p_post;

    if v_space_id is null then
        raise exception 'Creator post not found';
    end if;

    if not public.can_interact_creator_space(v_space_id, v_actor) then
        raise exception 'Forbidden: you may not like posts in this creator tribe';
    end if;

    insert into public.app_creator_post_like (
        post_id,
        user_id
    )
    values (
        p_post,
        v_actor
    )
    on conflict (post_id, user_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."like_creator_post"("p_post" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_challenge_comments"("p_post" "uuid", "p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "post_id" "uuid", "author_id" "uuid", "body" "text", "is_coach_answer" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select c.id, c.post_id, c.author_id, c.body, c.is_coach_answer, c.created_at, c.updated_at
  from public.app_challenge_comment c
  where c.post_id = p_post
  order by c.created_at asc, c.id asc
  limit greatest(1, least(coalesce(p_limit, 100), 300));
$$;


ALTER FUNCTION "public"."list_challenge_comments"("p_post" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_challenge_posts"("p_space" "uuid", "p_limit" integer DEFAULT 20, "p_before_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "space_id" "uuid", "author_id" "uuid", "body" "text", "media_url" "text", "kind" "text", "context_type" "text", "context_id" "uuid", "directed_to" "uuid"[], "metadata" "jsonb", "like_count" integer, "comment_count" integer, "liked_by_me" boolean, "coach_answer" "jsonb", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id, p.space_id, p.author_id, p.body, p.media_url,
    p.kind, p.context_type, p.context_id, p.directed_to, p.metadata,
    (select count(*)::int from app_challenge_post_like l where l.post_id = p.id) as like_count,
    (select count(*)::int from app_challenge_comment c where c.post_id = p.id) as comment_count,
    exists (select 1 from app_challenge_post_like l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me,
    (select jsonb_build_object('author_id', c.author_id, 'body', c.body, 'created_at', c.created_at)
       from app_challenge_comment c
       where c.post_id = p.id and c.is_coach_answer
       order by c.created_at desc
       limit 1) as coach_answer,
    p.created_at, p.updated_at
  from public.app_challenge_post p
  where p.space_id = p_space
    and can_access_challenge_space(p_space, auth.uid())
    and (
      p_before_created_at is null
      or (p.created_at, p.id) < (p_before_created_at, p_before_id)
    )
  order by p.created_at desc, p.id desc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;


ALTER FUNCTION "public"."list_challenge_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_creator_comments"("p_post" "uuid", "p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "post_id" "uuid", "author_id" "uuid", "body" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select
        c.id,
        c.post_id,
        c.author_id,
        c.body,
        c.created_at,
        c.updated_at
    from public.app_creator_comment c
    where c.post_id = p_post
    order by c.created_at asc, c.id asc
    limit greatest(1, least(coalesce(p_limit, 100), 300));
$$;


ALTER FUNCTION "public"."list_creator_comments"("p_post" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_creator_posts"("p_space" "uuid", "p_limit" integer DEFAULT 20, "p_before_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "space_id" "uuid", "author_id" "uuid", "body" "text", "media_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "context_type" "text", "context_id" "uuid")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
    select
        p.id,
        p.space_id,
        p.author_id,
        p.body,
        p.media_url,
        p.created_at,
        p.updated_at,
        p.context_type,
        p.context_id
    from public.app_creator_post p
    where p.space_id = p_space
      and (
            p_before_created_at is null
         or (p.created_at, p.id) < (p_before_created_at, p_before_id)
      )
    order by p.created_at desc, p.id desc
    limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;


ALTER FUNCTION "public"."list_creator_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_dm_messages"("p_conversation_id" "uuid", "p_limit" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "author_id" "uuid", "body" "text", "created_at" timestamp with time zone, "kind" "text", "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_dm_member_nors(p_conversation_id, auth.uid()) THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;
  RETURN QUERY
  SELECT m.id, m.author_id, m.body, m.created_at, m.kind, m.metadata
  FROM app_dm_message m
  WHERE m.conversation_id = p_conversation_id AND m.deleted_at IS NULL
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."list_dm_messages"("p_conversation_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."load_experience_creator_stats"("p_challenge_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := auth.uid();
  v_space_id uuid;
begin
  if v_user is null then
    return jsonb_build_object('authorized', false);
  end if;

  select id into v_space_id
  from public.app_challenge_space
  where source_challenge_id = p_challenge_id;

  if v_space_id is null or not public.is_challenge_space_admin(v_space_id, v_user) then
    return jsonb_build_object('authorized', false);
  end if;

  return jsonb_build_object(
    'authorized', true,
    'member_count', (
      select count(*)::int from public.app_challenge_member
      where challenge_id = p_challenge_id
    ),
    'pending_questions', (
      select count(*)::int from public.vw_pending_questions_for_creator
      where challenge_id = p_challenge_id
    ),
    'recent_reflections', (
      select count(*)::int from public.vw_recent_reflections_for_creator
      where challenge_id = p_challenge_id
    )
  );
end $$;


ALTER FUNCTION "public"."load_experience_creator_stats"("p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."load_experience_space"("p_challenge_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."load_experience_space"("p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."load_workspace"("p_challenge_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."load_workspace"("p_challenge_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_challenge_contract"("p_challenge_id" "uuid", "p_actor" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_challenge app_challenge;
  v_snapshot jsonb;
  v_contract_id uuid;
  v_cohost uuid;
begin
  select * into v_challenge from app_challenge where id = p_challenge_id;
  if not found then raise exception 'challenge_not_found'; end if;
  if v_challenge.owner_id != p_actor then raise exception 'only_owner_can_lock'; end if;
  if v_challenge.status != 'draft' then raise exception 'challenge_not_draft'; end if;

  if not exists (select 1 from app_challenge_cohost where challenge_id = p_challenge_id) then
    raise exception 'no_cohosts_to_lock';
  end if;

  select jsonb_build_object(
    'title', v_challenge.title,
    'price_cents', v_challenge.price_cents,
    'currency', v_challenge.currency,
    'owner_id', v_challenge.owner_id,
    'cohosts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'cohost_id', cc.cohost_id,
        'split_percent', cc.split_percent
      ))
      from app_challenge_cohost cc where cc.challenge_id = p_challenge_id
    ), '[]'::jsonb)
  ) into v_snapshot;

  v_contract_id := lock_contract('challenge', p_challenge_id, p_actor, v_snapshot, null);

  for v_cohost in
    select cohost_id from app_challenge_cohost where challenge_id = p_challenge_id
  loop
    insert into public.app_notification (recipient_id, type, payload)
    values (
      v_cohost,
      'contract_locked',
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'contract_id', v_contract_id,
        'actor_id', p_actor
      )
    )
    on conflict do nothing;
  end loop;

  return v_contract_id;
end;
$$;


ALTER FUNCTION "public"."lock_challenge_contract"("p_challenge_id" "uuid", "p_actor" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_contract"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_snapshot_json" "jsonb", "p_snapshot_text" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_uid uuid := auth.uid();
    v_actor uuid := coalesce(v_uid, p_actor);

    v_contract_id uuid;
    v_next_version integer;
    v_now timestamptz := now();

    v_snapshot_json jsonb;
    v_snapshot_text text;

    v_host_profile_id uuid;
    v_host_party_type text;
    v_host_contract_name text;
    v_host_entity_signer_name text;
    v_target_title text;

    v_session_start_time timestamptz;
    v_session_duration_minutes integer;
    v_session_price_cents integer;
    v_session_currency text;

    v_challenge_start_date date;
    v_challenge_end_date date;
    v_challenge_price_cents integer;
    v_challenge_currency text;

    v_host_share_percent integer;
    v_cohost_split_total integer;
    v_missing_identity_count integer;
    v_invalid_contributor_count integer;
begin
    if v_uid is not null and v_uid <> p_actor then
        raise exception 'caller_mismatch_auth_uid';
    end if;

    if p_target_type not in ('session', 'challenge') then
        raise exception 'invalid target type: %', p_target_type;
    end if;

    if p_target_id is null then
        raise exception 'target_id is required';
    end if;

    if v_actor is null then
        raise exception 'actor is required';
    end if;

    if p_target_type = 'session' then
        select
            s.host_id, ci.party_type, ci.contract_name, ci.entity_signer_name,
            s.title, s.start_time, s.duration_minutes, s.price_cents, s.currency
        into
            v_host_profile_id, v_host_party_type, v_host_contract_name, v_host_entity_signer_name,
            v_target_title, v_session_start_time, v_session_duration_minutes, v_session_price_cents, v_session_currency
        from public.app_session s
        join public.app_creator_contract_identity ci on ci.creator_id = s.host_id
        where s.id = p_target_id and s.host_id = v_actor and ci.authority_attested = true;

        if v_host_profile_id is null then
            raise exception 'session not found, actor is not host, or host lacks attested contract identity';
        end if;

        select count(*) into v_missing_identity_count
        from public.app_session_cohost sch
        left join public.app_creator_contract_identity ci on ci.creator_id = sch.cohost_id and ci.authority_attested = true
        where sch.session_id = p_target_id and ci.creator_id is null;
        if v_missing_identity_count > 0 then raise exception 'one or more session cohosts lack attested contract identity'; end if;

        select coalesce(sum(sch.split_percent), 0) into v_cohost_split_total
        from public.app_session_cohost sch where sch.session_id = p_target_id;
        if v_cohost_split_total > 100 then raise exception 'session cohost split exceeds 100'; end if;
        v_host_share_percent := 100 - v_cohost_split_total;

        select coalesce(max(c.version), 0) + 1 into v_next_version
        from public.app_collaboration_contract c
        where c.target_type = 'session' and c.target_id = p_target_id;

        v_snapshot_json := jsonb_build_object(
            'schema_version', 1, 'contract_type', 'session',
            'target', jsonb_build_object('id', p_target_id, 'title', v_target_title),
            'parties', (select jsonb_agg(party_obj order by sort_role, sort_profile_id) from (
                select 1 as sort_role, v_host_profile_id as sort_profile_id, jsonb_build_object(
                    'role', 'host', 'type', v_host_party_type, 'profile_id', v_host_profile_id,
                    'legal_name', case when v_host_party_type = 'individual' then v_host_contract_name else null end,
                    'entity_name', case when v_host_party_type = 'entity' then v_host_contract_name else null end
                ) as party_obj
                union all
                select 2, sch.cohost_id, jsonb_build_object(
                    'role', 'cohost', 'type', ci.party_type, 'profile_id', sch.cohost_id,
                    'legal_name', case when ci.party_type = 'individual' then ci.contract_name else null end,
                    'entity_name', case when ci.party_type = 'entity' then ci.contract_name else null end)
                from public.app_session_cohost sch
                join public.app_creator_contract_identity ci on ci.creator_id = sch.cohost_id
                where sch.session_id = p_target_id) q),
            'economics', jsonb_build_object('price_cents', v_session_price_cents, 'currency', v_session_currency),
            'revenue_shares', (select jsonb_agg(share_obj order by sort_role, sort_profile_id) from (
                select 1 as sort_role, v_host_profile_id as sort_profile_id,
                    jsonb_build_object('profile_id', v_host_profile_id, 'share_percent', v_host_share_percent) as share_obj
                union all
                select 2, sch.cohost_id, jsonb_build_object('profile_id', sch.cohost_id, 'share_percent', sch.split_percent)
                from public.app_session_cohost sch where sch.session_id = p_target_id) q),
            'schedule', jsonb_build_object('starts_at', v_session_start_time, 'duration_minutes', v_session_duration_minutes),
            'audit', jsonb_build_object('locked_by', v_actor, 'locked_at', v_now, 'version', v_next_version),
            'signatures', (select jsonb_agg(sig_obj order by sort_role, sort_profile_id) from (
                select 1 as sort_role, v_host_profile_id as sort_profile_id, jsonb_build_object(
                    'profile_id', v_host_profile_id,
                    'signer_name', case when v_host_party_type = 'entity' then v_host_entity_signer_name else v_host_contract_name end) as sig_obj
                union all
                select 2, sch.cohost_id, jsonb_build_object('profile_id', sch.cohost_id,
                    'signer_name', case when ci.party_type = 'entity' then ci.entity_signer_name else ci.contract_name end)
                from public.app_session_cohost sch
                join public.app_creator_contract_identity ci on ci.creator_id = sch.cohost_id
                where sch.session_id = p_target_id) q));

        v_snapshot_text := (with party_rows as (
            select 1 as sort_role, v_host_profile_id as sort_profile_id, v_host_contract_name as party_name, v_host_share_percent as share_percent
            union all
            select 2, sch.cohost_id, ci.contract_name, sch.split_percent
            from public.app_session_cohost sch
            join public.app_creator_contract_identity ci on ci.creator_id = sch.cohost_id
            where sch.session_id = p_target_id)
            select 'Session Contract v' || v_next_version::text
                || ' | Target: ' || coalesce(v_target_title, '')
                || ' | Parties: ' || string_agg(party_name, '; ' order by sort_role, sort_profile_id)
                || ' | Revenue Shares: ' || string_agg(party_name || ' ' || share_percent::text || '%', '; ' order by sort_role, sort_profile_id)
                || ' | Price: ' || (v_session_price_cents::numeric / 100.0)::text || ' ' || v_session_currency
                || ' | Starts At: ' || coalesce(v_session_start_time::text, '')
                || ' | Duration: ' || coalesce(v_session_duration_minutes::text, '') || ' min'
            from party_rows);

    else
        select c.owner_id, ci.party_type, ci.contract_name, ci.entity_signer_name,
            c.title, c.start_date, c.end_date, c.price_cents, c.currency
        into v_host_profile_id, v_host_party_type, v_host_contract_name, v_host_entity_signer_name,
            v_target_title, v_challenge_start_date, v_challenge_end_date, v_challenge_price_cents, v_challenge_currency
        from public.app_challenge c
        join public.app_creator_contract_identity ci on ci.creator_id = c.owner_id
        where c.id = p_target_id and c.owner_id = v_actor and ci.authority_attested = true;

        if v_host_profile_id is null then
            raise exception 'challenge not found, actor is not owner, or owner lacks attested contract identity';
        end if;

        select count(*) into v_missing_identity_count
        from public.app_challenge_cohost cch
        left join public.app_creator_contract_identity ci on ci.creator_id = cch.cohost_id and ci.authority_attested = true
        where cch.challenge_id = p_target_id and ci.creator_id is null;
        if v_missing_identity_count > 0 then raise exception 'one or more challenge cohosts lack attested contract identity'; end if;

        select count(*) into v_missing_identity_count
        from (
            select distinct s.host_id as creator_id from public.app_challenge_session chs
            join public.app_session s on s.id = chs.session_id where chs.challenge_id = p_target_id
            union
            select distinct sch.cohost_id from public.app_challenge_session chs
            join public.app_session_cohost sch on sch.session_id = chs.session_id
            where chs.challenge_id = p_target_id) contrib
        left join public.app_creator_contract_identity ci on ci.creator_id = contrib.creator_id and ci.authority_attested = true
        where ci.creator_id is null;
        if v_missing_identity_count > 0 then raise exception 'one or more challenge session contributors lack attested contract identity'; end if;

        select count(*) into v_invalid_contributor_count
        from (
            select distinct s.host_id as creator_id from public.app_challenge_session chs
            join public.app_session s on s.id = chs.session_id where chs.challenge_id = p_target_id
            union
            select distinct sch.cohost_id from public.app_challenge_session chs
            join public.app_session_cohost sch on sch.session_id = chs.session_id
            where chs.challenge_id = p_target_id) contrib
        where contrib.creator_id <> v_host_profile_id
          and not exists (select 1 from public.app_challenge_cohost cch
            where cch.challenge_id = p_target_id and cch.cohost_id = contrib.creator_id);
        if v_invalid_contributor_count > 0 then raise exception 'all challenge session contributors must be challenge parties before locking'; end if;

        select coalesce(sum(cch.split_percent), 0) into v_cohost_split_total
        from public.app_challenge_cohost cch where cch.challenge_id = p_target_id;
        if v_cohost_split_total > 100 then raise exception 'challenge cohost split exceeds 100'; end if;
        v_host_share_percent := 100 - v_cohost_split_total;

        select coalesce(max(c.version), 0) + 1 into v_next_version
        from public.app_collaboration_contract c
        where c.target_type = 'challenge' and c.target_id = p_target_id;

        v_snapshot_json := jsonb_build_object(
            'schema_version', 1, 'contract_type', 'challenge',
            'target', jsonb_build_object('id', p_target_id, 'title', v_target_title),
            'parties', (select jsonb_agg(party_obj order by sort_role, sort_profile_id) from (
                select 1 as sort_role, v_host_profile_id as sort_profile_id, jsonb_build_object(
                    'role', 'host', 'type', v_host_party_type, 'profile_id', v_host_profile_id,
                    'legal_name', case when v_host_party_type = 'individual' then v_host_contract_name else null end,
                    'entity_name', case when v_host_party_type = 'entity' then v_host_contract_name else null end) as party_obj
                union all
                select 2, cch.cohost_id, jsonb_build_object(
                    'role', 'cohost', 'type', ci.party_type, 'profile_id', cch.cohost_id,
                    'legal_name', case when ci.party_type = 'individual' then ci.contract_name else null end,
                    'entity_name', case when ci.party_type = 'entity' then ci.contract_name else null end)
                from public.app_challenge_cohost cch
                join public.app_creator_contract_identity ci on ci.creator_id = cch.cohost_id
                where cch.challenge_id = p_target_id) q),
            'economics', jsonb_build_object('price_cents', v_challenge_price_cents, 'currency', v_challenge_currency),
            'revenue_shares', (select jsonb_agg(share_obj order by sort_role, sort_profile_id) from (
                select 1 as sort_role, v_host_profile_id as sort_profile_id,
                    jsonb_build_object('profile_id', v_host_profile_id, 'share_percent', v_host_share_percent) as share_obj
                union all
                select 2, cch.cohost_id, jsonb_build_object('profile_id', cch.cohost_id, 'share_percent', cch.split_percent)
                from public.app_challenge_cohost cch where cch.challenge_id = p_target_id) q),
            'schedule', jsonb_build_object(
                'start_date', v_challenge_start_date, 'end_date', v_challenge_end_date,
                'sessions', (select coalesce(jsonb_agg(session_obj order by sort_start_time, sort_session_id), '[]'::jsonb) from (
                    select s.start_time as sort_start_time, s.id as sort_session_id, jsonb_build_object(
                        'id', s.id, 'title', s.title, 'host_profile_id', s.host_id,
                        'cohost_profile_ids', (select coalesce(jsonb_agg(sch.cohost_id order by sch.cohost_id), '[]'::jsonb)
                            from public.app_session_cohost sch where sch.session_id = s.id),
                        'starts_at', s.start_time, 'duration_minutes', s.duration_minutes) as session_obj
                    from public.app_challenge_session chs
                    join public.app_session s on s.id = chs.session_id
                    where chs.challenge_id = p_target_id) q)),
            'audit', jsonb_build_object('locked_by', v_actor, 'locked_at', v_now, 'version', v_next_version),
            'signatures', (select jsonb_agg(sig_obj order by sort_role, sort_profile_id) from (
                select 1 as sort_role, v_host_profile_id as sort_profile_id, jsonb_build_object(
                    'profile_id', v_host_profile_id,
                    'signer_name', case when v_host_party_type = 'entity' then v_host_entity_signer_name else v_host_contract_name end) as sig_obj
                union all
                select 2, cch.cohost_id, jsonb_build_object('profile_id', cch.cohost_id,
                    'signer_name', case when ci.party_type = 'entity' then ci.entity_signer_name else ci.contract_name end)
                from public.app_challenge_cohost cch
                join public.app_creator_contract_identity ci on ci.creator_id = cch.cohost_id
                where cch.challenge_id = p_target_id) q));

        v_snapshot_text := (with party_rows as (
            select 1 as sort_role, v_host_profile_id as sort_profile_id, v_host_contract_name as party_name, v_host_share_percent as share_percent
            union all
            select 2, cch.cohost_id, ci.contract_name, cch.split_percent
            from public.app_challenge_cohost cch
            join public.app_creator_contract_identity ci on ci.creator_id = cch.cohost_id
            where cch.challenge_id = p_target_id),
            session_rows as (select s.start_time, s.id, s.title from public.app_challenge_session chs
                join public.app_session s on s.id = chs.session_id where chs.challenge_id = p_target_id)
            select 'Challenge Contract v' || v_next_version::text
                || ' | Target: ' || coalesce(v_target_title, '')
                || ' | Parties: ' || (select string_agg(party_name, '; ' order by sort_role, sort_profile_id) from party_rows)
                || ' | Revenue Shares: ' || (select string_agg(party_name || ' ' || share_percent::text || '%', '; ' order by sort_role, sort_profile_id) from party_rows)
                || ' | Price: ' || (v_challenge_price_cents::numeric / 100.0)::text || ' ' || v_challenge_currency
                || ' | Dates: ' || coalesce(v_challenge_start_date::text, '') || ' to ' || coalesce(v_challenge_end_date::text, '')
                || ' | Sessions: ' || coalesce((select string_agg(title || ' [' || id::text || ']', '; ' order by start_time, id) from session_rows), ''));
    end if;

    insert into public.app_collaboration_contract (
        target_type, target_id, version, snapshot_json, snapshot_text, sha256, locked_at)
    values (p_target_type, p_target_id, v_next_version, v_snapshot_json, v_snapshot_text,
        encode(extensions.digest(convert_to(v_snapshot_json::text || '|' || coalesce(v_snapshot_text, ''), 'UTF8'), 'sha256'::text), 'hex'),
        v_now)
    returning id into v_contract_id;

    if p_target_type = 'session' then
        update public.app_session set contract_id = v_contract_id where id = p_target_id;
    else
        update public.app_challenge set contract_id = v_contract_id where id = p_target_id;
        -- Workspace activity log (challenge only — sessions have no workspace)
        perform public.post_workspace_log(p_target_id, 'locked the terms for review');
    end if;

    return v_contract_id;
end;
$$;


ALTER FUNCTION "public"."lock_contract"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_snapshot_json" "jsonb", "p_snapshot_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_workspace_field_edit"("p_challenge_id" "uuid", "p_field" "text", "p_old" "jsonb", "p_new" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := (select auth.uid());
  v_is_party boolean;
begin
  if v_actor is null then return; end if;
  if p_challenge_id is null then return; end if;

  select (c.owner_id = v_actor) or exists (
    select 1 from public.app_challenge_cohost ch
    where ch.challenge_id = p_challenge_id
      and ch.cohost_id = v_actor
  ) into v_is_party
  from public.app_challenge c
  where c.id = p_challenge_id;

  if v_is_party is not true then return; end if;

  insert into public.app_workspace_activity(challenge_id, actor_id, kind, payload)
  values (
    p_challenge_id,
    v_actor,
    'field_edit',
    jsonb_build_object(
      'field', p_field,
      'old', coalesce(p_old, 'null'::jsonb),
      'new', coalesce(p_new, 'null'::jsonb)
    )
  );
end;
$$;


ALTER FUNCTION "public"."log_workspace_field_edit"("p_challenge_id" "uuid", "p_field" "text", "p_old" "jsonb", "p_new" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update public.app_notification
     set read_at = now()
   where recipient_id = auth.uid()
     and read_at is null;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update public.app_notification
     set read_at = now()
   where id = p_id
     and recipient_id = auth.uid();
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_collab_reputation"("limit_recent" integer DEFAULT 3) RETURNS TABLE("subject_id" "uuid", "reviews_count" integer, "avg_rating" numeric, "last_reviewed_at" timestamp with time zone, "recent" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
declare
  v_subject uuid := auth.uid();
begin
  if v_subject is null or not public.is_creator(v_subject) then
    raise exception 'forbidden: only creators can fetch collab reputation';
  end if;

  return query
  with mine as (
    select
      acr.id,
      acr.reviewer_id,
      acr.subject_id,
      acr.rating,
      acr.comment,
      acr.created_at,
      acr.updated_at
    from public.app_collab_review as acr
    where acr.subject_id = v_subject
  ),
  agg as (
    select
      v_subject::uuid                      as subject_id_out,
      count(*)::int                        as reviews_count,
      round(avg(mine.rating)::numeric, 2)  as avg_rating,
      max(mine.created_at)                 as last_reviewed_at
    from mine
  ),
  recent as (
    select coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'id', id,
                 'reviewer_id', reviewer_id,
                 'rating', rating,
                 'comment', comment,
                 'created_at', created_at,
                 'updated_at', updated_at
               )
               order by created_at desc
             ),
             '[]'::jsonb
           ) as recent
    from (select * from mine order by created_at desc limit limit_recent) x
  )
  select
    a.subject_id_out                        as subject_id,
    coalesce(a.reviews_count, 0)            as reviews_count,
    coalesce(a.avg_rating, 0)::numeric(4,2) as avg_rating,
    a.last_reviewed_at,
    r.recent
  from agg a
  cross join recent r;
end;
$$;


ALTER FUNCTION "public"."my_collab_reputation"("limit_recent" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notification_mark_all_read_before"("p_before" timestamp with time zone DEFAULT "now"()) RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid   uuid := auth.uid();
  v_count int;
begin
  if v_uid is null then
    raise exception 'unauthorized';
  end if;

  update public.app_notification n
     set read_at = coalesce(read_at, now())
   where n.recipient_id = v_uid
     and n.created_at   <= p_before
     and n.read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."notification_mark_all_read_before"("p_before" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notification_mark_read"("p_ids" "uuid"[]) RETURNS integer
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid   uuid := auth.uid();
  v_count int;
begin
  if v_uid is null then
    raise exception 'unauthorized';
  end if;

  update public.app_notification n
     set read_at = coalesce(read_at, now())
   where n.recipient_id = v_uid
     and n.id = any(p_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."notification_mark_read"("p_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_app_transaction_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_actor_claims jsonb;
  v_actor_id     uuid;
  v_actor_role   text;
  v_before       jsonb;
  v_after        jsonb;
  v_changed      text[];
  v_src_role     text := current_user;
  v_after_provider         text;
  v_after_provider_pid     text;
  v_after_status           text;
  v_after_buyer_id         uuid;
  v_after_session_id       uuid;
  v_after_challenge_id     uuid;
  v_after_currency         text;
BEGIN
  -- Pull actor from JWT if present (Edge functions pass no user JWT; service_role has none)
  BEGIN
    v_actor_claims := current_setting('request.jwt.claims', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    v_actor_claims := NULL;
  END;

  IF v_actor_claims ? 'sub' THEN
    v_actor_id := NULLIF( (v_actor_claims->>'sub'), '' )::uuid;
  END IF;
  IF v_actor_claims ? 'role' THEN
    v_actor_role := v_actor_claims->>'role';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after  := to_jsonb(NEW);
    v_changed := ARRAY[]::text[]; -- for insert, we store empty list (everything is new)
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);

    -- Compute changed column names (exclude volatile columns if you ever add them)
    SELECT coalesce(array_agg(k), ARRAY[]::text[])
    INTO v_changed
    FROM (
      SELECT k
      FROM jsonb_object_keys(v_after) AS k
      WHERE (v_before->>k) IS DISTINCT FROM (v_after->>k)
    ) diff;

    -- If nothing changed, skip logging (no-op update)
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NULL;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after  := NULL;
    v_changed := ARRAY[]::text[]; -- for delete, no changed set (row is gone)
  END IF;

  -- Denorm from "after" snapshot when available (else from before for delete)
  v_after_provider         := COALESCE( (v_after->>'provider'),         (v_before->>'provider') );
  v_after_provider_pid     := COALESCE( (v_after->>'provider_payment_id'), (v_before->>'provider_payment_id') );
  v_after_status           := COALESCE( (v_after->>'status'),           (v_before->>'status') );
  v_after_buyer_id         := COALESCE( NULLIF(v_after->>'buyer_id','')::uuid,    NULLIF(v_before->>'buyer_id','')::uuid );
  v_after_session_id       := COALESCE( NULLIF(v_after->>'session_id','')::uuid,  NULLIF(v_before->>'session_id','')::uuid );
  v_after_challenge_id     := COALESCE( NULLIF(v_after->>'challenge_id','')::uuid,NULLIF(v_before->>'challenge_id','')::uuid );
  v_after_currency         := COALESCE( (v_after->>'currency'),         (v_before->>'currency') );

  INSERT INTO public.app_transaction_audit (
    tx_id, op, actor_id, actor_role, source_role,
    changed_keys, before_row, after_row,
    provider, provider_payment_id, status, buyer_id, session_id, challenge_id, currency
  )
  VALUES (
    (CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END),
    lower(TG_OP),
    v_actor_id,
    v_actor_role,
    v_src_role,
    COALESCE(v_changed, ARRAY[]::text[]),
    v_before,
    v_after,
    v_after_provider, v_after_provider_pid, v_after_status,
    v_after_buyer_id, v_after_session_id, v_after_challenge_id, v_after_currency
  );

  RETURN NULL; -- statement-level side effect only
END;
$$;


ALTER FUNCTION "public"."on_app_transaction_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_collab_review_new"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.app_notification (recipient_id, type, payload)
  values (
    new.subject_id,
    'system',
    jsonb_build_object(
      'event', 'collab_review_new',
      'challenge_id', new.challenge_id,
      'review_id', new.id,
      'reviewer_id', new.reviewer_id,
      'rating', new.rating
    )
  );
  return null;
end;
$$;


ALTER FUNCTION "public"."on_collab_review_new"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_published_session_time_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if old.status = 'published'
     and new.start_time is distinct from old.start_time then

    if coalesce(new.change_reason, '') = '' then
      raise exception 'Changing start_time on a published session requires change_reason.'
        using errcode = '23514';
    end if;

    insert into public.app_notification (recipient_id, type, payload)
    select distinct
      recipients.recipient_id,
      'system',
      jsonb_build_object(
        'kind', 'session_time_changed',
        'session_id', new.id,
        'old_start_time', old.start_time,
        'new_start_time', new.start_time,
        'reason', new.change_reason
      )
    from (
      -- direct session buyers
      select t.buyer_id as recipient_id
      from public.app_transaction t
      where t.session_id = new.id
        and t.status = 'succeeded'

      union

      -- challenge bundle buyers for any parent challenge containing this session
      select t.buyer_id as recipient_id
      from public.app_challenge_session cs
      join public.app_transaction t
        on t.challenge_id = cs.challenge_id
      where cs.session_id = new.id
        and t.status = 'succeeded'

      union

      -- session host
      select new.host_id as recipient_id

      union

      -- session cohosts
      select sc.cohost_id as recipient_id
      from public.app_session_cohost sc
      where sc.session_id = new.id

      union

      -- challenge owners for any parent challenge containing this session
      select c.owner_id as recipient_id
      from public.app_challenge_session cs
      join public.app_challenge c
        on c.id = cs.challenge_id
      where cs.session_id = new.id

      union

      -- challenge cohosts for any parent challenge containing this session
      select cc.cohost_id as recipient_id
      from public.app_challenge_session cs
      join public.app_challenge_cohost cc
        on cc.challenge_id = cs.challenge_id
      where cs.session_id = new.id
    ) recipients
    where recipients.recipient_id is not null;

  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."on_published_session_time_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_review_new"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.app_notification (recipient_id, type, payload)
  values (
    new.creator_id,
    'review_new',
    jsonb_build_object(
      'event',       'review_new',
      'review_id',   new.id,
      'session_id',  new.session_id,
      'reviewer_id', new.reviewer_id,
      'rating',      new.rating,
      'preview',     left(coalesce(new.comment, ''), 160)
    )
  );
  return null; -- no row change needed; this is a side-effect trigger
end;
$$;


ALTER FUNCTION "public"."on_review_new"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_review_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- only notify if meaningful review fields changed
  if (new.rating is distinct from old.rating) or (new.comment is distinct from old.comment) then
    insert into public.app_notification (recipient_id, type, payload)
    values (
      new.creator_id,
      'review_updated',
      jsonb_build_object(
        'event',       'review_updated',
        'review_id',   new.id,
        'session_id',  new.session_id,
        'reviewer_id', new.reviewer_id,
        'old_rating',  old.rating,
        'new_rating',  new.rating,
        'preview',     left(coalesce(new.comment, ''), 160)
      )
    );
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."on_review_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."post_workspace_log"("p_challenge_id" "uuid", "p_body" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_convo_id uuid;
BEGIN
  IF v_actor IS NULL THEN RETURN; END IF;
  IF p_challenge_id IS NULL THEN RETURN; END IF;
  IF length(trim(coalesce(p_body, ''))) = 0 THEN RETURN; END IF;

  -- Find the workspace's DM conversation (any invite linked to this challenge)
  SELECT dm_conversation_id INTO v_convo_id
  FROM app_collaboration_invite
  WHERE challenge_id = p_challenge_id AND dm_conversation_id IS NOT NULL
  LIMIT 1;

  IF v_convo_id IS NULL THEN RETURN; END IF;

  -- Verify actor is a member (skip silently if not)
  IF NOT EXISTS (
    SELECT 1 FROM app_dm_member WHERE conversation_id = v_convo_id AND user_id = v_actor
  ) THEN RETURN; END IF;

  INSERT INTO app_dm_message (conversation_id, author_id, body, kind, metadata)
  VALUES (v_convo_id, v_actor, trim(p_body), 'system', coalesce(p_metadata, '{}'::jsonb));
END;
$$;


ALTER FUNCTION "public"."post_workspace_log"("p_challenge_id" "uuid", "p_body" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_reviews_for_creator"("p_creator" "uuid", "p_limit" integer DEFAULT 10, "p_before" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("id" "uuid", "rating" integer, "comment" "text", "created_at" timestamp with time zone, "reviewer_id" "uuid")
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    SET "row_security" TO 'on'
    AS $$
  select
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    r.reviewer_id
  from public.app_review r
  join public.app_profile p on p.id = r.creator_id
  where r.creator_id = p_creator
    and p.visibility = 'public'
    and (p_before is null or r.created_at < p_before)
  order by r.created_at desc
  limit greatest(p_limit, 1);
$$;


ALTER FUNCTION "public"."public_reviews_for_creator"("p_creator" "uuid", "p_limit" integer, "p_before" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_challenge"("p_challenge" "uuid", "p_caller" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  errs text[];
  v_title text;

  v_uid uuid := auth.uid();
  v_actor uuid := coalesce(v_uid, p_caller);
  v_now timestamptz := now();

  v_linked_session_errors text[] := array[]::text[];

  v_cohost uuid;
begin
  if v_uid is not null and v_uid <> p_caller then
    return jsonb_build_object('ok', false, 'errors', array['caller_mismatch_auth_uid']);
  end if;

  errs := public.challenge_can_publish(p_challenge, v_actor);
  if array_length(errs, 1) is not null then
    return jsonb_build_object('ok', false, 'errors', errs);
  end if;

  with linked_sessions as (
    select
      s.id, s.status, s.start_time, s.duration_minutes,
      coalesce((
        select sum(sc.split_percent)
        from public.app_session_cohost sc
        where sc.session_id = s.id
      ), 0) as total_split
    from public.app_challenge_session cs
    join public.app_session s on s.id = cs.session_id
    where cs.challenge_id = p_challenge
  ),
  issue_rows as (
    select format('linked_session_status_not_draft:%s', id)::text as issue
    from linked_sessions where status <> 'draft'
    union all
    select format('linked_session_start_time_missing:%s', id)::text
    from linked_sessions where start_time is null
    union all
    select format('linked_session_start_time_must_be_future:%s', id)::text
    from linked_sessions
    where start_time is not null and start_time <= v_now
    union all
    select format('linked_session_duration_invalid:%s', id)::text
    from linked_sessions
    where duration_minutes is null or duration_minutes <= 0
    union all
    select format('linked_session_cohost_split_exceeds_100:%s', id)::text
    from linked_sessions where total_split > 100
  )
  select coalesce(array_agg(issue order by issue), array[]::text[])
  into v_linked_session_errors
  from issue_rows;

  if array_length(v_linked_session_errors, 1) is not null then
    return jsonb_build_object('ok', false, 'errors', v_linked_session_errors);
  end if;

  update public.app_session s
     set status = 'published', published_at = v_now
  where s.id in (
    select cs.session_id
    from public.app_challenge_session cs
    where cs.challenge_id = p_challenge
  );

  update public.app_challenge
     set status = 'published', published_at = v_now
   where id = p_challenge;

  perform public.ensure_challenge_space_for_published_challenge(
    p_challenge, v_actor, null, null, null
  );

  select title into v_title from public.app_challenge where id = p_challenge;

  insert into public.app_feed_event (type, actor_id, session_id, challenge_id, metadata)
  values (
    'challenge_published',
    v_actor,
    null,
    p_challenge,
    jsonb_build_object('title', v_title)
  );

  for v_cohost in
    select cohost_id from public.app_challenge_cohost
    where challenge_id = p_challenge and cohost_id <> v_actor
  loop
    insert into public.app_notification (recipient_id, type, payload)
    values (
      v_cohost,
      'challenge_published',
      jsonb_build_object(
        'challenge_id', p_challenge,
        'title', v_title,
        'actor_id', v_actor
      )
    )
    on conflict do nothing;
  end loop;

  return jsonb_build_object('ok', true, 'challenge_id', p_challenge);
end;
$$;


ALTER FUNCTION "public"."publish_challenge"("p_challenge" "uuid", "p_caller" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_session"("p_session" "uuid", "p_caller" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  errs    text[];
  v_title text;
  v_uid   uuid := auth.uid();
  v_actor uuid := coalesce(v_uid, p_caller);
BEGIN
  -- Anti-spoofing: if JWT exists it must match p_caller
  IF v_uid IS NOT NULL AND v_uid <> p_caller THEN
    RETURN jsonb_build_object('ok', false, 'errors', array['caller_mismatch_auth_uid']);
  END IF;

  errs := public.session_can_publish(p_session, v_actor);

  IF array_length(errs, 1) IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'errors', errs);
  END IF;

  UPDATE public.app_session
     SET status       = 'published',
         published_at = now()
   WHERE id = p_session;

  SELECT title INTO v_title FROM public.app_session WHERE id = p_session;

  INSERT INTO public.app_feed_event (type, actor_id, session_id, challenge_id, metadata)
  VALUES (
    'session_published',
    v_actor,
    p_session,
    null,
    jsonb_build_object('title', v_title)
  );

  RETURN jsonb_build_object('ok', true, 'session_id', p_session);
END;
$$;


ALTER FUNCTION "public"."publish_session"("p_session" "uuid", "p_caller" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reactivate_drafting"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_contract_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_uid uuid := auth.uid();
    v_actor uuid := coalesce(v_uid, p_actor);
    v_bound_contract_id uuid;
    v_target_exists boolean;
begin
    if v_uid is not null and v_uid <> p_actor then
        raise exception 'caller_mismatch_auth_uid';
    end if;
    if p_target_type not in ('session', 'challenge') then
        raise exception 'invalid target type: %', p_target_type;
    end if;
    if p_target_id is null then raise exception 'target_id is required'; end if;
    if v_actor is null then raise exception 'actor is required'; end if;
    if p_contract_id is null then raise exception 'contract_id is required'; end if;

    if p_target_type = 'session' then
        select exists (select 1 from public.app_session s
            where s.id = p_target_id and s.host_id = v_actor) into v_target_exists;
        if not v_target_exists then raise exception 'session not found or actor is not host'; end if;

        select s.contract_id into v_bound_contract_id from public.app_session s
            where s.id = p_target_id and s.host_id = v_actor;
        if v_bound_contract_id is distinct from p_contract_id then
            raise exception 'supplied contract_id is not the currently bound contract for this session';
        end if;

        update public.app_session set contract_id = null
            where id = p_target_id and host_id = v_actor;
        if not found then raise exception 'session update failed under current RLS or ownership scope'; end if;

    else
        select exists (select 1 from public.app_challenge c
            where c.id = p_target_id and c.owner_id = v_actor) into v_target_exists;
        if not v_target_exists then raise exception 'challenge not found or actor is not owner'; end if;

        select c.contract_id into v_bound_contract_id from public.app_challenge c
            where c.id = p_target_id and c.owner_id = v_actor;
        if v_bound_contract_id is distinct from p_contract_id then
            raise exception 'supplied contract_id is not the currently bound contract for this challenge';
        end if;

        update public.app_challenge set contract_id = null
            where id = p_target_id and owner_id = v_actor;
        if not found then raise exception 'challenge update failed under current RLS or ownership scope'; end if;

        -- Workspace activity log (challenge only)
        perform public.post_workspace_log(p_target_id, 'reactivated the draft');
    end if;
end;
$$;


ALTER FUNCTION "public"."reactivate_drafting"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_contract_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_attendance"("p_session" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.app_attendance (session_id, user_id)
  values (p_session, auth.uid())
  on conflict (session_id, user_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."record_attendance"("p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reschedule_published_session"("p_session" "uuid", "p_new_start_time" timestamp with time zone, "p_change_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_uid uuid := auth.uid();
    v_host_id uuid;
    v_status public.session_status;
begin
    if v_uid is null then
        raise exception 'unauthorized';
    end if;

    if p_session is null then
        raise exception 'session_id is required';
    end if;

    if p_new_start_time is null then
        raise exception 'new_start_time is required';
    end if;

    if coalesce(btrim(p_change_reason), '') = '' then
        raise exception 'change_reason is required';
    end if;

    select
        s.host_id,
        s.status
    into
        v_host_id,
        v_status
    from public.app_session s
    where s.id = p_session;

    if v_host_id is null then
        raise exception 'session not found';
    end if;

    if v_host_id <> v_uid then
        raise exception 'forbidden: only session host may reschedule published session';
    end if;

    if v_status <> 'published' then
        raise exception 'only published sessions may be rescheduled through this rpc';
    end if;

    if p_new_start_time <= now() then
        raise exception 'new_start_time must be in the future';
    end if;

    update public.app_session s
    set
        start_time = p_new_start_time,
        change_reason = p_change_reason
    where s.id = p_session
      and s.host_id = v_uid
      and s.status = 'published';

    if not found then
        raise exception 'published session update failed';
    end if;
end;
$$;


ALTER FUNCTION "public"."reschedule_published_session"("p_session" "uuid", "p_new_start_time" timestamp with time zone, "p_change_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_contract"("p_contract_id" "uuid", "p_actor" "uuid", "p_response" "text", "p_comment" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  v_actor uuid := coalesce(v_uid, p_actor);
  v_target_type text;
  v_target_id uuid;
  v_actor_is_cohost boolean;
  v_owner_id uuid;
  v_other_cohost uuid;
begin
  if v_uid is not null and v_uid <> p_actor then
    raise exception 'caller_mismatch_auth_uid';
  end if;
  if p_contract_id is null then raise exception 'contract_id is required'; end if;
  if v_actor is null then raise exception 'actor is required'; end if;
  if p_response not in ('accept', 'decline') then
    raise exception 'invalid response: %', p_response;
  end if;

  select c.target_type, c.target_id into v_target_type, v_target_id
  from public.app_collaboration_contract c where c.id = p_contract_id;
  if v_target_type is null then raise exception 'contract not found or not visible to actor'; end if;

  if v_target_type = 'session' then
    select exists (
      select 1 from public.app_session_cohost sch
      where sch.session_id = v_target_id and sch.cohost_id = v_actor
    ) into v_actor_is_cohost;
  else
    select exists (
      select 1 from public.app_challenge_cohost cch
      where cch.challenge_id = v_target_id and cch.cohost_id = v_actor
    ) into v_actor_is_cohost;
  end if;

  if not v_actor_is_cohost then
    raise exception 'actor is not a collaborator on this contract target';
  end if;

  if p_response = 'accept' then
    delete from public.app_collaboration_decline
      where contract_id = p_contract_id and cohost_id = v_actor;
    insert into public.app_collaboration_acceptance (contract_id, cohost_id, accepted_at)
    values (p_contract_id, v_actor, now())
    on conflict (contract_id, cohost_id)
      do update set accepted_at = excluded.accepted_at;
  else
    delete from public.app_collaboration_acceptance
      where contract_id = p_contract_id and cohost_id = v_actor;
    insert into public.app_collaboration_decline (contract_id, cohost_id, declined_at, comment)
    values (p_contract_id, v_actor, now(), p_comment)
    on conflict (contract_id, cohost_id)
      do update set declined_at = excluded.declined_at, comment = excluded.comment;
  end if;

  if v_target_type = 'challenge' then
    perform public.post_workspace_log(
      v_target_id,
      case when p_response = 'accept' then 'confirmed the terms' else 'requested changes' end
    );

    select owner_id into v_owner_id from public.app_challenge where id = v_target_id;

    if p_response = 'accept' then
      if v_owner_id is not null and v_owner_id <> v_actor then
        insert into public.app_notification (recipient_id, type, payload)
        values (
          v_owner_id,
          'contract_accepted',
          jsonb_build_object(
            'challenge_id', v_target_id,
            'contract_id', p_contract_id,
            'actor_id', v_actor
          )
        )
        on conflict do nothing;
      end if;

      for v_other_cohost in
        select cohost_id from public.app_challenge_cohost
        where challenge_id = v_target_id and cohost_id <> v_actor
      loop
        insert into public.app_notification (recipient_id, type, payload)
        values (
          v_other_cohost,
          'contract_accepted',
          jsonb_build_object(
            'challenge_id', v_target_id,
            'contract_id', p_contract_id,
            'actor_id', v_actor
          )
        )
        on conflict do nothing;
      end loop;
    else
      if v_owner_id is not null and v_owner_id <> v_actor then
        insert into public.app_notification (recipient_id, type, payload)
        values (
          v_owner_id,
          'contract_declined',
          jsonb_build_object(
            'challenge_id', v_target_id,
            'contract_id', p_contract_id,
            'actor_id', v_actor,
            'comment', coalesce(p_comment, '')
          )
        )
        on conflict do nothing;
      end if;
    end if;
  end if;
end;
$$;


ALTER FUNCTION "public"."respond_to_contract"("p_contract_id" "uuid", "p_actor" "uuid", "p_response" "text", "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_additional_collab_invite"("p_challenge_id" "uuid", "p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split_percent" integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invite_id uuid;
  v_convo_id uuid;
  v_owner uuid;
  v_status text;
BEGIN
  -- Validate: sender must be challenge owner + challenge must be draft
  SELECT owner_id, status INTO v_owner, v_status FROM app_challenge WHERE id = p_challenge_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'challenge_not_found'; END IF;
  IF v_owner != p_from THEN RAISE EXCEPTION 'only_owner_can_invite'; END IF;
  IF v_status != 'draft' THEN RAISE EXCEPTION 'challenge_not_draft'; END IF;

  IF p_from = p_to THEN RAISE EXCEPTION 'cannot_invite_self'; END IF;
  IF p_split_percent < 0 OR p_split_percent > 100 THEN RAISE EXCEPTION 'invalid_split'; END IF;
  IF NOT EXISTS (SELECT 1 FROM app_profile WHERE id = p_to AND role = 'creator') THEN
    RAISE EXCEPTION 'target_not_creator';
  END IF;

  -- Don't invite someone who's already a cohost
  IF EXISTS (SELECT 1 FROM app_challenge_cohost WHERE challenge_id = p_challenge_id AND cohost_id = p_to) THEN
    RAISE EXCEPTION 'already_a_cohost';
  END IF;

  -- Don't duplicate pending invites
  IF EXISTS (
    SELECT 1 FROM app_collaboration_invite
    WHERE challenge_id = p_challenge_id AND to_id = p_to AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'already_invited';
  END IF;

  -- Find existing DM conversation for this challenge
  SELECT dm_conversation_id INTO v_convo_id
  FROM app_collaboration_invite
  WHERE challenge_id = p_challenge_id AND dm_conversation_id IS NOT NULL
  LIMIT 1;

  -- If no DM yet, create one with owner as member
  IF v_convo_id IS NULL THEN
    INSERT INTO app_dm_conversation (created_by) VALUES (p_from) RETURNING id INTO v_convo_id;
    INSERT INTO app_dm_member (conversation_id, user_id) VALUES (v_convo_id, p_from);
  END IF;

  -- Create invite
  INSERT INTO app_collaboration_invite (
    from_id, to_id, message, initial_split_percent,
    challenge_id, dm_conversation_id
  )
  VALUES (
    p_from, p_to, COALESCE(trim(p_message), ''), p_split_percent,
    p_challenge_id, v_convo_id
  )
  RETURNING id INTO v_invite_id;

  -- Notify
  INSERT INTO app_notification (recipient_id, type, payload)
  VALUES (p_to, 'collab_invite', jsonb_build_object(
    'invite_id', v_invite_id,
    'from_id', p_from,
    'challenge_id', p_challenge_id
  ));

  RETURN v_invite_id;
END;
$$;


ALTER FUNCTION "public"."send_additional_collab_invite"("p_challenge_id" "uuid", "p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split_percent" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_collab_invite"("p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split" integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  -- Validate
  IF p_from = p_to THEN RAISE EXCEPTION 'cannot_invite_self'; END IF;
  IF p_split < 0 OR p_split > 100 THEN RAISE EXCEPTION 'invalid_split'; END IF;
  IF length(trim(p_message)) = 0 THEN RAISE EXCEPTION 'message_required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM app_profile WHERE id = p_to AND role = 'creator') THEN
    RAISE EXCEPTION 'target_not_creator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM app_profile WHERE id = p_from AND role = 'creator') THEN
    RAISE EXCEPTION 'sender_not_creator';
  END IF;

  -- Insert invite
  INSERT INTO app_collaboration_invite (from_id, to_id, message, initial_split_percent)
  VALUES (p_from, p_to, trim(p_message), p_split)
  RETURNING id INTO v_invite_id;

  -- Notify recipient
  INSERT INTO app_notification (recipient_id, type, payload)
  VALUES (p_to, 'collab_invite', jsonb_build_object('invite_id', v_invite_id, 'from_id', p_from));

  RETURN v_invite_id;
END;
$$;


ALTER FUNCTION "public"."send_collab_invite"("p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_collab_invites_with_draft"("p_from" "uuid", "p_title" "text", "p_message" "text", "p_invitees" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_challenge_id uuid;
  v_convo_id uuid;
  v_invitee jsonb;
  v_to_id uuid;
  v_split int;
  v_invite_id uuid;
  v_start date := current_date + 7;
  v_end date := current_date + 35;
BEGIN
  -- Validate sender is a creator
  IF NOT EXISTS (SELECT 1 FROM app_profile WHERE id = p_from AND role = 'creator') THEN
    RAISE EXCEPTION 'sender_not_creator';
  END IF;

  IF jsonb_array_length(p_invitees) = 0 THEN
    RAISE EXCEPTION 'no_invitees';
  END IF;

  -- Create the draft challenge
  INSERT INTO app_challenge (title, start_date, end_date, price_cents, currency, owner_id)
  VALUES (
    COALESCE(NULLIF(trim(p_title), ''), 'Untitled Collaboration'),
    v_start, v_end, 0, 'CHF', p_from
  )
  RETURNING id INTO v_challenge_id;

  -- Create DM conversation with sender as first member
  INSERT INTO app_dm_conversation (created_by) VALUES (p_from) RETURNING id INTO v_convo_id;
  INSERT INTO app_dm_member (conversation_id, user_id) VALUES (v_convo_id, p_from);

  -- Post the first message (the pitch)
  IF length(trim(COALESCE(p_message, ''))) > 0 THEN
    INSERT INTO app_dm_message (conversation_id, author_id, body)
    VALUES (v_convo_id, p_from, trim(p_message));
  END IF;

  -- Create invites for each invitee
  FOR v_invitee IN SELECT * FROM jsonb_array_elements(p_invitees)
  LOOP
    v_to_id := (v_invitee->>'to_id')::uuid;
    v_split := COALESCE((v_invitee->>'split_percent')::int, 0);

    IF v_to_id = p_from THEN CONTINUE; END IF;
    IF v_split < 0 OR v_split > 100 THEN RAISE EXCEPTION 'invalid_split'; END IF;
    IF NOT EXISTS (SELECT 1 FROM app_profile WHERE id = v_to_id AND role = 'creator') THEN
      RAISE EXCEPTION 'invitee_not_creator: %', v_to_id;
    END IF;

    INSERT INTO app_collaboration_invite (
      from_id, to_id, message, initial_split_percent,
      challenge_id, dm_conversation_id
    )
    VALUES (
      p_from, v_to_id, COALESCE(p_message, ''), v_split,
      v_challenge_id, v_convo_id
    )
    RETURNING id INTO v_invite_id;

    INSERT INTO app_notification (recipient_id, type, payload)
    VALUES (v_to_id, 'collab_invite', jsonb_build_object(
      'invite_id', v_invite_id,
      'from_id', p_from,
      'challenge_id', v_challenge_id
    ));
  END LOOP;

  RETURN v_challenge_id;
END;
$$;


ALTER FUNCTION "public"."send_collab_invites_with_draft"("p_from" "uuid", "p_title" "text", "p_message" "text", "p_invitees" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."session_can_publish"("p_session" "uuid", "p_caller" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $_$
declare
  issues text[] := array[]::text[];

  v_host uuid;
  v_status text;
  v_start timestamptz;
  v_price_cents int;
  v_currency text;
  v_challenge uuid;
  v_ch_price int;
  v_total_split int;

  v_contract_id uuid;
  v_contract_target_type text;
  v_contract_target_id uuid;
  v_contract_locked_at timestamptz;

  v_required_cohost_count int;
  v_accepted_cohost_count int;
  v_decline_count int;
  v_missing_split_count int;
begin
  select
    host_id,
    status,
    start_time,
    price_cents,
    currency,
    contract_id
  into
    v_host,
    v_status,
    v_start,
    v_price_cents,
    v_currency,
    v_contract_id
  from public.app_session
  where id = p_session;

  if v_host is null then
    issues := issues || array['session_not_found'];
    return issues;
  end if;

  if v_host <> p_caller then
    issues := issues || array['only_host_can_publish'];
  end if;

  if v_status <> 'draft' then
    issues := issues || array[format('status_must_be_draft_current=%s', v_status)];
  end if;

  if v_start is null then
    issues := issues || array['start_time_missing'];
  elsif v_start <= now() then
    issues := issues || array['start_time_must_be_future'];
  end if;

  if v_currency is null or v_currency !~ '^[A-Z]{3}$' then
    issues := issues || array['currency_invalid'];
  end if;

  -- Detect challenge linkage
  select cs.challenge_id
  into v_challenge
  from public.app_challenge_session cs
  where cs.session_id = p_session
  limit 1;

  -- Pricing:
  -- standalone session -> own price required
  -- challenge-linked session -> own price OR priced parent challenge
  if coalesce(v_price_cents, 0) <= 0 then
    if v_challenge is null then
      issues := issues || array['price_must_be_positive_or_in_priced_challenge'];
    else
      select price_cents
      into v_ch_price
      from public.app_challenge
      where id = v_challenge;

      if coalesce(v_ch_price, 0) <= 0 then
        issues := issues || array['parent_challenge_price_must_be_positive'];
      end if;
    end if;
  end if;

  select coalesce(sum(split_percent), 0)
  into v_total_split
  from public.app_session_cohost
  where session_id = p_session;

  if v_total_split > 100 then
    issues := issues || array[format('cohost_split_exceeds_100_total=%s', v_total_split)];
  end if;

  -- Determine whether this is a collaborative session
  select count(*)
  into v_required_cohost_count
  from public.app_session_cohost
  where session_id = p_session;

  -- Solo session: no contract required
  if v_required_cohost_count = 0 then
    return issues;
  end if;

  -- Standalone collaborative session: explicit split is mandatory for every cohost row
  if v_challenge is null then
    select count(*)
    into v_missing_split_count
    from public.app_session_cohost sch
    where sch.session_id = p_session
      and sch.split_percent is null;

    if v_missing_split_count > 0 then
      issues := issues || array['standalone_session_cohost_split_missing'];
    end if;
  end if;

  -- Challenge-linked collaborative session: no session-level contract required
  if v_challenge is not null then
    return issues;
  end if;

  -- Standalone collaborative session: contract is required
  if v_contract_id is null then
    issues := issues || array['contract_id_missing'];
    return issues;
  end if;

  select
    c.target_type,
    c.target_id,
    c.locked_at
  into
    v_contract_target_type,
    v_contract_target_id,
    v_contract_locked_at
  from public.app_collaboration_contract c
  where c.id = v_contract_id;

  if v_contract_target_type is null then
    issues := issues || array['bound_contract_not_found'];
    return issues;
  end if;

  if v_contract_target_type <> 'session'
     or v_contract_target_id is distinct from p_session then
    issues := issues || array['bound_contract_target_mismatch'];
  end if;

  if v_contract_locked_at is null then
    issues := issues || array['bound_contract_not_locked'];
  end if;

  select count(*)
  into v_decline_count
  from public.app_collaboration_decline d
  where d.contract_id = v_contract_id;

  if v_decline_count > 0 then
    issues := issues || array['contract_has_decline'];
  end if;

  select count(distinct a.cohost_id)
  into v_accepted_cohost_count
  from public.app_collaboration_acceptance a
  join public.app_session_cohost sch
    on sch.cohost_id = a.cohost_id
   and sch.session_id = p_session
  where a.contract_id = v_contract_id;

  if coalesce(v_accepted_cohost_count, 0) <> v_required_cohost_count then
    issues := issues || array['session_cohosts_not_all_accepted_bound_contract'];
  end if;

  return issues;
end;
$_$;


ALTER FUNCTION "public"."session_can_publish"("p_session" "uuid", "p_caller" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."session_has_purchases"("p_session" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select exists (
    select 1 from public.app_transaction t
    where t.session_id = p_session and t.status='succeeded'
  );
$$;


ALTER FUNCTION "public"."session_has_purchases"("p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."session_split_preview"("p_session" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
with
gross as (
  -- sum of what buyers agreed to pay to the creator(s) BEFORE fees
  select coalesce(sum(t.amount_gross_cents),0)::bigint as total_gross_cents
  from public.app_transaction t
  where t.session_id = p_session
    and t.status = 'succeeded'
),
split_map as (
  -- {"user_uuid": "percent", ...}
  select (k)::uuid as user_id,
         (v)::int  as pct
  from jsonb_each_text(public.get_session_split_map(p_session)) as e(k,v)
)
select jsonb_object_agg(
  user_id,
  floor(
    (pct * (select total_gross_cents from gross)) / 100.0
  )::bigint
)
from split_map;
$$;


ALTER FUNCTION "public"."session_split_preview"("p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."session_spots_left"("p_session" "uuid") RETURNS integer
    LANGUAGE "sql"
    SET "search_path" TO ''
    AS $$
  SELECT CASE
    WHEN s.capacity IS NULL THEN NULL
    ELSE greatest(
      s.capacity - (SELECT count(*) FROM public.app_attendance a WHERE a.session_id = s.id),
      0
    )
  END
  FROM public.app_session s
  WHERE s.id = p_session;
$$;


ALTER FUNCTION "public"."session_spots_left"("p_session" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_badge_visibility"("p_user_badge_id" bigint, "p_visible_on_profile" boolean, "p_pinned_on_profile" boolean) RETURNS "public"."app_user_badge"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid   uuid;
  v_badge public.app_user_badge;
begin
  -- Auth check
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'set_badge_visibility: not authenticated';
  end if;

  -- Update ONLY this user's own badge
  update public.app_user_badge ub
  set
    visible_on_profile = coalesce(p_visible_on_profile, ub.visible_on_profile),
    pinned_on_profile  = coalesce(p_pinned_on_profile,  ub.pinned_on_profile)
  where ub.id = p_user_badge_id
    and ub.user_id = v_uid   -- hard ownership check
  returning * into v_badge;

  if not found then
    raise exception 'set_badge_visibility: badge not found or not permitted';
  end if;

  return v_badge;
end;
$$;


ALTER FUNCTION "public"."set_badge_visibility"("p_user_badge_id" bigint, "p_visible_on_profile" boolean, "p_pinned_on_profile" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stream_tokens_purge_expired"("limit_rows" integer DEFAULT 1000) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  -- Defensive clamp
  IF limit_rows IS NULL OR limit_rows <= 0 THEN
    limit_rows := 1000;
  END IF;

  -- Delete a bounded slice by PK (session_id,user_id) using expires_at index
  WITH doomed AS (
    SELECT session_id, user_id
    FROM public.app_stream_token
    WHERE expires_at < now()
    ORDER BY expires_at ASC
    LIMIT limit_rows
  )
  DELETE FROM public.app_stream_token t
  USING doomed d
  WHERE t.session_id = d.session_id
    AND t.user_id    = d.user_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;


ALTER FUNCTION "public"."stream_tokens_purge_expired"("limit_rows" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_intro_post"("p_challenge_id" "uuid", "p_body" "text", "p_share_with_cohort" boolean DEFAULT true) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_space_id uuid;
  v_post_id uuid;
  v_kind text;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_challenge_id is null then raise exception 'challenge_id is required'; end if;
  if v_body is null then raise exception 'body is required'; end if;
  if length(v_body) > 2000 then raise exception 'intro is too long'; end if;

  if not exists (
    select 1 from public.app_challenge_member
    where challenge_id = p_challenge_id and user_id = v_actor
  ) then
    raise exception 'not enrolled in this challenge';
  end if;

  select id into v_space_id
  from public.app_challenge_space
  where source_challenge_id = p_challenge_id
  limit 1;

  if v_space_id is null then
    raise exception 'no challenge space for this challenge';
  end if;

  if exists (
    select 1 from public.app_challenge_post p
    where p.space_id = v_space_id
      and p.author_id = v_actor
      and p.kind in ('intro','intro_private')
  ) then
    raise exception 'intro already posted';
  end if;

  v_kind := case when p_share_with_cohort then 'intro' else 'intro_private' end;

  insert into public.app_challenge_post (space_id, author_id, body, kind)
  values (v_space_id, v_actor, v_body, v_kind)
  returning id into v_post_id;

  return v_post_id;
end;
$$;


ALTER FUNCTION "public"."submit_intro_post"("p_challenge_id" "uuid", "p_body" "text", "p_share_with_cohort" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_pre_pulse"("p_session_id" "uuid", "p_value" smallint) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_session_id is null then raise exception 'session_id is required'; end if;
  if p_value is null or p_value < 0 or p_value > 10 then
    raise exception 'value must be between 0 and 10';
  end if;

  insert into public.app_session_pre_pulse_response (session_id, user_id, value)
  values (p_session_id, v_actor, p_value)
  on conflict (session_id, user_id)
  do update set value = excluded.value, created_at = now();
end;
$$;


ALTER FUNCTION "public"."submit_pre_pulse"("p_session_id" "uuid", "p_value" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_session_reflection"("p_session_id" "uuid", "p_body" "text", "p_energy_after" smallint DEFAULT NULL::smallint) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_space_id uuid;
  v_post_id uuid;
  v_metadata jsonb := '{}'::jsonb;
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if p_session_id is null then raise exception 'session_id is required'; end if;
  if v_body is null and p_energy_after is null then
    raise exception 'reflection requires body or energy value';
  end if;
  if p_energy_after is not null and (p_energy_after < 0 or p_energy_after > 10) then
    raise exception 'energy_after must be between 0 and 10';
  end if;

  if not exists (
    select 1
    from public.app_attendance a
    join public.app_session s on s.id = a.session_id
    where a.session_id = p_session_id
      and a.user_id = v_actor
      and s.ended_at is not null
  ) then
    raise exception 'not eligible to reflect on this session';
  end if;

  select cs.id into v_space_id
  from public.app_challenge_session csess
  join public.app_challenge_space cs on cs.source_challenge_id = csess.challenge_id
  where csess.session_id = p_session_id
  limit 1;

  if v_space_id is null then
    raise exception 'no challenge space for this session';
  end if;

  if p_energy_after is not null then
    v_metadata := jsonb_build_object('energy_after', p_energy_after);
  end if;

  insert into public.app_challenge_post (
    space_id, author_id, body, kind, context_type, context_id, metadata
  ) values (
    v_space_id,
    v_actor,
    coalesce(v_body, ''),
    'reflection',
    'session',
    p_session_id,
    v_metadata
  ) returning id into v_post_id;

  return v_post_id;
end;
$$;


ALTER FUNCTION "public"."submit_session_reflection"("p_session_id" "uuid", "p_body" "text", "p_energy_after" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_dm_message_notify"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- System messages (kind != 'user') are framework chatter — workspace
  -- audit log, "joined the collaboration", etc. They should not generate
  -- notifications. Real human chat (kind='user') is the only thing that
  -- earns a dm_new ping.
  if new.kind is not null and new.kind <> 'user' then
    return new;
  end if;

  insert into app_notification (recipient_id, type, payload)
  select
    m.user_id,
    'dm_new',
    jsonb_build_object(
      'conversation_id', new.conversation_id,
      'message_id', new.id,
      'actor_id', new.author_id,
      'preview', left(coalesce(new.body, ''), 140)
    )
  from app_dm_member m
  where m.conversation_id = new.conversation_id
    and m.user_id <> new.author_id
  on conflict do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."trg_dm_message_notify"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_tx_auto_join_creator_space"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    v_space_id uuid;
begin
    -- Fire only when transaction is succeeded and it was not succeeded before
    if not (
        (tg_op = 'INSERT' and new.status = 'succeeded')
        or
        (tg_op = 'UPDATE' and new.status = 'succeeded' and old.status is distinct from 'succeeded')
    ) then
        return new;
    end if;

    -- Must have creator + buyer
    if new.creator_id is null or new.buyer_id is null then
        return new;
    end if;

    -- Ensure creator tribe exists
    select s.id
    into v_space_id
    from public.app_creator_space s
    where s.creator_id = new.creator_id
    limit 1;

    if v_space_id is null then
        insert into public.app_creator_space (
            creator_id,
            title,
            description
        )
        select
            p.id,
            coalesce(p.display_name, p.full_name, p.username, 'Creator Tribe'),
            null
        from public.app_profile p
        where p.id = new.creator_id
        returning id into v_space_id;
    end if;

    -- Auto-create membership (interaction right)
    if v_space_id is not null then
        insert into public.app_creator_space_member (
            space_id,
            user_id
        )
        values (
            v_space_id,
            new.buyer_id
        )
        on conflict do nothing;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."trg_tx_auto_join_creator_space"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_tx_enqueue_receipt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_exists boolean;
begin
  -- Fire only when status is 'succeeded' and it wasn't succeeded before
  if (TG_OP = 'INSERT' and NEW.status = 'succeeded')
     or (TG_OP = 'UPDATE' and NEW.status = 'succeeded' and (OLD.status is distinct from 'succeeded'))
  then
    -- Skip if an outbox row already exists
    select exists (
      select 1 from public.app_email_outbox
      where kind='receipt' and tx_id = NEW.id
    ) into v_exists;

    if not v_exists then
      -- Enqueue. Let the function validate email & status and raise if something is off.
      perform public.admin_email_enqueue_receipt(NEW.id);
    end if;
  end if;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."trg_tx_enqueue_receipt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unlike_challenge_post"("p_post" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_space_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_post is null then
        raise exception 'post_id is required';
    end if;

    select p.space_id
    into v_space_id
    from public.app_challenge_post p
    where p.id = p_post;

    if v_space_id is null then
        raise exception 'Challenge post not found';
    end if;

    if not public.can_access_challenge_space(v_space_id, v_actor) then
        raise exception 'Forbidden: you may not unlike posts in this challenge space';
    end if;

    delete from public.app_challenge_post_like
    where post_id = p_post
      and user_id = v_actor;
end;
$$;


ALTER FUNCTION "public"."unlike_challenge_post"("p_post" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unlike_creator_post"("p_post" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
    v_actor uuid := auth.uid();
    v_space_id uuid;
begin
    if v_actor is null then
        raise exception 'Unauthorized';
    end if;

    if p_post is null then
        raise exception 'post_id is required';
    end if;

    select p.space_id
    into v_space_id
    from public.app_creator_post p
    where p.id = p_post;

    if v_space_id is null then
        raise exception 'Creator post not found';
    end if;

    if not public.can_interact_creator_space(v_space_id, v_actor) then
        raise exception 'Forbidden: you may not unlike posts in this creator tribe';
    end if;

    delete from public.app_creator_post_like
    where post_id = p_post
      and user_id = v_actor;
end;
$$;


ALTER FUNCTION "public"."unlike_creator_post"("p_post" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_challenge_comment"("p_id" "uuid", "p_body" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_author uuid;
begin
  if v_actor is null then raise exception 'Unauthorized'; end if;
  if coalesce(btrim(p_body), '') = '' then raise exception 'body is required'; end if;

  select author_id into v_author from public.app_challenge_comment where id = p_id;
  if v_author is null then raise exception 'comment not found'; end if;
  if v_author <> v_actor then raise exception 'Forbidden'; end if;

  update public.app_challenge_comment
    set body = btrim(p_body),
        edited_at = now(),
        edited_by = v_actor
    where id = p_id;
end;
$$;


ALTER FUNCTION "public"."update_challenge_comment"("p_id" "uuid", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_challenge_workspace"("p_challenge_id" "uuid", "p_title" "text", "p_description" "text", "p_image_url" "text", "p_start_date" "date", "p_end_date" "date", "p_capacity" integer, "p_price_cents" integer, "p_promise_text" "text" DEFAULT NULL::"text", "p_weekly_arc" "jsonb" DEFAULT NULL::"jsonb", "p_topic_ownership" "jsonb" DEFAULT NULL::"jsonb", "p_intro_prompt" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := auth.uid();
  v_owner_id uuid;
  v_status challenge_status;
  v_contract_id uuid;
  v_is_party boolean;
  v_promise_changed boolean := false;
begin
  if v_actor is null then raise exception 'not_authenticated'; end if;

  select owner_id, status, contract_id
  into v_owner_id, v_status, v_contract_id
  from public.app_challenge
  where id = p_challenge_id;

  if v_owner_id is null then raise exception 'challenge_not_found'; end if;
  if v_status <> 'draft' then raise exception 'challenge_not_draft'; end if;
  if v_contract_id is not null then raise exception 'challenge_locked'; end if;

  v_is_party := (v_owner_id = v_actor)
    or exists (
      select 1 from public.app_challenge_cohost
      where challenge_id = p_challenge_id and cohost_id = v_actor
    );
  if not v_is_party then raise exception 'not_a_collaborator'; end if;

  if p_title is null or length(trim(p_title)) < 3 then raise exception 'title_too_short'; end if;
  if p_start_date is null or p_end_date is null then raise exception 'dates_required'; end if;
  if p_end_date <= p_start_date then raise exception 'end_before_start'; end if;
  if p_capacity is not null and (p_capacity < 1 or p_capacity > 10000) then raise exception 'capacity_out_of_range'; end if;
  if p_price_cents is null or p_price_cents < 0 then raise exception 'invalid_price'; end if;
  if p_promise_text is not null and length(p_promise_text) > 600 then raise exception 'promise_too_long'; end if;
  if p_weekly_arc is not null and jsonb_typeof(p_weekly_arc) <> 'array' then raise exception 'weekly_arc_must_be_array'; end if;
  if p_topic_ownership is not null and jsonb_typeof(p_topic_ownership) <> 'array' then raise exception 'topic_ownership_must_be_array'; end if;
  if p_intro_prompt is not null and length(p_intro_prompt) > 500 then raise exception 'intro_prompt_too_long'; end if;

  v_promise_changed := (
    p_promise_text is not null
    or p_weekly_arc is not null
    or p_topic_ownership is not null
    or p_intro_prompt is not null
  );

  update public.app_challenge set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    image_url = nullif(trim(coalesce(p_image_url, '')), ''),
    start_date = p_start_date,
    end_date = p_end_date,
    capacity = p_capacity,
    price_cents = p_price_cents,
    promise_text = case when p_promise_text is not null
      then nullif(trim(p_promise_text), '')
      else promise_text end,
    weekly_arc = case when p_weekly_arc is not null
      then p_weekly_arc
      else weekly_arc end,
    topic_ownership = case when p_topic_ownership is not null
      then p_topic_ownership
      else topic_ownership end,
    intro_prompt = case when p_intro_prompt is not null
      then nullif(trim(p_intro_prompt), '')
      else intro_prompt end,
    promise_edited_at = case when v_promise_changed then now()
      else promise_edited_at end,
    promise_edited_by = case when v_promise_changed then v_actor
      else promise_edited_by end
  where id = p_challenge_id;
end;
$$;


ALTER FUNCTION "public"."update_challenge_workspace"("p_challenge_id" "uuid", "p_title" "text", "p_description" "text", "p_image_url" "text", "p_start_date" "date", "p_end_date" "date", "p_capacity" integer, "p_price_cents" integer, "p_promise_text" "text", "p_weekly_arc" "jsonb", "p_topic_ownership" "jsonb", "p_intro_prompt" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_weekly_arc_themes"("p_challenge_id" "uuid", "p_weekly_arc" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor uuid := (select auth.uid());
  v_is_party boolean;
begin
  if v_actor is null then
    raise exception 'not_authenticated';
  end if;
  if p_weekly_arc is null or jsonb_typeof(p_weekly_arc) <> 'array' then
    raise exception 'weekly_arc_must_be_array';
  end if;

  select (c.owner_id = v_actor) or exists (
    select 1 from public.app_challenge_cohost ch
    where ch.challenge_id = p_challenge_id and ch.cohost_id = v_actor
  ) into v_is_party
  from public.app_challenge c
  where c.id = p_challenge_id;

  if v_is_party is not true then
    raise exception 'not_a_collaborator';
  end if;

  update public.app_challenge set
    weekly_arc = p_weekly_arc,
    promise_edited_at = now(),
    promise_edited_by = v_actor
  where id = p_challenge_id;
end;
$$;


ALTER FUNCTION "public"."update_weekly_arc_themes"("p_challenge_id" "uuid", "p_weekly_arc" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_review"("p_session_id" "uuid", "p_rating" integer, "p_comment" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "session_id" "uuid", "rating" integer, "comment" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_creator    uuid;
  v_id         uuid;
  v_session_id uuid;
  v_rating     int;
  v_comment    text;
  v_created_at timestamptz;
begin
  -- Find session host (creator)
  select s.host_id
    into v_creator
  from public.app_session s
  where s.id = p_session_id;

  if v_creator is null then
    raise exception 'Session not found';
  end if;

  -- Try update user's existing review (RLS enforces "own + 24h window")
  update public.app_review r
  set rating  = p_rating,
      comment = p_comment
  where r.session_id  = p_session_id
    and r.reviewer_id = auth.uid()
  returning r.id, r.session_id, r.rating, r.comment, r.created_at
  into v_id, v_session_id, v_rating, v_comment, v_created_at;

  -- If nothing updated, insert (RLS enforces: attended + session ended)
  if not found then
    insert into public.app_review (session_id, reviewer_id, creator_id, rating, comment)
    values (p_session_id, auth.uid(), v_creator, p_rating, p_comment)
    returning app_review.id,
              app_review.session_id,
              app_review.rating,
              app_review.comment,
              app_review.created_at
    into v_id, v_session_id, v_rating, v_comment, v_created_at;
  end if;

  return query
  select v_id, v_session_id, v_rating, v_comment, v_created_at;
end;
$$;


ALTER FUNCTION "public"."upsert_review"("p_session_id" "uuid", "p_rating" integer, "p_comment" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_transaction_from_checkout"("buyer_id" "uuid", "creator_id" "uuid", "session_id" "uuid", "challenge_id" "uuid", "tx_type" "text", "status" "text", "quantity" integer, "currency" "text", "amount_gross_cents" bigint, "processing_fee_fixed_cents" bigint, "processing_fee_percent_cents" bigint, "amount_after_stripe_cents" bigint, "creator_cut_cents" bigint, "platform_cut_cents" bigint, "provider" "text", "provider_payment_id" "text", "metadata" "jsonb") RETURNS TABLE("inserted" boolean, "app_transaction_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $_$
declare
  v_existing uuid;
  v_type_enum public.payment_type;
  v_status_enum public.payment_status;
begin
  -- 1) Normalize / validate enums

  -- tx_type -> payment_type enum
  -- we mapped:
  --   session purchase     -> 'ticket'
  --   challenge bundle     -> 'bundle'
  --   subscription (later) -> 'subscription'
  if tx_type not in ('ticket','bundle','subscription') then
    raise exception 'Invalid tx_type: %', tx_type;
  end if;
  v_type_enum := tx_type::public.payment_type;

  -- status -> payment_status enum ('succeeded','failed','pending',...)
  if status not in ('succeeded','failed','pending','canceled','requires_action') then
    raise exception 'Invalid status: %', status;
  end if;
  v_status_enum := status::public.payment_status;

  -- currency check: we currently enforce "CHF" in the rest of the system,
  -- but we'll allow any 3-letter uppercase here and trust RLS/reporting logic later.
  if currency !~ '^[A-Z]{3}$' then
    raise exception 'Invalid currency: %', currency;
  end if;

  -- sanity: quantity
  if quantity is null or quantity < 1 then
    quantity := 1;
  end if;

  -- 2) If we already have this provider_payment_id, return that row instead of inserting again
  select t.id
    into v_existing
  from public.app_transaction t
  where t.provider = provider
    and t.provider_payment_id = provider_payment_id
  limit 1;

  if v_existing is not null then
    -- already stored this transaction
    inserted := false;
    app_transaction_id := v_existing;
    return next;
    return;
  end if;

  -- 3) Insert a fresh row
  insert into public.app_transaction (
    buyer_id,
    creator_id,
    session_id,
    challenge_id,
    type,
    status,
    quantity,
    provider,
    provider_payment_id,
    metadata,
    -- money columns, all cents
    currency,
    amount_gross_cents,
    processing_fee_fixed_cents,
    processing_fee_percent_cents,
    amount_after_stripe_cents,
    creator_cut_cents,
    platform_cut_cents
  )
  values (
    buyer_id,
    creator_id,
    session_id,
    challenge_id,
    v_type_enum,
    v_status_enum,
    quantity,
    provider,
    provider_payment_id,
    coalesce(metadata, '{}'::jsonb),

    upper(currency),
    amount_gross_cents,
    processing_fee_fixed_cents,
    processing_fee_percent_cents,
    amount_after_stripe_cents,
    creator_cut_cents,
    platform_cut_cents
  )
  returning id
  into v_existing;

  inserted := true;
  app_transaction_id := v_existing;
  return next;
end;
$_$;


ALTER FUNCTION "public"."upsert_transaction_from_checkout"("buyer_id" "uuid", "creator_id" "uuid", "session_id" "uuid", "challenge_id" "uuid", "tx_type" "text", "status" "text", "quantity" integer, "currency" "text", "amount_gross_cents" bigint, "processing_fee_fixed_cents" bigint, "processing_fee_percent_cents" bigint, "amount_after_stripe_cents" bigint, "creator_cut_cents" bigint, "platform_cut_cents" bigint, "provider" "text", "provider_payment_id" "text", "metadata" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_badge_monthly_digest" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period" "text" NOT NULL,
    "summary" "jsonb" NOT NULL,
    "awarded" "jsonb" NOT NULL,
    "revoked" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_badge_monthly_digest" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_badge_monthly_digest" IS 'Stores one monthly badge digest per user/period, with summary and lists of awarded/revoked monthly badges.';



COMMENT ON COLUMN "public"."app_badge_monthly_digest"."period" IS 'Monthly period in YYYY-MM format (e.g. 2025-11).';



COMMENT ON COLUMN "public"."app_badge_monthly_digest"."summary" IS 'JSON summary: total_badges, best_rank, category flags (attendance, revenue, followers, growth), etc.';



COMMENT ON COLUMN "public"."app_badge_monthly_digest"."awarded" IS 'JSON array of awarded monthly badges for this period (active at digest time).';



COMMENT ON COLUMN "public"."app_badge_monthly_digest"."revoked" IS 'JSON array of monthly badges revoked for this period (revoked_at not null).';



CREATE SEQUENCE IF NOT EXISTS "public"."app_badge_monthly_digest_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_badge_monthly_digest_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_badge_monthly_digest_id_seq" OWNED BY "public"."app_badge_monthly_digest"."id";



CREATE TABLE IF NOT EXISTS "public"."app_challenge" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "price_cents" integer DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'CHF'::"text" NOT NULL,
    "status" "public"."challenge_status" DEFAULT 'draft'::"public"."challenge_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "contract_id" "uuid",
    "capacity" integer,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "continuation_group_id" "uuid",
    "continued_from_challenge_id" "uuid",
    "image_url" "text",
    "promise_text" "text",
    "weekly_arc" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "topic_ownership" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "intro_prompt" "text",
    "promise_edited_at" timestamp with time zone,
    "promise_edited_by" "uuid",
    CONSTRAINT "app_challenge_currency_check" CHECK (("currency" = 'CHF'::"text")),
    CONSTRAINT "app_challenge_price_non_negative" CHECK (("price_cents" >= 0)),
    CONSTRAINT "chk_challenge_capacity_positive" CHECK ((("capacity" IS NULL) OR ("capacity" > 0))),
    CONSTRAINT "ck_challenge_not_continue_self" CHECK ((("continued_from_challenge_id" IS NULL) OR ("continued_from_challenge_id" <> "id"))),
    CONSTRAINT "ck_challenge_published_requires_price" CHECK ((("status" <> 'published'::"public"."challenge_status") OR ("price_cents" > 0)))
);


ALTER TABLE "public"."app_challenge" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_cohost" (
    "challenge_id" "uuid" NOT NULL,
    "cohost_id" "uuid" NOT NULL,
    "split_percent" integer,
    "updated_at" timestamp with time zone,
    CONSTRAINT "app_challenge_cohost_split_percent_check" CHECK ((("split_percent" >= 1) AND ("split_percent" <= 99)))
);

ALTER TABLE ONLY "public"."app_challenge_cohost" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_challenge_cohost" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_comment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "is_coach_answer" boolean DEFAULT false NOT NULL,
    "edited_at" timestamp with time zone,
    "edited_by" "uuid",
    CONSTRAINT "app_challenge_comment_body_check" CHECK ((("length"("body") >= 1) AND ("length"("body") <= 5000)))
);

ALTER TABLE ONLY "public"."app_challenge_comment" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_challenge_comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_member" (
    "challenge_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "completed" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."app_challenge_member" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_challenge_member" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_post" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "media_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "kind" "text" DEFAULT 'talk'::"text" NOT NULL,
    "context_type" "text",
    "context_id" "uuid",
    "directed_to" "uuid"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "app_challenge_post_body_check" CHECK ((("length"("body") >= 1) AND ("length"("body") <= 5000))),
    CONSTRAINT "app_challenge_post_kind_valid" CHECK (("kind" = ANY (ARRAY['talk'::"text", 'intro'::"text", 'intro_private'::"text", 'reflection'::"text", 'question'::"text"])))
);


ALTER TABLE "public"."app_challenge_post" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_post_like" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."app_challenge_post_like" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_challenge_post_like" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_challenge_space" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "continuation_group_id" "uuid",
    "kind" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "ownership_type" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "source_challenge_id" "uuid",
    "cover_image_url" "text",
    CONSTRAINT "app_challenge_space_kind_check" CHECK (("kind" = 'challenge'::"text")),
    CONSTRAINT "app_challenge_space_ownership_type_check" CHECK (("ownership_type" = ANY (ARRAY['solo'::"text", 'shared'::"text"])))
);


ALTER TABLE "public"."app_challenge_space" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_chat_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_chat_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_collaboration_acceptance" (
    "contract_id" "uuid" NOT NULL,
    "cohost_id" "uuid" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."app_collaboration_acceptance" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_collaboration_acceptance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_collaboration_contract" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "snapshot_json" "jsonb" NOT NULL,
    "snapshot_text" "text",
    "sha256" "text" NOT NULL,
    "locked_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_collaboration_contract_sha256_check" CHECK (("length"("sha256") > 0)),
    CONSTRAINT "app_collaboration_contract_target_type_check" CHECK (("target_type" = ANY (ARRAY['session'::"text", 'challenge'::"text"]))),
    CONSTRAINT "app_collaboration_contract_version_check" CHECK (("version" >= 1))
);

ALTER TABLE ONLY "public"."app_collaboration_contract" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_collaboration_contract" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_collaboration_decline" (
    "contract_id" "uuid" NOT NULL,
    "cohost_id" "uuid" NOT NULL,
    "declined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comment" "text"
);

ALTER TABLE ONLY "public"."app_collaboration_decline" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_collaboration_decline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_collaboration_invite" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_id" "uuid" NOT NULL,
    "to_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "initial_split_percent" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "challenge_id" "uuid",
    "dm_conversation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    CONSTRAINT "app_collaboration_invite_initial_split_percent_check" CHECK ((("initial_split_percent" >= 0) AND ("initial_split_percent" <= 100))),
    CONSTRAINT "app_collaboration_invite_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'interested'::"text", 'declined'::"text"]))),
    CONSTRAINT "no_self_invite" CHECK (("from_id" <> "to_id"))
);

ALTER TABLE ONLY "public"."app_collaboration_invite" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_collaboration_invite" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."app_creator_badge_trigger_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_creator_badge_trigger_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_creator_badge_trigger_id_seq" OWNED BY "public"."app_creator_badge_trigger"."id";



CREATE TABLE IF NOT EXISTS "public"."app_creator_comment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "app_creator_comment_body_check" CHECK ((("length"("body") >= 1) AND ("length"("body") <= 5000)))
);


ALTER TABLE "public"."app_creator_comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_contract_identity" (
    "creator_id" "uuid" NOT NULL,
    "party_type" "text" NOT NULL,
    "contract_name" "text" NOT NULL,
    "entity_signer_name" "text",
    "authority_attested" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_creator_contract_identity_contract_name_check" CHECK (("length"("btrim"("contract_name")) > 0)),
    CONSTRAINT "app_creator_contract_identity_entity_signer_rule_check" CHECK (((("party_type" = 'individual'::"text") AND ("entity_signer_name" IS NULL)) OR (("party_type" = 'entity'::"text") AND ("entity_signer_name" IS NOT NULL) AND ("length"("btrim"("entity_signer_name")) > 0)))),
    CONSTRAINT "app_creator_contract_identity_party_type_check" CHECK (("party_type" = ANY (ARRAY['individual'::"text", 'entity'::"text"])))
);


ALTER TABLE "public"."app_creator_contract_identity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."app_creator_earnings" WITH ("security_invoker"='true') AS
 SELECT "creator_id",
    ("sum"("creator_cut_cents") / 100.0) AS "total_earnings_chf",
    "count"("id") AS "total_transactions"
   FROM "public"."app_transaction" "t"
  WHERE ("status" = 'succeeded'::"public"."payment_status")
  GROUP BY "creator_id";


ALTER VIEW "public"."app_creator_earnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_post" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "space_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "media_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "context_type" "text",
    "context_id" "uuid",
    CONSTRAINT "app_creator_post_body_check" CHECK ((("length"("body") >= 1) AND ("length"("body") <= 5000))),
    CONSTRAINT "chk_context_pair" CHECK ((("context_type" IS NULL) = ("context_id" IS NULL))),
    CONSTRAINT "chk_context_type" CHECK ((("context_type" IS NULL) OR ("context_type" = ANY (ARRAY['session'::"text", 'challenge'::"text"]))))
);


ALTER TABLE "public"."app_creator_post" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_post_like" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_creator_post_like" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_space" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "cover_image_url" "text"
);


ALTER TABLE "public"."app_creator_space" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_space_member" (
    "space_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_creator_space_member" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_creator_subscription_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "stripe_price_id" "text" NOT NULL,
    "currency" "text" DEFAULT 'CHF'::"text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "interval" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "price_cents" integer NOT NULL,
    "billing_period" "text" DEFAULT 'monthly'::"text",
    CONSTRAINT "app_creator_subscription_plan_currency_check" CHECK (("currency" = 'CHF'::"text")),
    CONSTRAINT "app_creator_subscription_plan_interval_check" CHECK (("interval" = ANY (ARRAY['month'::"text", 'year'::"text"]))),
    CONSTRAINT "app_creator_subscription_plan_price_check" CHECK (("price_cents" > 0))
);


ALTER TABLE "public"."app_creator_subscription_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_dm_conversation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "is_group" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_dm_conversation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_dm_member" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_read_at" timestamp with time zone,
    CONSTRAINT "app_dm_member_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."app_dm_member" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_dm_message" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "kind" "text" DEFAULT 'user'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "app_dm_message_body_check" CHECK ((("length"("body") >= 1) AND ("length"("body") <= 5000))),
    CONSTRAINT "app_dm_message_kind_check" CHECK (("kind" = ANY (ARRAY['user'::"text", 'system'::"text"])))
);

ALTER TABLE ONLY "public"."app_dm_message" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_dm_message" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_edge_call_log" (
    "id" bigint NOT NULL,
    "fn" "text" NOT NULL,
    "user_id" "uuid",
    "ip" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_edge_call_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."app_edge_call_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_edge_call_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_edge_call_log_id_seq" OWNED BY "public"."app_edge_call_log"."id";



CREATE TABLE IF NOT EXISTS "public"."app_email_outbox" (
    "id" bigint NOT NULL,
    "kind" "text" NOT NULL,
    "tx_id" "uuid",
    "to_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_body" "text" NOT NULL,
    "text_body" "text" NOT NULL,
    "attempt_count" integer DEFAULT 0 NOT NULL,
    "last_error" "text",
    "enqueued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "target_id" "uuid",
    CONSTRAINT "app_email_outbox_kind_check" CHECK (("kind" = 'receipt'::"text"))
);


ALTER TABLE "public"."app_email_outbox" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_email_outbox" IS 'Append-only outbox for transactional emails (receipts, etc). service_role inserts; sender marks sent_at.';



CREATE SEQUENCE IF NOT EXISTS "public"."app_email_outbox_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_email_outbox_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_email_outbox_id_seq" OWNED BY "public"."app_email_outbox"."id";



CREATE TABLE IF NOT EXISTS "public"."app_feed_event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "actor_id" "uuid",
    "session_id" "uuid",
    "challenge_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "app_feed_event_type_check" CHECK (("type" = ANY (ARRAY['session_published'::"text", 'session_ended'::"text", 'session_completed'::"text", 'challenge_joined'::"text", 'challenge_completed'::"text", 'review_created'::"text", 'challenge_published'::"text"])))
);


ALTER TABLE "public"."app_feed_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_notification" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid",
    "type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_notification_type_check" CHECK (("type" = ANY (ARRAY['review_new'::"text", 'dm_new'::"text", 'system'::"text", 'badge_awarded'::"text", 'badge_monthly_digest'::"text", 'collab_invite'::"text", 'collab_accepted'::"text", 'contract_locked'::"text", 'contract_accepted'::"text", 'contract_declined'::"text", 'challenge_published'::"text", 'question_for_you'::"text", 'coach_answered_your_question'::"text"])))
);


ALTER TABLE "public"."app_notification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_payment_event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "provider_id" "text",
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_payment_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_payout" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "currency" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "provider" "text" DEFAULT 'manual'::"text" NOT NULL,
    "provider_payout_id" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_payout_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "app_payout_currency_check" CHECK (("currency" ~ '^[A-Z]{3}$'::"text"))
);


ALTER TABLE "public"."app_payout" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_pilot_application" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "channel_url" "text",
    "expertise" "text" NOT NULL,
    "audience_size_range" "text",
    "location" "text",
    "has_partner" boolean DEFAULT false NOT NULL,
    "partner_info" "text",
    "complement_interest" "text",
    "success_description" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_pilot_application_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'accepted'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."app_pilot_application" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_profile" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "username" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'participant'::"text" NOT NULL,
    "creator_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text",
    "bio" "text",
    "visibility" "text" DEFAULT 'public'::"text",
    "tagline" "text",
    "updated_at" timestamp with time zone,
    "is_admin" boolean DEFAULT false,
    "cover_image_url" "text",
    CONSTRAINT "app_profile_creator_visibility_check" CHECK ((("role" <> 'creator'::"text") OR ("visibility" = 'public'::"text"))),
    CONSTRAINT "app_profile_role_check" CHECK (("role" = ANY (ARRAY['participant'::"text", 'creator'::"text", 'admin'::"text"]))),
    CONSTRAINT "app_profile_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."app_profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_review" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    CONSTRAINT "app_review_no_self" CHECK (("reviewer_id" <> "creator_id")),
    CONSTRAINT "app_review_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "chk_app_review_rating_range" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);

ALTER TABLE ONLY "public"."app_review" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_review" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."app_profile_stats" AS
 WITH "creator_tribe_members" AS (
         SELECT "s_1"."creator_id" AS "profile_id",
            ("count"("m"."user_id"))::integer AS "creator_tribe_members_count"
           FROM ("public"."app_creator_space" "s_1"
             LEFT JOIN "public"."app_creator_space_member" "m" ON (("m"."space_id" = "s_1"."id")))
          GROUP BY "s_1"."creator_id"
        ), "sessions" AS (
         SELECT "app_session"."host_id" AS "profile_id",
            ("count"(*) FILTER (WHERE ("app_session"."status" = 'published'::"public"."session_status")))::integer AS "upcoming_sessions"
           FROM "public"."app_session"
          GROUP BY "app_session"."host_id"
        ), "reviews" AS (
         SELECT "app_review"."creator_id" AS "profile_id",
            (COALESCE("avg"("app_review"."rating"), (0)::numeric))::numeric(3,2) AS "avg_rating",
            ("count"(*))::integer AS "total_reviews"
           FROM "public"."app_review"
          GROUP BY "app_review"."creator_id"
        )
 SELECT "p"."id" AS "profile_id",
    "p"."display_name",
    "p"."role",
    "p"."bio",
    "p"."avatar_url",
    "p"."visibility",
    COALESCE("ctm"."creator_tribe_members_count", 0) AS "creator_tribe_members_count",
    COALESCE("s"."upcoming_sessions", 0) AS "upcoming_sessions",
    (COALESCE("r"."avg_rating", (0)::numeric))::numeric(3,2) AS "avg_rating",
    COALESCE("r"."total_reviews", 0) AS "total_reviews"
   FROM ((("public"."app_profile" "p"
     LEFT JOIN "creator_tribe_members" "ctm" ON (("ctm"."profile_id" = "p"."id")))
     LEFT JOIN "sessions" "s" ON (("s"."profile_id" = "p"."id")))
     LEFT JOIN "reviews" "r" ON (("r"."profile_id" = "p"."id")));


ALTER VIEW "public"."app_profile_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."app_profile_public" AS
 SELECT "profile_id",
    "display_name",
    "role",
    "bio",
    "avatar_url",
    "visibility",
    "creator_tribe_members_count",
    "upcoming_sessions",
    "avg_rating",
    "total_reviews"
   FROM "public"."app_profile_stats" "ps"
  WHERE "public"."can_view_profile"("profile_id");


ALTER VIEW "public"."app_profile_public" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_session_cohost" (
    "session_id" "uuid" NOT NULL,
    "cohost_id" "uuid" NOT NULL,
    "split_percent" integer,
    "updated_at" timestamp with time zone
);

ALTER TABLE ONLY "public"."app_session_cohost" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_session_cohost" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."app_session_financials" AS
SELECT
    NULL::"uuid" AS "session_id",
    NULL::"text" AS "title",
    NULL::numeric AS "total_revenue_chf",
    NULL::numeric AS "creator_payout_chf",
    NULL::numeric AS "platform_revenue_chf",
    NULL::bigint AS "total_sales";


ALTER VIEW "public"."app_session_financials" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."app_session_overview" WITH ("security_invoker"='true') AS
 SELECT "id",
    "title",
    "created_at",
    "status",
    "currency",
    ( SELECT "count"(*) AS "count"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."session_id" = "s"."id") AND ("t"."status" = 'succeeded'::"public"."payment_status"))) AS "buyers_count",
    ( SELECT (COALESCE("sum"("t"."amount_gross_cents"), (0)::numeric) / 100.0)
           FROM "public"."app_transaction" "t"
          WHERE (("t"."session_id" = "s"."id") AND ("t"."status" = 'succeeded'::"public"."payment_status"))) AS "total_sales_chf",
    ( SELECT (COALESCE("sum"("t"."creator_cut_cents"), (0)::numeric) / 100.0)
           FROM "public"."app_transaction" "t"
          WHERE (("t"."session_id" = "s"."id") AND ("t"."status" = 'succeeded'::"public"."payment_status"))) AS "total_creator_payout_chf"
   FROM "public"."app_session" "s";


ALTER VIEW "public"."app_session_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_session_pre_pulse_response" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "value" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_session_pre_pulse_response_value_check" CHECK ((("value" >= 0) AND ("value" <= 10)))
);


ALTER TABLE "public"."app_session_pre_pulse_response" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_staff" (
    "user_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_stream_event" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_stream_event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_stream_token" (
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_stream_token" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_subscription_inclusion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "challenge_id" "uuid",
    "session_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_subscription_inclusion_check" CHECK ((((("challenge_id" IS NOT NULL))::integer + (("session_id" IS NOT NULL))::integer) = 1))
);


ALTER TABLE "public"."app_subscription_inclusion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_template" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "price_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'CHF'::"text" NOT NULL,
    "capacity" integer,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_template_kind_check" CHECK (("kind" = ANY (ARRAY['session'::"text", 'challenge'::"text"])))
);


ALTER TABLE "public"."app_template" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_template_item" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "position" integer NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_template_item_item_type_check" CHECK (("item_type" = 'session'::"text"))
);


ALTER TABLE "public"."app_template_item" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_transaction_audit" (
    "id" bigint NOT NULL,
    "tx_id" "uuid" NOT NULL,
    "op" "text" NOT NULL,
    "actor_id" "uuid",
    "actor_role" "text",
    "source_role" "text",
    "changed_keys" "text"[] NOT NULL,
    "before_row" "jsonb",
    "after_row" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider" "text",
    "provider_payment_id" "text",
    "status" "text",
    "buyer_id" "uuid",
    "session_id" "uuid",
    "challenge_id" "uuid",
    "currency" "text"
);


ALTER TABLE "public"."app_transaction_audit" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."app_transaction_audit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_transaction_audit_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_transaction_audit_id_seq" OWNED BY "public"."app_transaction_audit"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."app_user_badge_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."app_user_badge_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."app_user_badge_id_seq" OWNED BY "public"."app_user_badge"."id";



CREATE TABLE IF NOT EXISTS "public"."app_user_period_seen" (
    "user_id" "uuid" NOT NULL,
    "period" "text" NOT NULL,
    "seen_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_user_period_seen" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_user_period_seen" IS 'Tracks which monthly badge digest periods a user has already seen (one row per user_id + period).';



COMMENT ON COLUMN "public"."app_user_period_seen"."period" IS 'Monthly period in YYYY-MM format (e.g. 2025-11).';



CREATE TABLE IF NOT EXISTS "public"."app_user_subscription" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "status" "text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_user_subscription_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'incomplete'::"text", 'past_due'::"text", 'canceled'::"text", 'unpaid'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."app_user_subscription" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_workspace_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."app_workspace_activity" REPLICA IDENTITY FULL;


ALTER TABLE "public"."app_workspace_activity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_creator_collab_reputation" WITH ("security_invoker"='true') AS
 SELECT "subject_id" AS "creator_id",
    ("count"(*))::integer AS "review_count",
    ("avg"("rating"))::numeric(4,2) AS "avg_rating",
    "max"("created_at") AS "last_review_at"
   FROM "public"."app_collab_review" "r"
  GROUP BY "subject_id";


ALTER VIEW "public"."v_creator_collab_reputation" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_challenge_buyer_view" WITH ("security_invoker"='true') AS
 SELECT "id" AS "challenge_id",
    "title",
    "image_url",
    "start_date",
    "end_date",
    "price_cents",
    "currency",
    "status",
    "owner_id",
    COALESCE(NULLIF("promise_text", ''::"text"), "description") AS "promise_text",
    COALESCE("weekly_arc", '[]'::"jsonb") AS "weekly_arc",
    COALESCE("topic_ownership", '[]'::"jsonb") AS "topic_ownership",
    "intro_prompt",
    (( SELECT "count"(*) AS "count"
           FROM "public"."app_challenge_session" "csess"
          WHERE ("csess"."challenge_id" = "c"."id")))::integer AS "session_count",
    "public"."challenge_spots_left"("id") AS "spots_left"
   FROM "public"."app_challenge" "c"
  WHERE ("status" = ANY (ARRAY['published'::"public"."challenge_status", 'completed'::"public"."challenge_status"]));


ALTER VIEW "public"."vw_challenge_buyer_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_challenge_program_state" WITH ("security_invoker"='true') AS
 WITH "challenge_weeks" AS (
         SELECT "c"."id" AS "challenge_id",
            "c"."weekly_arc",
            "c"."start_date",
            "c"."end_date",
            GREATEST(1, ((("c"."end_date" - "c"."start_date") / 7) + 1)) AS "total_weeks"
           FROM "public"."app_challenge" "c"
        ), "session_week_buckets" AS (
         SELECT "csess"."challenge_id",
            GREATEST(1, (((("s"."start_time")::"date" - "cw"."start_date") / 7) + 1)) AS "week_num",
            COALESCE("s"."ended_at", ("s"."start_time" + "make_interval"("mins" => "s"."duration_minutes"))) AS "effective_end"
           FROM (("challenge_weeks" "cw"
             JOIN "public"."app_challenge_session" "csess" ON (("csess"."challenge_id" = "cw"."challenge_id")))
             JOIN "public"."app_session" "s" ON (("s"."id" = "csess"."session_id")))
        ), "week_last_session_end" AS (
         SELECT "session_week_buckets"."challenge_id",
            "session_week_buckets"."week_num",
            "max"("session_week_buckets"."effective_end") AS "last_end"
           FROM "session_week_buckets"
          GROUP BY "session_week_buckets"."challenge_id", "session_week_buckets"."week_num"
        ), "ongoing_week" AS (
         SELECT "week_last_session_end"."challenge_id",
            "min"("week_last_session_end"."week_num") AS "week_num_from_sessions"
           FROM "week_last_session_end"
          WHERE ("week_last_session_end"."last_end" > "now"())
          GROUP BY "week_last_session_end"."challenge_id"
        ), "resolved" AS (
         SELECT "cw"."challenge_id",
            "cw"."total_weeks",
            "cw"."weekly_arc",
            LEAST("cw"."total_weeks", GREATEST(1, COALESCE("ow"."week_num_from_sessions", (((CURRENT_DATE - "cw"."start_date") / 7) + 1)))) AS "current_week_number"
           FROM ("challenge_weeks" "cw"
             LEFT JOIN "ongoing_week" "ow" ON (("ow"."challenge_id" = "cw"."challenge_id")))
        )
 SELECT "challenge_id",
    "total_weeks",
    "current_week_number",
    ("current_week_number" - 1) AS "weeks_completed",
    ("total_weeks" - "current_week_number") AS "weeks_remaining",
    COALESCE((("weekly_arc" -> ("current_week_number" - 1)) ->> 'theme'::"text"), ''::"text") AS "current_week_theme"
   FROM "resolved";


ALTER VIEW "public"."vw_challenge_program_state" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_challenge_session_team" WITH ("security_invoker"='false') AS
 SELECT "cs"."challenge_id",
    "cs"."session_id",
    "s"."host_id",
    "sc"."cohost_id"
   FROM ((("public"."app_challenge_session" "cs"
     JOIN "public"."app_challenge" "c" ON (("c"."id" = "cs"."challenge_id")))
     JOIN "public"."app_session" "s" ON (("s"."id" = "cs"."session_id")))
     LEFT JOIN "public"."app_session_cohost" "sc" ON (("sc"."session_id" = "cs"."session_id")))
  WHERE ("c"."status" = ANY (ARRAY['published'::"public"."challenge_status", 'completed'::"public"."challenge_status"]));


ALTER VIEW "public"."vw_challenge_session_team" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_creator_collab_reputation" WITH ("security_invoker"='true') AS
 SELECT "subject_id" AS "creator_id",
    "count"(*) AS "reviews_count",
    ("avg"("rating"))::numeric(4,2) AS "avg_rating",
    "max"("created_at") AS "last_reviewed_at"
   FROM "public"."app_collab_review" "r"
  GROUP BY "subject_id";


ALTER VIEW "public"."vw_creator_collab_reputation" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_creator_collab_reputation" IS 'Aggregated private creator↔creator collab reviews (creators-only via base-table RLS).';



CREATE OR REPLACE VIEW "public"."vw_creator_earnings" WITH ("security_invoker"='true') AS
 WITH "tx" AS (
         SELECT "t"."creator_id",
            ("date_trunc"('day'::"text", "t"."created_at"))::"date" AS "day",
            "t"."challenge_id",
            "t"."currency",
            "t"."creator_cut_cents",
            "t"."amount_gross_cents",
            "t"."id" AS "tx_id"
           FROM "public"."app_transaction" "t"
          WHERE ("t"."status" = 'succeeded'::"public"."payment_status")
        )
 SELECT "tx"."creator_id",
    "p"."username" AS "creator_username",
    "tx"."day",
    "tx"."currency",
    "tx"."challenge_id",
    "ch"."title" AS "challenge_title",
    "count"("tx"."tx_id") AS "tx_count",
    ("sum"("tx"."amount_gross_cents"))::bigint AS "gross_cents",
    ("sum"("tx"."creator_cut_cents"))::bigint AS "creator_cut_cents"
   FROM (("tx"
     LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "tx"."creator_id")))
     LEFT JOIN "public"."app_challenge" "ch" ON (("ch"."id" = "tx"."challenge_id")))
  GROUP BY "tx"."creator_id", "p"."username", "tx"."day", "tx"."currency", "tx"."challenge_id", "ch"."title"
  ORDER BY "tx"."day" DESC, "tx"."creator_id";


ALTER VIEW "public"."vw_creator_earnings" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_creator_earnings" IS 'Daily creator earnings summarised by creator and (when applicable) challenge. Only succeeded transactions.';



CREATE OR REPLACE VIEW "public"."vw_creator_public_reviews_summary" WITH ("security_invoker"='true') AS
 SELECT "r"."creator_id",
    ("count"(*))::integer AS "reviews_count",
    "round"("avg"("r"."rating"), 2) AS "avg_rating",
    "max"("r"."created_at") AS "last_reviewed_at"
   FROM ("public"."app_review" "r"
     JOIN "public"."app_profile" "p" ON (("p"."id" = "r"."creator_id")))
  WHERE ("p"."visibility" = 'public'::"text")
  GROUP BY "r"."creator_id";


ALTER VIEW "public"."vw_creator_public_reviews_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_dm_inbox" WITH ("security_invoker"='true') AS
 SELECT "m"."user_id",
    "m"."conversation_id",
    "msg"."id" AS "last_msg_id",
    "msg"."author_id" AS "last_author_id",
    "msg"."body" AS "last_msg_preview",
    "msg"."created_at" AS "last_msg_at",
    COALESCE(( SELECT "count"(*) AS "count"
           FROM "public"."app_notification" "n"
          WHERE (("n"."recipient_id" = "m"."user_id") AND ("n"."type" = 'dm_new'::"text") AND (("n"."payload" ->> 'conversation_id'::"text") = ("m"."conversation_id")::"text") AND ("n"."read_at" IS NULL))), (0)::bigint) AS "unread_count"
   FROM ("public"."app_dm_member" "m"
     LEFT JOIN LATERAL ( SELECT "mm"."id",
            "mm"."author_id",
            "mm"."body",
            "mm"."created_at"
           FROM "public"."app_dm_message" "mm"
          WHERE ("mm"."conversation_id" = "m"."conversation_id")
          ORDER BY "mm"."created_at" DESC
         LIMIT 1) "msg" ON (true));


ALTER VIEW "public"."vw_dm_inbox" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_email_outbox_pending" WITH ("security_invoker"='true') AS
 SELECT "id",
    "kind",
    "tx_id",
    "to_email",
    "subject",
    "enqueued_at",
    "attempt_count",
    "last_error"
   FROM "public"."app_email_outbox"
  WHERE ("sent_at" IS NULL)
  ORDER BY "enqueued_at";


ALTER VIEW "public"."vw_email_outbox_pending" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_email_outbox_pending" IS 'Pending emails (not sent yet) for ops visibility.';



CREATE OR REPLACE VIEW "public"."vw_my_badges" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        )
 SELECT "ub"."id" AS "user_badge_id",
    "ub"."user_id",
    "ub"."badge_id",
    "b"."slug" AS "badge_slug",
    "b"."label" AS "badge_label",
    "b"."description",
    "b"."audience",
    "b"."source",
    "b"."tier",
    "b"."is_event_based",
    "b"."is_monthly",
    "b"."is_auto_awarded",
    "b"."is_active",
    "b"."color_hex" AS "badge_color_hex",
    "b"."icon" AS "badge_icon",
    "b"."created_by" AS "badge_created_by",
    "creator"."username" AS "badge_creator_username",
    "ub"."awarded_at",
    "ub"."awarded_by",
    "ub"."context",
    "ub"."is_permanent",
    "ub"."revoked_at",
    "ub"."revoked_reason",
    "ub"."visible_on_profile",
    "ub"."pinned_on_profile",
    "ub"."period",
        CASE
            WHEN ("ub"."revoked_at" IS NULL) THEN 'active'::"text"
            ELSE 'revoked'::"text"
        END AS "status",
    (("ub"."context" ->> 'rank'::"text"))::integer AS "rank",
    (("ub"."context" ->> 'total_attendance'::"text"))::integer AS "total_attendance",
    (("ub"."context" ->> 'unique_attendees'::"text"))::integer AS "unique_attendees",
    (("ub"."context" ->> 'total_gross_cents'::"text"))::bigint AS "total_gross_cents",
    (("ub"."context" ->> 'unique_buyers'::"text"))::integer AS "unique_buyers",
    (("ub"."context" ->> 'follower_count'::"text"))::integer AS "follower_count",
    (("ub"."context" ->> 'growth_ratio'::"text"))::numeric AS "growth_ratio",
    (("ub"."context" ->> 'curr_sessions'::"text"))::integer AS "curr_sessions",
    (("ub"."context" ->> 'prev_sessions'::"text"))::integer AS "prev_sessions",
    (("ub"."context" ->> 'curr_value'::"text"))::numeric AS "curr_value",
    (("ub"."context" ->> 'prev_value'::"text"))::numeric AS "prev_value"
   FROM ((("public"."app_user_badge" "ub"
     JOIN "me" ON (("me"."uid" = "ub"."user_id")))
     JOIN "public"."app_badge" "b" ON (("b"."id" = "ub"."badge_id")))
     LEFT JOIN "public"."app_profile" "creator" ON (("creator"."id" = "b"."created_by")))
  ORDER BY "ub"."awarded_at" DESC;


ALTER VIEW "public"."vw_my_badges" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_my_challenges_overview" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        ), "my_challenges" AS (
         SELECT "c"."id" AS "challenge_id",
            "c"."title",
            "c"."owner_id",
            "c"."status"
           FROM ("public"."app_challenge" "c"
             JOIN "me" "me_1" ON (true))
          WHERE (("c"."owner_id" = "me_1"."uid") OR (EXISTS ( SELECT 1
                   FROM "public"."app_challenge_cohost" "ch"
                  WHERE (("ch"."challenge_id" = "c"."id") AND ("ch"."cohost_id" = "me_1"."uid")))))
        ), "links" AS (
         SELECT "cs"."challenge_id",
            "cs"."session_id"
           FROM ("public"."app_challenge_session" "cs"
             JOIN "my_challenges" "mc_1" ON (("mc_1"."challenge_id" = "cs"."challenge_id")))
        ), "sess" AS (
         SELECT "s"."id" AS "session_id",
            "s"."host_id",
            "s"."start_time"
           FROM "public"."app_session" "s"
        ), "my_sessions_in_challenge" AS (
         SELECT "l"."challenge_id",
            "l"."session_id"
           FROM (("links" "l"
             JOIN "sess" "s" ON (("s"."session_id" = "l"."session_id")))
             JOIN "me" "me_1" ON (true))
          WHERE (("s"."host_id" = "me_1"."uid") OR (EXISTS ( SELECT 1
                   FROM "public"."app_session_cohost" "sch"
                  WHERE (("sch"."session_id" = "l"."session_id") AND ("sch"."cohost_id" = "me_1"."uid")))))
        ), "challenge_totals" AS (
         SELECT "l"."challenge_id",
            "count"(*) AS "total_sessions",
            "count"(*) FILTER (WHERE ("s"."start_time" < "now"())) AS "past_sessions"
           FROM ("links" "l"
             LEFT JOIN "sess" "s" ON (("s"."session_id" = "l"."session_id")))
          GROUP BY "l"."challenge_id"
        ), "challenge_participants" AS (
         SELECT "l"."challenge_id",
            "count"(DISTINCT "a"."user_id") AS "total_participants",
            "count"(*) AS "total_attend_rows"
           FROM ("links" "l"
             JOIN "public"."app_attendance" "a" ON (("a"."session_id" = "l"."session_id")))
          GROUP BY "l"."challenge_id"
        ), "challenge_attendance_rates" AS (
         SELECT "cp_1"."challenge_id",
                CASE
                    WHEN (("ct_1"."total_sessions" = 0) OR ("cp_1"."total_participants" = 0)) THEN 0
                    ELSE ("floor"(((100.0 * ("cp_1"."total_attend_rows")::numeric) / (("ct_1"."total_sessions" * "cp_1"."total_participants"))::numeric)))::integer
                END AS "avg_attendance_rate_percent"
           FROM ("challenge_participants" "cp_1"
             JOIN "challenge_totals" "ct_1" ON (("ct_1"."challenge_id" = "cp_1"."challenge_id")))
        ), "ticket_tx_all" AS (
         SELECT "l"."challenge_id",
            ("sum"("t"."amount_gross_cents"))::bigint AS "ticket_gross_cents",
            ("sum"("t"."creator_cut_cents"))::bigint AS "ticket_creator_cut_cents"
           FROM ("links" "l"
             JOIN "public"."app_transaction" "t" ON ((("t"."session_id" = "l"."session_id") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type"))))
          GROUP BY "l"."challenge_id"
        ), "bundle_tx_all" AS (
         SELECT "t"."challenge_id",
            ("sum"("t"."amount_gross_cents"))::bigint AS "bundle_gross_cents",
            ("sum"("t"."creator_cut_cents"))::bigint AS "bundle_creator_cut_cents"
           FROM ("public"."app_transaction" "t"
             JOIN "my_challenges" "mc_1" ON (("mc_1"."challenge_id" = "t"."challenge_id")))
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'bundle'::"public"."payment_type"))
          GROUP BY "t"."challenge_id"
        ), "my_contribution_financials" AS (
         SELECT "x"."challenge_id",
            ("sum"("x"."creator_cut_cents"))::bigint AS "my_financial_contribution_cents"
           FROM ( SELECT "t"."challenge_id",
                    "t"."creator_cut_cents"
                   FROM ("public"."app_transaction" "t"
                     JOIN "me" "me_1" ON (true))
                  WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."challenge_id" IS NOT NULL) AND ("t"."creator_id" = "me_1"."uid"))
                UNION ALL
                 SELECT "l"."challenge_id",
                    "t"."creator_cut_cents"
                   FROM (("links" "l"
                     JOIN "public"."app_transaction" "t" ON ((("t"."session_id" = "l"."session_id") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type"))))
                     JOIN "me" "me_1" ON (true))
                  WHERE ("t"."creator_id" = "me_1"."uid")) "x"
          GROUP BY "x"."challenge_id"
        ), "my_contribution_attendance" AS (
         SELECT "msic"."challenge_id",
            "count"(DISTINCT "a"."user_id") AS "my_contribution_attendees",
            "count"(*) AS "my_contribution_attend_rows"
           FROM ("my_sessions_in_challenge" "msic"
             JOIN "public"."app_attendance" "a" ON (("a"."session_id" = "msic"."session_id")))
          GROUP BY "msic"."challenge_id"
        ), "my_contribution_sessions" AS (
         SELECT "msic"."challenge_id",
            "count"(*) AS "my_contribution_session_count",
            "count"(*) FILTER (WHERE ("s"."start_time" < "now"())) AS "my_contribution_past_sessions"
           FROM ("my_sessions_in_challenge" "msic"
             JOIN "sess" "s" ON (("s"."session_id" = "msic"."session_id")))
          GROUP BY "msic"."challenge_id"
        ), "my_contribution_ticket_revenue" AS (
         SELECT "msic"."challenge_id",
            (COALESCE("sum"("t"."amount_gross_cents"), (0)::numeric))::bigint AS "my_contribution_ticket_gross_cents"
           FROM ("my_sessions_in_challenge" "msic"
             JOIN "public"."app_transaction" "t" ON ((("t"."session_id" = "msic"."session_id") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type"))))
          GROUP BY "msic"."challenge_id"
        )
 SELECT "mc"."challenge_id",
    "mc"."title" AS "challenge_title",
    "mc"."status" AS "challenge_status",
    "mc"."owner_id",
    "owner"."username" AS "owner_username",
    ("mc"."owner_id" = "me"."uid") AS "is_owner",
    (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "ch"
          WHERE (("ch"."challenge_id" = "mc"."challenge_id") AND ("ch"."cohost_id" = "me"."uid")))) AS "is_cohost",
    COALESCE("ct"."total_sessions", (0)::bigint) AS "total_sessions",
    COALESCE("ct"."past_sessions", (0)::bigint) AS "past_sessions",
    GREATEST((COALESCE("ct"."total_sessions", (0)::bigint) - COALESCE("ct"."past_sessions", (0)::bigint)), (0)::bigint) AS "upcoming_sessions",
        CASE
            WHEN (COALESCE("ct"."total_sessions", (0)::bigint) = 0) THEN 0
            ELSE ("floor"(((100.0 * (COALESCE("ct"."past_sessions", (0)::bigint))::numeric) / ("ct"."total_sessions")::numeric)))::integer
        END AS "challenge_progress_percent",
    COALESCE("cp"."total_participants", (0)::bigint) AS "total_participants",
    COALESCE("car"."avg_attendance_rate_percent", 0) AS "avg_attendance_rate_percent",
    (COALESCE("tta"."ticket_gross_cents", (0)::bigint) + COALESCE("bta"."bundle_gross_cents", (0)::bigint)) AS "total_revenue_gross_cents",
    (COALESCE("tta"."ticket_creator_cut_cents", (0)::bigint) + COALESCE("bta"."bundle_creator_cut_cents", (0)::bigint)) AS "total_revenue_creator_cents",
    COALESCE("mcf"."my_financial_contribution_cents", (0)::bigint) AS "my_financial_contribution_cents",
    COALESCE("mcs"."my_contribution_session_count", (0)::bigint) AS "my_contribution_session_count",
    COALESCE("mcs"."my_contribution_past_sessions", (0)::bigint) AS "my_contribution_past_sessions",
    COALESCE("mca"."my_contribution_attendees", (0)::bigint) AS "my_contribution_attendees",
    COALESCE("mctr"."my_contribution_ticket_gross_cents", (0)::bigint) AS "my_contribution_ticket_gross_cents"
   FROM ((((((((((("my_challenges" "mc"
     LEFT JOIN "me" ON (true))
     LEFT JOIN "public"."app_profile" "owner" ON (("owner"."id" = "mc"."owner_id")))
     LEFT JOIN "challenge_totals" "ct" ON (("ct"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "challenge_participants" "cp" ON (("cp"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "challenge_attendance_rates" "car" ON (("car"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "ticket_tx_all" "tta" ON (("tta"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "bundle_tx_all" "bta" ON (("bta"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "my_contribution_financials" "mcf" ON (("mcf"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "my_contribution_sessions" "mcs" ON (("mcs"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "my_contribution_attendance" "mca" ON (("mca"."challenge_id" = "mc"."challenge_id")))
     LEFT JOIN "my_contribution_ticket_revenue" "mctr" ON (("mctr"."challenge_id" = "mc"."challenge_id")))
  ORDER BY "mc"."title";


ALTER VIEW "public"."vw_my_challenges_overview" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_challenges_overview" IS '
Creator-side challenge dashboard for the signed-in user (owner OR cohost).

───────────────────────────────────────────────
Column Reference
───────────────────────────────────────────────
• challenge_id / challenge_title / challenge_status
    → Challenge identity and status.

• owner_id / owner_username
    → Primary creator (owner) of the challenge.

• is_owner / is_cohost
    → True if this user is the owner or cohost.

• total_sessions / past_sessions / upcoming_sessions
    → Session counts linked to the challenge.
      “Past” = sessions whose start_time < now().

• challenge_progress_percent
    → Progress of the challenge overall (past / total sessions * 100).

• total_participants
    → Distinct users who attended at least one session.

• avg_attendance_rate_percent
    → Average session attendance rate across all participants
      (attendance rows ÷ (participants * total sessions) * 100).

• total_revenue_gross_cents
    → Combined gross revenue from session tickets + challenge bundles (in cents).

• total_revenue_creator_cents
    → Combined creator portion (creator_cut_cents) of that revenue.

• my_financial_contribution_cents
    → Total creator_cut credited to me (the signed-in creator),
      across both bundle & ticket transactions in this challenge.

• my_contribution_session_count / my_contribution_past_sessions
    → How many sessions in this challenge I personally host or cohost
      (total & those already held).

• my_contribution_attendees
    → Distinct attendees across sessions I host/cohost.

• my_contribution_ticket_gross_cents
    → Gross ticket revenue (in cents) generated by my sessions.

───────────────────────────────────────────────
Usage
───────────────────────────────────────────────
→ This view powers the Creator Dashboard (challenge-level overview)
   showing both team-wide metrics and personal contribution metrics
   for collaborative challenges.

→ Safe under RLS: auth.uid() is scoped via ownership/cohost join.
';



CREATE OR REPLACE VIEW "public"."vw_my_challenges_progress" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        ), "links" AS (
         SELECT "cs"."challenge_id",
            "cs"."session_id"
           FROM "public"."app_challenge_session" "cs"
        ), "sess" AS (
         SELECT "s"."id" AS "session_id",
            "s"."start_time"
           FROM "public"."app_session" "s"
        ), "my_att" AS (
         SELECT "l"."challenge_id",
            "a"."session_id",
            "a"."joined_at"
           FROM (("links" "l"
             JOIN "public"."app_attendance" "a" ON (("a"."session_id" = "l"."session_id")))
             JOIN "me" ON (("a"."user_id" = "me"."uid")))
        ), "my_bundle_purchase" AS (
         SELECT DISTINCT "t"."challenge_id"
           FROM ("public"."app_transaction" "t"
             JOIN "me" ON (("t"."buyer_id" = "me"."uid")))
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'bundle'::"public"."payment_type") AND ("t"."challenge_id" IS NOT NULL))
        ), "challenge_totals" AS (
         SELECT "l"."challenge_id",
            "count"(*) AS "total_sessions",
            "count"(*) FILTER (WHERE ("s"."start_time" < "now"())) AS "past_sessions"
           FROM ("links" "l"
             LEFT JOIN "sess" "s" ON (("s"."session_id" = "l"."session_id")))
          GROUP BY "l"."challenge_id"
        ), "att_totals" AS (
         SELECT "ma"."challenge_id",
            "count"(DISTINCT "ma"."session_id") AS "attended_sessions",
            "count"(DISTINCT "ma"."session_id") FILTER (WHERE ("s"."start_time" < "now"())) AS "attended_past_sessions",
            "min"("ma"."joined_at") AS "first_attended_at",
            "max"("ma"."joined_at") AS "last_attended_at"
           FROM ("my_att" "ma"
             LEFT JOIN "sess" "s" ON (("s"."session_id" = "ma"."session_id")))
          GROUP BY "ma"."challenge_id"
        ), "involved" AS (
         SELECT DISTINCT "l"."challenge_id"
           FROM "links" "l"
          WHERE ((EXISTS ( SELECT 1
                   FROM "my_att" "ma"
                  WHERE ("ma"."challenge_id" = "l"."challenge_id"))) OR (EXISTS ( SELECT 1
                   FROM "my_bundle_purchase" "bp_1"
                  WHERE ("bp_1"."challenge_id" = "l"."challenge_id"))))
        ), "named" AS (
         SELECT "c"."id" AS "challenge_id",
            "c"."title",
            "c"."owner_id"
           FROM ("public"."app_challenge" "c"
             JOIN "involved" "i" ON (("i"."challenge_id" = "c"."id")))
        )
 SELECT "n"."challenge_id",
    "n"."title" AS "challenge_title",
    "n"."owner_id" AS "creator_id",
    "p"."username" AS "creator_username",
    COALESCE("ct"."total_sessions", (0)::bigint) AS "total_sessions",
    COALESCE("ct"."past_sessions", (0)::bigint) AS "past_sessions",
    COALESCE("at"."attended_sessions", (0)::bigint) AS "attended_sessions",
    COALESCE("at"."attended_past_sessions", (0)::bigint) AS "attended_past_sessions",
    GREATEST((COALESCE("ct"."total_sessions", (0)::bigint) - COALESCE("ct"."past_sessions", (0)::bigint)), (0)::bigint) AS "upcoming_sessions",
        CASE
            WHEN (COALESCE("ct"."total_sessions", (0)::bigint) = 0) THEN 0
            ELSE ("floor"(((100.0 * (COALESCE("at"."attended_sessions", (0)::bigint))::numeric) / ("ct"."total_sessions")::numeric)))::integer
        END AS "completion_percent",
        CASE
            WHEN (COALESCE("ct"."past_sessions", (0)::bigint) = 0) THEN 0
            ELSE ("floor"(((100.0 * (COALESCE("at"."attended_past_sessions", (0)::bigint))::numeric) / ("ct"."past_sessions")::numeric)))::integer
        END AS "attendance_so_far_percent",
        CASE
            WHEN (COALESCE("ct"."total_sessions", (0)::bigint) = 0) THEN 0
            ELSE ("floor"(((100.0 * (COALESCE("ct"."past_sessions", (0)::bigint))::numeric) / ("ct"."total_sessions")::numeric)))::integer
        END AS "challenge_progress_percent",
    ("bp"."challenge_id" IS NOT NULL) AS "purchased_bundle",
    "at"."first_attended_at",
    "at"."last_attended_at"
   FROM (((("named" "n"
     LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "n"."owner_id")))
     LEFT JOIN "challenge_totals" "ct" ON (("ct"."challenge_id" = "n"."challenge_id")))
     LEFT JOIN "att_totals" "at" ON (("at"."challenge_id" = "n"."challenge_id")))
     LEFT JOIN "my_bundle_purchase" "bp" ON (("bp"."challenge_id" = "n"."challenge_id")))
  ORDER BY
        CASE
            WHEN (COALESCE("ct"."total_sessions", (0)::bigint) = 0) THEN 0
            ELSE ("floor"(((100.0 * (COALESCE("ct"."past_sessions", (0)::bigint))::numeric) / ("ct"."total_sessions")::numeric)))::integer
        END DESC,
        CASE
            WHEN (COALESCE("ct"."total_sessions", (0)::bigint) = 0) THEN 0
            ELSE ("floor"(((100.0 * (COALESCE("at"."attended_sessions", (0)::bigint))::numeric) / ("ct"."total_sessions")::numeric)))::integer
        END DESC, "n"."title";


ALTER VIEW "public"."vw_my_challenges_progress" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_challenges_progress" IS '
Participant-side challenge progress dashboard for the signed-in user (auth.uid()).

───────────────────────────────────────────────
Column Reference
───────────────────────────────────────────────
• challenge_id / challenge_title  
    → The challenge identity and title.

• creator_id / creator_username  
    → The challenge owner (primary creator) details.

• total_sessions  
    → Total sessions linked to this challenge.

• past_sessions  
    → Sessions whose start_time < now() (i.e. have already happened).

• attended_sessions  
    → Total number of sessions attended by the signed-in user in this challenge.

• attended_past_sessions  
    → How many of the past sessions the participant has actually attended.

• upcoming_sessions  
    → Remaining sessions yet to occur in this challenge.

• completion_percent  
    → Attended_sessions ÷ Total_sessions × 100.
      Reflects overall challenge completion from this participant’s perspective.

• attendance_so_far_percent  
    → Attended_past_sessions ÷ Past_sessions × 100.
      Indicates consistency of attendance so far among sessions already held.

• challenge_progress_percent  
    → Past_sessions ÷ Total_sessions × 100.
      Indicates how far the challenge itself has progressed (global timeline).

• purchased_bundle  
    → True if the participant purchased the challenge bundle directly (vs per-session).

• first_attended_at / last_attended_at  
    → First and most recent attendance timestamps for this participant in the challenge.

───────────────────────────────────────────────
Usage
───────────────────────────────────────────────
→ Powers participant dashboards and achievement tracking (e.g. “Challenge Progress” widgets).

→ Supports features like:
   • Completion badges (“100% attended”)
   • Personal consistency streaks
   • Challenge progress graphs (timeline completion)

→ RLS-safe via auth.uid() context and attendance/transaction joins.
';



CREATE OR REPLACE VIEW "public"."vw_my_creator_badge_templates" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        )
 SELECT "b"."id" AS "badge_id",
    "b"."slug" AS "badge_slug",
    "b"."label" AS "badge_label",
    "b"."description",
    "b"."audience",
    "b"."source",
    "b"."tier",
    "b"."is_event_based",
    "b"."is_monthly",
    "b"."is_auto_awarded",
    "b"."is_active",
    "b"."color_hex",
    "b"."icon",
    "b"."created_by",
    "p"."username" AS "creator_username",
    "b"."created_at",
    "count"("ub"."id") AS "awards_count",
    "min"("ub"."awarded_at") AS "first_awarded_at",
    "max"("ub"."awarded_at") AS "last_awarded_at"
   FROM ((("public"."app_badge" "b"
     JOIN "me" ON (("me"."uid" = "b"."created_by")))
     LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "b"."created_by")))
     LEFT JOIN "public"."app_user_badge" "ub" ON (("ub"."badge_id" = "b"."id")))
  WHERE ("b"."source" = 'creator_defined'::"text")
  GROUP BY "b"."id", "b"."slug", "b"."label", "b"."description", "b"."audience", "b"."source", "b"."tier", "b"."is_event_based", "b"."is_monthly", "b"."is_auto_awarded", "b"."is_active", "b"."color_hex", "b"."icon", "b"."created_by", "p"."username", "b"."created_at"
  ORDER BY "b"."created_at" DESC;


ALTER VIEW "public"."vw_my_creator_badge_templates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_my_creator_earnings" WITH ("security_invoker"='true') AS
 WITH "base" AS (
         SELECT "t"."creator_id",
            ("to_char"(("t"."created_at" AT TIME ZONE 'UTC'::"text"), 'YYYY-MM-DD'::"text"))::"date" AS "day",
            "t"."currency",
            "t"."type",
            "t"."session_id",
            "t"."challenge_id",
            "t"."amount_gross_cents",
            "t"."creator_cut_cents"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."creator_id" = "auth"."uid"()))
        ), "named" AS (
         SELECT "b_1"."creator_id",
            "b_1"."day",
            "b_1"."currency",
            "b_1"."type",
            "b_1"."session_id",
            "b_1"."challenge_id",
            "b_1"."amount_gross_cents",
            "b_1"."creator_cut_cents",
            "s"."title" AS "session_title",
            "c"."title" AS "challenge_title"
           FROM (("base" "b_1"
             LEFT JOIN "public"."app_session" "s" ON (("s"."id" = "b_1"."session_id")))
             LEFT JOIN "public"."app_challenge" "c" ON (("c"."id" = "b_1"."challenge_id")))
        )
 SELECT "b"."creator_id",
    "p"."username" AS "creator_username",
    "b"."day",
    "b"."currency",
    "b"."challenge_id",
    "b"."challenge_title",
    "b"."session_id",
    "b"."session_title",
    "count"(*) AS "tx_count",
    ("sum"("b"."amount_gross_cents"))::bigint AS "gross_cents",
    ("sum"("b"."creator_cut_cents"))::bigint AS "creator_cut_cents"
   FROM ("named" "b"
     LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "b"."creator_id")))
  GROUP BY "b"."creator_id", "p"."username", "b"."day", "b"."currency", "b"."challenge_id", "b"."challenge_title", "b"."session_id", "b"."session_title"
  ORDER BY "b"."day" DESC, "b"."currency", "b"."challenge_title", "b"."session_title";


ALTER VIEW "public"."vw_my_creator_earnings" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_creator_earnings" IS 'Daily earnings scoped to the signed-in creator (auth.uid()). Includes both challenge and session products.';



CREATE OR REPLACE VIEW "public"."vw_my_creator_summary" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "me"
        ), "my_sessions" AS (
         SELECT "s"."id"
           FROM "public"."app_session" "s",
            "me" "me_1"
          WHERE (("s"."host_id" = "me_1"."me") OR (EXISTS ( SELECT 1
                   FROM "public"."app_session_cohost" "ch"
                  WHERE (("ch"."session_id" = "s"."id") AND ("ch"."cohost_id" = "me_1"."me")))))
        ), "sessions_count" AS (
         SELECT "count"(*) AS "total_sessions"
           FROM "my_sessions"
        ), "att" AS (
         SELECT "count"(*) AS "total_attendees"
           FROM "public"."app_attendance" "a"
          WHERE ("a"."session_id" IN ( SELECT "my_sessions"."id"
                   FROM "my_sessions"))
        ), "buyers" AS (
         SELECT "count"(DISTINCT "t"."buyer_id") AS "unique_buyers"
           FROM "public"."app_transaction" "t",
            "me" "me_1"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."creator_id" = "me_1"."me"))
        ), "earn" AS (
         SELECT (COALESCE("sum"("t"."amount_gross_cents"), (0)::numeric))::bigint AS "gross_cents",
            (COALESCE("sum"("t"."creator_cut_cents"), (0)::numeric))::bigint AS "creator_cut_cents"
           FROM "public"."app_transaction" "t",
            "me" "me_1"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."creator_id" = "me_1"."me"))
        )
 SELECT "me"."me" AS "creator_id",
    "p"."username" AS "creator_username",
    COALESCE("sessions_count"."total_sessions", (0)::bigint) AS "total_sessions",
    COALESCE("att"."total_attendees", (0)::bigint) AS "total_attendees",
    COALESCE("buyers"."unique_buyers", (0)::bigint) AS "unique_buyers",
    "earn"."gross_cents",
    "earn"."creator_cut_cents"
   FROM ((((("me"
     LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "me"."me")))
     LEFT JOIN "sessions_count" ON (true))
     LEFT JOIN "att" ON (true))
     LEFT JOIN "buyers" ON (true))
     LEFT JOIN "earn" ON (true));


ALTER VIEW "public"."vw_my_creator_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_creator_summary" IS 'KPI header for the signed-in creator (auth.uid()): sessions hosted/cohosted, attendees, unique buyers, gross & creator earnings.';



CREATE OR REPLACE VIEW "public"."vw_my_event_badges" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        )
 SELECT "ub"."id" AS "user_badge_id",
    "ub"."user_id",
    "ub"."badge_id",
    "b"."slug",
    "b"."label",
    "b"."description",
    "b"."tier",
    "b"."color_hex",
    "b"."icon",
    "ub"."awarded_at",
    "ub"."revoked_at",
    "ub"."is_permanent",
    "ub"."visible_on_profile",
    "ub"."pinned_on_profile",
    "ub"."context"
   FROM (("public"."app_user_badge" "ub"
     JOIN "public"."app_badge" "b" ON (("b"."id" = "ub"."badge_id")))
     JOIN "me" ON (("me"."uid" = "ub"."user_id")))
  WHERE (("ub"."period" IS NULL) AND ("b"."is_monthly" = false));


ALTER VIEW "public"."vw_my_event_badges" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_event_badges" IS 'Permanent (non-monthly) event-based badges for auth.uid(), including session milestones and challenge milestones.';



CREATE OR REPLACE VIEW "public"."vw_my_lifetime_summary" AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        ), "att" AS (
         SELECT "count"(DISTINCT "a"."session_id") AS "sessions_attended"
           FROM ("public"."app_attendance" "a"
             JOIN "me" "me_1" ON (("me_1"."uid" = "a"."user_id")))
        ), "hosted" AS (
         SELECT "count"(*) AS "sessions_hosted"
           FROM ("public"."app_session" "s"
             JOIN "me" "me_1" ON (("me_1"."uid" = "s"."host_id")))
        ), "challenges_owned" AS (
         SELECT "count"(*) AS "challenges_owned"
           FROM ("public"."app_challenge" "c"
             JOIN "me" "me_1" ON (("me_1"."uid" = "c"."owner_id")))
        ), "creator_tx" AS (
         SELECT (COALESCE("sum"("t"."amount_gross_cents"), (0)::numeric))::bigint AS "creator_total_gross_cents",
            ("count"(DISTINCT "t"."buyer_id"))::integer AS "creator_unique_buyers"
           FROM ("public"."app_transaction" "t"
             JOIN "me" "me_1" ON (("me_1"."uid" = "t"."creator_id")))
          WHERE ("t"."status" = 'succeeded'::"public"."payment_status")
        ), "creator_tribe_counts" AS (
         SELECT "count"("m"."user_id") AS "creator_tribe_members_count"
           FROM (("me" "me_1"
             LEFT JOIN "public"."app_creator_space" "s" ON (("s"."creator_id" = "me_1"."uid")))
             LEFT JOIN "public"."app_creator_space_member" "m" ON (("m"."space_id" = "s"."id")))
        ), "joined_tribe_counts" AS (
         SELECT "count"(*) AS "joined_creator_tribes_count"
           FROM ("public"."app_creator_space_member" "m"
             JOIN "me" "me_1" ON (("me_1"."uid" = "m"."user_id")))
        ), "badge_stats" AS (
         SELECT "count"(*) AS "total_badges",
            "count"(*) FILTER (WHERE ("ub"."is_permanent" AND ("ub"."revoked_at" IS NULL))) AS "permanent_badges_active",
            "min"("ub"."awarded_at") AS "first_badge_at",
            "max"("ub"."awarded_at") AS "last_badge_at"
           FROM ("public"."app_user_badge" "ub"
             JOIN "me" "me_1" ON (("me_1"."uid" = "ub"."user_id")))
        )
 SELECT "me"."uid" AS "user_id",
    COALESCE("att"."sessions_attended", (0)::bigint) AS "sessions_attended",
    COALESCE("hosted"."sessions_hosted", (0)::bigint) AS "sessions_hosted",
    COALESCE("challenges_owned"."challenges_owned", (0)::bigint) AS "challenges_owned",
    COALESCE("creator_tx"."creator_total_gross_cents", (0)::bigint) AS "creator_total_gross_cents",
    COALESCE("creator_tx"."creator_unique_buyers", 0) AS "creator_unique_buyers",
    COALESCE("creator_tribe_counts"."creator_tribe_members_count", (0)::bigint) AS "creator_tribe_members_count",
    COALESCE("joined_tribe_counts"."joined_creator_tribes_count", (0)::bigint) AS "joined_creator_tribes_count",
    COALESCE("badge_stats"."total_badges", (0)::bigint) AS "total_badges",
    COALESCE("badge_stats"."permanent_badges_active", (0)::bigint) AS "permanent_badges_active",
    "badge_stats"."first_badge_at",
    "badge_stats"."last_badge_at"
   FROM ((((((("me"
     LEFT JOIN "att" ON (true))
     LEFT JOIN "hosted" ON (true))
     LEFT JOIN "challenges_owned" ON (true))
     LEFT JOIN "creator_tx" ON (true))
     LEFT JOIN "creator_tribe_counts" ON (true))
     LEFT JOIN "joined_tribe_counts" ON (true))
     LEFT JOIN "badge_stats" ON (true));


ALTER VIEW "public"."vw_my_lifetime_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_my_monthly_badges_flat" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        )
 SELECT "ub"."id" AS "user_badge_id",
    "ub"."user_id",
    "ub"."badge_id",
    "b"."slug" AS "badge_slug",
    "b"."label" AS "badge_label",
    "b"."description",
    "b"."audience",
    "b"."tier",
    "b"."is_monthly",
    "ub"."period",
        CASE
            WHEN ("ub"."revoked_at" IS NULL) THEN 'awarded'::"text"
            ELSE 'revoked'::"text"
        END AS "status",
    "ub"."awarded_at",
    "ub"."revoked_at",
    "ub"."revoked_reason",
    "ub"."context",
    (("ub"."context" ->> 'rank'::"text"))::integer AS "rank",
    (("ub"."context" ->> 'total_attendance'::"text"))::integer AS "total_attendance",
    (("ub"."context" ->> 'unique_attendees'::"text"))::integer AS "unique_attendees",
    (("ub"."context" ->> 'total_gross_cents'::"text"))::bigint AS "total_gross_cents",
    (("ub"."context" ->> 'unique_buyers'::"text"))::integer AS "unique_buyers",
    (("ub"."context" ->> 'follower_count'::"text"))::integer AS "follower_count",
    (("ub"."context" ->> 'growth_ratio'::"text"))::numeric AS "growth_ratio",
    (("ub"."context" ->> 'curr_sessions'::"text"))::integer AS "curr_sessions",
    (("ub"."context" ->> 'prev_sessions'::"text"))::integer AS "prev_sessions",
    (("ub"."context" ->> 'curr_value'::"text"))::numeric AS "curr_value",
    (("ub"."context" ->> 'prev_value'::"text"))::numeric AS "prev_value"
   FROM (("public"."app_user_badge" "ub"
     JOIN "public"."app_badge" "b" ON (("b"."id" = "ub"."badge_id")))
     JOIN "me" ON (("me"."uid" = "ub"."user_id")))
  WHERE ("b"."is_monthly" = true)
  ORDER BY "ub"."period" DESC, "ub"."awarded_at" DESC;


ALTER VIEW "public"."vw_my_monthly_badges_flat" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_monthly_badges_flat" IS 'Flat per-badge view of all monthly badges for auth.uid(), including status (awarded/revoked), period, and typed metrics extracted from context.';



CREATE OR REPLACE VIEW "public"."vw_my_monthly_creator_badges" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        )
 SELECT "ub"."id" AS "user_badge_id",
    "ub"."user_id",
    "ub"."badge_id",
    "b"."slug",
    "b"."label",
    "b"."description",
    "b"."tier",
    "b"."color_hex",
    "b"."icon",
    "ub"."period",
    "ub"."awarded_at",
    "ub"."revoked_at",
    "ub"."is_permanent",
    "ub"."visible_on_profile",
    "ub"."pinned_on_profile",
    "ub"."context",
    (("ub"."context" ->> 'rank'::"text"))::integer AS "rank",
    (("ub"."context" ->> 'total_gross_cents'::"text"))::bigint AS "total_gross_cents",
    (("ub"."context" ->> 'unique_buyers'::"text"))::integer AS "unique_buyers",
    (("ub"."context" ->> 'total_attendance'::"text"))::integer AS "total_attendance",
    (("ub"."context" ->> 'unique_attendees'::"text"))::integer AS "unique_attendees",
    (("ub"."context" ->> 'follower_count'::"text"))::integer AS "follower_count",
    (("ub"."context" ->> 'growth_ratio'::"text"))::numeric AS "growth_ratio",
    (("ub"."context" ->> 'curr_value'::"text"))::numeric AS "curr_value",
    (("ub"."context" ->> 'prev_value'::"text"))::numeric AS "prev_value"
   FROM (("public"."app_user_badge" "ub"
     JOIN "public"."app_badge" "b" ON (("b"."id" = "ub"."badge_id")))
     JOIN "me" ON (("me"."uid" = "ub"."user_id")))
  WHERE (("ub"."period" IS NOT NULL) AND ("b"."audience" = 'creator'::"text") AND ("b"."is_monthly" = true));


ALTER VIEW "public"."vw_my_monthly_creator_badges" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_monthly_creator_badges" IS 'Monthly creator badges for the signed-in user (auth.uid()), including revenue/attendance/follower leaderboard positions and growth stats via app_user_badge.context.';



CREATE OR REPLACE VIEW "public"."vw_my_monthly_digest_history" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        ), "digests" AS (
         SELECT "d"."user_id",
            "d"."period",
            "d"."summary",
            "d"."awarded",
            "d"."revoked",
            "d"."created_at",
            "s"."seen_at"
           FROM (("public"."app_badge_monthly_digest" "d"
             JOIN "me" ON (("me"."uid" = "d"."user_id")))
             LEFT JOIN "public"."app_user_period_seen" "s" ON ((("s"."user_id" = "d"."user_id") AND ("s"."period" = "d"."period"))))
        )
 SELECT "period",
    "created_at" AS "digest_created_at",
    "seen_at",
    COALESCE("jsonb_array_length"("awarded"), 0) AS "awarded_count",
    COALESCE("jsonb_array_length"("revoked"), 0) AS "revoked_count",
    (("summary" ->> 'total_badges'::"text"))::integer AS "total_badges",
    (("summary" ->> 'best_rank'::"text"))::integer AS "best_rank",
    (("summary" ->> 'has_attendance_rank'::"text"))::boolean AS "has_attendance_rank",
    (("summary" ->> 'has_revenue_rank'::"text"))::boolean AS "has_revenue_rank",
    (("summary" ->> 'has_follower_rank'::"text"))::boolean AS "has_follower_rank",
    (("summary" ->> 'has_growth_badge'::"text"))::boolean AS "has_growth_badge",
    "summary",
    "awarded",
    "revoked"
   FROM "digests" "g"
  ORDER BY "period" DESC;


ALTER VIEW "public"."vw_my_monthly_digest_history" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_monthly_digest_history" IS 'Per-period monthly badge digest history for auth.uid(), including seen_at, counts, and summary flags unpacked from app_badge_monthly_digest.';



CREATE OR REPLACE VIEW "public"."vw_my_monthly_participant_badges" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        )
 SELECT "ub"."id" AS "user_badge_id",
    "ub"."user_id",
    "ub"."badge_id",
    "b"."slug",
    "b"."label",
    "b"."description",
    "b"."tier",
    "b"."color_hex",
    "b"."icon",
    "ub"."period",
    "ub"."awarded_at",
    "ub"."revoked_at",
    "ub"."is_permanent",
    "ub"."visible_on_profile",
    "ub"."pinned_on_profile",
    "ub"."context",
    (("ub"."context" ->> 'rank'::"text"))::integer AS "rank",
    (("ub"."context" ->> 'total_attendance'::"text"))::integer AS "total_attendance",
    (("ub"."context" ->> 'unique_creators'::"text"))::integer AS "total_creators",
    (("ub"."context" ->> 'growth_ratio'::"text"))::numeric AS "growth_ratio",
    (("ub"."context" ->> 'curr_sessions'::"text"))::integer AS "curr_sessions",
    (("ub"."context" ->> 'prev_sessions'::"text"))::integer AS "prev_sessions"
   FROM (("public"."app_user_badge" "ub"
     JOIN "public"."app_badge" "b" ON (("b"."id" = "ub"."badge_id")))
     JOIN "me" ON (("me"."uid" = "ub"."user_id")))
  WHERE (("ub"."period" IS NOT NULL) AND ("b"."audience" = 'participant'::"text") AND ("b"."is_monthly" = true));


ALTER VIEW "public"."vw_my_monthly_participant_badges" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_monthly_participant_badges" IS 'Monthly participant badges for the signed-in user (auth.uid()), including leaderboard positions and growth stats from app_user_badge.context.';



CREATE OR REPLACE VIEW "public"."vw_my_monthly_summary" WITH ("security_invoker"='true') AS
 WITH "monthly" AS (
         SELECT 'participant'::"text" AS "role",
            "m"."slug",
            "m"."tier",
            "m"."period",
            "m"."rank"
           FROM "public"."vw_my_monthly_participant_badges" "m"
        UNION ALL
         SELECT 'creator'::"text" AS "role",
            "m"."slug",
            "m"."tier",
            "m"."period",
            "m"."rank"
           FROM "public"."vw_my_monthly_creator_badges" "m"
        )
 SELECT "period",
    "count"(*) AS "total_badges",
    "min"("rank") FILTER (WHERE ("rank" IS NOT NULL)) AS "best_rank",
    "min"("rank") FILTER (WHERE (("role" = 'participant'::"text") AND ("rank" IS NOT NULL))) AS "best_participant_rank",
    "min"("rank") FILTER (WHERE (("role" = 'creator'::"text") AND ("rank" IS NOT NULL))) AS "best_creator_rank",
    "bool_or"(("role" = 'participant'::"text")) AS "has_participant_badges",
    "bool_or"(("role" = 'creator'::"text")) AS "has_creator_badges",
    "bool_or"(("slug" ~~ 'system:top_%attendance%'::"text")) AS "has_attendance_rank",
    "bool_or"(("slug" ~~ 'system:top_%revenue%'::"text")) AS "has_revenue_rank",
    "bool_or"(("slug" ~~ 'system:top_%followers%'::"text")) AS "has_follower_rank",
    "bool_or"(("slug" ~~ 'system:monthly_%_growth%'::"text")) AS "has_growth_badge"
   FROM "monthly"
  GROUP BY "period"
  ORDER BY "period" DESC;


ALTER VIEW "public"."vw_my_monthly_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_monthly_summary" IS 'Per-period summary of all monthly badges for auth.uid(), including best rank and category flags (attendance, revenue, followers, growth).';



CREATE OR REPLACE VIEW "public"."vw_my_notifications" WITH ("security_invoker"='true') AS
 SELECT "id",
    "type",
    "payload",
    "created_at",
    "read_at"
   FROM "public"."app_notification"
  WHERE ("recipient_id" = "auth"."uid"())
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."vw_my_notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_my_sessions_overview" WITH ("security_invoker"='true') AS
 WITH "my_sessions" AS (
         SELECT "s_1"."id",
            "s_1"."title",
            "s_1"."description",
            "s_1"."start_time",
            "s_1"."duration_minutes",
            "s_1"."capacity",
            "s_1"."price_cents",
            "s_1"."currency",
            "s_1"."stream_url",
            "s_1"."host_id",
            "s_1"."status",
            "s_1"."created_at",
            "s_1"."live_provider",
            "s_1"."live_room_id",
            "s_1"."started_at",
            "s_1"."ended_at",
            "s_1"."ticket_price",
            "s_1"."published_at",
            "s_1"."change_reason",
            "s_1"."updated_at"
           FROM "public"."app_session" "s_1"
          WHERE (("s_1"."host_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
                   FROM "public"."app_session_cohost" "ch"
                  WHERE (("ch"."session_id" = "s_1"."id") AND ("ch"."cohost_id" = "auth"."uid"())))))
        ), "att" AS (
         SELECT "a"."session_id",
            "count"(*) AS "attendee_count"
           FROM "public"."app_attendance" "a"
          GROUP BY "a"."session_id"
        ), "paid_att" AS (
         SELECT "a"."session_id",
            "count"(DISTINCT "a"."user_id") AS "paid_attendee_count"
           FROM "public"."app_attendance" "a"
          WHERE (EXISTS ( SELECT 1
                   FROM "public"."app_transaction" "t"
                  WHERE (("t"."session_id" = "a"."session_id") AND ("t"."buyer_id" = "a"."user_id") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type"))))
          GROUP BY "a"."session_id"
        ), "ticket_tx" AS (
         SELECT "t"."session_id",
            ("sum"("t"."amount_gross_cents"))::bigint AS "ticket_gross_cents"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type") AND ("t"."session_id" IS NOT NULL))
          GROUP BY "t"."session_id"
        )
 SELECT "s"."id" AS "session_id",
    "s"."title",
    "s"."host_id",
    "p"."username" AS "creator_username",
    "s"."status",
    "s"."start_time",
    "s"."started_at",
    "s"."ended_at",
    COALESCE("att"."attendee_count", (0)::bigint) AS "attendee_count",
    COALESCE("paid_att"."paid_attendee_count", (0)::bigint) AS "paid_attendee_count",
    COALESCE("ticket_tx"."ticket_gross_cents", (0)::bigint) AS "ticket_gross_cents"
   FROM (((("my_sessions" "s"
     LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "s"."host_id")))
     LEFT JOIN "att" ON (("att"."session_id" = "s"."id")))
     LEFT JOIN "paid_att" ON (("paid_att"."session_id" = "s"."id")))
     LEFT JOIN "ticket_tx" ON (("ticket_tx"."session_id" = "s"."id")))
  ORDER BY "s"."start_time" DESC NULLS LAST, "s"."created_at" DESC;


ALTER VIEW "public"."vw_my_sessions_overview" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_sessions_overview" IS 'Operational session dashboard scoped to the signed-in creator (host or cohost).';



CREATE OR REPLACE VIEW "public"."vw_my_sessions_participated" WITH ("security_invoker"='true') AS
 WITH "me" AS (
         SELECT "auth"."uid"() AS "uid"
        ), "att" AS (
         SELECT "a_1"."session_id",
            "a_1"."user_id",
            "a_1"."joined_at"
           FROM ("public"."app_attendance" "a_1"
             JOIN "me" ON (("a_1"."user_id" = "me"."uid")))
        ), "host_info" AS (
         SELECT "s"."id" AS "session_id",
            "s"."title",
            "s"."host_id",
            "s"."status",
            "s"."start_time"
           FROM "public"."app_session" "s"
        ), "host_named" AS (
         SELECT "h"."session_id",
            "h"."title",
            "h"."host_id",
            "p"."username" AS "host_username",
            "h"."status",
            "h"."start_time"
           FROM ("host_info" "h"
             LEFT JOIN "public"."app_profile" "p" ON (("p"."id" = "h"."host_id")))
        ), "ticket_tx" AS (
         SELECT "t"."session_id",
            ("sum"("t"."amount_gross_cents"))::bigint AS "ticket_amount_cents"
           FROM ("public"."app_transaction" "t"
             JOIN "me" ON (("t"."buyer_id" = "me"."uid")))
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type") AND ("t"."session_id" IS NOT NULL))
          GROUP BY "t"."session_id"
        ), "paid_ticket" AS (
         SELECT DISTINCT "t"."session_id"
           FROM ("public"."app_transaction" "t"
             JOIN "me" ON (("t"."buyer_id" = "me"."uid")))
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type") AND ("t"."session_id" IS NOT NULL))
        ), "bundle_map" AS (
         SELECT "cs"."session_id",
            "cs"."challenge_id"
           FROM "public"."app_challenge_session" "cs"
        ), "paid_bundle" AS (
         SELECT DISTINCT "bm"."session_id"
           FROM (("bundle_map" "bm"
             JOIN "public"."app_transaction" "t" ON (("t"."challenge_id" = "bm"."challenge_id")))
             JOIN "me" ON (("t"."buyer_id" = "me"."uid")))
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'bundle'::"public"."payment_type"))
        )
 SELECT "a"."session_id",
    "hn"."title",
    "hn"."host_id",
    "hn"."host_username",
    "hn"."status",
    "hn"."start_time",
    "a"."joined_at",
    COALESCE("tt"."ticket_amount_cents", (0)::bigint) AS "ticket_amount_cents",
    ("pt"."session_id" IS NOT NULL) AS "paid_via_ticket",
    ("pb"."session_id" IS NOT NULL) AS "paid_via_challenge",
    (("pt"."session_id" IS NOT NULL) OR ("pb"."session_id" IS NOT NULL)) AS "paid_attendee"
   FROM (((("att" "a"
     LEFT JOIN "host_named" "hn" ON (("hn"."session_id" = "a"."session_id")))
     LEFT JOIN "ticket_tx" "tt" ON (("tt"."session_id" = "a"."session_id")))
     LEFT JOIN "paid_ticket" "pt" ON (("pt"."session_id" = "a"."session_id")))
     LEFT JOIN "paid_bundle" "pb" ON (("pb"."session_id" = "a"."session_id")))
  ORDER BY "hn"."start_time" DESC NULLS LAST, "a"."joined_at" DESC;


ALTER VIEW "public"."vw_my_sessions_participated" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_my_sessions_participated" IS '
Participant-side session dashboard for the signed-in user (auth.uid()).

───────────────────────────────────────────────
Column Reference
───────────────────────────────────────────────
• session_id / title  
    → The unique session identifier and its title.

• host_username  
    → The creator/host of the session.

• paid_attendee  
    → True if the participant has paid for this session (directly or via challenge purchase).

• paid_via_ticket  
    → True if payment was made through a direct session ticket transaction.

• paid_via_challenge  
    → True if payment access was obtained via a purchased challenge bundle.

• ticket_amount_cents  
    → The amount paid for the ticket (in cents). Zero if joined via a bundle or free session.

• start_time  
    → The scheduled session start time, used to distinguish upcoming vs past sessions.

───────────────────────────────────────────────
Usage
───────────────────────────────────────────────
→ Powers the participant dashboard and "My Sessions" tab, showing all sessions the
  signed-in user attended, purchased, or has access to.

→ Enables metrics like:
   • Upcoming vs past sessions
   • Paid vs free participation
   • Session host visibility (creator attribution)

→ Fully RLS-safe: auth.uid() is enforced via attendance and transaction scope.
';



CREATE OR REPLACE VIEW "public"."vw_my_transactions" WITH ("security_invoker"='false') AS
 SELECT "t"."id",
    "t"."type",
    "t"."status",
    "t"."currency",
    "t"."amount_gross_cents",
    "t"."platform_cut_cents",
    "t"."creator_cut_cents",
    "t"."processing_fee_fixed_cents",
    "t"."processing_fee_percent_cents",
    "t"."created_at",
    "t"."session_id",
    "t"."challenge_id",
    "t"."buyer_id",
    "s"."title" AS "session_title",
    "c"."title" AS "challenge_title",
    "bp"."display_name" AS "buyer_name"
   FROM ((("public"."app_transaction" "t"
     LEFT JOIN "public"."app_session" "s" ON (("s"."id" = "t"."session_id")))
     LEFT JOIN "public"."app_challenge" "c" ON (("c"."id" = "t"."challenge_id")))
     LEFT JOIN "public"."app_profile" "bp" ON (("bp"."id" = "t"."buyer_id")))
  WHERE (("t"."creator_id" = "auth"."uid"()) AND ("t"."status" = 'succeeded'::"public"."payment_status"))
  ORDER BY "t"."created_at" DESC;


ALTER VIEW "public"."vw_my_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_pending_questions_for_creator" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "post_id",
    "p"."body",
    "p"."created_at",
    "p"."author_id",
    "p"."directed_to",
    "cs"."source_challenge_id" AS "challenge_id",
    "prof"."display_name" AS "asker_name",
    ((EXTRACT(epoch FROM ("now"() - "p"."created_at")) / (3600)::numeric))::integer AS "hours_since_asked"
   FROM (("public"."app_challenge_post" "p"
     JOIN "public"."app_challenge_space" "cs" ON (("cs"."id" = "p"."space_id")))
     JOIN "public"."app_profile" "prof" ON (("prof"."id" = "p"."author_id")))
  WHERE (("p"."kind" = 'question'::"text") AND (( SELECT "auth"."uid"() AS "uid") = ANY ("p"."directed_to")) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."app_challenge_comment" "c"
          WHERE (("c"."post_id" = "p"."id") AND ("c"."author_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("c"."is_coach_answer" = true))))));


ALTER VIEW "public"."vw_pending_questions_for_creator" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_recent_reflections_for_creator" WITH ("security_invoker"='true') AS
 SELECT "p"."id" AS "post_id",
    "p"."body",
    "p"."created_at",
    "p"."author_id",
    "p"."context_id" AS "session_id",
    "cs"."source_challenge_id" AS "challenge_id",
    "s"."title" AS "session_title",
    "prof"."display_name" AS "author_name",
    (("p"."metadata" ->> 'energy_after'::"text"))::integer AS "energy_after"
   FROM (((("public"."app_challenge_post" "p"
     JOIN "public"."app_challenge_space" "cs" ON (("cs"."id" = "p"."space_id")))
     JOIN "public"."app_challenge" "c" ON (("c"."id" = "cs"."source_challenge_id")))
     LEFT JOIN "public"."app_session" "s" ON ((("s"."id" = "p"."context_id") AND ("p"."context_type" = 'session'::"text"))))
     JOIN "public"."app_profile" "prof" ON (("prof"."id" = "p"."author_id")))
  WHERE (("p"."kind" = 'reflection'::"text") AND ("p"."created_at" > ("now"() - '48:00:00'::interval)) AND (("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "ch"
          WHERE (("ch"."challenge_id" = "c"."id") AND ("ch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))));


ALTER VIEW "public"."vw_recent_reflections_for_creator" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_session_financials" WITH ("security_invoker"='true') AS
 WITH "ticket_tx" AS (
         SELECT "t"."session_id",
            "count"(*) AS "ticket_tx_count",
            ("sum"("t"."amount_gross_cents"))::bigint AS "ticket_gross_cents",
            ("sum"("t"."creator_cut_cents"))::bigint AS "ticket_creator_cut_cents"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type") AND ("t"."session_id" IS NOT NULL))
          GROUP BY "t"."session_id"
        ), "buyers" AS (
         SELECT "t"."session_id",
            "count"(DISTINCT "t"."buyer_id") AS "ticket_buyers"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type") AND ("t"."session_id" IS NOT NULL))
          GROUP BY "t"."session_id"
        ), "att" AS (
         SELECT "a"."session_id",
            "count"(*) AS "attendee_count"
           FROM "public"."app_attendance" "a"
          GROUP BY "a"."session_id"
        ), "paid_att" AS (
         SELECT "a"."session_id",
            "count"(DISTINCT "a"."user_id") AS "paid_attendee_count"
           FROM "public"."app_attendance" "a"
          WHERE (EXISTS ( SELECT 1
                   FROM "public"."app_transaction" "t"
                  WHERE (("t"."session_id" = "a"."session_id") AND ("t"."buyer_id" = "a"."user_id") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type"))))
          GROUP BY "a"."session_id"
        )
 SELECT "s"."id" AS "session_id",
    "s"."title",
    "s"."host_id",
    "s"."status",
    "s"."start_time",
    COALESCE("tt"."ticket_tx_count", (0)::bigint) AS "ticket_tx_count",
    COALESCE("b"."ticket_buyers", (0)::bigint) AS "ticket_buyers",
    COALESCE("tt"."ticket_gross_cents", (0)::bigint) AS "ticket_gross_cents",
    COALESCE("tt"."ticket_creator_cut_cents", (0)::bigint) AS "ticket_creator_cut_cents",
    COALESCE("at"."attendee_count", (0)::bigint) AS "attendee_count",
    COALESCE("pa"."paid_attendee_count", (0)::bigint) AS "paid_attendee_count"
   FROM (((("public"."app_session" "s"
     LEFT JOIN "ticket_tx" "tt" ON (("tt"."session_id" = "s"."id")))
     LEFT JOIN "buyers" "b" ON (("b"."session_id" = "s"."id")))
     LEFT JOIN "att" "at" ON (("at"."session_id" = "s"."id")))
     LEFT JOIN "paid_att" "pa" ON (("pa"."session_id" = "s"."id")))
  ORDER BY "s"."start_time" DESC NULLS LAST, "s"."created_at" DESC;


ALTER VIEW "public"."vw_session_financials" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_session_financials" IS 'Per-session KPIs. Ticket revenue only (direct session purchases). Adds paid_attendee_count (attendees who bought a ticket).';



CREATE OR REPLACE VIEW "public"."vw_session_overview" WITH ("security_invoker"='true') AS
 WITH "att" AS (
         SELECT "a"."session_id",
            "count"(*) AS "attendee_count"
           FROM "public"."app_attendance" "a"
          GROUP BY "a"."session_id"
        ), "paid_att" AS (
         SELECT "a"."session_id",
            "count"(DISTINCT "a"."user_id") AS "paid_attendee_count"
           FROM "public"."app_attendance" "a"
          WHERE (EXISTS ( SELECT 1
                   FROM "public"."app_transaction" "t"
                  WHERE (("t"."session_id" = "a"."session_id") AND ("t"."buyer_id" = "a"."user_id") AND ("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type"))))
          GROUP BY "a"."session_id"
        ), "ticket_tx" AS (
         SELECT "t"."session_id",
            ("sum"("t"."amount_gross_cents"))::bigint AS "ticket_gross_cents"
           FROM "public"."app_transaction" "t"
          WHERE (("t"."status" = 'succeeded'::"public"."payment_status") AND ("t"."type" = 'ticket'::"public"."payment_type") AND ("t"."session_id" IS NOT NULL))
          GROUP BY "t"."session_id"
        )
 SELECT "s"."id" AS "session_id",
    "s"."title",
    "s"."status",
    "s"."start_time",
    "s"."started_at",
    "s"."ended_at",
    "s"."host_id",
    "ap"."username" AS "creator_username",
    COALESCE("att"."attendee_count", (0)::bigint) AS "attendee_count",
    COALESCE("paid_att"."paid_attendee_count", (0)::bigint) AS "paid_attendee_count",
    COALESCE("ticket_tx"."ticket_gross_cents", (0)::bigint) AS "ticket_gross_cents"
   FROM (((("public"."app_session" "s"
     LEFT JOIN "att" ON (("att"."session_id" = "s"."id")))
     LEFT JOIN "paid_att" ON (("paid_att"."session_id" = "s"."id")))
     LEFT JOIN "ticket_tx" ON (("ticket_tx"."session_id" = "s"."id")))
     LEFT JOIN "public"."app_profile" "ap" ON (("ap"."id" = "s"."host_id")))
  ORDER BY "s"."start_time" DESC NULLS LAST, "s"."created_at" DESC;


ALTER VIEW "public"."vw_session_overview" OWNER TO "postgres";


COMMENT ON VIEW "public"."vw_session_overview" IS 'Operational snapshot per session. Includes host_id, creator_username and paid_attendee_count (attendees who purchased a ticket for this session).';



CREATE OR REPLACE VIEW "public"."vw_session_pre_pulse_aggregate" WITH ("security_invoker"='true') AS
 SELECT "s"."id" AS "session_id",
    ("count"("p"."id"))::integer AS "response_count",
        CASE
            WHEN ("count"("p"."id") > 0) THEN "round"("avg"("p"."value"), 1)
            ELSE NULL::numeric
        END AS "avg_value",
    (( SELECT "count"(*) AS "count"
           FROM "public"."app_attendance" "a"
          WHERE ("a"."session_id" = "s"."id")))::integer AS "eligible_count",
    ("count"("p"."id") >= 5) AS "can_show"
   FROM ("public"."app_session" "s"
     LEFT JOIN "public"."app_session_pre_pulse_response" "p" ON (("p"."session_id" = "s"."id")))
  GROUP BY "s"."id";


ALTER VIEW "public"."vw_session_pre_pulse_aggregate" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_sessions_starting_soon_no_room" WITH ("security_invoker"='true') AS
 SELECT "id",
    "title",
    "status",
    "start_time",
    "live_provider",
    "live_room_id"
   FROM "public"."app_session"
  WHERE (("status" = 'published'::"public"."session_status") AND ("start_time" IS NOT NULL) AND (("start_time" >= "now"()) AND ("start_time" <= ("now"() + '00:10:00'::interval))) AND (("live_room_id" IS NULL) OR ("live_provider" IS NULL)))
  ORDER BY "start_time";


ALTER VIEW "public"."vw_sessions_starting_soon_no_room" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_stream_tokens_expired" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "expired_count",
    "min"("expires_at") AS "oldest_expired_at",
    "max"("expires_at") AS "newest_expired_at"
   FROM "public"."app_stream_token"
  WHERE ("expires_at" < "now"());


ALTER VIEW "public"."vw_stream_tokens_expired" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_event_lock" (
    "provider" "text" NOT NULL,
    "provider_event_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_event_lock" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_badge_monthly_digest" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_badge_monthly_digest_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_creator_badge_trigger" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_creator_badge_trigger_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_edge_call_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_edge_call_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_email_outbox" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_email_outbox_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_transaction_audit" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_transaction_audit_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_user_badge" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."app_user_badge_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_attendance"
    ADD CONSTRAINT "app_attendance_pkey" PRIMARY KEY ("session_id", "user_id");



ALTER TABLE ONLY "public"."app_badge_monthly_digest"
    ADD CONSTRAINT "app_badge_monthly_digest_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_badge_monthly_digest"
    ADD CONSTRAINT "app_badge_monthly_digest_user_period_uniq" UNIQUE ("user_id", "period");



ALTER TABLE ONLY "public"."app_badge"
    ADD CONSTRAINT "app_badge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_badge"
    ADD CONSTRAINT "app_badge_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."app_challenge_cohost"
    ADD CONSTRAINT "app_challenge_cohost_pkey" PRIMARY KEY ("challenge_id", "cohost_id");



ALTER TABLE ONLY "public"."app_challenge_comment"
    ADD CONSTRAINT "app_challenge_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_challenge_member"
    ADD CONSTRAINT "app_challenge_member_pkey" PRIMARY KEY ("challenge_id", "user_id");



ALTER TABLE ONLY "public"."app_challenge"
    ADD CONSTRAINT "app_challenge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_challenge_post_like"
    ADD CONSTRAINT "app_challenge_post_like_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."app_challenge_post"
    ADD CONSTRAINT "app_challenge_post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_challenge_session"
    ADD CONSTRAINT "app_challenge_session_pkey" PRIMARY KEY ("challenge_id", "session_id");



ALTER TABLE ONLY "public"."app_challenge_space"
    ADD CONSTRAINT "app_challenge_space_continuation_group_id_key" UNIQUE ("continuation_group_id");



ALTER TABLE ONLY "public"."app_challenge_space"
    ADD CONSTRAINT "app_challenge_space_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_chat_message"
    ADD CONSTRAINT "app_chat_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_collab_review"
    ADD CONSTRAINT "app_collab_review_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_collaboration_acceptance"
    ADD CONSTRAINT "app_collaboration_acceptance_pkey" PRIMARY KEY ("contract_id", "cohost_id");



ALTER TABLE ONLY "public"."app_collaboration_contract"
    ADD CONSTRAINT "app_collaboration_contract_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_collaboration_contract"
    ADD CONSTRAINT "app_collaboration_contract_target_version_key" UNIQUE ("target_type", "target_id", "version");



ALTER TABLE ONLY "public"."app_collaboration_decline"
    ADD CONSTRAINT "app_collaboration_decline_pkey" PRIMARY KEY ("contract_id", "cohost_id");



ALTER TABLE ONLY "public"."app_collaboration_invite"
    ADD CONSTRAINT "app_collaboration_invite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_badge_trigger"
    ADD CONSTRAINT "app_creator_badge_trigger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_comment"
    ADD CONSTRAINT "app_creator_comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_contract_identity"
    ADD CONSTRAINT "app_creator_contract_identity_pkey" PRIMARY KEY ("creator_id");



ALTER TABLE ONLY "public"."app_creator_post_like"
    ADD CONSTRAINT "app_creator_post_like_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."app_creator_post"
    ADD CONSTRAINT "app_creator_post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_space_member"
    ADD CONSTRAINT "app_creator_space_member_pkey" PRIMARY KEY ("space_id", "user_id");



ALTER TABLE ONLY "public"."app_creator_space"
    ADD CONSTRAINT "app_creator_space_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_subscription_plan"
    ADD CONSTRAINT "app_creator_subscription_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_subscription_plan"
    ADD CONSTRAINT "app_creator_subscription_plan_stripe_price_id_key" UNIQUE ("stripe_price_id");



ALTER TABLE ONLY "public"."app_dm_conversation"
    ADD CONSTRAINT "app_dm_conversation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_dm_member"
    ADD CONSTRAINT "app_dm_member_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."app_dm_message"
    ADD CONSTRAINT "app_dm_message_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_edge_call_log"
    ADD CONSTRAINT "app_edge_call_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_email_outbox"
    ADD CONSTRAINT "app_email_outbox_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_feed_event"
    ADD CONSTRAINT "app_feed_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_notification"
    ADD CONSTRAINT "app_notification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_payment_event"
    ADD CONSTRAINT "app_payment_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_payout"
    ADD CONSTRAINT "app_payout_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_pilot_application"
    ADD CONSTRAINT "app_pilot_application_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_profile"
    ADD CONSTRAINT "app_profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_profile"
    ADD CONSTRAINT "app_profile_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."app_review"
    ADD CONSTRAINT "app_review_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_review"
    ADD CONSTRAINT "app_review_session_id_reviewer_id_key" UNIQUE ("session_id", "reviewer_id");



ALTER TABLE ONLY "public"."app_session_cohost"
    ADD CONSTRAINT "app_session_cohost_pkey" PRIMARY KEY ("session_id", "cohost_id");



ALTER TABLE ONLY "public"."app_session"
    ADD CONSTRAINT "app_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_session_pre_pulse_response"
    ADD CONSTRAINT "app_session_pre_pulse_response_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_session_pre_pulse_response"
    ADD CONSTRAINT "app_session_pre_pulse_response_session_id_user_id_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "public"."app_staff"
    ADD CONSTRAINT "app_staff_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."app_stream_event"
    ADD CONSTRAINT "app_stream_event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_stream_token"
    ADD CONSTRAINT "app_stream_token_pkey" PRIMARY KEY ("session_id", "user_id");



ALTER TABLE ONLY "public"."app_subscription_inclusion"
    ADD CONSTRAINT "app_subscription_inclusion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_template_item"
    ADD CONSTRAINT "app_template_item_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_template"
    ADD CONSTRAINT "app_template_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_transaction_audit"
    ADD CONSTRAINT "app_transaction_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_transaction"
    ADD CONSTRAINT "app_transaction_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user_badge"
    ADD CONSTRAINT "app_user_badge_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user_period_seen"
    ADD CONSTRAINT "app_user_period_seen_pkey" PRIMARY KEY ("user_id", "period");



ALTER TABLE ONLY "public"."app_user_subscription"
    ADD CONSTRAINT "app_user_subscription_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_user_subscription"
    ADD CONSTRAINT "app_user_subscription_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."app_workspace_activity"
    ADD CONSTRAINT "app_workspace_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_creator_space"
    ADD CONSTRAINT "uq_creator_space_creator_id" UNIQUE ("creator_id");



ALTER TABLE ONLY "public"."webhook_event_lock"
    ADD CONSTRAINT "webhook_event_lock_pkey" PRIMARY KEY ("provider", "provider_event_id");



CREATE INDEX "app_creator_badge_trigger_badge_id_idx" ON "public"."app_creator_badge_trigger" USING "btree" ("badge_id");



CREATE INDEX "app_creator_badge_trigger_creator_id_trigger_type_idx" ON "public"."app_creator_badge_trigger" USING "btree" ("creator_id", "trigger_type");



CREATE INDEX "idx_app_challenge_contract_id" ON "public"."app_challenge" USING "btree" ("contract_id");



CREATE INDEX "idx_app_session_contract_id" ON "public"."app_session" USING "btree" ("contract_id");



CREATE INDEX "idx_attendance_session" ON "public"."app_attendance" USING "btree" ("session_id");



CREATE INDEX "idx_badge_created_by" ON "public"."app_badge" USING "btree" ("created_by");



CREATE INDEX "idx_challenge_cohost_cohost" ON "public"."app_challenge_cohost" USING "btree" ("cohost_id");



CREATE INDEX "idx_challenge_comment_author_id" ON "public"."app_challenge_comment" USING "btree" ("author_id");



CREATE INDEX "idx_challenge_comment_coach_answer" ON "public"."app_challenge_comment" USING "btree" ("post_id", "is_coach_answer") WHERE ("is_coach_answer" = true);



CREATE INDEX "idx_challenge_comment_created_at" ON "public"."app_challenge_comment" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_challenge_comment_post_id" ON "public"."app_challenge_comment" USING "btree" ("post_id");



CREATE INDEX "idx_challenge_continuation_group_id" ON "public"."app_challenge" USING "btree" ("continuation_group_id");



CREATE INDEX "idx_challenge_continued_from_challenge_id" ON "public"."app_challenge" USING "btree" ("continued_from_challenge_id");



CREATE INDEX "idx_challenge_dates" ON "public"."app_challenge" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_challenge_member_user" ON "public"."app_challenge_member" USING "btree" ("user_id");



CREATE INDEX "idx_challenge_owner" ON "public"."app_challenge" USING "btree" ("owner_id");



CREATE INDEX "idx_challenge_post_author_id" ON "public"."app_challenge_post" USING "btree" ("author_id");



CREATE INDEX "idx_challenge_post_context" ON "public"."app_challenge_post" USING "btree" ("context_type", "context_id") WHERE ("context_type" IS NOT NULL);



CREATE INDEX "idx_challenge_post_created_at" ON "public"."app_challenge_post" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_challenge_post_kind" ON "public"."app_challenge_post" USING "btree" ("space_id", "kind", "created_at" DESC);



CREATE INDEX "idx_challenge_post_like_user_id" ON "public"."app_challenge_post_like" USING "btree" ("user_id");



CREATE INDEX "idx_challenge_post_space_id" ON "public"."app_challenge_post" USING "btree" ("space_id");



CREATE INDEX "idx_challenge_space_created_by" ON "public"."app_challenge_space" USING "btree" ("created_by");



CREATE INDEX "idx_challenge_space_owner_id" ON "public"."app_challenge_space" USING "btree" ("owner_id");



CREATE INDEX "idx_challenge_space_source_challenge_id" ON "public"."app_challenge_space" USING "btree" ("source_challenge_id");



CREATE INDEX "idx_challenge_status" ON "public"."app_challenge" USING "btree" ("status");



CREATE INDEX "idx_chat_message_author" ON "public"."app_chat_message" USING "btree" ("author_id");



CREATE INDEX "idx_chat_session" ON "public"."app_chat_message" USING "btree" ("session_id");



CREATE INDEX "idx_chat_session_time" ON "public"."app_chat_message" USING "btree" ("session_id", "created_at" DESC);



CREATE INDEX "idx_collab_invite_from" ON "public"."app_collaboration_invite" USING "btree" ("from_id");



CREATE INDEX "idx_collab_invite_to" ON "public"."app_collaboration_invite" USING "btree" ("to_id", "status");



CREATE INDEX "idx_collaboration_acceptance_cohost_id" ON "public"."app_collaboration_acceptance" USING "btree" ("cohost_id", "accepted_at" DESC);



CREATE INDEX "idx_collaboration_contract_target" ON "public"."app_collaboration_contract" USING "btree" ("target_type", "target_id", "version" DESC);



CREATE INDEX "idx_collaboration_decline_cohost_id" ON "public"."app_collaboration_decline" USING "btree" ("cohost_id", "declined_at" DESC);



CREATE INDEX "idx_creator_comment_author_id" ON "public"."app_creator_comment" USING "btree" ("author_id");



CREATE INDEX "idx_creator_comment_created_at" ON "public"."app_creator_comment" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_creator_comment_post_id" ON "public"."app_creator_comment" USING "btree" ("post_id");



CREATE INDEX "idx_creator_post_author_id" ON "public"."app_creator_post" USING "btree" ("author_id");



CREATE INDEX "idx_creator_post_created_at" ON "public"."app_creator_post" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_creator_post_like_user_id" ON "public"."app_creator_post_like" USING "btree" ("user_id");



CREATE INDEX "idx_creator_post_space_id" ON "public"."app_creator_post" USING "btree" ("space_id");



CREATE INDEX "idx_creator_space_creator_id" ON "public"."app_creator_space" USING "btree" ("creator_id");



CREATE INDEX "idx_creator_space_member_user_id" ON "public"."app_creator_space_member" USING "btree" ("user_id");



CREATE INDEX "idx_dm_conversation_created_by" ON "public"."app_dm_conversation" USING "btree" ("created_by");



CREATE INDEX "idx_dm_member_conversation" ON "public"."app_dm_member" USING "btree" ("conversation_id");



CREATE INDEX "idx_dm_member_user" ON "public"."app_dm_member" USING "btree" ("user_id");



CREATE INDEX "idx_dm_message_author" ON "public"."app_dm_message" USING "btree" ("author_id");



CREATE INDEX "idx_dm_message_conv_created" ON "public"."app_dm_message" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_dm_message_conversation" ON "public"."app_dm_message" USING "btree" ("conversation_id");



CREATE INDEX "idx_email_outbox_tx" ON "public"."app_email_outbox" USING "btree" ("tx_id");



CREATE INDEX "idx_feed_actor" ON "public"."app_feed_event" USING "btree" ("actor_id");



CREATE INDEX "idx_feed_created_at" ON "public"."app_feed_event" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feed_event_challenge" ON "public"."app_feed_event" USING "btree" ("challenge_id");



CREATE INDEX "idx_feed_session" ON "public"."app_feed_event" USING "btree" ("session_id");



CREATE INDEX "idx_feed_type" ON "public"."app_feed_event" USING "btree" ("type");



CREATE INDEX "idx_inclusion_challenge" ON "public"."app_subscription_inclusion" USING "btree" ("challenge_id");



CREATE INDEX "idx_inclusion_plan" ON "public"."app_subscription_inclusion" USING "btree" ("plan_id");



CREATE INDEX "idx_inclusion_session" ON "public"."app_subscription_inclusion" USING "btree" ("session_id");



CREATE INDEX "idx_payout_creator" ON "public"."app_payout" USING "btree" ("creator_id", "created_at" DESC);



CREATE INDEX "idx_pilot_application_status_created" ON "public"."app_pilot_application" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_pre_pulse_session" ON "public"."app_session_pre_pulse_response" USING "btree" ("session_id");



CREATE INDEX "idx_review_creator" ON "public"."app_review" USING "btree" ("creator_id");



CREATE INDEX "idx_review_reviewer" ON "public"."app_review" USING "btree" ("reviewer_id", "created_at" DESC);



CREATE INDEX "idx_review_session" ON "public"."app_review" USING "btree" ("session_id");



CREATE INDEX "idx_session_continuation_group_id" ON "public"."app_session" USING "btree" ("continuation_group_id");



CREATE INDEX "idx_session_continued_from_session_id" ON "public"."app_session" USING "btree" ("continued_from_session_id");



CREATE INDEX "idx_session_ended_at" ON "public"."app_session" USING "btree" ("ended_at");



CREATE INDEX "idx_session_host" ON "public"."app_session" USING "btree" ("host_id");



CREATE INDEX "idx_session_live_room" ON "public"."app_session" USING "btree" ("live_provider", "live_room_id");



CREATE INDEX "idx_session_start_time" ON "public"."app_session" USING "btree" ("start_time");



CREATE INDEX "idx_session_started_at" ON "public"."app_session" USING "btree" ("started_at");



CREATE INDEX "idx_session_status" ON "public"."app_session" USING "btree" ("status");



CREATE INDEX "idx_stream_event_session" ON "public"."app_stream_event" USING "btree" ("session_id");



CREATE INDEX "idx_stream_token_expiry" ON "public"."app_stream_token" USING "btree" ("expires_at");



CREATE INDEX "idx_subplan_creator" ON "public"."app_creator_subscription_plan" USING "btree" ("creator_id");



CREATE INDEX "idx_template_creator" ON "public"."app_template" USING "btree" ("creator_id");



CREATE INDEX "idx_template_item_position" ON "public"."app_template_item" USING "btree" ("template_id", "position");



CREATE INDEX "idx_template_item_template" ON "public"."app_template_item" USING "btree" ("template_id");



CREATE INDEX "idx_template_kind" ON "public"."app_template" USING "btree" ("kind");



CREATE INDEX "idx_token_session" ON "public"."app_stream_token" USING "btree" ("session_id");



CREATE INDEX "idx_tx_buyer" ON "public"."app_transaction" USING "btree" ("buyer_id", "created_at" DESC);



CREATE INDEX "idx_tx_creator" ON "public"."app_transaction" USING "btree" ("creator_id", "created_at" DESC);



CREATE INDEX "idx_tx_session" ON "public"."app_transaction" USING "btree" ("session_id");



CREATE INDEX "idx_tx_status" ON "public"."app_transaction" USING "btree" ("status");



CREATE INDEX "idx_user_badge_awarded_by" ON "public"."app_user_badge" USING "btree" ("awarded_by");



CREATE INDEX "idx_user_badge_badge" ON "public"."app_user_badge" USING "btree" ("badge_id", "awarded_at" DESC);



CREATE UNIQUE INDEX "idx_user_badge_full" ON "public"."app_user_badge" USING "btree" ("user_id", "badge_id", COALESCE("period", ''::"text"));



CREATE INDEX "idx_user_badge_user" ON "public"."app_user_badge" USING "btree" ("user_id", "awarded_at" DESC);



CREATE INDEX "idx_user_subscription_plan" ON "public"."app_user_subscription" USING "btree" ("plan_id");



CREATE INDEX "idx_usersub_creator_status" ON "public"."app_user_subscription" USING "btree" ("creator_id", "status");



CREATE INDEX "idx_usersub_user_creator" ON "public"."app_user_subscription" USING "btree" ("user_id", "creator_id");



CREATE INDEX "idx_usersub_user_status" ON "public"."app_user_subscription" USING "btree" ("user_id", "status");



CREATE INDEX "idx_workspace_activity_challenge_created" ON "public"."app_workspace_activity" USING "btree" ("challenge_id", "created_at" DESC);



CREATE INDEX "ix_attendance_user" ON "public"."app_attendance" USING "btree" ("user_id");



CREATE INDEX "ix_attendance_user_session" ON "public"."app_attendance" USING "btree" ("user_id", "session_id");



CREATE INDEX "ix_ch_sess_challenge_id" ON "public"."app_challenge_session" USING "btree" ("challenge_id");



CREATE INDEX "ix_ch_sess_session_id" ON "public"."app_challenge_session" USING "btree" ("session_id");



CREATE INDEX "ix_challenge_cohost_ch" ON "public"."app_challenge_cohost" USING "btree" ("challenge_id");



CREATE INDEX "ix_collab_review_reviewer" ON "public"."app_collab_review" USING "btree" ("reviewer_id", "created_at" DESC);



CREATE INDEX "ix_collab_review_subject" ON "public"."app_collab_review" USING "btree" ("subject_id", "created_at" DESC);



CREATE INDEX "ix_dm_member_user_conv" ON "public"."app_dm_member" USING "btree" ("user_id", "conversation_id");



CREATE INDEX "ix_edge_call_created_at" ON "public"."app_edge_call_log" USING "btree" ("created_at");



CREATE INDEX "ix_edge_call_fn_ip_ts" ON "public"."app_edge_call_log" USING "btree" ("fn", "ip", "created_at" DESC);



CREATE INDEX "ix_edge_call_fn_user_ts" ON "public"."app_edge_call_log" USING "btree" ("fn", "user_id", "created_at" DESC);



CREATE INDEX "ix_email_outbox_pending" ON "public"."app_email_outbox" USING "btree" ("kind", "sent_at", "enqueued_at") WHERE ("sent_at" IS NULL);



CREATE INDEX "ix_notification_dm_conv_rec_created" ON "public"."app_notification" USING "btree" ("recipient_id", "type", (("payload" ->> 'conversation_id'::"text")), "created_at" DESC) WHERE ("type" = 'dm_new'::"text");



CREATE INDEX "ix_notification_recipient_created" ON "public"."app_notification" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "ix_notification_recipient_type_ts" ON "public"."app_notification" USING "btree" ("recipient_id", "type", "created_at" DESC);



CREATE INDEX "ix_review_creator_created" ON "public"."app_review" USING "btree" ("creator_id", "created_at" DESC);



CREATE INDEX "ix_session_cohost_cohost" ON "public"."app_session_cohost" USING "btree" ("cohost_id");



CREATE INDEX "ix_session_host_start" ON "public"."app_session" USING "btree" ("host_id", "start_time" DESC);



CREATE INDEX "ix_session_status_start" ON "public"."app_session" USING "btree" ("status", "start_time" DESC);



CREATE INDEX "ix_stream_event_session_created" ON "public"."app_stream_event" USING "btree" ("session_id", "created_at" DESC);



CREATE INDEX "ix_stream_token_user_created" ON "public"."app_stream_token" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "ix_tx_audit_created_at" ON "public"."app_transaction_audit" USING "btree" ("created_at");



CREATE INDEX "ix_tx_audit_provider_pid" ON "public"."app_transaction_audit" USING "btree" ("provider", "provider_payment_id");



CREATE INDEX "ix_tx_audit_txid_ts" ON "public"."app_transaction_audit" USING "btree" ("tx_id", "created_at" DESC);



CREATE INDEX "ix_tx_challenge_created" ON "public"."app_transaction" USING "btree" ("challenge_id", "created_at" DESC);



CREATE UNIQUE INDEX "uniq_email_outbox_user_kind_target" ON "public"."app_email_outbox" USING "btree" ("user_id", "kind", "target_id") WHERE (("user_id" IS NOT NULL) AND ("target_id" IS NOT NULL));



CREATE UNIQUE INDEX "uniq_notification_recipient_kind_challenge" ON "public"."app_notification" USING "btree" ("recipient_id", "type", (("payload" ->> 'challenge_id'::"text"))) WHERE ("type" = ANY (ARRAY['intro_prompt_ready'::"text", 'contract_locked'::"text", 'contract_accepted'::"text", 'contract_declined'::"text", 'challenge_published'::"text"]));



CREATE UNIQUE INDEX "uniq_notification_recipient_kind_post" ON "public"."app_notification" USING "btree" ("recipient_id", "type", (("payload" ->> 'post_id'::"text"))) WHERE ("type" = ANY (ARRAY['question_for_you'::"text", 'coach_answered_your_question'::"text"]));



CREATE UNIQUE INDEX "uniq_notification_recipient_kind_session" ON "public"."app_notification" USING "btree" ("recipient_id", "type", (("payload" ->> 'session_id'::"text"))) WHERE ("type" = ANY (ARRAY['pre_pulse_ready'::"text", 'reflection_ready'::"text"]));



CREATE UNIQUE INDEX "uq_challenge_space_source_challenge_id" ON "public"."app_challenge_space" USING "btree" ("source_challenge_id") WHERE ("source_challenge_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_collab_review_once" ON "public"."app_collab_review" USING "btree" ("challenge_id", "reviewer_id", "subject_id");



CREATE UNIQUE INDEX "uq_notification_dm_new" ON "public"."app_notification" USING "btree" ("recipient_id", (("payload" ->> 'message_id'::"text"))) WHERE ("type" = 'dm_new'::"text");



CREATE UNIQUE INDEX "uq_template_item_template_position" ON "public"."app_template_item" USING "btree" ("template_id", "position");



CREATE UNIQUE INDEX "uq_tx_provider_payment" ON "public"."app_transaction" USING "btree" ("provider", "provider_payment_id") WHERE ("provider_payment_id" IS NOT NULL);



CREATE UNIQUE INDEX "ux_email_outbox_kind_tx" ON "public"."app_email_outbox" USING "btree" ("kind", "tx_id");



CREATE UNIQUE INDEX "ux_user_badge_event_once" ON "public"."app_user_badge" USING "btree" ("user_id", "badge_id") WHERE (("is_permanent" = true) AND ("revoked_at" IS NULL));



CREATE UNIQUE INDEX "ux_user_badge_monthly_period" ON "public"."app_user_badge" USING "btree" ("user_id", "badge_id", COALESCE(("context" ->> 'period_month'::"text"), ''::"text")) WHERE (("is_permanent" = false) AND ("context" ? 'period_month'::"text") AND ("revoked_at" IS NULL));



CREATE OR REPLACE VIEW "public"."app_session_financials" WITH ("security_invoker"='true') AS
 SELECT "s"."id" AS "session_id",
    "s"."title",
    ("sum"("t"."amount_gross_cents") / 100.0) AS "total_revenue_chf",
    ("sum"("t"."creator_cut_cents") / 100.0) AS "creator_payout_chf",
    ("sum"("t"."platform_cut_cents") / 100.0) AS "platform_revenue_chf",
    "count"("t"."id") AS "total_sales"
   FROM ("public"."app_session" "s"
     LEFT JOIN "public"."app_transaction" "t" ON ((("t"."session_id" = "s"."id") AND ("t"."status" = 'succeeded'::"public"."payment_status"))))
  GROUP BY "s"."id";



CREATE OR REPLACE TRIGGER "app_session_assert_within_challenge_window" BEFORE INSERT OR UPDATE OF "start_time" ON "public"."app_session" FOR EACH ROW EXECUTE FUNCTION "public"."app_session_assert_within_challenge_window"();



CREATE OR REPLACE TRIGGER "trg_app_transaction_audit" AFTER INSERT OR DELETE OR UPDATE ON "public"."app_transaction" FOR EACH ROW EXECUTE FUNCTION "public"."on_app_transaction_audit"();



CREATE OR REPLACE TRIGGER "trg_app_tx_enqueue_receipt" AFTER INSERT OR UPDATE OF "status" ON "public"."app_transaction" FOR EACH ROW EXECUTE FUNCTION "public"."trg_tx_enqueue_receipt"();



CREATE OR REPLACE TRIGGER "trg_badge_on_attendance" AFTER INSERT ON "public"."app_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."fn_badge_on_attendance"();



CREATE OR REPLACE TRIGGER "trg_badge_on_challenge_published" AFTER UPDATE ON "public"."app_challenge" FOR EACH ROW EXECUTE FUNCTION "public"."fn_badge_on_challenge_published"();



CREATE OR REPLACE TRIGGER "trg_badge_on_session_cohost_insert" AFTER INSERT ON "public"."app_session_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."fn_badge_on_session_cohost_insert"();



CREATE OR REPLACE TRIGGER "trg_badge_on_session_insert" AFTER INSERT ON "public"."app_session" FOR EACH ROW EXECUTE FUNCTION "public"."fn_badge_on_session_insert"();



CREATE OR REPLACE TRIGGER "trg_challenge_comment_set_updated_at" BEFORE UPDATE ON "public"."app_challenge_comment" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_challenge_post_set_updated_at" BEFORE UPDATE ON "public"."app_challenge_post" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_challenge_space_set_updated_at" BEFORE UPDATE ON "public"."app_challenge_space" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE CONSTRAINT TRIGGER "trg_challenge_split" AFTER INSERT OR UPDATE ON "public"."app_challenge_cohost" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."enforce_challenge_split"();



CREATE OR REPLACE TRIGGER "trg_challenge_split_enforce" AFTER INSERT OR DELETE OR UPDATE ON "public"."app_challenge_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_challenge_split_total"();



CREATE OR REPLACE TRIGGER "trg_collab_review_new" AFTER INSERT ON "public"."app_collab_review" FOR EACH ROW EXECUTE FUNCTION "public"."on_collab_review_new"();



CREATE OR REPLACE TRIGGER "trg_creator_badges_attendance" AFTER INSERT ON "public"."app_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."f_check_creator_auto_badges_for_attendance"();



CREATE OR REPLACE TRIGGER "trg_creator_comment_set_updated_at" BEFORE UPDATE ON "public"."app_creator_comment" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_creator_post_set_updated_at" BEFORE UPDATE ON "public"."app_creator_post" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_creator_space_set_updated_at" BEFORE UPDATE ON "public"."app_creator_space" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dm_message_notify" AFTER INSERT ON "public"."app_dm_message" FOR EACH ROW EXECUTE FUNCTION "public"."trg_dm_message_notify"();



CREATE OR REPLACE TRIGGER "trg_enforce_challenge_cohost_creator_role" BEFORE INSERT OR UPDATE ON "public"."app_challenge_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_challenge_cohost_creator_role"();



CREATE OR REPLACE TRIGGER "trg_enforce_creator_contract_identity_creator_role" BEFORE INSERT OR UPDATE ON "public"."app_creator_contract_identity" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_creator_contract_identity_creator_role"();



CREATE OR REPLACE TRIGGER "trg_enforce_profile_role_immutable" BEFORE UPDATE ON "public"."app_profile" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_profile_role_immutable"();



CREATE OR REPLACE TRIGGER "trg_enforce_session_cohost_creator_role" BEFORE INSERT OR UPDATE ON "public"."app_session_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_session_cohost_creator_role"();



CREATE OR REPLACE TRIGGER "trg_guard_link_via_rpc" BEFORE INSERT OR DELETE OR UPDATE ON "public"."app_challenge_session" FOR EACH ROW EXECUTE FUNCTION "public"."guard_link_via_rpc"();



CREATE OR REPLACE TRIGGER "trg_notify_badge_awarded" AFTER INSERT ON "public"."app_user_badge" FOR EACH ROW EXECUTE FUNCTION "public"."fn_notify_badge_awarded"();



CREATE OR REPLACE TRIGGER "trg_published_session_time_change" AFTER UPDATE ON "public"."app_session" FOR EACH ROW EXECUTE FUNCTION "public"."on_published_session_time_change"();



CREATE OR REPLACE TRIGGER "trg_review_new" AFTER INSERT ON "public"."app_review" FOR EACH ROW EXECUTE FUNCTION "public"."on_review_new"();



CREATE OR REPLACE TRIGGER "trg_review_updated" AFTER UPDATE OF "rating", "comment" ON "public"."app_review" FOR EACH ROW EXECUTE FUNCTION "public"."on_review_updated"();



CREATE CONSTRAINT TRIGGER "trg_session_split" AFTER INSERT OR UPDATE ON "public"."app_session_cohost" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."enforce_session_split"();



CREATE OR REPLACE TRIGGER "trg_session_split_enforce" AFTER INSERT OR DELETE OR UPDATE ON "public"."app_session_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_session_split_total"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_challenge" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_challenge_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_collab_review" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_creator_contract_identity" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_dm_message" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_profile" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_review" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_session" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_session_cohost" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_transaction" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at" BEFORE UPDATE ON "public"."app_user_subscription" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tx_auto_join_creator_space" AFTER INSERT OR UPDATE OF "status" ON "public"."app_transaction" FOR EACH ROW EXECUTE FUNCTION "public"."trg_tx_auto_join_creator_space"();



CREATE OR REPLACE TRIGGER "trg_tx_currency_consistency" BEFORE INSERT OR UPDATE ON "public"."app_transaction" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_tx_currency_consistency"();



ALTER TABLE ONLY "public"."app_attendance"
    ADD CONSTRAINT "app_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_badge"
    ADD CONSTRAINT "app_badge_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_badge_monthly_digest"
    ADD CONSTRAINT "app_badge_monthly_digest_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_challenge_cohost"
    ADD CONSTRAINT "app_challenge_cohost_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_cohost"
    ADD CONSTRAINT "app_challenge_cohost_cohost_id_fkey" FOREIGN KEY ("cohost_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_challenge_comment"
    ADD CONSTRAINT "app_challenge_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_comment"
    ADD CONSTRAINT "app_challenge_comment_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_challenge_comment"
    ADD CONSTRAINT "app_challenge_comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."app_challenge_post"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge"
    ADD CONSTRAINT "app_challenge_continued_from_challenge_id_fkey" FOREIGN KEY ("continued_from_challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_challenge"
    ADD CONSTRAINT "app_challenge_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."app_collaboration_contract"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_challenge_member"
    ADD CONSTRAINT "app_challenge_member_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_member"
    ADD CONSTRAINT "app_challenge_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge"
    ADD CONSTRAINT "app_challenge_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_challenge_post"
    ADD CONSTRAINT "app_challenge_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_post_like"
    ADD CONSTRAINT "app_challenge_post_like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."app_challenge_post"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_post_like"
    ADD CONSTRAINT "app_challenge_post_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_post"
    ADD CONSTRAINT "app_challenge_post_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."app_challenge_space"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge"
    ADD CONSTRAINT "app_challenge_promise_edited_by_fkey" FOREIGN KEY ("promise_edited_by") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_challenge_session"
    ADD CONSTRAINT "app_challenge_session_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_session"
    ADD CONSTRAINT "app_challenge_session_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_space"
    ADD CONSTRAINT "app_challenge_space_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_space"
    ADD CONSTRAINT "app_challenge_space_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_challenge_space"
    ADD CONSTRAINT "app_challenge_space_source_challenge_id_fkey" FOREIGN KEY ("source_challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_chat_message"
    ADD CONSTRAINT "app_chat_message_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_chat_message"
    ADD CONSTRAINT "app_chat_message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_collab_review"
    ADD CONSTRAINT "app_collab_review_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_collaboration_acceptance"
    ADD CONSTRAINT "app_collaboration_acceptance_cohost_id_fkey" FOREIGN KEY ("cohost_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_collaboration_acceptance"
    ADD CONSTRAINT "app_collaboration_acceptance_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."app_collaboration_contract"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_collaboration_decline"
    ADD CONSTRAINT "app_collaboration_decline_cohost_id_fkey" FOREIGN KEY ("cohost_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_collaboration_decline"
    ADD CONSTRAINT "app_collaboration_decline_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."app_collaboration_contract"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_collaboration_invite"
    ADD CONSTRAINT "app_collaboration_invite_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id");



ALTER TABLE ONLY "public"."app_collaboration_invite"
    ADD CONSTRAINT "app_collaboration_invite_dm_conversation_id_fkey" FOREIGN KEY ("dm_conversation_id") REFERENCES "public"."app_dm_conversation"("id");



ALTER TABLE ONLY "public"."app_collaboration_invite"
    ADD CONSTRAINT "app_collaboration_invite_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_collaboration_invite"
    ADD CONSTRAINT "app_collaboration_invite_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_creator_badge_trigger"
    ADD CONSTRAINT "app_creator_badge_trigger_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."app_badge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_badge_trigger"
    ADD CONSTRAINT "app_creator_badge_trigger_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_creator_comment"
    ADD CONSTRAINT "app_creator_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_comment"
    ADD CONSTRAINT "app_creator_comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."app_creator_post"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_contract_identity"
    ADD CONSTRAINT "app_creator_contract_identity_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_post"
    ADD CONSTRAINT "app_creator_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_post_like"
    ADD CONSTRAINT "app_creator_post_like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."app_creator_post"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_post_like"
    ADD CONSTRAINT "app_creator_post_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_post"
    ADD CONSTRAINT "app_creator_post_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."app_creator_space"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_space"
    ADD CONSTRAINT "app_creator_space_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_space_member"
    ADD CONSTRAINT "app_creator_space_member_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."app_creator_space"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_space_member"
    ADD CONSTRAINT "app_creator_space_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_creator_subscription_plan"
    ADD CONSTRAINT "app_creator_subscription_plan_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_dm_conversation"
    ADD CONSTRAINT "app_dm_conversation_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_dm_member"
    ADD CONSTRAINT "app_dm_member_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."app_dm_conversation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_dm_member"
    ADD CONSTRAINT "app_dm_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_dm_message"
    ADD CONSTRAINT "app_dm_message_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_dm_message"
    ADD CONSTRAINT "app_dm_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."app_dm_conversation"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_email_outbox"
    ADD CONSTRAINT "app_email_outbox_tx_id_fkey" FOREIGN KEY ("tx_id") REFERENCES "public"."app_transaction"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_email_outbox"
    ADD CONSTRAINT "app_email_outbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_feed_event"
    ADD CONSTRAINT "app_feed_event_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_feed_event"
    ADD CONSTRAINT "app_feed_event_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id");



ALTER TABLE ONLY "public"."app_feed_event"
    ADD CONSTRAINT "app_feed_event_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id");



ALTER TABLE ONLY "public"."app_notification"
    ADD CONSTRAINT "app_notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_payout"
    ADD CONSTRAINT "app_payout_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_profile"
    ADD CONSTRAINT "app_profile_user_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_review"
    ADD CONSTRAINT "app_review_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_review"
    ADD CONSTRAINT "app_review_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_review"
    ADD CONSTRAINT "app_review_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_session_cohost"
    ADD CONSTRAINT "app_session_cohost_cohost_id_fkey" FOREIGN KEY ("cohost_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_session_cohost"
    ADD CONSTRAINT "app_session_cohost_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_session"
    ADD CONSTRAINT "app_session_continued_from_session_id_fkey" FOREIGN KEY ("continued_from_session_id") REFERENCES "public"."app_session"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_session"
    ADD CONSTRAINT "app_session_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "public"."app_collaboration_contract"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_session"
    ADD CONSTRAINT "app_session_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_session_pre_pulse_response"
    ADD CONSTRAINT "app_session_pre_pulse_response_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_session_pre_pulse_response"
    ADD CONSTRAINT "app_session_pre_pulse_response_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_staff"
    ADD CONSTRAINT "app_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_stream_event"
    ADD CONSTRAINT "app_stream_event_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_stream_token"
    ADD CONSTRAINT "app_stream_token_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_stream_token"
    ADD CONSTRAINT "app_stream_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_subscription_inclusion"
    ADD CONSTRAINT "app_subscription_inclusion_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_subscription_inclusion"
    ADD CONSTRAINT "app_subscription_inclusion_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."app_creator_subscription_plan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_subscription_inclusion"
    ADD CONSTRAINT "app_subscription_inclusion_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_template"
    ADD CONSTRAINT "app_template_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_template_item"
    ADD CONSTRAINT "app_template_item_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."app_template"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_transaction"
    ADD CONSTRAINT "app_transaction_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."app_profile"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."app_transaction"
    ADD CONSTRAINT "app_transaction_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_transaction"
    ADD CONSTRAINT "app_transaction_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."app_transaction"
    ADD CONSTRAINT "app_transaction_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_user_badge"
    ADD CONSTRAINT "app_user_badge_awarded_by_fkey" FOREIGN KEY ("awarded_by") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_user_badge"
    ADD CONSTRAINT "app_user_badge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."app_badge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_user_badge"
    ADD CONSTRAINT "app_user_badge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_user_period_seen"
    ADD CONSTRAINT "app_user_period_seen_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_user_subscription"
    ADD CONSTRAINT "app_user_subscription_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_user_subscription"
    ADD CONSTRAINT "app_user_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."app_creator_subscription_plan"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_user_subscription"
    ADD CONSTRAINT "app_user_subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_profile"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_workspace_activity"
    ADD CONSTRAINT "app_workspace_activity_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."app_profile"("id");



ALTER TABLE ONLY "public"."app_workspace_activity"
    ADD CONSTRAINT "app_workspace_activity_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."app_challenge"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_attendance"
    ADD CONSTRAINT "fk_attendance_session" FOREIGN KEY ("session_id") REFERENCES "public"."app_session"("id") ON DELETE CASCADE;



CREATE POLICY "All authenticated can read creator subscription plans" ON "public"."app_creator_subscription_plan" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete their own period_seen rows" ON "public"."app_user_period_seen" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert their own period_seen rows" ON "public"."app_user_period_seen" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read their own monthly badge digests" ON "public"."app_badge_monthly_digest" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can read their own period_seen rows" ON "public"."app_user_period_seen" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update their own period_seen rows" ON "public"."app_user_period_seen" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_attendance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_attendance_select_merged" ON "public"."app_attendance" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_session" "s"
  WHERE (("s"."id" = "app_attendance"."session_id") AND (("s"."host_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_session_cohost" "sc"
          WHERE (("sc"."session_id" = "s"."id") AND ("sc"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))))));



ALTER TABLE "public"."app_badge" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_badge_admin_all" ON "public"."app_badge" TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "app_badge_creator_insert" ON "public"."app_badge" FOR INSERT TO "authenticated" WITH CHECK ((("source" = 'creator_defined'::"text") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("audience" = 'participant'::"text") AND ("is_event_based" = true) AND ("is_monthly" = false) AND ("is_auto_awarded" = false)));



CREATE POLICY "app_badge_creator_update_own" ON "public"."app_badge" FOR UPDATE TO "authenticated" USING ((("source" = 'creator_defined'::"text") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("source" = 'creator_defined'::"text") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("audience" = 'participant'::"text")));



ALTER TABLE "public"."app_badge_monthly_digest" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_badge_read_active" ON "public"."app_badge" FOR SELECT TO "authenticated" USING ((("is_active" = true) OR ("source" = 'creator_defined'::"text")));



ALTER TABLE "public"."app_challenge" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_challenge_cohost" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_challenge_comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_challenge_member" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_challenge_post" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_challenge_post_like" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_challenge_select_merged" ON "public"."app_challenge" FOR SELECT USING ((("status" = ANY (ARRAY['published'::"public"."challenge_status", 'completed'::"public"."challenge_status"])) OR ("owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_challenge_cohost"("id", ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_collaboration_invite" "ci"
  WHERE (("ci"."challenge_id" = "app_challenge"."id") AND ("ci"."to_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("ci"."status" = 'pending'::"text"))))));



ALTER TABLE "public"."app_challenge_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_challenge_space" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_chat_message" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_collab_review" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_collaboration_acceptance" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_collaboration_acceptance_delete_own" ON "public"."app_collaboration_acceptance" FOR DELETE TO "authenticated" USING (("cohost_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "app_collaboration_acceptance_insert_as_cohost" ON "public"."app_collaboration_acceptance" FOR INSERT TO "authenticated" WITH CHECK ((("cohost_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_collaboration_contract" "c"
  WHERE (("c"."id" = "app_collaboration_acceptance"."contract_id") AND ((("c"."target_type" = 'session'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."app_session_cohost" "sch"
          WHERE (("sch"."session_id" = "c"."target_id") AND ("sch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))) OR (("c"."target_type" = 'challenge'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "cch"
          WHERE (("cch"."challenge_id" = "c"."target_id") AND ("cch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))))))));



CREATE POLICY "app_collaboration_acceptance_select_as_party" ON "public"."app_collaboration_acceptance" FOR SELECT TO "authenticated" USING ((("cohost_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_collaboration_contract" "c"
  WHERE (("c"."id" = "app_collaboration_acceptance"."contract_id") AND ((("c"."target_type" = 'session'::"text") AND ((EXISTS ( SELECT 1
           FROM "public"."app_session" "s"
          WHERE (("s"."id" = "c"."target_id") AND ("s"."host_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
           FROM "public"."app_session_cohost" "sch"
          WHERE (("sch"."session_id" = "c"."target_id") AND ("sch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))) OR (("c"."target_type" = 'challenge'::"text") AND ((EXISTS ( SELECT 1
           FROM "public"."app_challenge" "ch"
          WHERE (("ch"."id" = "c"."target_id") AND ("ch"."owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "cch"
          WHERE (("cch"."challenge_id" = "c"."target_id") AND ("cch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))))))));



CREATE POLICY "app_collaboration_acceptance_update_own" ON "public"."app_collaboration_acceptance" FOR UPDATE TO "authenticated" USING (("cohost_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("cohost_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_collaboration_contract" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_collaboration_contract_select_as_party" ON "public"."app_collaboration_contract" FOR SELECT TO "authenticated" USING (((("target_type" = 'session'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."app_session" "s"
  WHERE (("s"."id" = "app_collaboration_contract"."target_id") AND ("s"."host_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM "public"."app_session_cohost" "sch"
  WHERE (("sch"."session_id" = "app_collaboration_contract"."target_id") AND ("sch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))) OR (("target_type" = 'challenge'::"text") AND ((EXISTS ( SELECT 1
   FROM "public"."app_challenge" "c"
  WHERE (("c"."id" = "app_collaboration_contract"."target_id") AND ("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM "public"."app_challenge_cohost" "cch"
  WHERE (("cch"."challenge_id" = "app_collaboration_contract"."target_id") AND ("cch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))));



ALTER TABLE "public"."app_collaboration_decline" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_collaboration_decline_delete_own" ON "public"."app_collaboration_decline" FOR DELETE TO "authenticated" USING (("cohost_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "app_collaboration_decline_insert_as_cohost" ON "public"."app_collaboration_decline" FOR INSERT TO "authenticated" WITH CHECK ((("cohost_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_collaboration_contract" "c"
  WHERE (("c"."id" = "app_collaboration_decline"."contract_id") AND ((("c"."target_type" = 'session'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."app_session_cohost" "sch"
          WHERE (("sch"."session_id" = "c"."target_id") AND ("sch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))) OR (("c"."target_type" = 'challenge'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "cch"
          WHERE (("cch"."challenge_id" = "c"."target_id") AND ("cch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))))))));



CREATE POLICY "app_collaboration_decline_select_as_party" ON "public"."app_collaboration_decline" FOR SELECT TO "authenticated" USING ((("cohost_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_collaboration_contract" "c"
  WHERE (("c"."id" = "app_collaboration_decline"."contract_id") AND ((("c"."target_type" = 'session'::"text") AND ((EXISTS ( SELECT 1
           FROM "public"."app_session" "s"
          WHERE (("s"."id" = "c"."target_id") AND ("s"."host_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
           FROM "public"."app_session_cohost" "sch"
          WHERE (("sch"."session_id" = "c"."target_id") AND ("sch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))) OR (("c"."target_type" = 'challenge'::"text") AND ((EXISTS ( SELECT 1
           FROM "public"."app_challenge" "ch"
          WHERE (("ch"."id" = "c"."target_id") AND ("ch"."owner_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "cch"
          WHERE (("cch"."challenge_id" = "c"."target_id") AND ("cch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))))))));



CREATE POLICY "app_collaboration_decline_update_own" ON "public"."app_collaboration_decline" FOR UPDATE TO "authenticated" USING (("cohost_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("cohost_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_collaboration_invite" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_badge_trigger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_comment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_contract_identity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_creator_contract_identity_insert_own" ON "public"."app_creator_contract_identity" FOR INSERT TO "authenticated" WITH CHECK (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "app_creator_contract_identity_select_own" ON "public"."app_creator_contract_identity" FOR SELECT TO "authenticated" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "app_creator_contract_identity_update_own" ON "public"."app_creator_contract_identity" FOR UPDATE TO "authenticated" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_creator_post" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_post_like" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_space" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_space_member" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_creator_subscription_plan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_dm_conversation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_dm_member" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_dm_member_select_merged" ON "public"."app_dm_member" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_dm_member_nors"("conversation_id", ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "app_dm_member_update_merged" ON "public"."app_dm_member" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."app_dm_conversation" "c"
  WHERE (("c"."id" = "app_dm_member"."conversation_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."app_dm_conversation" "c"
  WHERE (("c"."id" = "app_dm_member"."conversation_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."app_dm_message" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_dm_message_select_merged" ON "public"."app_dm_message" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND "public"."is_dm_member_nors"("conversation_id", ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."app_edge_call_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_edge_call_log_deny_all" ON "public"."app_edge_call_log" TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."app_email_outbox" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_email_outbox_service_only" ON "public"."app_email_outbox" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."app_feed_event" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_feed_event_select_merged" ON "public"."app_feed_event" FOR SELECT USING ((("actor_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_session" "s"
  WHERE (("s"."id" = "app_feed_event"."session_id") AND ("s"."host_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM "public"."app_session" "s"
  WHERE (("s"."id" = "app_feed_event"."session_id") AND ("s"."status" = 'published'::"public"."session_status"))))));



ALTER TABLE "public"."app_notification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_payment_event" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_payment_event_service_only" ON "public"."app_payment_event" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."app_payout" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_pilot_application" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_pilot_application_insert_any" ON "public"."app_pilot_application" FOR INSERT WITH CHECK (true);



CREATE POLICY "app_pilot_application_select_admin" ON "public"."app_pilot_application" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."app_profile"
  WHERE (("app_profile"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("app_profile"."role" = 'admin'::"text")))));



ALTER TABLE "public"."app_profile" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_profile_select_merged" ON "public"."app_profile" FOR SELECT USING ((("visibility" = 'public'::"text") OR ("id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "app_profile_update_merged" ON "public"."app_profile" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_review" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_review_select_merged" ON "public"."app_review" FOR SELECT USING ((("creator_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_profile" "p"
  WHERE (("p"."id" = "app_review"."creator_id") AND ("p"."visibility" = 'public'::"text")))) OR ("reviewer_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."app_session" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_session_cohost" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_session_pre_pulse_response" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_session_select_merged" ON "public"."app_session" FOR SELECT USING ((("status" = 'published'::"public"."session_status") OR ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (("host_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_session_cohost" "sc"
  WHERE (("sc"."session_id" = "app_session"."id") AND ("sc"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR "public"."has_attended_session"("id", ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."app_challenge_session" "cs"
     JOIN "public"."app_challenge" "c" ON (("c"."id" = "cs"."challenge_id")))
  WHERE (("cs"."session_id" = "app_session"."id") AND (("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "cch"
          WHERE (("cch"."challenge_id" = "c"."id") AND ("cch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))))))));



ALTER TABLE "public"."app_staff" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_staff_service_only" ON "public"."app_staff" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."app_stream_event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_stream_token" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_subscription_inclusion" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_subscription_inclusion_service_only" ON "public"."app_subscription_inclusion" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."app_template" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_template_item" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_transaction" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_transaction_audit" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_transaction_select_merged" ON "public"."app_transaction" FOR SELECT TO "authenticated" USING ((("buyer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("creator_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."app_user_badge" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_user_badge_admin_delete" ON "public"."app_user_badge" FOR DELETE TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "app_user_badge_insert_merged" ON "public"."app_user_badge" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ((EXISTS ( SELECT 1
   FROM "public"."app_badge" "b"
  WHERE (("b"."id" = "app_user_badge"."badge_id") AND ("b"."source" = 'creator_defined'::"text") AND ("b"."created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("b"."audience" = 'participant'::"text") AND ("b"."is_event_based" = true) AND ("b"."is_monthly" = false) AND ("b"."is_auto_awarded" = false) AND ("b"."is_active" = true)))) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."app_profile" "p"
  WHERE (("p"."id" = "app_user_badge"."user_id") AND ("p"."role" = 'creator'::"text"))))) AND ("is_permanent" = true) AND ("visible_on_profile" = true) AND ("pinned_on_profile" = false) AND ("period" IS NULL))));



CREATE POLICY "app_user_badge_select_merged" ON "public"."app_user_badge" FOR SELECT TO "authenticated" USING (("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")) OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "app_user_badge_update_own" ON "public"."app_user_badge" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."app_user_period_seen" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_user_subscription" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_user_subscription_service_only" ON "public"."app_user_subscription" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."app_workspace_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attendance_delete_service" ON "public"."app_attendance" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "attendance_insert_service" ON "public"."app_attendance" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "attendance_update_service" ON "public"."app_attendance" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "challenge_cohost_delete_owner_only" ON "public"."app_challenge_cohost" FOR DELETE TO "authenticated" USING ("public"."is_challenge_owner_nors"("challenge_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_cohost_insert_owner_only" ON "public"."app_challenge_cohost" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_challenge_owner_nors"("challenge_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_cohost_select_owner_or_self" ON "public"."app_challenge_cohost" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."app_challenge" "c"
  WHERE (("c"."id" = "app_challenge_cohost"."challenge_id") AND ("c"."status" = ANY (ARRAY['published'::"public"."challenge_status", 'completed'::"public"."challenge_status"]))))) OR "public"."is_challenge_owner_nors"("challenge_id", ( SELECT "auth"."uid"() AS "uid")) OR ("cohost_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "challenge_cohost_update_owner_only" ON "public"."app_challenge_cohost" FOR UPDATE TO "authenticated" USING ("public"."is_challenge_owner_nors"("challenge_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_challenge_owner_nors"("challenge_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_comment_delete_author" ON "public"."app_challenge_comment" FOR DELETE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_comment_insert_access" ON "public"."app_challenge_comment" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_challenge_post" "p"
  WHERE (("p"."id" = "app_challenge_comment"."post_id") AND "public"."can_access_challenge_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "challenge_comment_select_access" ON "public"."app_challenge_comment" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."app_challenge_post" "p"
  WHERE (("p"."id" = "app_challenge_comment"."post_id") AND "public"."can_access_challenge_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "challenge_comment_update_author" ON "public"."app_challenge_comment" FOR UPDATE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_delete_owner_draft" ON "public"."app_challenge" FOR DELETE TO "authenticated" USING ((("owner_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'draft'::"public"."challenge_status")));



CREATE POLICY "challenge_insert_creator" ON "public"."app_challenge" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_creator"(( SELECT "auth"."uid"() AS "uid")) AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "challenge_member_insert_service_only" ON "public"."app_challenge_member" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "challenge_post_delete_author" ON "public"."app_challenge_post" FOR DELETE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_post_insert_active" ON "public"."app_challenge_post" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_post_in_challenge_space"("space_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "challenge_post_like_delete_self" ON "public"."app_challenge_post_like" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_challenge_post" "p"
  WHERE (("p"."id" = "app_challenge_post_like"."post_id") AND "public"."can_access_challenge_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "challenge_post_like_insert_access" ON "public"."app_challenge_post_like" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_challenge_post" "p"
  WHERE (("p"."id" = "app_challenge_post_like"."post_id") AND "public"."can_access_challenge_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "challenge_post_like_select_access" ON "public"."app_challenge_post_like" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."app_challenge_post" "p"
  WHERE (("p"."id" = "app_challenge_post_like"."post_id") AND "public"."can_access_challenge_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "challenge_post_select_access" ON "public"."app_challenge_post" FOR SELECT USING (((("kind" <> 'intro_private'::"text") AND "public"."can_access_challenge_space"("space_id", ( SELECT "auth"."uid"() AS "uid"))) OR (("kind" = 'intro_private'::"text") AND (("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."app_challenge_space" "cs"
     JOIN "public"."app_challenge" "c" ON (("c"."id" = "cs"."source_challenge_id")))
  WHERE (("cs"."id" = "app_challenge_post"."space_id") AND (("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "ch"
          WHERE (("ch"."challenge_id" = "c"."id") AND ("ch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))))))));



CREATE POLICY "challenge_post_update_author" ON "public"."app_challenge_post" FOR UPDATE TO "authenticated" USING ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_access_challenge_space"("space_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_access_challenge_space"("space_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "challenge_session_insert_block" ON "public"."app_challenge_session" FOR INSERT TO "authenticated", "anon" WITH CHECK (false);



CREATE POLICY "challenge_session_select_flat" ON "public"."app_challenge_session" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."app_challenge" "c"
  WHERE (("c"."id" = "app_challenge_session"."challenge_id") AND (("c"."status" = ANY (ARRAY['published'::"public"."challenge_status", 'completed'::"public"."challenge_status"])) OR ("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "cc"
          WHERE (("cc"."challenge_id" = "c"."id") AND ("cc"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))))));



CREATE POLICY "challenge_space_delete_admin" ON "public"."app_challenge_space" FOR DELETE TO "authenticated" USING ("public"."is_challenge_space_admin"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_space_no_client_insert" ON "public"."app_challenge_space" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "challenge_space_select_access" ON "public"."app_challenge_space" FOR SELECT USING ((("owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_challenge_member" "cm"
  WHERE (("cm"."challenge_id" = "app_challenge_space"."source_challenge_id") AND ("cm"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM "public"."app_challenge_cohost" "ch"
  WHERE (("ch"."challenge_id" = "app_challenge_space"."source_challenge_id") AND ("ch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "challenge_space_update_admin" ON "public"."app_challenge_space" FOR UPDATE TO "authenticated" USING ("public"."is_challenge_space_admin"("id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_challenge_space_admin"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "challenge_update_owner_draft" ON "public"."app_challenge" FOR UPDATE TO "authenticated" USING ((("owner_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'draft'::"public"."challenge_status"))) WITH CHECK ((("owner_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'draft'::"public"."challenge_status")));



CREATE POLICY "collab_review_delete_window" ON "public"."app_collab_review" FOR DELETE TO "authenticated" USING ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("created_at" > ("now"() - '00:15:00'::interval))));



CREATE POLICY "collab_review_insert_guard" ON "public"."app_collab_review" FOR INSERT TO "authenticated" WITH CHECK ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_creator"(( SELECT "auth"."uid"() AS "uid")) AND "public"."is_creator"("subject_id") AND "public"."collab_had_shared_work"(( SELECT "auth"."uid"() AS "uid"), "subject_id") AND "public"."is_in_challenge"("challenge_id", ( SELECT "auth"."uid"() AS "uid")) AND "public"."is_in_challenge"("challenge_id", "subject_id")));



CREATE POLICY "collab_review_select_creators" ON "public"."app_collab_review" FOR SELECT TO "authenticated" USING ("public"."is_creator"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "collab_review_update_window" ON "public"."app_collab_review" FOR UPDATE TO "authenticated" USING ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("created_at" > ("now"() - '24:00:00'::interval)))) WITH CHECK ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("created_at" > ("now"() - '24:00:00'::interval))));



CREATE POLICY "creator can read own payouts" ON "public"."app_payout" FOR SELECT TO "authenticated" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_badge_trigger_delete" ON "public"."app_creator_badge_trigger" FOR DELETE TO "authenticated" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_badge_trigger_insert" ON "public"."app_creator_badge_trigger" FOR INSERT TO "authenticated" WITH CHECK ((("creator_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_badge" "b"
  WHERE (("b"."id" = "app_creator_badge_trigger"."badge_id") AND ("b"."source" = 'creator_defined'::"text") AND ("b"."created_by" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "creator_badge_trigger_select" ON "public"."app_creator_badge_trigger" FOR SELECT TO "authenticated" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_badge_trigger_update" ON "public"."app_creator_badge_trigger" FOR UPDATE TO "authenticated" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_comment_delete_author_or_owner" ON "public"."app_creator_comment" FOR DELETE TO "authenticated" USING ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM ("public"."app_creator_post" "p"
     JOIN "public"."app_creator_space" "s" ON (("s"."id" = "p"."space_id")))
  WHERE (("p"."id" = "app_creator_comment"."post_id") AND ("s"."creator_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "creator_comment_insert_interact" ON "public"."app_creator_comment" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_creator_post" "p"
  WHERE (("p"."id" = "app_creator_comment"."post_id") AND "public"."can_interact_creator_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "creator_comment_select_access" ON "public"."app_creator_comment" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."app_creator_post" "p"
  WHERE (("p"."id" = "app_creator_comment"."post_id") AND "public"."can_access_creator_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "creator_comment_update_author" ON "public"."app_creator_comment" FOR UPDATE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_post_delete_owner" ON "public"."app_creator_post" FOR DELETE TO "authenticated" USING ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_post_in_creator_space"("space_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "creator_post_insert_owner" ON "public"."app_creator_post" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_post_in_creator_space"("space_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "creator_post_like_delete_self" ON "public"."app_creator_post_like" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_creator_post" "p"
  WHERE (("p"."id" = "app_creator_post_like"."post_id") AND "public"."can_interact_creator_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "creator_post_like_insert_interact" ON "public"."app_creator_post_like" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_creator_post" "p"
  WHERE (("p"."id" = "app_creator_post_like"."post_id") AND "public"."can_interact_creator_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "creator_post_like_select_access" ON "public"."app_creator_post_like" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."app_creator_post" "p"
  WHERE (("p"."id" = "app_creator_post_like"."post_id") AND "public"."can_access_creator_space"("p"."space_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "creator_post_select_access" ON "public"."app_creator_post" FOR SELECT TO "authenticated" USING ("public"."can_access_creator_space"("space_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_post_update_owner" ON "public"."app_creator_post" FOR UPDATE TO "authenticated" USING ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_post_in_creator_space"("space_id", ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND "public"."can_post_in_creator_space"("space_id", ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "creator_space_delete_owner" ON "public"."app_creator_space" FOR DELETE TO "authenticated" USING ("public"."is_creator_space_owner"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_space_member_no_client_delete" ON "public"."app_creator_space_member" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "creator_space_member_no_client_insert" ON "public"."app_creator_space_member" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "creator_space_member_no_client_update" ON "public"."app_creator_space_member" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "creator_space_member_select_creator" ON "public"."app_creator_space_member" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."app_profile" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'creator'::"text")))) AND ("space_id" IN ( SELECT "s"."id"
   FROM "public"."app_creator_space" "s"
  WHERE ("s"."creator_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "creator_space_member_select_self" ON "public"."app_creator_space_member" FOR SELECT USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "creator_space_no_client_insert" ON "public"."app_creator_space" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "creator_space_select_access" ON "public"."app_creator_space" FOR SELECT USING (true);



CREATE POLICY "creator_space_update_owner" ON "public"."app_creator_space" FOR UPDATE TO "authenticated" USING ("public"."is_creator_space_owner"("id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_creator_space_owner"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "dm_conv_delete_owner" ON "public"."app_dm_conversation" FOR DELETE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "dm_conv_deny_all" ON "public"."app_dm_conversation" AS RESTRICTIVE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "dm_conv_insert_self" ON "public"."app_dm_conversation" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "dm_conv_select_member" ON "public"."app_dm_conversation" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."app_dm_member" "m"
  WHERE (("m"."conversation_id" = "app_dm_conversation"."id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "dm_conv_update_owner" ON "public"."app_dm_conversation" FOR UPDATE TO "authenticated" USING (("created_by" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("created_by" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "dm_member_delete_owner" ON "public"."app_dm_member" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."app_dm_conversation" "c"
  WHERE (("c"."id" = "app_dm_member"."conversation_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "dm_member_write_owner" ON "public"."app_dm_member" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."app_dm_conversation" "c"
  WHERE (("c"."id" = "app_dm_member"."conversation_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "dm_msg_insert_member" ON "public"."app_dm_message" FOR INSERT TO "authenticated" WITH CHECK ((("author_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_dm_member" "m"
  WHERE (("m"."conversation_id" = "app_dm_message"."conversation_id") AND ("m"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "dm_msg_update_author" ON "public"."app_dm_message" FOR UPDATE TO "authenticated" USING (("author_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("author_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "invite_insert" ON "public"."app_collaboration_invite" FOR INSERT WITH CHECK (("from_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "invite_select" ON "public"."app_collaboration_invite" FOR SELECT USING ((("from_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("to_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "invite_update" ON "public"."app_collaboration_invite" FOR UPDATE USING ((("to_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("from_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "no client delete payouts" ON "public"."app_payout" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "no client delete tx" ON "public"."app_transaction" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "no client insert tx" ON "public"."app_transaction" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "no client update payouts" ON "public"."app_payout" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "no client update tx" ON "public"."app_transaction" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "no client write payouts" ON "public"."app_payout" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "notif_delete_service" ON "public"."app_notification" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "notif_insert_service" ON "public"."app_notification" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "notif_update_own" ON "public"."app_notification" FOR UPDATE TO "authenticated" USING (("recipient_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("recipient_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notif_update_service" ON "public"."app_notification" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "notification_read_own" ON "public"."app_notification" FOR SELECT TO "authenticated" USING (("recipient_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner manages challenge sessions" ON "public"."app_challenge_session" TO "authenticated" USING ((( SELECT "app_challenge"."owner_id"
   FROM "public"."app_challenge"
  WHERE ("app_challenge"."id" = "app_challenge_session"."challenge_id")) = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ((( SELECT "app_challenge"."owner_id"
   FROM "public"."app_challenge"
  WHERE ("app_challenge"."id" = "app_challenge_session"."challenge_id")) = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "pre_pulse_insert_self_for_attended_sessions" ON "public"."app_session_pre_pulse_response" FOR INSERT WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_attendance" "a"
  WHERE (("a"."session_id" = "app_session_pre_pulse_response"."session_id") AND ("a"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "pre_pulse_select_self_or_creator" ON "public"."app_session_pre_pulse_response" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM (("public"."app_session" "s"
     LEFT JOIN "public"."app_challenge_session" "cs" ON (("cs"."session_id" = "s"."id")))
     LEFT JOIN "public"."app_challenge" "c" ON (("c"."id" = "cs"."challenge_id")))
  WHERE (("s"."id" = "app_session_pre_pulse_response"."session_id") AND (("s"."host_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "ch"
          WHERE (("ch"."challenge_id" = "c"."id") AND ("ch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))))))));



CREATE POLICY "pre_pulse_update_self" ON "public"."app_session_pre_pulse_response" FOR UPDATE USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "read challenge membership" ON "public"."app_challenge_member" FOR SELECT USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "c"."owner_id"
   FROM "public"."app_challenge" "c"
  WHERE ("c"."id" = "app_challenge_member"."challenge_id")) = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_challenge_cohost" "ch"
  WHERE (("ch"."challenge_id" = "app_challenge_member"."challenge_id") AND ("ch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "read chat if authorized" ON "public"."app_chat_message" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."app_session" "s"
  WHERE (("s"."id" = "app_chat_message"."session_id") AND (("s"."host_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_session_cohost" "sc"
          WHERE (("sc"."session_id" = "s"."id") AND ("sc"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))))) OR (EXISTS ( SELECT 1
   FROM "public"."app_attendance" "a"
  WHERE (("a"."session_id" = "app_chat_message"."session_id") AND ("a"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "review_delete_own_15m" ON "public"."app_review" AS RESTRICTIVE FOR DELETE TO "authenticated" USING ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("created_at" >= ("now"() - '00:15:00'::interval))));



CREATE POLICY "review_insert_attended_ended" ON "public"."app_review" FOR INSERT TO "authenticated" WITH CHECK ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."app_attendance" "a"
  WHERE (("a"."session_id" = "app_review"."session_id") AND ("a"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND (EXISTS ( SELECT 1
   FROM "public"."app_session" "s"
  WHERE (("s"."id" = "app_review"."session_id") AND ("s"."status" = 'ended'::"public"."session_status"))))));



CREATE POLICY "review_update_own_24h" ON "public"."app_review" FOR UPDATE TO "authenticated" USING ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("created_at" >= ("now"() - '24:00:00'::interval)))) WITH CHECK (("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "send chat if authorized" ON "public"."app_chat_message" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "app_session"."host_id"
   FROM "public"."app_session"
  WHERE ("app_session"."id" = "app_chat_message"."session_id")) = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."app_session_cohost"
  WHERE (("app_session_cohost"."session_id" = "app_chat_message"."session_id") AND ("app_session_cohost"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))) OR (EXISTS ( SELECT 1
   FROM "public"."app_attendance"
  WHERE (("app_attendance"."session_id" = "app_chat_message"."session_id") AND ("app_attendance"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "session_cohost_delete" ON "public"."app_session_cohost" FOR DELETE TO "authenticated" USING ("public"."is_session_host"("session_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "session_cohost_insert" ON "public"."app_session_cohost" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_session_host"("session_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "session_cohost_select" ON "public"."app_session_cohost" FOR SELECT USING (("public"."is_session_host"("session_id", ( SELECT "auth"."uid"() AS "uid")) OR ("cohost_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "session_cohost_update" ON "public"."app_session_cohost" FOR UPDATE TO "authenticated" USING ("public"."is_session_host"("session_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_session_host"("session_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "session_delete_owner_draft" ON "public"."app_session" FOR DELETE TO "authenticated" USING ((("host_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'draft'::"public"."session_status")));



CREATE POLICY "session_insert_creator" ON "public"."app_session" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_creator"(( SELECT "auth"."uid"() AS "uid")) AND ("host_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "session_update_owner_draft" ON "public"."app_session" FOR UPDATE TO "authenticated" USING ((("host_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'draft'::"public"."session_status"))) WITH CHECK ((("host_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'draft'::"public"."session_status")));



CREATE POLICY "stream_event_rw_service" ON "public"."app_stream_event" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "stream_token_delete_service" ON "public"."app_stream_token" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "stream_token_insert_service" ON "public"."app_stream_token" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "stream_token_read_own" ON "public"."app_stream_token" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "stream_token_update_service" ON "public"."app_stream_token" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "template_item_owner_all" ON "public"."app_template_item" USING ((EXISTS ( SELECT 1
   FROM "public"."app_template" "t"
  WHERE (("t"."id" = "app_template_item"."template_id") AND ("t"."creator_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "template_item_read_creators" ON "public"."app_template_item" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."app_template" "t"
  WHERE (("t"."id" = "app_template_item"."template_id") AND "public"."is_creator"(( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "template_owner_all" ON "public"."app_template" USING (("creator_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "template_read_creators" ON "public"."app_template" FOR SELECT TO "authenticated" USING ("public"."is_creator"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "tx_audit_select_admin" ON "public"."app_transaction_audit" FOR SELECT TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."webhook_event_lock" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wel_insert" ON "public"."webhook_event_lock" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "wel_select" ON "public"."webhook_event_lock" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "workspace_activity_select_party" ON "public"."app_workspace_activity" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."app_challenge" "c"
  WHERE (("c"."id" = "app_workspace_activity"."challenge_id") AND (("c"."owner_id" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
           FROM "public"."app_challenge_cohost" "ch"
          WHERE (("ch"."challenge_id" = "c"."id") AND ("ch"."cohost_id" = ( SELECT "auth"."uid"() AS "uid"))))))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge_cohost";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge_comment";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge_member";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge_post";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge_post_like";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_challenge_session";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_collaboration_acceptance";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_collaboration_contract";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_collaboration_decline";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_collaboration_invite";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_dm_message";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_session";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_session_cohost";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_workspace_activity";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";












































































































































































































































































































REVOKE ALL ON FUNCTION "public"."_debug_list_collab_reviews"("p_challenge" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_debug_list_collab_reviews"("p_challenge" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_collab_invite"("p_invite_id" "uuid", "p_actor" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_collab_invite"("p_invite_id" "uuid", "p_actor" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_collab_invite"("p_invite_id" "uuid", "p_actor" "uuid") TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_user_badge" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_user_badge" TO "authenticated";
GRANT ALL ON TABLE "public"."app_user_badge" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_award_creator_badge"("p_creator_id" "uuid", "p_badge_id" "uuid", "p_target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_award_creator_badge"("p_creator_id" "uuid", "p_badge_id" "uuid", "p_target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_badge_award"("p_user_id" "uuid", "p_badge_slug" "text", "p_context" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_badge_award"("p_user_id" "uuid", "p_badge_slug" "text", "p_context" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_email_enqueue_receipt"("p_tx_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_email_enqueue_receipt"("p_tx_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_generate_monthly_badge_digest"("p_period" "text", "p_admin_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_generate_monthly_badge_digest"("p_period" "text", "p_admin_id" "uuid") TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_attendance" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."app_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."app_attendance" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_session" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_session" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_session" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_transaction" TO "authenticated";
GRANT ALL ON TABLE "public"."app_transaction" TO "service_role";



GRANT ALL ON TABLE "public"."vw_entitlement_gaps" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_health_entitlements"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_health_entitlements"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."session_has_priced_parent_challenge"("p_session_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."session_has_priced_parent_challenge"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."session_has_priced_parent_challenge"("p_session_id" "uuid") TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_session" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_session" TO "authenticated";
GRANT ALL ON TABLE "public"."app_session" TO "service_role";



GRANT ALL ON TABLE "public"."vw_sessions_requiring_room" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_health_rooms"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_health_rooms"() TO "service_role";



GRANT ALL ON TABLE "public"."vw_tx_health" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_health_tx"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_health_tx"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_regrant_entitlements_for"("p_buyer_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_regrant_entitlements_for"("p_buyer_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_regrant_entitlements_tx"("p_tx_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_regrant_entitlements_tx"("p_tx_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_run_monthly_attendance_badges"("p_year" integer, "p_month" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_run_monthly_attendance_badges"("p_year" integer, "p_month" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_run_monthly_creator_attendance_badges"("p_year" integer, "p_month" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_run_monthly_creator_attendance_badges"("p_year" integer, "p_month" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_run_monthly_creator_follower_badges"("p_year" integer, "p_month" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_run_monthly_creator_follower_badges"("p_year" integer, "p_month" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_run_monthly_creator_revenue_badges"("p_year" integer, "p_month" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_run_monthly_creator_revenue_badges"("p_year" integer, "p_month" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_run_monthly_participant_growth_badges"("p_year" integer, "p_month" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_run_monthly_participant_growth_badges"("p_year" integer, "p_month" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."app_handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."app_session_assert_within_challenge_window"() TO "anon";
GRANT ALL ON FUNCTION "public"."app_session_assert_within_challenge_window"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_session_assert_within_challenge_window"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."award_creator_badge"("p_badge_id" "uuid", "p_target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."award_creator_badge"("p_badge_id" "uuid", "p_target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_creator_badge"("p_badge_id" "uuid", "p_target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."build_transaction_row"("p_buyer_id" "uuid", "p_creator_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid", "p_type" "public"."payment_type", "p_currency" "text", "p_amount_gross_cents" bigint, "p_processing_fee_fixed_cents" bigint, "p_processing_fee_percent_cents" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."build_transaction_row"("p_buyer_id" "uuid", "p_creator_id" "uuid", "p_session_id" "uuid", "p_challenge_id" "uuid", "p_type" "public"."payment_type", "p_currency" "text", "p_amount_gross_cents" bigint, "p_processing_fee_fixed_cents" bigint, "p_processing_fee_percent_cents" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_challenge_space"("p_space" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_challenge_space"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_challenge_space"("p_space" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_access_creator_space"("p_space" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_access_creator_space"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_creator_space"("p_space" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_interact_creator_space"("p_space" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_interact_creator_space"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_interact_creator_space"("p_space" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_join_challenge"("p_user" "uuid", "p_challenge" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_join_challenge"("p_user" "uuid", "p_challenge" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_join_session"("p_user" "uuid", "p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_join_session"("p_user" "uuid", "p_session" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_post_in_challenge_space"("p_space" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_post_in_challenge_space"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_post_in_challenge_space"("p_space" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_post_in_creator_space"("p_space" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_post_in_creator_space"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_post_in_creator_space"("p_space" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_profile"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_profile"("p_profile_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."challenge_add_session"("p_challenge" "uuid", "p_session" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."challenge_add_session"("p_challenge" "uuid", "p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."challenge_add_session"("p_challenge" "uuid", "p_session" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."challenge_can_publish"("p_challenge" "uuid", "p_caller" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."challenge_can_publish"("p_challenge" "uuid", "p_caller" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."challenge_can_publish"("p_challenge" "uuid", "p_caller" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."challenge_has_purchases"("p_challenge" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."challenge_has_purchases"("p_challenge" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."challenge_remove_session"("p_challenge" "uuid", "p_session" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."challenge_remove_session"("p_challenge" "uuid", "p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."challenge_remove_session"("p_challenge" "uuid", "p_session" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."challenge_remove_session_and_delete"("p_challenge" "uuid", "p_session" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."challenge_remove_session_and_delete"("p_challenge" "uuid", "p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."challenge_remove_session_and_delete"("p_challenge" "uuid", "p_session" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."challenge_spots_left"("p_challenge" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."challenge_spots_left"("p_challenge" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."challenge_spots_left"("p_challenge" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."challenge_spots_left"("p_challenge" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."collab_had_shared_work"("p_reviewer" "uuid", "p_subject" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."collab_had_shared_work"("p_reviewer" "uuid", "p_subject" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."collab_had_shared_work"("p_reviewer" "uuid", "p_subject" "uuid") TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_collab_review" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_collab_review" TO "authenticated";
GRANT ALL ON TABLE "public"."app_collab_review" TO "service_role";



REVOKE ALL ON FUNCTION "public"."collab_review_create"("p_challenge" "uuid", "p_subject" "uuid", "p_rating" integer, "p_comment" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."collab_review_create"("p_challenge" "uuid", "p_subject" "uuid", "p_rating" integer, "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."collab_review_create"("p_challenge" "uuid", "p_subject" "uuid", "p_rating" integer, "p_comment" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."collab_review_delete"("p_review_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."collab_review_delete"("p_review_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."collab_review_delete"("p_review_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."collab_review_update"("p_review_id" "uuid", "p_rating" integer, "p_comment" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."collab_review_update"("p_review_id" "uuid", "p_rating" integer, "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."collab_review_update"("p_review_id" "uuid", "p_rating" integer, "p_comment" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."collab_reviews_for_creator"("p_subject" "uuid", "p_limit" integer, "p_after" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."collab_reviews_for_creator"("p_subject" "uuid", "p_limit" integer, "p_after" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."collab_reviews_for_creator"("p_subject" "uuid", "p_limit" integer, "p_after" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_challenge_comment"("p_post" "uuid", "p_body" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_challenge_comment"("p_post" "uuid", "p_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_challenge_comment"("p_post" "uuid", "p_body" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_challenge_continuation_draft"("p_source_challenge" "uuid", "p_start_date" "date", "p_end_date" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_challenge_continuation_draft"("p_source_challenge" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_challenge_continuation_draft"("p_source_challenge" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_challenge_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_kind" "text", "p_context_type" "text", "p_context_id" "uuid", "p_directed_to" "uuid"[], "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_challenge_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_kind" "text", "p_context_type" "text", "p_context_id" "uuid", "p_directed_to" "uuid"[], "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_challenge_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_kind" "text", "p_context_type" "text", "p_context_id" "uuid", "p_directed_to" "uuid"[], "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_challenge_session"("p_challenge_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_duration_minutes" integer, "p_price_cents" integer, "p_currency" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_challenge_session"("p_challenge_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_duration_minutes" integer, "p_price_cents" integer, "p_currency" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_challenge_session"("p_challenge_id" "uuid", "p_title" "text", "p_start_time" timestamp with time zone, "p_duration_minutes" integer, "p_price_cents" integer, "p_currency" "text") TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_badge" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_badge" TO "authenticated";
GRANT ALL ON TABLE "public"."app_badge" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_creator_badge"("p_label" "text", "p_description" "text", "p_color_hex" "text", "p_icon" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_creator_badge"("p_label" "text", "p_description" "text", "p_color_hex" "text", "p_icon" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_creator_badge"("p_label" "text", "p_description" "text", "p_color_hex" "text", "p_icon" "text") TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_creator_badge_trigger" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_creator_badge_trigger" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_badge_trigger" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_creator_badge_trigger"("p_badge_id" "uuid", "p_trigger_type" "text", "p_params" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_creator_badge_trigger"("p_badge_id" "uuid", "p_trigger_type" "text", "p_params" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_creator_badge_trigger"("p_badge_id" "uuid", "p_trigger_type" "text", "p_params" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_creator_comment"("p_post" "uuid", "p_body" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_creator_comment"("p_post" "uuid", "p_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_creator_comment"("p_post" "uuid", "p_body" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_context_type" "text", "p_context_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_context_type" "text", "p_context_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_creator_post"("p_space" "uuid", "p_body" "text", "p_media_url" "text", "p_context_type" "text", "p_context_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_session_continuation_draft"("p_source_session" "uuid", "p_start_time" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_session_continuation_draft"("p_source_session" "uuid", "p_start_time" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_session_continuation_draft"("p_source_session" "uuid", "p_start_time" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."creator_collab_reputation"("p_subject" "uuid", "limit_recent" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."creator_collab_reputation"("p_subject" "uuid", "limit_recent" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."creator_collab_reputation"("p_subject" "uuid", "limit_recent" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_active_challenge_in_group"("p_continuation_group" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."current_active_challenge_in_group"("p_continuation_group" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_active_challenge_in_group"("p_continuation_group" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dm_mark_read"("p_conversation" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dm_mark_read"("p_conversation" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_mark_read"("p_conversation" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dm_send"("p_conversation_id" "uuid", "p_body" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dm_send"("p_conversation_id" "uuid", "p_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_send"("p_conversation_id" "uuid", "p_body" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dm_start_or_get"("p_other_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dm_start_or_get"("p_other_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_start_or_get"("p_other_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."edge_rate_limit_use"("p_fn" "text", "p_window_seconds" integer, "p_limit_per_user" integer, "p_limit_per_ip" integer, "p_user_id" "uuid", "p_ip" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."edge_rate_limit_use"("p_fn" "text", "p_window_seconds" integer, "p_limit_per_user" integer, "p_limit_per_ip" integer, "p_user_id" "uuid", "p_ip" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_challenge_cohost_creator_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_challenge_cohost_creator_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_challenge_cohost_creator_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_challenge_split"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_challenge_split"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_challenge_split"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_challenge_split_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_challenge_split_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_challenge_split_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_creator_contract_identity_creator_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_creator_contract_identity_creator_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_creator_contract_identity_creator_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_profile_role_collaboration_integrity"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_collaboration_integrity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_collaboration_integrity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_profile_role_immutable"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_immutable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_profile_role_immutable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_session_cohost_creator_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_session_cohost_creator_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_session_cohost_creator_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_session_split"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_session_split"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_session_split"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_session_split_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_session_split_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_session_split_total"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_tx_currency_consistency"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_tx_currency_consistency"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."ensure_challenge_space_for_published_challenge"("p_challenge" "uuid", "p_actor" "uuid", "p_title" "text", "p_description" "text", "p_ownership_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_challenge_space_for_published_challenge"("p_challenge" "uuid", "p_actor" "uuid", "p_title" "text", "p_description" "text", "p_ownership_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_challenge_space_for_published_challenge"("p_challenge" "uuid", "p_actor" "uuid", "p_title" "text", "p_description" "text", "p_ownership_type" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ensure_creator_space"("p_creator" "uuid", "p_title" "text", "p_description" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_creator_space"("p_creator" "uuid", "p_title" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_creator_space"("p_creator" "uuid", "p_title" "text", "p_description" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."f_check_creator_auto_badges_challenge_completion"("p_user_id" "uuid", "p_challenge_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."f_check_creator_auto_badges_challenge_completion"("p_user_id" "uuid", "p_challenge_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."f_check_creator_auto_badges_for_attendance"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."f_check_creator_auto_badges_for_attendance"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_badge_on_attendance"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_badge_on_attendance"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_badge_on_challenge_published"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_badge_on_challenge_published"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_badge_on_session_cohost_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_badge_on_session_cohost_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_badge_on_session_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_badge_on_session_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fn_notify_badge_awarded"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fn_notify_badge_awarded"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_challenge_space_by_challenge"("p_challenge" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_challenge_space_by_challenge"("p_challenge" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_challenge_space_by_challenge"("p_challenge" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_challenge_split_map"("p_challenge" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_challenge_split_map"("p_challenge" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_creator_dashboard_stats"("p_creator_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_creator_dashboard_stats"("p_creator_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_creator_space_by_creator"("p_creator" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_creator_space_by_creator"("p_creator" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_creator_space_by_creator"("p_creator" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_latest_unseen_monthly_digest"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_latest_unseen_monthly_digest"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_monthly_digest"("p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_monthly_digest"("p_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_split_map"("p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_split_map"("p_session" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."grant_challenge_access"("p_buyer" "uuid", "p_challenge" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."grant_challenge_access"("p_buyer" "uuid", "p_challenge" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."guard_link_via_rpc"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."guard_link_via_rpc"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_active_subscription"("p_user" "uuid", "p_creator" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_subscription"("p_user" "uuid", "p_creator" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_attended_session"("p_session" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_attended_session"("p_session" "uuid", "p_user" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."has_attended_session"("p_session" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_attended_session"("p_session" "uuid", "p_user" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."has_creator_participation"("p_creator" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_creator_participation"("p_creator" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_creator_participation"("p_creator" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_challenge_cohost"("p_challenge" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_challenge_cohost"("p_challenge" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_challenge_cohost"("p_challenge" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_challenge_owner"("p_challenge_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_challenge_owner"("p_challenge_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_challenge_owner_nors"("p_challenge" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_challenge_owner_nors"("p_challenge" "uuid", "p_user" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_challenge_owner_nors"("p_challenge" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_challenge_owner_nors"("p_challenge" "uuid", "p_user" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."is_challenge_space_admin"("p_space" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_challenge_space_admin"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_challenge_space_admin"("p_space" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_creator"("p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_creator"("p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_creator"("p_user" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_creator"("p_user" "uuid") TO "anon";



GRANT ALL ON FUNCTION "public"."is_creator_profile"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_creator_profile"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_creator_profile"("p_profile_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_creator_space_member"("p_space" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_creator_space_member"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_creator_space_member"("p_space" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_creator_space_owner"("p_space" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_creator_space_owner"("p_space" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_creator_space_owner"("p_space" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_dm_member_nors"("p_conversation" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_dm_member_nors"("p_conversation" "uuid", "p_user" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_dm_member_nors"("p_conversation" "uuid", "p_user" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."is_host_or_cohost"("p_session" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_host_or_cohost"("p_session" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_in_challenge"("p_challenge" "uuid", "p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_in_challenge"("p_challenge" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_in_challenge"("p_challenge" "uuid", "p_user" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_session_host"("p_session_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_session_host"("p_session_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_session_host"("p_session_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_session_host"("p_session_id" "uuid", "p_user_id" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."join_creator_space"("p_space" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."join_creator_space"("p_space" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_creator_space"("p_space" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."leave_creator_space"("p_space" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leave_creator_space"("p_space" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_creator_space"("p_space" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."like_challenge_post"("p_post" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."like_challenge_post"("p_post" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."like_challenge_post"("p_post" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."like_creator_post"("p_post" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."like_creator_post"("p_post" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."like_creator_post"("p_post" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_challenge_comments"("p_post" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_challenge_comments"("p_post" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_challenge_comments"("p_post" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."list_challenge_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_challenge_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_challenge_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_creator_comments"("p_post" "uuid", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_creator_comments"("p_post" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_creator_comments"("p_post" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."list_creator_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_creator_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_creator_posts"("p_space" "uuid", "p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_dm_messages"("p_conversation_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."list_dm_messages"("p_conversation_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_dm_messages"("p_conversation_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."load_experience_creator_stats"("p_challenge_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."load_experience_creator_stats"("p_challenge_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."load_experience_creator_stats"("p_challenge_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."load_experience_space"("p_challenge_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."load_experience_space"("p_challenge_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."load_experience_space"("p_challenge_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."load_workspace"("p_challenge_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."load_workspace"("p_challenge_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."load_workspace"("p_challenge_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_challenge_contract"("p_challenge_id" "uuid", "p_actor" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."lock_challenge_contract"("p_challenge_id" "uuid", "p_actor" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_challenge_contract"("p_challenge_id" "uuid", "p_actor" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."lock_contract"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_snapshot_json" "jsonb", "p_snapshot_text" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."lock_contract"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_snapshot_json" "jsonb", "p_snapshot_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_contract"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_snapshot_json" "jsonb", "p_snapshot_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_workspace_field_edit"("p_challenge_id" "uuid", "p_field" "text", "p_old" "jsonb", "p_new" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_workspace_field_edit"("p_challenge_id" "uuid", "p_field" "text", "p_old" "jsonb", "p_new" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_workspace_field_edit"("p_challenge_id" "uuid", "p_field" "text", "p_old" "jsonb", "p_new" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_all_notifications_read"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."my_collab_reputation"("limit_recent" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."my_collab_reputation"("limit_recent" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_collab_reputation"("limit_recent" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."notification_mark_all_read_before"("p_before" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notification_mark_all_read_before"("p_before" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."notification_mark_all_read_before"("p_before" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."notification_mark_read"("p_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notification_mark_read"("p_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."notification_mark_read"("p_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."on_app_transaction_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_app_transaction_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_app_transaction_audit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."on_collab_review_new"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."on_collab_review_new"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_published_session_time_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_published_session_time_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_published_session_time_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."on_review_new"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."on_review_new"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."on_review_updated"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."on_review_updated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."post_workspace_log"("p_challenge_id" "uuid", "p_body" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."post_workspace_log"("p_challenge_id" "uuid", "p_body" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."post_workspace_log"("p_challenge_id" "uuid", "p_body" "text", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."public_reviews_for_creator"("p_creator" "uuid", "p_limit" integer, "p_before" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."public_reviews_for_creator"("p_creator" "uuid", "p_limit" integer, "p_before" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_reviews_for_creator"("p_creator" "uuid", "p_limit" integer, "p_before" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."publish_challenge"("p_challenge" "uuid", "p_caller" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."publish_challenge"("p_challenge" "uuid", "p_caller" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_challenge"("p_challenge" "uuid", "p_caller" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."publish_session"("p_session" "uuid", "p_caller" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."publish_session"("p_session" "uuid", "p_caller" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_session"("p_session" "uuid", "p_caller" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reactivate_drafting"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_contract_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reactivate_drafting"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_contract_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reactivate_drafting"("p_target_type" "text", "p_target_id" "uuid", "p_actor" "uuid", "p_contract_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."record_attendance"("p_session" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."record_attendance"("p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_attendance"("p_session" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reschedule_published_session"("p_session" "uuid", "p_new_start_time" timestamp with time zone, "p_change_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reschedule_published_session"("p_session" "uuid", "p_new_start_time" timestamp with time zone, "p_change_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reschedule_published_session"("p_session" "uuid", "p_new_start_time" timestamp with time zone, "p_change_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."respond_to_contract"("p_contract_id" "uuid", "p_actor" "uuid", "p_response" "text", "p_comment" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."respond_to_contract"("p_contract_id" "uuid", "p_actor" "uuid", "p_response" "text", "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_contract"("p_contract_id" "uuid", "p_actor" "uuid", "p_response" "text", "p_comment" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_additional_collab_invite"("p_challenge_id" "uuid", "p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split_percent" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."send_additional_collab_invite"("p_challenge_id" "uuid", "p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split_percent" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_additional_collab_invite"("p_challenge_id" "uuid", "p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split_percent" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."send_collab_invite"("p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."send_collab_invite"("p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_collab_invite"("p_from" "uuid", "p_to" "uuid", "p_message" "text", "p_split" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."send_collab_invites_with_draft"("p_from" "uuid", "p_title" "text", "p_message" "text", "p_invitees" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."send_collab_invites_with_draft"("p_from" "uuid", "p_title" "text", "p_message" "text", "p_invitees" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_collab_invites_with_draft"("p_from" "uuid", "p_title" "text", "p_message" "text", "p_invitees" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."session_can_publish"("p_session" "uuid", "p_caller" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."session_can_publish"("p_session" "uuid", "p_caller" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."session_can_publish"("p_session" "uuid", "p_caller" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."session_has_purchases"("p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."session_has_purchases"("p_session" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."session_split_preview"("p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."session_split_preview"("p_session" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."session_spots_left"("p_session" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."session_spots_left"("p_session" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."session_spots_left"("p_session" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_badge_visibility"("p_user_badge_id" bigint, "p_visible_on_profile" boolean, "p_pinned_on_profile" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_badge_visibility"("p_user_badge_id" bigint, "p_visible_on_profile" boolean, "p_pinned_on_profile" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_badge_visibility"("p_user_badge_id" bigint, "p_visible_on_profile" boolean, "p_pinned_on_profile" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."stream_tokens_purge_expired"("limit_rows" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."stream_tokens_purge_expired"("limit_rows" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_intro_post"("p_challenge_id" "uuid", "p_body" "text", "p_share_with_cohort" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_intro_post"("p_challenge_id" "uuid", "p_body" "text", "p_share_with_cohort" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_intro_post"("p_challenge_id" "uuid", "p_body" "text", "p_share_with_cohort" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_pre_pulse"("p_session_id" "uuid", "p_value" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_pre_pulse"("p_session_id" "uuid", "p_value" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_pre_pulse"("p_session_id" "uuid", "p_value" smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_session_reflection"("p_session_id" "uuid", "p_body" "text", "p_energy_after" smallint) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_session_reflection"("p_session_id" "uuid", "p_body" "text", "p_energy_after" smallint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_session_reflection"("p_session_id" "uuid", "p_body" "text", "p_energy_after" smallint) TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_dm_message_notify"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_dm_message_notify"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_dm_message_notify"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."trg_tx_auto_join_creator_space"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."trg_tx_enqueue_receipt"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trg_tx_enqueue_receipt"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."unlike_challenge_post"("p_post" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."unlike_challenge_post"("p_post" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlike_challenge_post"("p_post" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."unlike_creator_post"("p_post" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."unlike_creator_post"("p_post" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlike_creator_post"("p_post" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_challenge_comment"("p_id" "uuid", "p_body" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_challenge_comment"("p_id" "uuid", "p_body" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_challenge_comment"("p_id" "uuid", "p_body" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_challenge_workspace"("p_challenge_id" "uuid", "p_title" "text", "p_description" "text", "p_image_url" "text", "p_start_date" "date", "p_end_date" "date", "p_capacity" integer, "p_price_cents" integer, "p_promise_text" "text", "p_weekly_arc" "jsonb", "p_topic_ownership" "jsonb", "p_intro_prompt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_challenge_workspace"("p_challenge_id" "uuid", "p_title" "text", "p_description" "text", "p_image_url" "text", "p_start_date" "date", "p_end_date" "date", "p_capacity" integer, "p_price_cents" integer, "p_promise_text" "text", "p_weekly_arc" "jsonb", "p_topic_ownership" "jsonb", "p_intro_prompt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_challenge_workspace"("p_challenge_id" "uuid", "p_title" "text", "p_description" "text", "p_image_url" "text", "p_start_date" "date", "p_end_date" "date", "p_capacity" integer, "p_price_cents" integer, "p_promise_text" "text", "p_weekly_arc" "jsonb", "p_topic_ownership" "jsonb", "p_intro_prompt" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_weekly_arc_themes"("p_challenge_id" "uuid", "p_weekly_arc" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_weekly_arc_themes"("p_challenge_id" "uuid", "p_weekly_arc" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_weekly_arc_themes"("p_challenge_id" "uuid", "p_weekly_arc" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_review"("p_session_id" "uuid", "p_rating" integer, "p_comment" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_review"("p_session_id" "uuid", "p_rating" integer, "p_comment" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_review"("p_session_id" "uuid", "p_rating" integer, "p_comment" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_transaction_from_checkout"("buyer_id" "uuid", "creator_id" "uuid", "session_id" "uuid", "challenge_id" "uuid", "tx_type" "text", "status" "text", "quantity" integer, "currency" "text", "amount_gross_cents" bigint, "processing_fee_fixed_cents" bigint, "processing_fee_percent_cents" bigint, "amount_after_stripe_cents" bigint, "creator_cut_cents" bigint, "platform_cut_cents" bigint, "provider" "text", "provider_payment_id" "text", "metadata" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_transaction_from_checkout"("buyer_id" "uuid", "creator_id" "uuid", "session_id" "uuid", "challenge_id" "uuid", "tx_type" "text", "status" "text", "quantity" integer, "currency" "text", "amount_gross_cents" bigint, "processing_fee_fixed_cents" bigint, "processing_fee_percent_cents" bigint, "amount_after_stripe_cents" bigint, "creator_cut_cents" bigint, "platform_cut_cents" bigint, "provider" "text", "provider_payment_id" "text", "metadata" "jsonb") TO "service_role";






























GRANT MAINTAIN ON TABLE "public"."app_badge_monthly_digest" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_badge_monthly_digest" TO "authenticated";
GRANT ALL ON TABLE "public"."app_badge_monthly_digest" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_badge_monthly_digest_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_badge_monthly_digest_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_challenge" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_cohost" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_challenge_cohost" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_cohost" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_comment" TO "anon";
GRANT ALL ON TABLE "public"."app_challenge_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_comment" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_member" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_challenge_member" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_member" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_post" TO "anon";
GRANT ALL ON TABLE "public"."app_challenge_post" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_post" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_post_like" TO "anon";
GRANT ALL ON TABLE "public"."app_challenge_post_like" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_post_like" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_challenge_space" TO "anon";
GRANT ALL ON TABLE "public"."app_challenge_space" TO "authenticated";
GRANT ALL ON TABLE "public"."app_challenge_space" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_chat_message" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_chat_message" TO "authenticated";
GRANT ALL ON TABLE "public"."app_chat_message" TO "service_role";



GRANT ALL ON TABLE "public"."app_collaboration_acceptance" TO "authenticated";
GRANT ALL ON TABLE "public"."app_collaboration_acceptance" TO "service_role";



GRANT ALL ON TABLE "public"."app_collaboration_contract" TO "authenticated";
GRANT ALL ON TABLE "public"."app_collaboration_contract" TO "service_role";



GRANT ALL ON TABLE "public"."app_collaboration_decline" TO "authenticated";
GRANT ALL ON TABLE "public"."app_collaboration_decline" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_collaboration_invite" TO "anon";
GRANT ALL ON TABLE "public"."app_collaboration_invite" TO "authenticated";
GRANT ALL ON TABLE "public"."app_collaboration_invite" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_creator_badge_trigger_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_creator_badge_trigger_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_creator_comment" TO "anon";
GRANT ALL ON TABLE "public"."app_creator_comment" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_comment" TO "service_role";



GRANT ALL ON TABLE "public"."app_creator_contract_identity" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_contract_identity" TO "service_role";



GRANT ALL ON TABLE "public"."app_creator_earnings" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_creator_post" TO "anon";
GRANT ALL ON TABLE "public"."app_creator_post" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_post" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_creator_post_like" TO "anon";
GRANT ALL ON TABLE "public"."app_creator_post_like" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_post_like" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_creator_space" TO "anon";
GRANT ALL ON TABLE "public"."app_creator_space" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_space" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_creator_space_member" TO "anon";
GRANT ALL ON TABLE "public"."app_creator_space_member" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_space_member" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_creator_subscription_plan" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_creator_subscription_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."app_creator_subscription_plan" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_dm_conversation" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_dm_conversation" TO "authenticated";
GRANT ALL ON TABLE "public"."app_dm_conversation" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_dm_member" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_dm_member" TO "authenticated";
GRANT ALL ON TABLE "public"."app_dm_member" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_dm_message" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_dm_message" TO "authenticated";
GRANT ALL ON TABLE "public"."app_dm_message" TO "service_role";



GRANT ALL ON TABLE "public"."app_edge_call_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_edge_call_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_edge_call_log_id_seq" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_email_outbox" TO "anon";
GRANT ALL ON TABLE "public"."app_email_outbox" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_email_outbox_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_email_outbox_id_seq" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_feed_event" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_feed_event" TO "authenticated";
GRANT ALL ON TABLE "public"."app_feed_event" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_notification" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."app_notification" TO "authenticated";
GRANT ALL ON TABLE "public"."app_notification" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_payment_event" TO "authenticated";
GRANT ALL ON TABLE "public"."app_payment_event" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_payout" TO "authenticated";
GRANT ALL ON TABLE "public"."app_payout" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_pilot_application" TO "anon";
GRANT ALL ON TABLE "public"."app_pilot_application" TO "authenticated";
GRANT ALL ON TABLE "public"."app_pilot_application" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_profile" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_profile" TO "authenticated";
GRANT ALL ON TABLE "public"."app_profile" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_review" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_review" TO "authenticated";
GRANT ALL ON TABLE "public"."app_review" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_profile_stats" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."app_profile_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."app_profile_stats" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_profile_public" TO "anon";
GRANT ALL ON TABLE "public"."app_profile_public" TO "authenticated";
GRANT ALL ON TABLE "public"."app_profile_public" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_session_cohost" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_session_cohost" TO "authenticated";
GRANT ALL ON TABLE "public"."app_session_cohost" TO "service_role";



GRANT ALL ON TABLE "public"."app_session_financials" TO "service_role";



GRANT ALL ON TABLE "public"."app_session_overview" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_session_pre_pulse_response" TO "anon";
GRANT ALL ON TABLE "public"."app_session_pre_pulse_response" TO "authenticated";
GRANT ALL ON TABLE "public"."app_session_pre_pulse_response" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_staff" TO "authenticated";
GRANT ALL ON TABLE "public"."app_staff" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_stream_event" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."app_stream_event" TO "authenticated";
GRANT ALL ON TABLE "public"."app_stream_event" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_stream_token" TO "anon";
GRANT SELECT,MAINTAIN ON TABLE "public"."app_stream_token" TO "authenticated";
GRANT ALL ON TABLE "public"."app_stream_token" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_subscription_inclusion" TO "authenticated";
GRANT ALL ON TABLE "public"."app_subscription_inclusion" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_template" TO "anon";
GRANT ALL ON TABLE "public"."app_template" TO "authenticated";
GRANT ALL ON TABLE "public"."app_template" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_template_item" TO "anon";
GRANT ALL ON TABLE "public"."app_template_item" TO "authenticated";
GRANT ALL ON TABLE "public"."app_template_item" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_transaction_audit" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_transaction_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."app_transaction_audit" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_transaction_audit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_transaction_audit_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."app_user_badge_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."app_user_badge_id_seq" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_user_period_seen" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."app_user_period_seen" TO "authenticated";
GRANT ALL ON TABLE "public"."app_user_period_seen" TO "service_role";



GRANT MAINTAIN ON TABLE "public"."app_user_subscription" TO "authenticated";
GRANT ALL ON TABLE "public"."app_user_subscription" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."app_workspace_activity" TO "anon";
GRANT ALL ON TABLE "public"."app_workspace_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."app_workspace_activity" TO "service_role";



GRANT ALL ON TABLE "public"."v_creator_collab_reputation" TO "service_role";
GRANT SELECT ON TABLE "public"."v_creator_collab_reputation" TO "authenticated";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_challenge_buyer_view" TO "anon";
GRANT ALL ON TABLE "public"."vw_challenge_buyer_view" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_challenge_buyer_view" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_challenge_program_state" TO "anon";
GRANT ALL ON TABLE "public"."vw_challenge_program_state" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_challenge_program_state" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_challenge_session_team" TO "anon";
GRANT ALL ON TABLE "public"."vw_challenge_session_team" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_challenge_session_team" TO "service_role";



GRANT ALL ON TABLE "public"."vw_creator_collab_reputation" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_creator_collab_reputation" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_creator_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."vw_creator_public_reviews_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_creator_public_reviews_summary" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_dm_inbox" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_dm_inbox" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_email_outbox_pending" TO "service_role";



GRANT ALL ON TABLE "public"."vw_my_badges" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_badges" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_challenges_overview" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_challenges_overview" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_challenges_progress" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_challenges_progress" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_creator_badge_templates" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_creator_badge_templates" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_creator_earnings" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_creator_earnings" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_creator_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_creator_summary" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_event_badges" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_event_badges" TO "authenticated";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_my_lifetime_summary" TO "anon";
GRANT ALL ON TABLE "public"."vw_my_lifetime_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_my_lifetime_summary" TO "service_role";



GRANT ALL ON TABLE "public"."vw_my_monthly_badges_flat" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_monthly_badges_flat" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_monthly_creator_badges" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_monthly_creator_badges" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_monthly_digest_history" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_monthly_digest_history" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_monthly_participant_badges" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_monthly_participant_badges" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_monthly_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_monthly_summary" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_notifications" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_sessions_overview" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_sessions_overview" TO "authenticated";



GRANT ALL ON TABLE "public"."vw_my_sessions_participated" TO "service_role";
GRANT SELECT ON TABLE "public"."vw_my_sessions_participated" TO "authenticated";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_my_transactions" TO "anon";
GRANT ALL ON TABLE "public"."vw_my_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_my_transactions" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_pending_questions_for_creator" TO "anon";
GRANT ALL ON TABLE "public"."vw_pending_questions_for_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_pending_questions_for_creator" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_recent_reflections_for_creator" TO "anon";
GRANT ALL ON TABLE "public"."vw_recent_reflections_for_creator" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_recent_reflections_for_creator" TO "service_role";



GRANT ALL ON TABLE "public"."vw_session_financials" TO "service_role";



GRANT ALL ON TABLE "public"."vw_session_overview" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."vw_session_pre_pulse_aggregate" TO "anon";
GRANT ALL ON TABLE "public"."vw_session_pre_pulse_aggregate" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_session_pre_pulse_aggregate" TO "service_role";



GRANT ALL ON TABLE "public"."vw_sessions_starting_soon_no_room" TO "service_role";



GRANT ALL ON TABLE "public"."vw_stream_tokens_expired" TO "service_role";



GRANT SELECT,MAINTAIN ON TABLE "public"."webhook_event_lock" TO "anon";
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."webhook_event_lock" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_event_lock" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































