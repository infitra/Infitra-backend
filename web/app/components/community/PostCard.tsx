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
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function PostCard({
  post,
  authorName,
  communityType,
  likeCount,
  commentCount,
  isLikedByMe,
  currentUserId,
}: {
  post: {
    id: string;
    author_id: string;
    body: string;
    media_url: string | null;
    created_at: string;
  };
  authorName: string;
  communityType: "creator" | "challenge";
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
  currentUserId: string;
}) {
  return (
    <div className="rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 p-5">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            communityType === "creator"
              ? "bg-[#9CF0FF]/10 border border-[#9CF0FF]/20"
              : "bg-[#FF6130]/10 border border-[#FF6130]/20"
          }`}
        >
          <span
            className={`text-xs font-black font-headline ${
              communityType === "creator"
                ? "text-[#9CF0FF]/60"
                : "text-[#FF6130]"
            }`}
          >
            {authorName[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <Link
            href={`/profile/${post.author_id}`}
            className="text-sm font-bold text-white font-headline hover:text-[#FF6130] transition-colors"
          >
            {authorName}
          </Link>
          <p className="text-[10px] text-[#9CF0FF]/25">
            {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-[#9CF0FF]/60 leading-relaxed whitespace-pre-line mb-4">
        {post.body}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-5 pt-3 border-t border-[#9CF0FF]/8">
        <LikeButton
          postId={post.id}
          communityType={communityType}
          initialLiked={isLikedByMe}
          initialCount={likeCount}
        />
        <CommentSection
          postId={post.id}
          communityType={communityType}
          currentUserId={currentUserId}
          initialCount={commentCount}
        />
      </div>
    </div>
  );
}
