"use client";

/**
 * TribeFeed — Bundle 5c (locker-room v2).
 *
 * The Tribe's conversation, designed to feel human: a polished composer that
 * shows YOUR avatar and lets you choose what kind of post you're making
 * (Share / Reflection / Question), and kind-aware post cards with a strong
 * author identity — avatar + name, a coloured kind accent, and creators set
 * apart as "Experts" (ringed avatar + tag) so guidance reads differently from
 * peer chatter.
 *
 * Data + realtime layer unchanged from before: list_challenge_posts seed,
 * author-profile enrichment cache, app_challenge_post INSERT → prepend.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createChallengePost } from "@/app/actions/community";
import type { ExperienceViewer, SpaceCreator } from "@/lib/experienceSpace/store";
import { Avatar } from "./Avatar";

interface FeedPost {
  id: string;
  author_id: string;
  body: string;
  kind: string;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
}

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";

/** Visible post kinds + their accent. `talk` (a plain share) has no badge. */
const KIND: Record<string, { label: string; color: string }> = {
  intro: { label: "Introduction", color: CYAN },
  reflection: { label: "Reflection", color: "#8b5cf6" },
  question: { label: "Question", color: ORANGE },
};

/** Composer options → post kind. */
const COMPOSE_KINDS = [
  { key: "talk", label: "Share" },
  { key: "reflection", label: "Reflection" },
  { key: "question", label: "Question" },
] as const;
type ComposeKind = (typeof COMPOSE_KINDS)[number]["key"];

export function TribeFeed({
  spaceId,
  viewer,
  canPost,
  creators,
}: {
  spaceId: string;
  viewer: ExperienceViewer;
  canPost: boolean;
  creators: SpaceCreator[];
}) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<ComposeKind>("talk");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profRef = useRef<Record<string, { name: string; avatar: string | null }>>({});

  const creatorById = useMemo(
    () => new Map(creators.map((c) => [c.id, c])),
    [creators],
  );

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
    const result = await createChallengePost(spaceId, body.trim(), { kind });
    if (result?.error) { setError(result.error); setPosting(false); return; }
    setBody(""); setKind("talk"); setPosting(false);
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline gap-2.5 mb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline flex items-center gap-2" style={{ color: "#475569", fontWeight: 800 }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ORANGE }} />
          The Tribe
        </p>
        {!loading && posts.length > 0 && (
          <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        )}
      </div>

      {/* Composer */}
      {canPost && (
        <div
          id="tribe-composer"
          className="rounded-2xl p-4 mb-4 scroll-mt-24"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 4px 16px rgba(15,34,41,0.05)" }}
        >
          <div className="flex gap-3">
            <Avatar src={viewer.avatar} name={viewer.name} size={38} ring={CYAN} />
            <div className="flex-1 min-w-0">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share something with your Tribe…"
                rows={2}
                maxLength={5000}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
                style={{ backgroundColor: "#FAF7F1", border: "1px solid rgba(15,34,41,0.08)", color: INK }}
              />
              {error && <p className="text-xs mt-1.5" style={{ color: ORANGE }}>{error}</p>}
              <div className="flex items-center justify-between gap-2 mt-2.5 flex-wrap">
                {/* Kind picker */}
                <div className="flex gap-1.5">
                  {COMPOSE_KINDS.map((k) => {
                    const active = kind === k.key;
                    const color = k.key === "question" ? ORANGE : k.key === "reflection" ? "#8b5cf6" : "#475569";
                    return (
                      <button
                        key={k.key}
                        type="button"
                        onClick={() => setKind(k.key)}
                        className="text-[11px] font-black font-headline uppercase tracking-wider px-2.5 py-1.5 rounded-full transition-colors"
                        style={{
                          color: active ? "#fff" : color,
                          backgroundColor: active ? color : `${color}14`,
                        }}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={submit}
                  disabled={posting || !body.trim()}
                  className="px-5 py-2 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
                  style={{ backgroundColor: ORANGE, boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <p className="text-xs py-6 text-center" style={{ color: "#94a3b8" }}>Loading the Tribe…</p>
      ) : posts.length === 0 ? (
        <div className="py-10 text-center rounded-2xl" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
          <p className="text-sm font-bold font-headline" style={{ color: "#64748b" }}>The Tribe is quiet</p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Start the conversation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} creator={creatorById.get(p.author_id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, creator }: { post: FeedPost; creator?: SpaceCreator }) {
  const badge = KIND[post.kind];
  const isCreator = !!creator;
  const ring = isCreator ? (creator!.role === "owner" ? ORANGE : CYAN) : undefined;
  const accent = badge?.color;

  return (
    <article
      className="rounded-2xl relative overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 2px 12px rgba(15,34,41,0.04)" }}
    >
      {/* Kind accent rail */}
      {accent && (
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} aria-hidden />
      )}
      <div className="flex gap-3 p-4" style={accent ? { paddingLeft: 20 } : undefined}>
        <Avatar src={post.authorAvatar} name={post.authorName} size={40} ring={ring} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black font-headline" style={{ color: INK }}>{post.authorName}</span>
            {isCreator && (
              <span
                className="text-[9px] uppercase tracking-wider font-headline px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: ring, fontWeight: 800 }}
              >
                Expert
              </span>
            )}
            {badge && (
              <span
                className="text-[10px] uppercase tracking-wider font-headline px-2 py-0.5 rounded-full"
                style={{ color: badge.color, backgroundColor: `${badge.color}14`, fontWeight: 800 }}
              >
                {badge.label}
              </span>
            )}
            <span className="text-[11px] ml-auto shrink-0" style={{ color: "#94a3b8" }} suppressHydrationWarning>
              {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1.5" style={{ color: "#334155" }}>{post.body}</p>
        </div>
      </div>
    </article>
  );
}
