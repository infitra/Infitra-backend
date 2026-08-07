"use client";

/**
 * TribeFeed — Bundle 5c (locker-room Ship 2).
 *
 * The Tribe's conversation, now with engagement — all realtime:
 *   • Like a post (heart, optimistic; others' likes stream in live).
 *   • Comment threads that expand inline, with a composer.
 *   • Coach answers: when a creator replies to a directed question, it's
 *     auto-promoted server-side and surfaced as a prominent "Answered by …"
 *     banner under the question (and flagged in the thread).
 * Plus the earlier guided composer (Share/Question + Expert picker), image
 * posts, weighted context banners, and full-year dates.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/uploadImage";
import { createChallengePost, createChallengeComment, toggleChallengeLike } from "@/app/actions/community";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import type { ExperienceViewer, SpaceCreator, SpaceSession } from "@/lib/experienceSpace/store";
import { sessionTeamLabel } from "@/lib/experienceSpace/store";
import { SessionDetailModal } from "@/app/components/SessionDetailModal";
import { Avatar } from "./Avatar";
import { ProfileTrigger } from "@/app/components/ProfileModal";
import { useSpaceMaterials, MaterialContextCard } from "./SpaceMaterials";
import type { MaterialRow } from "@/app/(app)/dashboard/collaborate/[challengeId]/SessionMaterials";

interface CoachAnswer { authorId: string; body: string; createdAt: string }

interface FeedPost {
  id: string;
  author_id: string;
  body: string;
  kind: string;
  contextType: string | null;
  contextId: string | null;
  directedTo: string[];
  mediaUrl: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  coachAnswer: CoachAnswer | null;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
}

interface RawRow {
  id: string; author_id: string; body: string; kind?: string;
  context_type?: string | null;
  context_id?: string | null; directed_to?: string[] | null; media_url?: string | null;
  like_count?: number; comment_count?: number; liked_by_me?: boolean;
  coach_answer?: { author_id: string; body: string; created_at: string } | null;
  created_at: string;
}

interface CommentItem {
  id: string; author_id: string; body: string; isCoachAnswer: boolean; created_at: string;
  authorName: string; authorAvatar: string | null;
}
interface RawComment { id: string; author_id: string; body: string; is_coach_answer?: boolean; created_at: string }

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";

const COMPOSE_KINDS = [
  { key: "talk", label: "Share", color: CYAN },
  { key: "question", label: "Ask a question", color: ORANGE },
] as const;
type ComposeKind = (typeof COMPOSE_KINDS)[number]["key"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtSessionShort(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function TribeFeed({
  spaceId, viewer, canPost, creators,
}: {
  spaceId: string; viewer: ExperienceViewer; canPost: boolean; creators: SpaceCreator[];
}) {
  const introPrompt = useExperienceSpaceStore((s) => s.experience.introPrompt);
  const sessions = useExperienceSpaceStore((s) => s.sessions);
  const members = useExperienceSpaceStore((s) => s.members);
  const composeIntent = useExperienceSpaceStore((s) => s.ui.composeIntent);
  const feedFilter = useExperienceSpaceStore((s) => s.ui.feedFilter);
  const setFeedFilter = useExperienceSpaceStore((s) => s.setFeedFilter);
  const setComposeIntent = useExperienceSpaceStore((s) => s.setComposeIntent);
  // Reused by the creator console: this feed already holds the realtime channel
  // for questions/comments, so we tick a shared counter instead of opening a
  // second subscription. The Shell re-fetches the creator stats off it.
  const bumpFeedActivity = useExperienceSpaceStore((s) => s.bumpFeedActivity);
  // Creators get a contextual Share (attach a session / tag a co-host) in place
  // of the participant "Ask an Expert" composer — see the composer branch below.
  const isCreator = useExperienceSpaceStore((s) => s.isCreator);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  // Keyset pagination (founder's walk note: the feed must not grow endless).
  // list_challenge_posts already supports p_before_created_at/p_before_id;
  // a full page back means there may be more.
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [body, setBody] = useState("");
  // Creators always compose a Share (context is an optional add-on, not a mode);
  // participants pick Share/Question, so they start ungated.
  const [kind, setKind] = useState<ComposeKind | null>(isCreator ? "talk" : null);
  const [askId, setAskId] = useState<string | null>(null);
  // Creator "Add context": a tagged session (context_id) + the picker's open
  // state. The tagged co-host reuses askId (it rides on directed_to, like a
  // question — but a tagged Share is silent context, never a notified question).
  const [contextSessionId, setContextSessionId] = useState<string | null>(null);
  // One context per post: picking a material clears the session and back.
  const [contextMaterialId, setContextMaterialId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comment threads: which posts are expanded + their loaded comments.
  const [openPosts, setOpenPosts] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<Record<string, CommentItem[]>>({});

  const profRef = useRef<Record<string, { name: string; avatar: string | null }>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const creatorById = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);
  const spaceMaterials = useSpaceMaterials();
  const materialById = useMemo(() => new Map(spaceMaterials.map((m) => [m.id, m])), [spaceMaterials]);
  const sessionById = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);
  // Name/avatar resolver for likers — the tribe roster (DEFINER snapshot) has
  // everyone, so even private members resolve here. Fallback "Member".
  const peopleById = useMemo(() => {
    const m = new Map<string, { name: string; avatar: string | null }>();
    for (const c of creators) m.set(c.id, { name: c.name, avatar: c.avatar });
    for (const mem of members) m.set(mem.id, { name: mem.name, avatar: mem.avatar });
    m.set(viewer.id, { name: viewer.name, avatar: viewer.avatar });
    return m;
  }, [creators, members, viewer]);

  useEffect(() => {
    if (!composeIntent) return;
    // Creators never enter "question" mode — their engage button opens a Share.
    const k: ComposeKind = !isCreator && composeIntent === "question" ? "question" : "talk";
    setKind(k);
    if (k === "question" && creators.length === 1) setAskId(creators[0].id);
    else { setAskId(null); setContextSessionId(null); setContextMaterialId(null); setShowContext(false); }
    setComposeIntent(null);
  }, [composeIntent, creators, setComposeIntent, isCreator]);

  // The tribe roster (DEFINER snapshot from load_experience_space) contains
  // EVERY member, including private ones. Kept in a ref so enrich() can read
  // it without re-creating itself on every roster change.
  const peopleRef = useRef(peopleById);
  useEffect(() => {
    peopleRef.current = peopleById;
  }, [peopleById]);

  const enrich = useCallback(async (rows: { author_id: string }[]) => {
    const supabase = createClient();
    // Roster FIRST. A direct app_profile read is RLS-filtered, so a private
    // member's row comes back empty and their posts rendered as "Member" with
    // no photo — the founder's report. Private must hide the profile DETAIL,
    // never someone's identity inside their own tribe.
    for (const id of new Set(rows.map((r) => r.author_id))) {
      if (profRef.current[id]) continue;
      const known = peopleRef.current.get(id);
      if (known) profRef.current[id] = { name: known.name, avatar: known.avatar };
    }
    const missing = [...new Set(rows.map((r) => r.author_id))].filter((id) => !profRef.current[id]);
    if (missing.length > 0) {
      const { data } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", missing);
      for (const p of data ?? []) profRef.current[p.id] = { name: p.display_name ?? "Member", avatar: p.avatar_url };
    }
  }, []);

  const toPost = useCallback((r: RawRow): FeedPost => ({
    id: r.id, author_id: r.author_id, body: r.body, kind: r.kind ?? "talk",
    contextType: r.context_type ?? null, contextId: r.context_id ?? null, directedTo: r.directed_to ?? [], mediaUrl: r.media_url ?? null,
    likeCount: r.like_count ?? 0, commentCount: r.comment_count ?? 0, likedByMe: r.liked_by_me ?? false,
    coachAnswer: r.coach_answer ? { authorId: r.coach_answer.author_id, body: r.coach_answer.body, createdAt: r.coach_answer.created_at } : null,
    created_at: r.created_at,
    authorName: profRef.current[r.author_id]?.name ?? "Member", authorAvatar: profRef.current[r.author_id]?.avatar ?? null,
  }), []);

  const toComment = useCallback((r: RawComment): CommentItem => ({
    id: r.id, author_id: r.author_id, body: r.body, isCoachAnswer: !!r.is_coach_answer, created_at: r.created_at,
    authorName: profRef.current[r.author_id]?.name ?? "Member", authorAvatar: profRef.current[r.author_id]?.avatar ?? null,
  }), []);

  const PAGE_SIZE = 30;

  const fetchPosts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("list_challenge_posts", { p_space: spaceId, p_limit: PAGE_SIZE });
    const rows = (data as RawRow[]) ?? [];
    await enrich(rows);
    setPosts(rows.map(toPost));
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [spaceId, enrich, toPost]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      // Keyset cursor = the oldest loaded post (list is newest-first).
      const oldest = posts[posts.length - 1];
      if (!oldest) return;
      const supabase = createClient();
      const { data } = await supabase.rpc("list_challenge_posts", {
        p_space: spaceId,
        p_limit: PAGE_SIZE,
        p_before_created_at: oldest.created_at,
        p_before_id: oldest.id,
      });
      const rows = (data as RawRow[]) ?? [];
      await enrich(rows);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...rows.map(toPost).filter((p) => !seen.has(p.id))];
      });
      setHasMore(rows.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [posts, spaceId, enrich, toPost]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // ── Realtime: new posts, likes, comments ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tribe-feed-${spaceId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "app_challenge_post", filter: `space_id=eq.${spaceId}` },
        async (payload) => {
          const r = payload.new as RawRow & { kind?: string };
          if (r.kind === "intro_private") return;
          if (r.kind === "question") bumpFeedActivity(); // new question → creator pending may rise
          await enrich([r]);
          setPosts((prev) => (prev.some((p) => p.id === r.id) ? prev : [toPost(r), ...prev]));
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "app_challenge_post_like" },
        (payload) => {
          const r = payload.new as { post_id: string; user_id: string };
          if (r.user_id === viewer.id) return; // mine = optimistic
          setPosts((prev) => prev.map((p) => p.id === r.post_id ? { ...p, likeCount: p.likeCount + 1 } : p));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "app_challenge_post_like" },
        (payload) => {
          const r = payload.old as { post_id: string; user_id: string };
          if (!r?.post_id || r.user_id === viewer.id) return;
          setPosts((prev) => prev.map((p) => p.id === r.post_id ? { ...p, likeCount: Math.max(0, p.likeCount - 1) } : p));
        })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "app_challenge_comment" },
        async (payload) => {
          const r = payload.new as { id: string; post_id: string; author_id: string; body: string; is_coach_answer?: boolean; created_at: string };
          bumpFeedActivity(); // any comment may be a coach answer → creator pending may fall (incl. the creator's own answer)
          if (r.author_id === viewer.id) return; // mine = optimistic
          await enrich([r]);
          setPosts((prev) => prev.map((p) => p.id === r.post_id
            ? { ...p, commentCount: p.commentCount + 1, coachAnswer: r.is_coach_answer ? { authorId: r.author_id, body: r.body, createdAt: r.created_at } : p.coachAnswer }
            : p));
          setThreads((prev) => prev[r.post_id] ? { ...prev, [r.post_id]: [...prev[r.post_id], toComment(r)] } : prev);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [spaceId, viewer.id, enrich, toPost, toComment, bumpFeedActivity]);

  function selectKind(k: ComposeKind) {
    setKind(k); setError(null);
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
    // Service-role edge upload (direct client storage uploads are rejected as anon).
    const up = await uploadImage(file, "post");
    if (up.error) { setError(up.error); setUploading(false); return; }
    if (up.url) setMediaUrl(up.url);
    setUploading(false);
  }

  async function submit() {
    if (!body.trim() || posting || kind === null) return;
    if (kind === "question" && !askId) { setError("Pick an Expert to ask."); return; }
    const text = body.trim();
    const isQuestion = kind === "question";
    const media = mediaUrl;
    // A creator's Share can reference a session or a MATERIAL (Phase 5) —
    // one context per post. Participants' Shares carry no context.
    const ctxSession = !isQuestion && isCreator ? contextSessionId : null;
    const ctxMaterial = !isQuestion && isCreator && !ctxSession ? contextMaterialId : null;
    setPosting(true); setError(null);
    const result = isQuestion
      ? await createChallengePost(spaceId, text, { kind: "question", directedTo: [askId!], mediaUrl: media })
      : await createChallengePost(spaceId, text, {
          kind: "talk", mediaUrl: media,
          contextType: ctxSession ? "session" : ctxMaterial ? "material" : undefined,
          contextId: ctxSession ?? ctxMaterial ?? undefined,
        });
    if (result?.error) { setError(result.error); setPosting(false); return; }
    const postId = (result as { postId?: string })?.postId;
    if (postId) {
      profRef.current[viewer.id] = { name: viewer.name, avatar: viewer.avatar };
      const optimistic: FeedPost = {
        id: postId, author_id: viewer.id, body: text, kind: isQuestion ? "question" : "talk",
        contextType: ctxSession ? "session" : ctxMaterial ? "material" : null,
        contextId: ctxSession ?? ctxMaterial, directedTo: isQuestion ? [askId!] : [], mediaUrl: media,
        likeCount: 0, commentCount: 0, likedByMe: false, coachAnswer: null,
        created_at: new Date().toISOString(), authorName: viewer.name, authorAvatar: viewer.avatar,
      };
      setPosts((prev) => (prev.some((p) => p.id === postId) ? prev : [optimistic, ...prev]));
    }
    setBody(""); setKind(isCreator ? "talk" : null); setAskId(null);
    setContextSessionId(null); setContextMaterialId(null); setShowContext(false); setMediaUrl(null); setPosting(false);
  }

  // ── Likes ──
  async function toggleLike(post: FeedPost) {
    const wasLiked = post.likedByMe;
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, likedByMe: !wasLiked, likeCount: Math.max(0, p.likeCount + (wasLiked ? -1 : 1)) } : p));
    const res = await toggleChallengeLike(post.id, wasLiked);
    if (res?.error) {
      setPosts((prev) => prev.map((p) => p.id === post.id
        ? { ...p, likedByMe: wasLiked, likeCount: Math.max(0, p.likeCount + (wasLiked ? 1 : -1)) } : p));
    }
  }

  // ── Comment threads ──
  async function toggleThread(postId: string) {
    const isOpen = openPosts.has(postId);
    setOpenPosts((prev) => { const next = new Set(prev); if (isOpen) next.delete(postId); else next.add(postId); return next; });
    if (!isOpen && !threads[postId]) {
      const supabase = createClient();
      const { data } = await supabase.rpc("list_challenge_comments", { p_post: postId, p_limit: 100 });
      const rows = (data as RawComment[]) ?? [];
      await enrich(rows);
      setThreads((prev) => ({ ...prev, [postId]: rows.map(toComment) }));
    }
  }

  async function submitComment(post: FeedPost, text: string): Promise<string | null> {
    const res = await createChallengeComment(post.id, text);
    if (res?.error) return res.error;
    const commentId = (res as { commentId?: string })?.commentId ?? `tmp-${Date.now()}`;
    profRef.current[viewer.id] = { name: viewer.name, avatar: viewer.avatar };
    // A directed creator's reply becomes a coach answer — reflect it immediately for them.
    const becomesCoachAnswer = post.kind === "question" && post.directedTo.includes(viewer.id);
    const c: CommentItem = { id: commentId, author_id: viewer.id, body: text, isCoachAnswer: becomesCoachAnswer, created_at: new Date().toISOString(), authorName: viewer.name, authorAvatar: viewer.avatar };
    setThreads((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), c] }));
    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, commentCount: p.commentCount + 1, coachAnswer: becomesCoachAnswer ? { authorId: viewer.id, body: text, createdAt: c.created_at } : p.coachAnswer }
      : p));
    return null;
  }

  const needsAsk = kind === "question" && !askId;
  const textLocked = kind === null || needsAsk;
  const openForMeCount = useMemo(
    () =>
      posts.filter(
        (p) => p.kind === "question" && !p.coachAnswer && p.directedTo.includes(viewer.id),
      ).length,
    [posts, viewer.id],
  );

  // While the focus filter is active, pull the remaining pages automatically:
  // an open question further back must not hide behind "Show earlier posts".
  // Pilot volumes make the cascade cheap; the button stays as the manual path
  // for the other filters.
  useEffect(() => {
    if (feedFilter === "open_for_me" && hasMore && !loadingMore && !loading) loadMore();
  }, [feedFilter, hasMore, loadingMore, loading, loadMore]);

  const visiblePosts = useMemo(() => {
    if (feedFilter === "questions") return posts.filter((p) => p.kind === "question");
    if (feedFilter === "open_for_me")
      return posts.filter(
        (p) => p.kind === "question" && !p.coachAnswer && p.directedTo.includes(viewer.id),
      );
    return posts;
  }, [posts, feedFilter, viewer.id]);

  const canSubmit = !!body.trim() && !posting && !uploading && !textLocked;
  const placeholder =
    kind === null ? "Choose Share or Question to begin…"
      : kind === "question" ? (askId ? `What do you want to ask ${creatorById.get(askId)?.name ?? "your Expert"}?` : "Choose who to ask above…")
        : "Share something with your Tribe…";

  return (
    <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 6px 22px rgba(15,34,41,0.06)" }}>
      <div className="flex items-center gap-2.5 px-4 sm:px-5 pt-4 pb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: INK, fontWeight: 800 }}>The Tribe</p>
        {!loading && posts.length > 0 && (
          <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
        )}
      </div>

      {/* Composer */}
      {canPost && (
        <div id="tribe-composer" className="px-4 sm:px-5 py-5 scroll-mt-24" style={{ borderTop: "1px solid rgba(15,34,41,0.06)", backgroundColor: "#FCFAF6" }}>
          {isCreator ? (
            /* Creators compose a Share; "Add context" attaches a session and/or
               tags a co-host — the expert-side replacement for "Ask an Expert". */
            <div>
              {/* Share / Add context behave as a 2-way toggle: Share collapses
                  the picker, Add context opens it. Only one reads as active. */}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setShowContext(false)}
                  className="px-4 py-1.5 rounded-full text-[12px] font-black font-headline uppercase tracking-wider transition-colors"
                  style={!showContext ? { color: "#fff", backgroundColor: CYAN, boxShadow: `0 2px 8px ${CYAN}55` } : { color: "#475569", backgroundColor: "rgba(15,34,41,0.05)" }}>
                  Share
                </button>
                <button type="button" onClick={() => setShowContext(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-black font-headline transition-colors"
                  style={showContext ? { color: "#fff", backgroundColor: CYAN, boxShadow: `0 2px 8px ${CYAN}55` } : { color: "#475569", backgroundColor: "rgba(15,34,41,0.05)" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  {contextSessionId ? "Session added" : contextMaterialId ? "Material added" : "Add context"}
                </button>
              </div>

              {(contextSessionId || contextMaterialId) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {contextSessionId && (
                    <ContextChip color={CYAN} onRemove={() => setContextSessionId(null)}>On {sessionById.get(contextSessionId)?.title ?? "a session"}</ContextChip>
                  )}
                  {contextMaterialId && (
                    <ContextChip color={ORANGE} onRemove={() => setContextMaterialId(null)}>With {materialById.get(contextMaterialId)?.title ?? "a material"}</ContextChip>
                  )}
                </div>
              )}

              {showContext && (
                <div className="mt-3 rounded-xl p-3.5" style={{ backgroundColor: "#FCFAF6", boxShadow: "inset 0 0 0 1px rgba(15,34,41,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-[0.16em] font-headline mb-2" style={{ color: "#94a3b8", fontWeight: 800 }}>Reference a session</p>
                  {sessions.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto px-1 py-1.5 -mx-1">
                      {sessions.map((s) => {
                        const active = contextSessionId === s.id;
                        return (
                          <button key={s.id} type="button" onClick={() => { setContextSessionId(active ? null : s.id); if (!active) setContextMaterialId(null); }}
                            className="shrink-0 w-40 rounded-xl overflow-hidden text-left transition-shadow"
                            style={{ backgroundColor: "#FFFFFF", boxShadow: active ? `0 0 0 2px ${CYAN}` : "0 0 0 1px rgba(15,34,41,0.08)" }}>
                            <div className="relative w-full aspect-[5/3]" style={{ backgroundColor: "#ECE7DD" }}>
                              {s.imageUrl ? (
                                <Image src={s.imageUrl} alt="" fill sizes="160px" loading="lazy" decoding="async" className="object-cover" />
                              ) : (
                                <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(156,240,255,0.3), rgba(255,97,48,0.12))" }} />
                              )}
                              {active && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: CYAN, boxShadow: "0 1px 4px rgba(15,34,41,0.3)" }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                              )}
                            </div>
                            <div className="p-2.5">
                              <p className="text-[12px] font-black font-headline leading-tight" style={{ color: INK, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.title}</p>
                              <p className="text-[10px] font-bold font-headline mt-1 truncate" style={{ color: "#94a3b8" }} suppressHydrationWarning>{fmtSessionShort(s.startTime)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[12px] font-bold font-headline" style={{ color: "#94a3b8" }}>No sessions to reference yet.</p>
                  )}

                  {/* Materials — Phase 5. Same one-context rule: picking a
                      material clears the session. The chip vocabulary
                      matches the journey: orange = before, cyan = after. */}
                  {spaceMaterials.length > 0 && (
                    <>
                      <p className="text-[10px] uppercase tracking-[0.16em] font-headline mt-3 mb-2" style={{ color: "#94a3b8", fontWeight: 800 }}>Reference a material</p>
                      <div className="flex flex-wrap gap-1.5">
                        {spaceMaterials.map((m) => {
                          const mActive = contextMaterialId === m.id;
                          const mAccent = m.timing === "after" ? CYAN : ORANGE;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setContextMaterialId(mActive ? null : m.id); if (!mActive) setContextSessionId(null); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold font-headline transition-colors"
                              style={mActive
                                ? { color: "#fff", backgroundColor: mAccent, boxShadow: `0 2px 8px ${mAccent}55` }
                                : { color: "#475569", backgroundColor: `${mAccent}0D`, border: `1px solid ${mAccent}30` }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
                                <path d="M14 3v5h5" />
                              </svg>
                              <span className="truncate max-w-[160px]">{m.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {COMPOSE_KINDS.map((k) => {
                  const active = kind === k.key;
                  return (
                    <button key={k.key} type="button" onClick={() => selectKind(k.key)}
                      className="px-4 py-1.5 rounded-full text-[12px] font-black font-headline uppercase tracking-wider transition-colors"
                      style={active ? { color: "#fff", backgroundColor: k.color, boxShadow: `0 2px 8px ${k.color}55` } : { color: "#475569", backgroundColor: "rgba(15,34,41,0.05)" }}>
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
                        <button key={c.id} type="button" onClick={() => { setAskId(c.id); setError(null); textareaRef.current?.focus(); }}
                          className="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 transition-colors"
                          style={{ backgroundColor: active ? "rgba(255,97,48,0.12)" : "rgba(15,34,41,0.05)", boxShadow: active ? `inset 0 0 0 1.5px ${ORANGE}` : "none" }}>
                          <Avatar src={c.avatar} name={c.name} size={28} ring={c.role === "owner" ? ORANGE : CYAN} />
                          <span className="text-[12px] font-black font-headline" style={{ color: active ? ORANGE : "#475569" }}>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 mt-4">
            <Avatar src={viewer.avatar} name={viewer.name} size={46} ring={isCreator ? ORANGE : CYAN} />
            <div className="flex-1 min-w-0">
              <textarea ref={textareaRef} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} rows={3} maxLength={5000} disabled={textLocked}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none transition-colors disabled:cursor-not-allowed"
                style={{ backgroundColor: textLocked ? "rgba(15,34,41,0.03)" : "#FFFFFF", border: "1px solid rgba(15,34,41,0.10)", color: INK, opacity: textLocked ? 0.7 : 1 }} />
              {mediaUrl && (
                <div className="relative mt-2.5 inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl} alt="" className="rounded-xl w-[200px] aspect-[4/5] object-cover" style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.08)" }} />
                  <button type="button" onClick={() => setMediaUrl(null)} aria-label="Remove image" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(15,34,41,0.72)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
                  </button>
                </div>
              )}
              {error && <p className="text-xs mt-1.5" style={{ color: ORANGE }}>{error}</p>}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={textLocked || uploading} aria-label="Add image"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: "rgba(8,145,178,0.10)" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </button>
                  {uploading && <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>Uploading…</span>}
                </div>
                <button onClick={submit} disabled={!canSubmit} className="px-6 py-2 rounded-full text-white text-sm font-black font-headline disabled:opacity-40" style={{ backgroundColor: ORANGE, boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}>
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
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
            {/* Focus chips — the console's "Answer" deep-link lands on
                open_for_me so creators see exactly the questions waiting on
                them instead of the whole stream. Filters the LOADED pages;
                open questions are recent by nature. */}
            {/* Quiet underline TABS + funnel glyph — deliberately a different
                visual species from the pill composer buttons above, so
                "filter the stream" can't be confused with "write a post"
                (founder's walk). */}
            <div className="flex items-center gap-4 pb-1.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              {([
                ["all", "All"],
                ["questions", "Questions"],
                ...(isCreator ? [["open_for_me", `Open for you (${openForMeCount})`] as const] : []),
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFeedFilter(key)}
                  className="text-[11px] font-black font-headline uppercase tracking-wider pb-1 transition-colors"
                  style={
                    feedFilter === key
                      ? { color: "#0F2229", boxShadow: "inset 0 -2px 0 #FF6130" }
                      : { color: "#94a3b8" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {visiblePosts.length === 0 && (
              <p className="text-sm font-bold font-headline text-center py-6" style={{ color: "#94a3b8" }}>
                {feedFilter === "open_for_me" ? "Nothing waiting on you. Nice." : "No questions yet."}
              </p>
            )}
            {visiblePosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                viewer={viewer}
                creatorById={creatorById}
                peopleById={peopleById}
                directedCreator={p.kind === "question" ? creatorById.get(p.directedTo[0]) : undefined}
                reflectsOn={p.kind === "reflection" && p.contextId ? sessionById.get(p.contextId)?.title ?? null : null}
                contextSession={p.kind === "talk" && p.contextType !== "material" && p.contextId ? sessionById.get(p.contextId) ?? null : null}
                contextMaterial={p.kind === "talk" && p.contextType === "material" && p.contextId ? materialById.get(p.contextId) ?? null : null}
                introPrompt={p.kind === "intro" ? introPrompt : null}
                onLike={() => toggleLike(p)}
                threadOpen={openPosts.has(p.id)}
                comments={threads[p.id]}
                onToggleThread={() => toggleThread(p.id)}
                onSubmitComment={(text) => submitComment(p, text)}
              />
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-full text-[13px] font-bold font-headline transition-colors hover:bg-[rgba(15,34,41,0.04)] disabled:opacity-60"
                style={{ color: "#64748b", border: "1px solid rgba(15,34,41,0.12)" }}
              >
                {loadingMore ? "Loading…" : "Show earlier posts"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function PostCard({
  post, viewer, creatorById, peopleById, directedCreator, reflectsOn, contextSession, contextMaterial, introPrompt,
  onLike, threadOpen, comments, onToggleThread, onSubmitComment,
}: {
  post: FeedPost;
  viewer: ExperienceViewer;
  creatorById: Map<string, SpaceCreator>;
  peopleById: Map<string, { name: string; avatar: string | null }>;
  directedCreator?: SpaceCreator;
  reflectsOn?: string | null;
  contextSession?: SpaceSession | null;
  contextMaterial?: MaterialRow | null;
  introPrompt?: string | null;
  onLike: () => void;
  threadOpen: boolean;
  comments?: CommentItem[];
  onToggleThread: () => void;
  onSubmitComment: (text: string) => Promise<string | null>;
}) {
  const isCreator = creatorById.has(post.author_id);
  // Ring signals role type, not seniority: every host/co-host is orange, every
  // participant is cyan.
  const ring = isCreator ? ORANGE : CYAN;
  const answerCreator = post.coachAnswer ? creatorById.get(post.coachAnswer.authorId) : undefined;
  // The coach answer is shown inline above — don't repeat it in the thread.
  const visibleComments = comments?.filter((c) => !c.isCoachAnswer);

  // Who-liked: lazily fetched (fresh each open) when the like count is tapped.
  const [likersOpen, setLikersOpen] = useState(false);
  const [likers, setLikers] = useState<{ id: string; name: string; avatar: string | null }[] | undefined>(undefined);
  async function toggleLikers() {
    if (likersOpen) { setLikersOpen(false); return; }
    setLikersOpen(true);
    setLikers(undefined);
    const supabase = createClient();
    const { data } = await supabase
      .from("app_challenge_post_like")
      .select("user_id")
      .eq("post_id", post.id);
    const ids = (data as { user_id: string }[] | null) ?? [];
    setLikers(ids.map(({ user_id }) => ({ id: user_id, ...(peopleById.get(user_id) ?? { name: "Member", avatar: null }) })));
  }

  return (
    <article className="rounded-xl p-4" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.04), 0 1px 4px rgba(15,34,41,0.04)" }}>
      <div className="flex gap-3">
        {/* Identity is the profile-layer trigger: tap the photo to meet the
            person (P5 lean popover; stats/rankings deferred to Round 2). */}
        <ProfileTrigger profileId={post.author_id}>
          <Avatar src={post.authorAvatar} name={post.authorName} size={48} ring={ring} />
        </ProfileTrigger>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black font-headline" style={{ color: INK }}>{post.authorName}</span>
            {isCreator && <span className="text-[9px] uppercase tracking-wider font-headline px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: ring, fontWeight: 800 }}>Expert</span>}
            <span className="text-[11px] ml-auto shrink-0" style={{ color: "#94a3b8" }} suppressHydrationWarning>{fmtDate(post.created_at)}</span>
          </div>

          {post.kind === "question" && directedCreator && (
            <ContextBanner color={CYAN} label="Question for">
              <span className="text-[14px] font-black font-headline" style={{ color: CYAN }}>{directedCreator.name}</span>
            </ContextBanner>
          )}
          {post.kind === "reflection" && reflectsOn && (
            <ContextBanner color={CYAN} label="Reflection on"><span className="text-[14px] font-black font-headline" style={{ color: CYAN }}>{reflectsOn}</span></ContextBanner>
          )}
          {post.kind === "intro" && (
            <ContextBanner color={CYAN} label="Introduction" stacked>
              {introPrompt && <p className="text-[13px] italic leading-snug" style={{ color: "#475569" }}>“{introPrompt}”</p>}
            </ContextBanner>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap mt-3" style={{ color: "#334155" }}>{post.body}</p>

          {/* Referenced session — renders below the words, like an image embed */}
          {post.kind === "talk" && contextSession && (
            <SessionContextCard session={contextSession} />
          )}
          {/* Referenced material — same embed slot; the chip references,
              never re-hosts: release rules keep governing the download. */}
          {post.kind === "talk" && contextMaterial && (
            <MaterialContextCard material={contextMaterial} />
          )}

          {post.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.mediaUrl} alt="" loading="lazy" decoding="async" className="rounded-xl mt-3 w-full max-w-md aspect-[4/5] object-cover" style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }} />
          )}

          {/* Coach answer — prominent, under the question */}
          {post.coachAnswer && (
            <div className="rounded-lg mt-3 p-3" style={{ backgroundColor: "rgba(255,97,48,0.08)", boxShadow: `inset 3.5px 0 0 ${ORANGE}` }}>
              <div className="flex items-center gap-2">
                <Avatar src={answerCreator?.avatar ?? null} name={answerCreator?.name ?? "Expert"} size={30} ring={ORANGE} />
                <span className="text-[11px] uppercase tracking-[0.12em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>Answered by {answerCreator?.name ?? "your Expert"}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1.5" style={{ color: "#334155" }}>{post.coachAnswer.body}</p>
            </div>
          )}

          {/* Engagement bar */}
          <div className="flex items-center gap-5 mt-3 pt-3" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={onLike} aria-label={post.likedByMe ? "Unlike" : "Like"} className="flex items-center transition-transform active:scale-95">
                <svg width="17" height="17" viewBox="0 0 24 24" fill={post.likedByMe ? ORANGE : "none"} stroke={post.likedByMe ? ORANGE : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              {post.likeCount > 0 ? (
                <button type="button" onClick={toggleLikers} className="text-[12px] font-bold font-headline transition-colors hover:opacity-80" style={{ color: post.likedByMe ? ORANGE : "#64748b" }}>
                  {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                </button>
              ) : (
                <button type="button" onClick={onLike} className="text-[12px] font-bold font-headline" style={{ color: "#64748b" }}>Like</button>
              )}
            </div>
            <button type="button" onClick={onToggleThread} className="flex items-center gap-1.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={threadOpen ? CYAN : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="text-[12px] font-bold font-headline" style={{ color: threadOpen ? CYAN : "#64748b" }}>{post.commentCount > 0 ? post.commentCount : "Comment"}</span>
            </button>
          </div>

          {/* Likers — a structured "Liked by" panel anchored to the likes */}
          {likersOpen && (
            <div className="mt-2.5 rounded-xl px-3.5 py-3" style={{ backgroundColor: "#FAF7F1" }}>
              <p className="text-[10px] uppercase tracking-[0.14em] font-headline mb-2" style={{ color: "#94a3b8", fontWeight: 800 }}>Liked by</p>
              {likers === undefined ? (
                <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>Loading…</span>
              ) : likers.length === 0 ? (
                <span className="text-[11px] font-bold font-headline" style={{ color: "#94a3b8" }}>No likes yet.</span>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  {likers.map((l) => (
                    <div key={l.id} className="flex items-center gap-1.5">
                      <Avatar src={l.avatar} name={l.name} size={20} ring="#FFFFFF" bg={CYAN} />
                      <span className="text-[12px] font-bold font-headline" style={{ color: "#475569" }}>{l.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comment thread */}
          {threadOpen && (
            <div className="mt-3 space-y-3">
              {comments === undefined ? (
                <p className="text-[11px]" style={{ color: "#94a3b8" }}>Loading…</p>
              ) : !visibleComments || visibleComments.length === 0 ? (
                <p className="text-[11px]" style={{ color: "#94a3b8" }}>No comments yet — be the first.</p>
              ) : (
                visibleComments.map((c) => {
                  const cCreator = creatorById.get(c.author_id);
                  const cRing = cCreator ? ORANGE : CYAN;
                  return (
                    <div key={c.id} className="flex gap-2.5">
                      <ProfileTrigger profileId={c.author_id}>
                        <Avatar src={c.authorAvatar} name={c.authorName} size={34} ring={cRing} />
                      </ProfileTrigger>
                      <div className="flex-1 min-w-0 rounded-xl px-3 py-2" style={{ backgroundColor: c.isCoachAnswer ? "rgba(8,145,178,0.07)" : "#FAF7F1" }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-black font-headline" style={{ color: INK }}>{c.authorName}</span>
                          {cCreator && <span className="text-[8px] uppercase tracking-wider font-headline px-1 py-0.5 rounded-full text-white" style={{ backgroundColor: cRing, fontWeight: 800 }}>Expert</span>}
                          {c.isCoachAnswer && <span className="text-[8px] uppercase tracking-wider font-headline px-1 py-0.5 rounded-full" style={{ backgroundColor: "rgba(8,145,178,0.14)", color: CYAN, fontWeight: 800 }}>Answer</span>}
                          <span className="text-[10px] ml-auto" style={{ color: "#94a3b8" }} suppressHydrationWarning>{fmtDate(c.created_at)}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap mt-0.5" style={{ color: "#334155" }}>{c.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <CommentComposer viewer={viewer} onSubmit={onSubmitComment} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CommentComposer({ viewer, onSubmit }: { viewer: ExperienceViewer; onSubmit: (text: string) => Promise<string | null> }) {
  const viewerIsCreator = useExperienceSpaceStore((s) => s.isCreator);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function send() {
    if (!text.trim() || sending) return;
    setSending(true); setErr(null);
    const e = await onSubmit(text.trim());
    if (e) { setErr(e); setSending(false); return; }
    setText(""); setSending(false);
  }
  return (
    <div className="flex gap-2.5 items-start">
      <Avatar src={viewer.avatar} name={viewer.name} size={34} ring={viewerIsCreator ? ORANGE : CYAN} />
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-end">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" rows={1} maxLength={2000}
            className="flex-1 rounded-xl px-3 py-2 text-[13px] resize-none focus:outline-none"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(15,34,41,0.10)", color: INK }} />
          <button type="button" onClick={send} disabled={!text.trim() || sending} className="px-3.5 py-2 rounded-full text-white text-[12px] font-black font-headline disabled:opacity-40 shrink-0" style={{ backgroundColor: CYAN }}>
            {sending ? "…" : "Send"}
          </button>
        </div>
        {err && <p className="text-[11px] mt-1" style={{ color: ORANGE }}>{err}</p>}
      </div>
    </div>
  );
}

function ContextBanner({ color, label, stacked, children }: { color: string; label: string; stacked?: boolean; children?: ReactNode }) {
  const labelEl = <span className="text-[11px] uppercase tracking-[0.12em] font-headline" style={{ color, fontWeight: 800 }}>{label}</span>;
  return (
    <div className="rounded-lg mt-2.5 px-3 py-2" style={{ backgroundColor: `${color}14`, boxShadow: `inset 3.5px 0 0 ${color}` }}>
      {stacked ? (<>{labelEl}<div className="mt-1">{children}</div></>) : (<div className="flex items-center gap-2 flex-wrap">{labelEl}{children}</div>)}
    </div>
  );
}

// A removable context pill in the creator composer — the selected session,
// shown even when the picker is collapsed.
function ContextChip({ color, onRemove, children }: { color: string; onRemove: () => void; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1" style={{ backgroundColor: `${color}14`, boxShadow: `inset 0 0 0 1.5px ${color}` }}>
      <span className="text-[12px] font-black font-headline" style={{ color }}>{children}</span>
      <button type="button" onClick={onRemove} aria-label="Remove context" className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
      </button>
    </span>
  );
}

// The referenced-session embed inside a creator's Share — mirrors the
// WeekJourney agenda row (cover · when · title · host). Clicking it opens the
// read-only session detail popup (the same modal the buyer carousel uses), so
// it never navigates out to the standalone session pages. Fed from the store.
function SessionContextCard({ session }: { session: SpaceSession }) {
  const [open, setOpen] = useState(false);
  const start = new Date(session.startTime);
  const day = start.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const m = session.durationMinutes;
  const dur = m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.floor(m / 60)}h`;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full max-w-md text-left flex items-stretch rounded-xl overflow-hidden mt-3"
        style={{ backgroundColor: "#FAF7F1", boxShadow: `inset 3.5px 0 0 ${CYAN}, 0 0 0 1px rgba(15,34,41,0.05)` }}
      >
        <div className="relative shrink-0 w-20 sm:w-24" style={{ backgroundColor: "#ECE7DD" }}>
          {session.imageUrl ? (
            <Image src={session.imageUrl} alt="" fill sizes="96px" loading="lazy" decoding="async" className="object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(156,240,255,0.3), rgba(255,97,48,0.12))" }} />
          )}
        </div>
        <div className="flex-1 min-w-0 py-2.5 px-3.5 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Session</p>
          <h4 className="font-black font-headline tracking-tight mt-0.5 truncate" style={{ color: INK, fontSize: "clamp(0.95rem, 3vw, 1.05rem)" }}>{session.title}</h4>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: "#94a3b8" }} suppressHydrationWarning>{day} · {time} · {dur} · {sessionTeamLabel(session)}</p>
        </div>
        <div className="shrink-0 self-center pr-3 pl-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </button>
      <SessionDetailModal
        open={open}
        onClose={() => setOpen(false)}
        session={{
          id: session.id, title: session.title, startTime: session.startTime,
          durationMinutes: session.durationMinutes, hostId: session.hostId,
          hostName: session.hostName, hostAvatar: session.hostAvatar,
          imageUrl: session.imageUrl, description: session.description, cohosts: session.cohosts,
        }}
      />
    </>
  );
}
