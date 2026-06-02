"use client";

/**
 * TribeFeed — Bundle 5c (revised).
 *
 * The Tribe's social feed: kind-aware posts (intro / reflection / question
 * badges) with author avatars, a "share with your Tribe" composer for
 * members/creators, and its own realtime subscription (app_challenge_post
 * INSERT → prepend). The intro action moved to the IntroActionCard, so this
 * composer is just for ongoing posts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createChallengePost } from "@/app/actions/community";

interface FeedPost {
  id: string;
  author_id: string;
  body: string;
  kind: string;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
}

const KIND_BADGE: Record<string, { label: string; color: string }> = {
  intro: { label: "Introduction", color: "#0891b2" },
  reflection: { label: "Reflection", color: "#8b5cf6" },
  question: { label: "Question", color: "#FF6130" },
};

export function TribeFeed({
  spaceId,
  currentUserId,
  canPost,
}: {
  spaceId: string;
  currentUserId: string;
  canPost: boolean;
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profRef = useRef<Record<string, { name: string; avatar: string | null }>>({});

  const enrich = useCallback(async (rows: { author_id: string }[]) => {
    const supabase = createClient();
    const missing = [...new Set(rows.map((r) => r.author_id))].filter((id) => !profRef.current[id]);
    if (missing.length > 0) {
      const { data } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", missing);
      for (const p of data ?? []) profRef.current[p.id] = { name: p.display_name ?? "Member", avatar: p.avatar_url };
    }
  }, []);

  const toPost = useCallback((r: { id: string; author_id: string; body: string; kind?: string; created_at: string }): FeedPost => ({
    id: r.id, author_id: r.author_id, body: r.body, kind: r.kind ?? "talk", created_at: r.created_at,
    authorName: profRef.current[r.author_id]?.name ?? "Member", authorAvatar: profRef.current[r.author_id]?.avatar ?? null,
  }), []);

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("list_challenge_posts", { p_space: spaceId, p_limit: 30 });
    const rows = (data as { id: string; author_id: string; body: string; kind?: string; created_at: string }[]) ?? [];
    await enrich(rows);
    setPosts(rows.map(toPost));
    setLoading(false);
  }, [spaceId, enrich, toPost]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tribe-feed-${spaceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "app_challenge_post", filter: `space_id=eq.${spaceId}` },
        async (payload) => {
          const r = payload.new as { id: string; author_id: string; body: string; kind?: string; created_at: string };
          if (r.kind === "intro_private") return;
          await enrich([r]);
          setPosts((prev) => (prev.some((p) => p.id === r.id) ? prev : [toPost(r), ...prev]));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [spaceId, enrich, toPost]);

  async function submit() {
    if (!body.trim() || posting) return;
    setPosting(true); setError(null);
    const result = await createChallengePost(spaceId, body.trim());
    if (result?.error) { setError(result.error); setPosting(false); return; }
    setBody(""); setPosting(false);
  }

  return (
    <div className="space-y-3">
      {canPost && (
        <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.6)" }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share something with your Tribe…"
            rows={2}
            maxLength={5000}
            className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,34,41,0.1)", color: "#0F2229" }}
          />
          {error && <p className="text-xs mt-1.5" style={{ color: "#FF6130" }}>{error}</p>}
          <div className="flex justify-end mt-2">
            <button onClick={submit} disabled={posting || !body.trim()} className="px-4 py-2 rounded-full text-white text-sm font-black font-headline disabled:opacity-40" style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}>
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: "#94a3b8" }}>Loading the Tribe…</p>
      ) : posts.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed" style={{ borderColor: "rgba(15,34,41,0.15)" }}>
          <p className="text-sm" style={{ color: "#64748b" }}>The Tribe is quiet — start the conversation.</p>
        </div>
      ) : (
        posts.map((p) => {
          const badge = KIND_BADGE[p.kind];
          return (
            <div key={p.id} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.6)" }}>
              <div className="flex items-center gap-2.5 mb-2">
                {p.authorAvatar ? (
                  <img src={p.authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: "#0891b2" }}>{p.authorName[0]?.toUpperCase()}</div>
                )}
                <span className="text-sm font-black font-headline" style={{ color: "#0F2229" }}>{p.authorName}</span>
                {badge && (
                  <span className="text-[10px] uppercase tracking-wider font-headline px-2 py-0.5 rounded-full" style={{ color: badge.color, backgroundColor: `${badge.color}14`, fontWeight: 800 }}>{badge.label}</span>
                )}
                <span className="text-[11px] ml-auto" style={{ color: "#94a3b8" }}>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#334155" }}>{p.body}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
