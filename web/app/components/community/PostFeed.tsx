"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "./PostCard";
import {
  createCreatorPost,
  createChallengePost,
} from "@/app/actions/community";

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
}

export function PostFeed({
  spaceId,
  communityType,
  currentUserId,
  canPost,
}: {
  spaceId: string;
  communityType: "creator" | "challenge";
  currentUserId: string;
  canPost: boolean;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create post state
  const [newBody, setNewBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const rpcList =
    communityType === "creator"
      ? "list_creator_posts"
      : "list_challenge_posts";
  const likeTable =
    communityType === "creator"
      ? "app_creator_post_like"
      : "app_challenge_post_like";
  const commentTable =
    communityType === "creator"
      ? "app_creator_comment"
      : "app_challenge_comment";

  const fetchPage = useCallback(
    async (cursor?: { created_at: string; id: string }) => {
      const supabase = createClient();

      // 1. Fetch posts
      const params: any = { p_space: spaceId, p_limit: 20 };
      if (cursor) {
        params.p_before_created_at = cursor.created_at;
        params.p_before_id = cursor.id;
      }
      const { data: rawPosts } = await supabase.rpc(rpcList, params);
      if (!rawPosts?.length) return { posts: [], hasMore: false };

      const postIds = rawPosts.map((p: any) => p.id);
      const authorIds = [...new Set(rawPosts.map((p: any) => p.author_id))];

      // 2-5. Enrich in parallel
      const [profilesRes, likesRes, myLikesRes, commentsRes] =
        await Promise.all([
          supabase
            .from("app_profile")
            .select("id, display_name")
            .in("id", authorIds as string[]),
          supabase
            .from(likeTable)
            .select("post_id")
            .in("post_id", postIds),
          supabase
            .from(likeTable)
            .select("post_id")
            .in("post_id", postIds)
            .eq("user_id", currentUserId),
          supabase
            .from(commentTable)
            .select("post_id")
            .in("post_id", postIds),
        ]);

      // Build maps
      const nameMap: Record<string, string> = {};
      for (const p of profilesRes.data ?? []) {
        nameMap[p.id] = p.display_name ?? "User";
      }

      const likeCounts: Record<string, number> = {};
      for (const l of likesRes.data ?? []) {
        likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;
      }

      const myLikes = new Set(
        (myLikesRes.data ?? []).map((l: any) => l.post_id)
      );

      const commentCounts: Record<string, number> = {};
      for (const c of commentsRes.data ?? []) {
        commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
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
      }));

      return { posts: enriched, hasMore: rawPosts.length >= 20 };
    },
    [spaceId, rpcList, likeTable, commentTable, currentUserId]
  );

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await fetchPage();
      if (!cancelled) {
        setPosts(result.posts);
        setHasMore(result.hasMore);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  // Load more
  async function handleLoadMore() {
    if (loadingMore || !posts.length) return;
    setLoadingMore(true);
    const last = posts[posts.length - 1];
    const result = await fetchPage({
      created_at: last.created_at,
      id: last.id,
    });
    setPosts((prev) => [...prev, ...result.posts]);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }

  // Create post
  async function handleCreatePost() {
    if (!newBody.trim() || posting) return;
    setPosting(true);
    setPostError(null);

    const action =
      communityType === "creator" ? createCreatorPost : createChallengePost;
    const result = await action(spaceId, newBody.trim());

    if (result?.error) {
      setPostError(result.error);
      setPosting(false);
      return;
    }

    setNewBody("");
    setPosting(false);
    // Re-fetch first page to include new post
    const fresh = await fetchPage();
    setPosts(fresh.posts);
    setHasMore(fresh.hasMore);
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
          style={{
            borderColor: "rgba(15, 34, 41, 0.10)",
            borderTopColor: "rgba(15, 34, 41, 0.45)",
          }}
        />
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          Loading posts...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create post form */}
      {canPost && (
        <div className="rounded-2xl infitra-glass p-5">
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Share something with the community..."
            maxLength={5000}
            rows={3}
            className="w-full rounded-xl p-4 text-sm focus:outline-none resize-none"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              border: "1px solid rgba(15, 34, 41, 0.12)",
              color: "#0F2229",
            }}
          />
          {postError && (
            <p className="text-xs mt-2" style={{ color: "#FF6130" }}>
              {postError}
            </p>
          )}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleCreatePost}
              disabled={posting || !newBody.trim()}
              className="px-5 py-2.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:hover:scale-100"
              style={{
                backgroundColor: "#FF6130",
                boxShadow:
                  "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
              }}
            >
              {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div
          className="py-12 text-center rounded-2xl border border-dashed"
          style={{ borderColor: "rgba(15, 34, 41, 0.15)" }}
        >
          <p className="text-sm" style={{ color: "#64748b" }}>
            No posts yet.
          </p>
          {canPost && (
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
              Be the first to share something.
            </p>
          )}
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            authorName={post.authorName}
            communityType={communityType}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            isLikedByMe={post.isLikedByMe}
            currentUserId={currentUserId}
          />
        ))
      )}

      {/* Load more */}
      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-bold font-headline transition-colors disabled:opacity-50"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
