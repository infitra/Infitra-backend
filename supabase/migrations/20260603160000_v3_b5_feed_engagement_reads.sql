-- Bundle 5c Ship 2 — surface engagement on the Tribe feed reads.
--
-- The like/comment primitives already exist (app_challenge_post_like,
-- app_challenge_comment, like/unlike + create_challenge_comment which
-- auto-promotes the first directed-creator reply to is_coach_answer). What was
-- missing is the READ side: the feed couldn't see counts, whether I liked a
-- post, or the coach answer. Extend the two list RPCs + publish the tables for
-- realtime.

-- ── list_challenge_posts: + like/comment counts, liked_by_me, coach answer ──
-- SECURITY DEFINER so the counts/coach-answer are computed with full visibility
-- (not per-row RLS), gated by an explicit can_access_challenge_space check.
-- auth.uid() still resolves to the caller under DEFINER.
drop function if exists public.list_challenge_posts(uuid, integer, timestamptz, uuid);
create or replace function public.list_challenge_posts(
  p_space uuid,
  p_limit integer default 20,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
) returns table (
  id uuid, space_id uuid, author_id uuid, body text, media_url text,
  kind text, context_type text, context_id uuid, directed_to uuid[], metadata jsonb,
  like_count integer, comment_count integer, liked_by_me boolean, coach_answer jsonb,
  created_at timestamptz, updated_at timestamptz
)
  language sql
  stable
  security definer
  set search_path to 'public'
as $$
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
grant execute on function public.list_challenge_posts(uuid, integer, timestamptz, uuid) to authenticated;

-- ── list_challenge_comments: + is_coach_answer ──
drop function if exists public.list_challenge_comments(uuid, integer);
create or replace function public.list_challenge_comments(
  p_post uuid,
  p_limit integer default 100
) returns table (
  id uuid, post_id uuid, author_id uuid, body text,
  is_coach_answer boolean, created_at timestamptz, updated_at timestamptz
)
  language sql
  stable
  set search_path to 'public'
as $$
  select c.id, c.post_id, c.author_id, c.body, c.is_coach_answer, c.created_at, c.updated_at
  from public.app_challenge_comment c
  where c.post_id = p_post
  order by c.created_at asc, c.id asc
  limit greatest(1, least(coalesce(p_limit, 100), 300));
$$;
grant execute on function public.list_challenge_comments(uuid, integer) to authenticated;

-- ── realtime: likes + comments update live ──
alter publication supabase_realtime add table public.app_challenge_post_like;
alter publication supabase_realtime add table public.app_challenge_comment;
-- FULL so DELETE/UPDATE payloads carry the keys we filter on (unlike → post_id).
alter table public.app_challenge_post_like replica identity full;
alter table public.app_challenge_comment replica identity full;
