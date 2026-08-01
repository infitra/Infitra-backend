"use client";

/**
 * ProfilePopover — the space's lean profile layer (Phase A / P5).
 *
 * Wraps any identity element (avatar + name in the feed); a click opens a
 * small card with the person behind the post: photo, name, role, bio, and
 * for experts their rating + tribe size. Read-only, existing data only,
 * fetched on demand from app_profile_public — the ACCESS-FILTERED view
 * (CLAUDE.md rule 11; never app_profile_stats directly). Participant
 * progress stats / rankings are deliberately NOT here: deferred to Round 2
 * as a designed feature with a privacy toggle (locked founder decision).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";

const INK = "#0F2229";
const ORANGE = "#FF6130";
const CYAN = "#0891b2";

interface PublicProfile {
  profile_id: string;
  display_name: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  avg_rating: number | null;
  total_reviews: number | null;
  creator_tribe_members_count: number | null;
}

export function ProfilePopover({
  profileId,
  children,
}: {
  profileId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("app_profile_public")
      .select(
        "profile_id, display_name, role, bio, avatar_url, avg_rating, total_reviews, creator_tribe_members_count",
      )
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error || !data) setFailed(true);
    else setProfile(data as PublicProfile);
  }, [profileId]);

  useEffect(() => {
    if (!open) return;
    if (!profile && !failed) load();

    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, profile, failed, load]);

  const isExpert = profile?.role === "creator";

  return (
    // self-start: as a flex child of the post row this wrapper would STRETCH
    // to the card's full height and the button's centering floated the photo
    // to mid-height — the founder's "picture is always in the middle" bug.
    // Identity pins top-left, next to the name, like every feed ever.
    <div ref={rootRef} className="relative inline-flex self-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-start gap-2 text-left cursor-pointer"
        aria-expanded={open}
        aria-label="View profile"
      >
        {children}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-30 w-64 rounded-2xl p-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.98)",
            border: "1px solid rgba(15,34,41,0.10)",
            boxShadow: "0 12px 32px rgba(15,34,41,0.14), 0 2px 8px rgba(15,34,41,0.08)",
          }}
        >
          {failed ? (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              This profile is private.
            </p>
          ) : !profile ? (
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Loading…
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name ?? "?"}
                  size={48}
                  ring={isExpert ? ORANGE : CYAN}
                />
                <div className="min-w-0">
                  <p className="text-sm font-black font-headline truncate" style={{ color: INK }}>
                    {profile.display_name ?? "Member"}
                  </p>
                  <span
                    className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-black font-headline uppercase tracking-[0.14em]"
                    style={
                      isExpert
                        ? { color: "#c2410c", backgroundColor: "rgba(255,97,48,0.10)" }
                        : { color: CYAN, backgroundColor: "rgba(8,145,178,0.08)" }
                    }
                  >
                    {isExpert ? "Expert" : "Tribe member"}
                  </span>
                </div>
              </div>

              {profile.bio && (
                <p
                  className="text-xs leading-relaxed mt-3 line-clamp-4"
                  style={{ color: "#475569" }}
                >
                  {profile.bio}
                </p>
              )}

              {isExpert &&
                ((profile.total_reviews ?? 0) > 0 ||
                  (profile.creator_tribe_members_count ?? 0) > 0) && (
                  <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(15,34,41,0.07)" }}>
                    {(profile.total_reviews ?? 0) > 0 && (
                      <span className="text-[11px] font-bold font-headline" style={{ color: INK }}>
                        ★ {Number(profile.avg_rating).toFixed(1)}
                        <span style={{ color: "#94a3b8" }}> ({profile.total_reviews})</span>
                      </span>
                    )}
                    {(profile.creator_tribe_members_count ?? 0) > 0 && (
                      <span className="text-[11px] font-bold font-headline" style={{ color: "#64748b" }}>
                        {profile.creator_tribe_members_count} in their tribe
                      </span>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
