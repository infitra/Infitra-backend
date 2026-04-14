"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/app/components/community/PostCard";
import { EventSelector } from "./EventSelector";
import {
  createCreatorPost,
} from "@/app/actions/community";

interface EventItem {
  id: string;
  type: "session" | "challenge";
  title: string;
  imageUrl: string | null;
}

interface EnrichedPost {
  id: string;
  author_id: string;
  body: string;
  media_url: string | null;
  created_at: string;
  authorName: string;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  contextType: "session" | "challenge" | null;
  contextId: string | null;
  contextTitle: string | null;
  contextImageUrl: string | null;
  contextMeta: string | null;
  authorAvatarUrl: string | null;
}

/**
 * ContextualPostFeed — PostFeed with event context selection.
 * Used only on the creator dashboard. Tribe feeds use regular PostFeed.
 */
export function ContextualPostFeed({
  spaceId,
  currentUserId,
  events,
  avatarUrl,
}: {
  spaceId: string;
  currentUserId: string;
  events: EventItem[];
  avatarUrl?: string | null;
}) {
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{ type: "session" | "challenge"; id: string } | null>(null);

  const fetchPage = useCallback(
    async (cursor?: { created_at: string; id: string }) => {
      const supabase = createClient();

      const params: any = { p_space: spaceId, p_limit: 20 };
      if (cursor) {
        params.p_before_created_at = cursor.created_at;
        params.p_before_id = cursor.id;
      }
      const { data: rawPosts } = await supabase.rpc("list_creator_posts", params);
      if (!rawPosts?.length) return { posts: [] as EnrichedPost[], hasMore: false };

      const postIds = rawPosts.map((p: any) => p.id);
      const authorIds = [...new Set(rawPosts.map((p: any) => p.author_id))];

      // Enrich in parallel
      const [profilesRes, likesRes, myLikesRes, commentsRes] = await Promise.all([
        supabase.from("app_profile").select("id, display_name, avatar_url").in("id", authorIds as string[]),
        supabase.from("app_creator_post_like").select("post_id").in("post_id", postIds),
        supabase.from("app_creator_post_like").select("post_id").in("post_id", postIds).eq("user_id", currentUserId),
        supabase.from("app_creator_comment").select("post_id").in("post_id", postIds),
      ]);

      const nameMap: Record<string, string> = {};
      const avatarMap: Record<string, string | null> = {};
      for (const p of profilesRes.data ?? []) {
        nameMap[p.id] = p.display_name ?? "User";
        avatarMap[p.id] = p.avatar_url ?? null;
      }

      const likeCounts: Record<string, number> = {};
      for (const l of likesRes.data ?? []) likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;

      const myLikes = new Set((myLikesRes.data ?? []).map((l: any) => l.post_id));

      const commentCounts: Record<string, number> = {};
      for (const c of commentsRes.data ?? []) commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;

      // Resolve context details for posts that have them
      const contextIds = rawPosts.filter((p: any) => p.context_id).map((p: any) => ({ type: p.context_type, id: p.context_id }));
      const contextData: Record<string, { title: string; imageUrl: string | null; meta: string | null }> = {};

      const sessionContextIds = contextIds.filter((c: any) => c.type === "session").map((c: any) => c.id);
      const challengeContextIds = contextIds.filter((c: any) => c.type === "challenge").map((c: any) => c.id);

      if (sessionContextIds.length > 0) {
        const { data: sessions } = await supabase.from("app_session").select("id, title, image_url, duration_minutes, price_cents").in("id", sessionContextIds);
        for (const s of sessions ?? []) {
          const parts: string[] = [];
          if (s.duration_minutes) parts.push(`${s.duration_minutes} min`);
          if (s.price_cents > 0) parts.push(`CHF ${(s.price_cents / 100).toFixed(0)}`);
          else parts.push("Free");
          contextData[s.id] = { title: s.title, imageUrl: s.image_url, meta: parts.join(" · ") };
        }
      }
      if (challengeContextIds.length > 0) {
        const { data: challenges } = await supabase.from("app_challenge").select("id, title, image_url, price_cents").in("id", challengeContextIds);
        // Count sessions per challenge
        const challengeSessionCounts: Record<string, number> = {};
        if (challengeContextIds.length > 0) {
          const { data: csLinks } = await supabase.from("app_challenge_session").select("challenge_id").in("challenge_id", challengeContextIds);
          for (const l of csLinks ?? []) challengeSessionCounts[l.challenge_id] = (challengeSessionCounts[l.challenge_id] ?? 0) + 1;
        }
        for (const c of challenges ?? []) {
          const parts: string[] = [];
          const sessCount = challengeSessionCounts[c.id] ?? 0;
          if (sessCount > 0) parts.push(`${sessCount} session${sessCount !== 1 ? "s" : ""}`);
          if (c.price_cents > 0) parts.push(`CHF ${(c.price_cents / 100).toFixed(0)}`);
          else parts.push("Free");
          contextData[c.id] = { title: c.title, imageUrl: c.image_url, meta: parts.join(" · ") };
        }
      }

      const enriched: EnrichedPost[] = rawPosts.map((p: any) => ({
        id: p.id,
        author_id: p.author_id,
        body: p.body,
        media_url: p.media_url ?? null,
        created_at: p.created_at,
        authorName: nameMap[p.author_id] ?? "User",
        likeCount: likeCounts[p.id] ?? 0,
        commentCount: commentCounts[p.id] ?? 0,
        isLikedByMe: myLikes.has(p.id),
        contextType: p.context_type ?? null,
        contextId: p.context_id ?? null,
        contextTitle: p.context_id ? contextData[p.context_id]?.title ?? null : null,
        contextImageUrl: p.context_id ? contextData[p.context_id]?.imageUrl ?? null : null,
        contextMeta: p.context_id ? contextData[p.context_id]?.meta ?? null : null,
        authorAvatarUrl: avatarMap[p.author_id] ?? null,
      }));

      return { posts: enriched, hasMore: rawPosts.length >= 20 };
    },
    [spaceId, currentUserId]
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await fetchPage();
      if (!cancelled) { setPosts(result.posts); setHasMore(result.hasMore); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchPage]);

  async function handleLoadMore() {
    if (loadingMore || !posts.length) return;
    setLoadingMore(true);
    const last = posts[posts.length - 1];
    const result = await fetchPage({ created_at: last.created_at, id: last.id });
    setPosts((prev) => [...prev, ...result.posts]);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }

  async function handleCreatePost() {
    if (!newBody.trim() || posting) return;
    setPosting(true);
    setPostError(null);

    const result = await createCreatorPost(
      spaceId,
      newBody.trim(),
      selectedEvent?.type ?? undefined,
      selectedEvent?.id ?? undefined
    );

    if (result?.error) { setPostError(result.error); setPosting(false); return; }

    setNewBody("");
    setSelectedEvent(null);
    setPosting(false);
    const fresh = await fetchPage();
    setPosts(fresh.posts);
    setHasMore(fresh.hasMore);
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: "rgba(15,34,41,0.10)", borderTopColor: "rgba(15,34,41,0.45)" }} />
        <p className="text-xs text-[#94a3b8]">Loading activity...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Composer — compact */}
      <div className="pb-5 border-b" style={{ borderColor: "rgba(15,34,41,0.06)" }}>
        <div className="flex gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0 mt-1" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-cyan-100/80 border border-cyan-200 flex items-center justify-center shrink-0 mt-1">
              <span className="text-sm font-black font-headline text-cyan-700">Y</span>
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder={selectedEvent ? `Share about this ${selectedEvent.type}...` : "Share something with your community..."}
              maxLength={5000}
              rows={2}
              className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none"
              style={{ backgroundColor: "rgba(255,255,255,0.55)", border: "1px solid rgba(15,34,41,0.08)", color: "#0F2229" }}
            />
            {/* Actions row — context link + post button */}
            <div className="flex items-center justify-between mt-2">
              <EventSelector events={events} selected={selectedEvent} onSelect={setSelectedEvent} />
              <button
                onClick={handleCreatePost}
                disabled={posting || !newBody.trim()}
                className="px-5 py-2 rounded-full text-white text-sm font-black font-headline disabled:opacity-40 shrink-0"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
            {postError && <p className="text-xs mt-1 text-[#FF6130]">{postError}</p>}
          </div>
        </div>
      </div>

      {/* Posts — inline variant, flowing inside the container */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#0F2229] font-bold font-headline mb-1">No activity yet</p>
          <p className="text-xs text-[#64748b]">Share something with your community to get started.</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                author_id: post.author_id,
                body: post.body,
                media_url: post.media_url,
                created_at: post.created_at,
              }}
              authorName={post.authorName}
              authorAvatarUrl={post.authorAvatarUrl}
              communityType="creator"
              likeCount={post.likeCount}
              commentCount={post.commentCount}
              isLikedByMe={post.isLikedByMe}
              currentUserId={currentUserId}
              contextType={post.contextType}
              contextTitle={post.contextTitle}
              contextImageUrl={post.contextImageUrl}
              contextId={post.contextId}
              contextMeta={post.contextMeta}
              variant="inline"
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center pt-2 pb-2">
          <button onClick={handleLoadMore} disabled={loadingMore} className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
