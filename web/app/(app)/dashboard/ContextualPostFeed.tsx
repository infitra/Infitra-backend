"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "@/app/components/community/PostCard";
import { PostContextBadge } from "@/app/components/community/PostContextBadge";
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
}

/**
 * ContextualPostFeed — PostFeed with event context selection.
 * Used only on the creator dashboard. Tribe feeds use regular PostFeed.
 */
export function ContextualPostFeed({
  spaceId,
  currentUserId,
  events,
}: {
  spaceId: string;
  currentUserId: string;
  events: EventItem[];
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
        supabase.from("app_profile").select("id, display_name").in("id", authorIds as string[]),
        supabase.from("app_creator_post_like").select("post_id").in("post_id", postIds),
        supabase.from("app_creator_post_like").select("post_id").in("post_id", postIds).eq("user_id", currentUserId),
        supabase.from("app_creator_comment").select("post_id").in("post_id", postIds),
      ]);

      const nameMap: Record<string, string> = {};
      for (const p of profilesRes.data ?? []) nameMap[p.id] = p.display_name ?? "User";

      const likeCounts: Record<string, number> = {};
      for (const l of likesRes.data ?? []) likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;

      const myLikes = new Set((myLikesRes.data ?? []).map((l: any) => l.post_id));

      const commentCounts: Record<string, number> = {};
      for (const c of commentsRes.data ?? []) commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;

      // Resolve context titles for posts that have them
      const contextIds = rawPosts.filter((p: any) => p.context_id).map((p: any) => ({ type: p.context_type, id: p.context_id }));
      const contextTitles: Record<string, { title: string; imageUrl: string | null }> = {};

      const sessionContextIds = contextIds.filter((c: any) => c.type === "session").map((c: any) => c.id);
      const challengeContextIds = contextIds.filter((c: any) => c.type === "challenge").map((c: any) => c.id);

      if (sessionContextIds.length > 0) {
        const { data: sessions } = await supabase.from("app_session").select("id, title, image_url").in("id", sessionContextIds);
        for (const s of sessions ?? []) contextTitles[s.id] = { title: s.title, imageUrl: s.image_url };
      }
      if (challengeContextIds.length > 0) {
        const { data: challenges } = await supabase.from("app_challenge").select("id, title, image_url").in("id", challengeContextIds);
        for (const c of challenges ?? []) contextTitles[c.id] = { title: c.title, imageUrl: c.image_url };
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
        contextTitle: p.context_id ? contextTitles[p.context_id]?.title ?? null : null,
        contextImageUrl: p.context_id ? contextTitles[p.context_id]?.imageUrl ?? null : null,
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
    <div className="space-y-4">
      {/* Composer */}
      <div className="rounded-2xl infitra-card p-5">
        {/* Event selector */}
        <EventSelector events={events} selected={selectedEvent} onSelect={setSelectedEvent} />

        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder={selectedEvent ? `Share about this ${selectedEvent.type}...` : "Share something with your community..."}
          maxLength={5000}
          rows={3}
          className="w-full rounded-xl p-4 text-sm focus:outline-none resize-none"
          style={{ backgroundColor: "rgba(255,255,255,0.55)", border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
        />
        {postError && <p className="text-xs mt-2 text-[#FF6130]">{postError}</p>}
        <div className="flex items-center justify-between mt-3">
          {selectedEvent && (
            <span className="text-xs text-[#FF6130] font-bold font-headline">
              📌 {events.find(e => e.id === selectedEvent.id && e.type === selectedEvent.type)?.title}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={handleCreatePost}
            disabled={posting || !newBody.trim()}
            className="px-5 py-2.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[#0F2229] font-bold font-headline mb-1">No activity yet</p>
          <p className="text-xs text-[#64748b]">Share something with your community to get started.</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id}>
            {post.contextType && post.contextTitle && post.contextId && (
              <PostContextBadge
                contextType={post.contextType}
                contextTitle={post.contextTitle}
                contextImageUrl={post.contextImageUrl}
                contextId={post.contextId}
              />
            )}
            <PostCard
              postId={post.id}
              authorId={post.author_id}
              authorName={post.authorName}
              body={post.body}
              createdAt={post.created_at}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
              isLikedByMe={post.isLikedByMe}
              communityType="creator"
              currentUserId={currentUserId}
            />
          </div>
        ))
      )}

      {hasMore && (
        <div className="text-center pt-4">
          <button onClick={handleLoadMore} disabled={loadingMore} className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-50">
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
