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
}) {
  return (
    <div className="rounded-2xl infitra-glass p-5">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center border ${
              communityType === "creator" ? "bg-cyan-100/80 border-cyan-200" : "bg-orange-100/80 border-orange-200"
            }`}
          >
            <span className={`text-xs font-black font-headline ${communityType === "creator" ? "text-cyan-700" : "text-orange-700"}`}>
              {authorName[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <Link href={`/profile/${post.author_id}`} className="text-sm font-bold font-headline text-[#0F2229] hover:opacity-75">
            {authorName}
          </Link>
          <p className="text-[10px] text-[#94a3b8]">{timeAgo(post.created_at)}</p>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed whitespace-pre-line mb-3" style={{ color: "#475569" }}>
        {post.body}
      </p>

      {/* Context card — INSIDE the post */}
      {contextType && contextTitle && contextId && (
        <Link
          href={contextType === "session" ? `/sessions/${contextId}` : `/challenges/${contextId}`}
          className="flex items-center gap-3 p-3 rounded-xl mb-3 group"
          style={{ backgroundColor: "rgba(255,97,48,0.04)", border: "1px solid rgba(255,97,48,0.12)" }}
        >
          {contextImageUrl ? (
            <img src={contextImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
              <img src="/logo-mark.png" alt="" width={16} height={16} style={{ opacity: 0.15 }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]">{contextType}</p>
            <p className="text-sm font-bold font-headline text-[#0F2229] truncate group-hover:text-[#FF6130]">{contextTitle}</p>
          </div>
          <span className="text-xs font-bold text-[#FF6130] shrink-0">View →</span>
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t" style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}>
        <LikeButton postId={post.id} communityType={communityType} initialLiked={isLikedByMe} initialCount={likeCount} />
        <CommentSection postId={post.id} communityType={communityType} currentUserId={currentUserId} initialCount={commentCount} />
      </div>
    </div>
  );
}
