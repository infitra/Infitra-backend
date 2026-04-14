"use client";

import Link from "next/link";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function PostCard({
  post,
  authorName,
  authorAvatarUrl,
  communityType,
  likeCount,
  commentCount,
  isLikedByMe,
  currentUserId,
  contextType,
  contextTitle,
  contextImageUrl,
  contextId,
  variant = "card",
}: {
  post: {
    id: string;
    author_id: string;
    body: string;
    media_url: string | null;
    created_at: string;
  };
  authorName: string;
  authorAvatarUrl?: string | null;
  communityType: "creator" | "challenge";
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  currentUserId: string;
  contextType?: "session" | "challenge" | null;
  contextTitle?: string | null;
  contextImageUrl?: string | null;
  contextId?: string | null;
  variant?: "card" | "inline";
}) {
  const isInline = variant === "inline";

  const content = (
    <>
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center border ${
              communityType === "creator" ? "bg-cyan-100/80 border-cyan-200" : "bg-orange-100/80 border-orange-200"
            }`}
          >
            <span className={`text-sm font-black font-headline ${communityType === "creator" ? "text-cyan-700" : "text-orange-700"}`}>
              {authorName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <Link href={`/profile/${post.author_id}`} className="text-base font-black font-headline text-[#0F2229] hover:opacity-75">
            {authorName}
          </Link>
          <p className="text-[10px] text-[#94a3b8]">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Body */}
      <p className="text-base leading-relaxed whitespace-pre-line mb-4" style={{ color: "#334155" }}>
        {post.body}
      </p>

      {/* Media image */}
      {post.media_url && (
        <div className="rounded-xl overflow-hidden mb-4">
          <img src={post.media_url} alt="" className="w-full object-cover max-h-80" />
        </div>
      )}

      {/* Context card — editorial promotional style */}
      {contextType && contextTitle && contextId && (
        <Link
          href={contextType === "session" ? `/sessions/${contextId}` : `/challenges/${contextId}`}
          className="block rounded-xl overflow-hidden mb-4 group/ctx"
        >
          <div className="h-40 relative">
            {contextImageUrl ? (
              <>
                <img src={contextImageUrl} alt="" className="w-full h-full object-cover group-hover/ctx:scale-[1.02] transition-transform duration-300" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)" }} />
              </>
            ) : (
              <>
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229 0%, #1a3340 50%, #2a1508 100%)" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
                  <img src="/logo-mark.png" alt="" width={32} height={32} />
                </div>
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
              </>
            )}

            {/* Type badge — top left */}
            <div className="absolute top-3 left-3">
              <span
                className="px-2.5 py-1 rounded text-[10px] font-bold font-headline uppercase tracking-wider"
                style={{
                  backgroundColor: contextType === "session" ? "rgba(156,240,255,0.85)" : "rgba(255,97,48,0.85)",
                  color: contextType === "session" ? "#064e5c" : "#ffffff",
                }}
              >
                {contextType}
              </span>
            </div>

            {/* Title — bottom */}
            <div className="absolute bottom-3 left-4 right-4">
              <h4 className="text-lg font-black font-headline text-white tracking-tight group-hover/ctx:text-[#9CF0FF]">
                {contextTitle}
              </h4>
            </div>
          </div>
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t" style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}>
        <LikeButton postId={post.id} communityType={communityType} initialLiked={isLikedByMe} initialCount={likeCount} />
        <CommentSection postId={post.id} communityType={communityType} currentUserId={currentUserId} initialCount={commentCount} />
      </div>
    </>
  );

  if (isInline) {
    return (
      <div className="py-6 border-t" style={{ borderColor: "rgba(15, 34, 41, 0.06)" }}>
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-2xl infitra-glass p-5">
      {content}
    </div>
  );
}
