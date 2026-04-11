"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SlideOver } from "@/app/components/SlideOver";
import { createClient } from "@/lib/supabase/client";

interface Tribe {
  id: string;
  title: string;
  challengeTitle: string;
  memberCount: number;
  nextSession: { title: string; startTime: string } | null;
  latestPost: { body: string; authorName: string; createdAt: string } | null;
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function TribesPanel({
  tribeCount,
  totalMembers,
  hasTribes,
}: {
  tribeCount: number;
  totalMembers: number;
  hasTribes: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !hasTribes) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const now = new Date();

      // Fetch tribe spaces
      const { data: spaces } = await supabase
        .from("app_challenge_space")
        .select("id, title, source_challenge_id, owner_id");

      if (cancelled || !spaces) { setLoading(false); return; }

      // Filter to own spaces (RLS should handle this but be safe)
      const mySpaces = spaces;

      // Challenge titles
      const cIds = mySpaces.map((s: any) => s.source_challenge_id).filter(Boolean);
      const challengeTitles: Record<string, string> = {};
      if (cIds.length > 0) {
        const { data: chs } = await supabase.from("app_challenge").select("id, title").in("id", cIds);
        for (const c of chs ?? []) challengeTitles[c.id] = c.title;
      }

      // Member counts
      const memberCounts: Record<string, number> = {};
      if (cIds.length > 0) {
        const { data: members } = await supabase.from("app_challenge_member").select("challenge_id").in("challenge_id", cIds);
        const c2s: Record<string, string> = {};
        for (const s of mySpaces) { if (s.source_challenge_id) c2s[s.source_challenge_id] = s.id; }
        for (const m of members ?? []) {
          const sid = c2s[m.challenge_id];
          if (sid) memberCounts[sid] = (memberCounts[sid] ?? 0) + 1;
        }
      }

      // Next sessions per tribe
      const nextSessions: Record<string, any> = {};
      if (cIds.length > 0) {
        const c2s: Record<string, string> = {};
        for (const s of mySpaces) { if (s.source_challenge_id) c2s[s.source_challenge_id] = s.id; }
        const { data: links } = await supabase
          .from("app_challenge_session")
          .select("challenge_id, app_session(id, title, start_time, status)")
          .in("challenge_id", cIds);
        for (const link of links ?? []) {
          const sess = (link as any).app_session;
          if (!sess || sess.status !== "published" || new Date(sess.start_time) < now) continue;
          const sid = c2s[(link as any).challenge_id];
          if (sid && (!nextSessions[sid] || new Date(sess.start_time) < new Date(nextSessions[sid].start_time))) {
            nextSessions[sid] = sess;
          }
        }
      }

      // Latest posts per tribe
      const latestPosts: Record<string, any> = {};
      for (const s of mySpaces) {
        const { data: posts } = await supabase
          .from("app_challenge_post")
          .select("id, body, created_at, author_id")
          .eq("space_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (posts?.[0]) latestPosts[s.id] = posts[0];
      }

      // Author names
      const authorIds = [...new Set(Object.values(latestPosts).map((p: any) => p.author_id))];
      const authorNames: Record<string, string> = {};
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase.from("app_profile").select("id, display_name").in("id", authorIds);
        for (const p of profiles ?? []) authorNames[p.id] = p.display_name ?? "User";
      }

      if (cancelled) return;

      setTribes(
        mySpaces.map((s: any) => ({
          id: s.id,
          title: s.title,
          challengeTitle: challengeTitles[s.source_challenge_id] ?? "",
          memberCount: memberCounts[s.id] ?? 0,
          nextSession: nextSessions[s.id]
            ? { title: nextSessions[s.id].title, startTime: nextSessions[s.id].start_time }
            : null,
          latestPost: latestPosts[s.id]
            ? {
                body: latestPosts[s.id].body,
                authorName: authorNames[latestPosts[s.id].author_id] ?? "User",
                createdAt: latestPosts[s.id].created_at,
              }
            : null,
        }))
      );
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [open, hasTribes]);

  return (
    <>
      {/* Gateway button */}
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 rounded-full text-white text-sm font-bold font-headline shrink-0"
        style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.4)" }}
      >
        {hasTribes ? "Enter Tribes →" : "Start Your First →"}
      </button>

      {/* SlideOver panel */}
      <SlideOver open={open} onClose={() => setOpen(false)} title="Your Tribes">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#FF6130]/30 border-t-[#FF6130] animate-spin" />
          </div>
        ) : tribes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">No tribes yet</p>
            <p className="text-sm text-[#64748b] max-w-xs mx-auto mb-4">
              Start a challenge, bundle 3+ sessions, publish — your first tribe is born.
            </p>
            <Link
              href="/dashboard/create"
              onClick={() => setOpen(false)}
              className="text-sm font-bold font-headline text-[#FF6130]"
            >
              Create Challenge →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-2">
              <span className="text-2xl font-black font-headline text-[#FF6130]">{tribeCount}</span>
              <span className="text-xs text-[#94a3b8]">tribe{tribeCount !== 1 ? "s" : ""}</span>
              <span className="text-2xl font-black font-headline text-[#0F2229]">{totalMembers}</span>
              <span className="text-xs text-[#94a3b8]">member{totalMembers !== 1 ? "s" : ""}</span>
            </div>

            {/* Tribe cards — dark */}
            {tribes.map((tribe) => (
              <Link
                key={tribe.id}
                href={`/communities/challenge/${tribe.id}`}
                onClick={() => setOpen(false)}
                className="group block rounded-2xl overflow-hidden"
                style={{ backgroundColor: "#0F2229", border: "1px solid rgba(156,240,255,0.08)" }}
              >
                {/* Orange energy bar */}
                <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6130, rgba(255,97,48,0.2))" }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-black font-headline text-white tracking-tight truncate group-hover:text-[#FF6130]">
                        {tribe.title}
                      </h3>
                      {tribe.challengeTitle && (
                        <p className="text-[10px] text-[#9CF0FF]/40 mt-0.5">{tribe.challengeTitle}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold font-headline text-white shrink-0">
                      {tribe.memberCount} <span className="text-[#9CF0FF]/40 text-xs font-normal">mbr</span>
                    </span>
                  </div>

                  {/* Next session */}
                  {tribe.nextSession && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF]" />
                      <span className="text-[10px] font-bold font-headline text-[#9CF0FF]">
                        {formatRelativeTime(tribe.nextSession.startTime)}
                      </span>
                      <span className="text-[10px] text-[#9CF0FF]/40 truncate">· {tribe.nextSession.title}</span>
                    </div>
                  )}

                  {/* Latest post */}
                  {tribe.latestPost ? (
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(156,240,255,0.04)", border: "1px solid rgba(156,240,255,0.08)" }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-white">{tribe.latestPost.authorName}</span>
                        <span className="text-[10px] text-[#9CF0FF]/30">{timeAgo(tribe.latestPost.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-[#9CF0FF]/50 line-clamp-1">{tribe.latestPost.body}</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#9CF0FF]/25">No posts yet</p>
                  )}
                </div>
              </Link>
            ))}

            <Link
              href="/dashboard/create"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-bold font-headline text-[#FF6130] mt-4"
            >
              + Create New Challenge
            </Link>
          </div>
        )}
      </SlideOver>
    </>
  );
}
