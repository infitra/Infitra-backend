"use client";

import { useState } from "react";
import {
  toggleCreatorLike,
  toggleChallengeLike,
} from "@/app/actions/community";

export function LikeButton({
  postId,
  communityType,
  initialLiked,
  initialCount,
}: {
  postId: string;
  communityType: "creator" | "challenge";
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleToggle() {
    if (pending) return;
    // Optimistic
    const wasLiked = liked;
    const prevCount = count;
    setLiked(!wasLiked);
    setCount(wasLiked ? prevCount - 1 : prevCount + 1);
    setPending(true);

    const action =
      communityType === "creator" ? toggleCreatorLike : toggleChallengeLike;
    const result = await action(postId, wasLiked);

    if (result?.error) {
      // Revert
      setLiked(wasLiked);
      setCount(prevCount);
    }
    setPending(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 transition-colors ${
        liked
          ? "text-[#FF6130]"
          : "text-[#9CF0FF]/25 hover:text-[#FF6130]/60"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="text-xs font-headline font-bold">{count}</span>
    </button>
  );
}
