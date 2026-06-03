"use client";

/**
 * TribeFeed — Bundle 5c (locker-room Ship 1.4).
 *
 * One contained conversation panel with a GUIDED composer (choose Share/Question
 * first → the chosen pill pops → the text unlocks; Question reveals an Expert
 * picker). Posts can now carry an IMAGE (Instagram/Facebook style — e.g. sharing
 * a meal): the composer uploads to the existing profile-images bucket and the
 * post renders the photo inline. Posts are clean white cards on a tinted strip:
 * author header → one kind/context line → body → photo. Dates show the full year
 * so a 2027 program never reads as the past.
 *
 * Realtime works (app_challenge_post is published); your own post is prepended
 * optimistically. (Likes/comments + coach answers are Ship 2.)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { createChallengePost } from "@/app/actions/community";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import type { ExperienceViewer, SpaceCreator } from "@/lib/experienceSpace/store";
import { Avatar } from "./Avatar";

interface FeedPost {
  id: string;
  author_id: string;
  body: string;
  kind: string;
  contextId: string | null;
  directedTo: string[];
  mediaUrl: string | null;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
}

interface RawRow {
  id: string;
  author_id: string;
  body: string;
  kind?: string;
  context_id?: string | null;
  directed_to?: string[] | null;
  media_url?: string | null;
  created_at: string;
}

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";

const COMPOSE_KINDS = [
  { key: "talk", label: "Share", color: CYAN },
  { key: "question", label: "Question", color: ORANGE },
] as const;
type ComposeKind = (typeof COMPOSE_KINDS)[number]["key"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
  const introPrompt = useExperienceSpaceStore((s) => s.experience.introPrompt);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const composeIntent = useExperienceSpaceStore((s) => s.ui.composeIntent);
  const setComposeIntent = useExperienceSpaceStore((s) => s.setComposeIntent);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<ComposeKind | null>(null);
  const [askId, setAskId] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profRef = useRef<Record<string, { name: string; avatar: string | null }>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const creatorById = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);
  const sessionById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  // Hub → composer intent (Share / Ask). Pre-selects the kind, then consumes.
  useEffect(() => {
    if (!composeIntent) return;
    const k: ComposeKind = composeIntent === "question" ? "question" : "talk";
    setKind(k);
    if (k === "question" && creators.length === 1) setAskId(creators[0].id);
    else if (k !== "question") setAskId(null);
    setComposeIntent(null);
  }, [composeIntent, creators, setComposeIntent]);

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
    contextId: r.context_id ?? null, directedTo: r.directed_to ?? [], mediaUrl: r.media_url ?? null,
    created_at: r.created_at,
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
    if (k === "talk") textareaRef.current?.focus();
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setUploading(true); setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not signed in."); setUploading(false); return; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/post-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) { setError(`Upload failed: ${upErr.message}`); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
      setMediaUrl(urlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
    setUploading(false);
  }

  async function submit() {
    if (!body.trim() || posting || kind === null) return;
    if (kind === "question" && !askId) { setError("Pick an Expert to ask."); return; }
    const text = body.trim();
    const isQuestion = kind === "question";
    const media = mediaUrl;
    setPosting(true); setError(null);
    const result = isQuestion
      ? await createChallengePost(spaceId, text, { kind: "question", directedTo: [askId!], mediaUrl: media })
      : await createChallengePost(spaceId, text, { kind: "talk", mediaUrl: media });
    if (result?.error) { setError(result.error); setPosting(false); return; }

    const postId = (result as { postId?: string })?.postId;
    if (postId) {
      profRef.current[viewer.id] = { name: viewer.name, avatar: viewer.avatar };
      const optimistic: FeedPost = {
        id: postId, author_id: viewer.id, body: text,
        kind: isQuestion ? "question" : "talk", contextId: null,
        directedTo: isQuestion && askId ? [askId] : [], mediaUrl: media,
        created_at: new Date().toISOString(),
        authorName: viewer.name, authorAvatar: viewer.avatar,
      };
      setPosts((prev) => (prev.some((p) => p.id === postId) ? prev : [optimistic, ...prev]));
    }
    setBody(""); setKind(null); setAskId(null); setMediaUrl(null); setPosting(false);
  }

  const needsAsk = kind === "question" && !askId;
  const textLocked = kind === null || needsAsk;
  const canSubmit = !!body.trim() && !posting && !uploading && !textLocked;
  const placeholder =
    kind === null
      ? "Choose Share or Question to begin…"
      : kind === "question"
        ? askId
          ? `What do you want to ask ${creatorById.get(askId)?.name ?? "your Expert"}?`
          : "Choose who to ask above…"
        : "Share something with your Tribe…";

  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 sm:px-5 pt-4 pb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: INK, fontWeight: 800 }}>The Tribe</p>
        {!loading && posts.length > 0 && (
          <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        )}
      </div>

      {/* Composer — guided */}
      {canPost && (
        <div
          id="tribe-composer"
          className="px-4 sm:px-5 py-5 scroll-mt-24"
          style={{ borderTop: "1px solid rgba(15,34,41,0.06)", backgroundColor: "#FCFAF6" }}
        >
          <div className="flex gap-2">
            {COMPOSE_KINDS.map((k) => {
              const active = kind === k.key;
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => selectKind(k.key)}
                  className="px-4 py-1.5 rounded-full text-[12px] font-black font-headline uppercase tracking-wider transition-colors"
                  style={
                    active
                      ? { color: "#fff", backgroundColor: k.color, boxShadow: `0 2px 8px ${k.color}55` }
                      : { color: "#475569", backgroundColor: "rgba(15,34,41,0.05)" }
                  }
                >
                  {k.label}
                </button>
              );
            })}
          </div>

          {kind === "question" && creators.length > 0 && (
            <div className="mt-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] font-headline mb-1.5" style={{ color: "#94a3b8", fontWeight: 800 }}>Ask</p>
              <div className="flex flex-wrap gap-2">
                {creators.map((c) => {
                  const active = askId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setAskId(c.id); setError(null); textareaRef.current?.focus(); }}
                      className="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 transition-colors"
                      style={{
                        backgroundColor: active ? "rgba(255,97,48,0.12)" : "rgba(15,34,41,0.05)",
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

          <div className="flex gap-3 mt-4">
            <Avatar src={viewer.avatar} name={viewer.name} size={38} ring={CYAN} />
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={placeholder}
                rows={3}
                maxLength={5000}
                disabled={textLocked}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none transition-colors disabled:cursor-not-allowed"
                style={{
                  backgroundColor: textLocked ? "rgba(15,34,41,0.03)" : "#FFFFFF",
                  border: "1px solid rgba(15,34,41,0.10)",
                  color: INK,
                  opacity: textLocked ? 0.7 : 1,
                }}
              />

              {/* Image preview */}
              {mediaUrl && (
                <div className="relative mt-2.5 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl} alt="" className="rounded-xl max-h-44 object-cover" style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.08)" }} />
                  <button
                    type="button"
                    onClick={() => setMediaUrl(null)}
                    aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(15,34,41,0.72)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
                  </button>
                </div>
              )}

              {error && <p className="text-xs mt-1.5" style={{ color: ORANGE }}>{error}</p>}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={textLocked || uploading}
                    aria-label="Add image"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "rgba(8,145,178,0.10)" }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                  {uploading && <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>Uploading…</span>}
                </div>
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="px-6 py-2 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
                  style={{ backgroundColor: ORANGE, boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts — white cards on a tinted strip */}
      <div className="px-3 sm:px-4 py-4" style={{ borderTop: "1px solid rgba(15,34,41,0.06)", backgroundColor: "#F4F1EA" }}>
        {loading ? (
          <p className="text-xs py-6 text-center" style={{ color: "#94a3b8" }}>Loading the Tribe…</p>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center rounded-xl" style={{ backgroundColor: "#FFFFFF" }}>
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
                reflectsOn={p.kind === "reflection" && p.contextId ? sessionById.get(p.contextId)?.title ?? null : null}
                introPrompt={p.kind === "intro" ? introPrompt : null}
                isOwn={p.author_id === viewer.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PostCard({
  post,
  creator,
  directedCreator,
  reflectsOn,
  introPrompt,
  isOwn,
}: {
  post: FeedPost;
  creator?: SpaceCreator;
  directedCreator?: SpaceCreator;
  reflectsOn?: string | null;
  introPrompt?: string | null;
  isOwn: boolean;
}) {
  const isCreator = !!creator;
  const ring = isCreator ? (creator!.role === "owner" ? ORANGE : CYAN) : isOwn ? CYAN : undefined;

  return (
    <article
      className="rounded-xl p-4"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.04), 0 1px 4px rgba(15,34,41,0.04)" }}
    >
      <div className="flex gap-3">
        <Avatar src={post.authorAvatar} name={post.authorName} size={40} ring={ring} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black font-headline" style={{ color: INK }}>{post.authorName}</span>
            {isCreator && (
              <span className="text-[9px] uppercase tracking-wider font-headline px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: ring, fontWeight: 800 }}>Expert</span>
            )}
            <span className="text-[11px] ml-auto shrink-0" style={{ color: "#94a3b8" }} suppressHydrationWarning>{fmtDate(post.created_at)}</span>
          </div>

          {post.kind === "question" && directedCreator && (
            <ContextBanner color={ORANGE} label="Question for">
              <Avatar src={directedCreator.avatar} name={directedCreator.name} size={24} ring={directedCreator.role === "owner" ? ORANGE : CYAN} />
              <span className="text-[14px] font-black font-headline" style={{ color: ORANGE }}>{directedCreator.name}</span>
            </ContextBanner>
          )}
          {post.kind === "reflection" && reflectsOn && (
            <ContextBanner color={CYAN} label="Reflection on">
              <span className="text-[14px] font-black font-headline" style={{ color: CYAN }}>{reflectsOn}</span>
            </ContextBanner>
          )}
          {post.kind === "intro" && (
            <ContextBanner color={CYAN} label="Introduction" stacked>
              {introPrompt && (
                <p className="text-[13px] italic leading-snug" style={{ color: "#475569" }}>“{introPrompt}”</p>
              )}
            </ContextBanner>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-3" style={{ color: "#334155" }}>{post.body}</p>

          {post.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.mediaUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="rounded-xl mt-3 w-full max-h-[440px] object-cover"
              style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

/** A weighted context banner above the body — tinted, with a colour accent bar —
 *  so "Question for / Introduction / Reflection on" stands out even when the post
 *  carries a photo. (Ship 2's "Answer to" will reuse this.) */
function ContextBanner({
  color,
  label,
  stacked,
  children,
}: {
  color: string;
  label: string;
  stacked?: boolean;
  children?: ReactNode;
}) {
  const labelEl = (
    <span className="text-[11px] uppercase tracking-[0.12em] font-headline" style={{ color, fontWeight: 800 }}>{label}</span>
  );
  return (
    <div className="rounded-lg mt-2.5 px-3 py-2" style={{ backgroundColor: `${color}14`, boxShadow: `inset 3.5px 0 0 ${color}` }}>
      {stacked ? (
        <>
          {labelEl}
          <div className="mt-1">{children}</div>
        </>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {labelEl}
          {children}
        </div>
      )}
    </div>
  );
}
