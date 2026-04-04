"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createCreatorComment,
  createChallengeComment,
} from "@/app/actions/community";

interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  authorName: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function CommentSection({
  postId,
  communityType,
  currentUserId,
  initialCount,
}: {
  postId: string;
  communityType: "creator" | "challenge";
  currentUserId: string;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [displayCount, setDisplayCount] = useState(initialCount);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const rpcName =
        communityType === "creator"
          ? "list_creator_comments"
          : "list_challenge_comments";
      const { data: rows } = await supabase.rpc(rpcName, {
        p_post: postId,
        p_limit: 100,
      });

      if (cancelled || !rows?.length) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Fetch author profiles
      const authorIds = [...new Set(rows.map((r: any) => r.author_id))];
      const { data: profiles } = await supabase
        .from("app_profile")
        .select("id, display_name")
        .in("id", authorIds);

      const profileMap: Record<string, string> = {};
      for (const p of profiles ?? []) {
        profileMap[p.id] = p.display_name ?? "User";
      }

      if (!cancelled) {
        setComments(
          rows.map((r: any) => ({
            id: r.id,
            author_id: r.author_id,
            body: r.body,
            created_at: r.created_at,
            authorName: profileMap[r.author_id] ?? "User",
          }))
        );
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, postId, communityType]);

  async function handleSubmit() {
    if (!newBody.trim() || submitting) return;
    setSubmitting(true);

    const action =
      communityType === "creator"
        ? createCreatorComment
        : createChallengeComment;
    const result = await action(postId, newBody.trim());

    if (result?.success) {
      setComments((prev) => [
        ...prev,
        {
          id: result.commentId ?? crypto.randomUUID(),
          author_id: currentUserId,
          body: newBody.trim(),
          created_at: new Date().toISOString(),
          authorName: "You",
        },
      ]);
      setNewBody("");
      setDisplayCount((c) => c + 1);
    }
    setSubmitting(false);
  }

  return (
    <div>
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-[#9CF0FF]/25 hover:text-[#9CF0FF]/50 transition-colors"
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-xs font-headline font-bold">{displayCount}</span>
      </button>

      {/* Expanded comments */}
      {open && (
        <div className="mt-3 pt-3 border-t border-[#9CF0FF]/8 space-y-3">
          {loading ? (
            <p className="text-xs text-[#9CF0FF]/25">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-[#9CF0FF]/20">
              No comments yet.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-[#9CF0FF]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[8px] font-black text-[#9CF0FF]/40 font-headline">
                    {c.authorName[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white font-headline">
                    {c.authorName}
                  </span>
                  <span className="text-[10px] text-[#9CF0FF]/20 ml-2">
                    {timeAgo(c.created_at)}
                  </span>
                  <p className="text-xs text-[#9CF0FF]/50 mt-0.5 leading-relaxed">
                    {c.body}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Add comment */}
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Write a comment..."
              maxLength={2000}
              className="flex-1 bg-transparent border border-[#9CF0FF]/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#9CF0FF]/20 focus:border-[#9CF0FF]/25 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !newBody.trim()}
              className="px-3 py-2 rounded-lg bg-[#FF6130] text-white text-[10px] font-bold font-headline disabled:opacity-40 shrink-0"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
