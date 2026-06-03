"use client";

/**
 * TribeFeed — Bundle 5c (locker-room v4).
 *
 * The Tribe's conversation. The kind selector sits at the TOP of the composer
 * (you choose what you're doing before you type): Share (cyan) or Question
 * (orange). Picking Question reveals an "ask a specific Expert" picker and the
 * post is directed to them (directed_to).
 *
 * Colour system: Share = cyan, Question = orange, and the GUIDED system posts —
 * Intro + Reflection — are purple. Cards stay calm (one small kind accent),
 * creators read as Experts, your own posts are marked "You", and questions show
 * who they're for.
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
  directedTo: string[];
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
}

interface RawRow {
  id: string;
  author_id: string;
  body: string;
  kind?: string;
  directed_to?: string[] | null;
  created_at: string;
}

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const PURPLE = "#8b5cf6";
const INK = "#0F2229";

/** Visible post kinds + their accent. `talk` (a plain share) has no badge.
 *  Intro + Reflection are the guided/system posts → purple. */
const KIND: Record<string, { label: string; color: string }> = {
  intro: { label: "Introduction", color: PURPLE },
  reflection: { label: "Reflection", color: PURPLE },
  question: { label: "Question", color: ORANGE },
};

const COMPOSE_KINDS = [
  { key: "talk", label: "Share", color: CYAN },
  { key: "question", label: "Question", color: ORANGE },
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
  const [askId, setAskId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profRef = useRef<Record<string, { name: string; avatar: string | null }>>({});

  const creatorById = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);

  const enrich = useCallback(async (rows: { author_id: string }[]) => {
    const supabase = createClient();
    const missing = [...new Set(rows.map((r) => r.author_id))].filter((id) => !profRef.current[id]);
    if (missing.length > 0) {
      const { data } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", missing);
      for (const p of data ?? []) profRef.current[p.id] = { name: p.display_name ?? "Member", avatar: p.avatar_url };
    }
  }, []);

  const toPost = useCallback((r: RawRow): FeedPost => ({
    id: r.id, author_id: r.author_id, body: r.body, kind: r.kind ?? "talk",
    directedTo: r.directed_to ?? [], created_at: r.created_at,
    authorName: profRef.current[r.author_id]?.name ?? "Member", authorAvatar: profRef.current[r.author_id]?.avatar ?? null,
  }), []);

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("list_challenge_posts", { p_space: spaceId, p_limit: 30 });
    const rows = (data as RawRow[]) ?? [];
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
          const r = payload.new as RawRow & { kind?: string };
          if (r.kind === "intro_private") return;
          await enrich([r]);
          setPosts((prev) => (prev.some((p) => p.id === r.id) ? prev : [toPost(r), ...prev]));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [spaceId, enrich, toPost]);

  function selectKind(k: ComposeKind) {
    setKind(k);
    setError(null);
    if (k !== "question") setAskId(null);
    else if (creators.length === 1) setAskId(creators[0].id);
  }

  async function submit() {
    if (!body.trim() || posting) return;
    if (kind === "question" && !askId) { setError("Pick an Expert to ask."); return; }
    setPosting(true); setError(null);
    const result =
      kind === "question"
        ? await createChallengePost(spaceId, body.trim(), { kind: "question", directedTo: [askId!] })
        : await createChallengePost(spaceId, body.trim(), { kind: "talk" });
    if (result?.error) { setError(result.error); setPosting(false); return; }
    setBody(""); setKind("talk"); setAskId(null); setPosting(false);
  }

  const canSubmit = !!body.trim() && !posting && !(kind === "question" && !askId);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-baseline gap-2.5 mb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: INK, fontWeight: 800 }}>
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
          {/* Kind selector — at the top, before you type */}
          <div className="flex gap-2 mb-3">
            {COMPOSE_KINDS.map((k) => {
              const active = kind === k.key;
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => selectKind(k.key)}
                  className="px-4 py-1.5 rounded-full text-[12px] font-black font-headline uppercase tracking-wider transition-colors"
                  style={{ color: active ? "#fff" : k.color, backgroundColor: active ? k.color : `${k.color}14` }}
                >
                  {k.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Avatar src={viewer.avatar} name={viewer.name} size={38} ring={CYAN} />
            <div className="flex-1 min-w-0">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={kind === "question" ? "What do you want to ask?" : "Share something with your Tribe…"}
                rows={2}
                maxLength={5000}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
                style={{ backgroundColor: "#FAF7F1", border: "1px solid rgba(15,34,41,0.08)", color: INK }}
              />

              {/* Question → pick an Expert to direct it to */}
              {kind === "question" && creators.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-headline mb-1.5" style={{ color: "#94a3b8", fontWeight: 800 }}>
                    Ask
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {creators.map((c) => {
                      const active = askId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setAskId(c.id); setError(null); }}
                          className="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 transition-colors"
                          style={{
                            backgroundColor: active ? "rgba(255,97,48,0.12)" : "rgba(15,34,41,0.04)",
                            boxShadow: active ? `inset 0 0 0 1.5px ${ORANGE}` : "none",
                          }}
                        >
                          <Avatar src={c.avatar} name={c.name} size={22} ring={c.role === "owner" ? ORANGE : CYAN} />
                          <span className="text-[12px] font-black font-headline" style={{ color: active ? ORANGE : "#475569" }}>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && <p className="text-xs mt-1.5" style={{ color: ORANGE }}>{error}</p>}

              <div className="flex justify-end mt-2.5">
                <button
                  onClick={submit}
                  disabled={!canSubmit}
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
            <PostCard
              key={p.id}
              post={p}
              creator={creatorById.get(p.author_id)}
              directedCreator={p.kind === "question" ? creatorById.get(p.directedTo[0]) : undefined}
              isOwn={p.author_id === viewer.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  creator,
  directedCreator,
  isOwn,
}: {
  post: FeedPost;
  creator?: SpaceCreator;
  directedCreator?: SpaceCreator;
  isOwn: boolean;
}) {
  const badge = KIND[post.kind];
  const isCreator = !!creator;
  const ring = isCreator ? (creator!.role === "owner" ? ORANGE : CYAN) : isOwn ? CYAN : undefined;
  const accent = badge?.color;

  return (
    <article
      className="rounded-2xl relative overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 2px 12px rgba(15,34,41,0.04)" }}
    >
      {accent && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: accent }} aria-hidden />}
      <div className="flex gap-3 p-4" style={accent ? { paddingLeft: 20 } : undefined}>
        <Avatar src={post.authorAvatar} name={post.authorName} size={40} ring={ring} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-black font-headline" style={{ color: INK }}>{post.authorName}</span>
            {isCreator && (
              <span className="text-[9px] uppercase tracking-wider font-headline px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: ring, fontWeight: 800 }}>
                Expert
              </span>
            )}
            {isOwn && !isCreator && (
              <span className="text-[9px] uppercase tracking-wider font-headline px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(8,145,178,0.12)", color: CYAN, fontWeight: 800 }}>
                You
              </span>
            )}
            {badge && (
              <span className="text-[10px] uppercase tracking-wider font-headline px-2 py-0.5 rounded-full" style={{ color: badge.color, backgroundColor: `${badge.color}14`, fontWeight: 800 }}>
                {badge.label}
              </span>
            )}
            <span className="text-[11px] ml-auto shrink-0" style={{ color: "#94a3b8" }} suppressHydrationWarning>
              {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          </div>

          {/* Directed question → who it's for */}
          {post.kind === "question" && directedCreator && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>for</span>
              <Avatar src={directedCreator.avatar} name={directedCreator.name} size={18} ring={directedCreator.role === "owner" ? ORANGE : CYAN} />
              <span className="text-[12px] font-black font-headline" style={{ color: ORANGE }}>{directedCreator.name}</span>
            </div>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1.5" style={{ color: "#334155" }}>{post.body}</p>
        </div>
      </div>
    </article>
  );
}
