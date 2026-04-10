"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * FollowButton — toggles follow/unfollow on a creator.
 *
 * Uses the follow_user / unfollow_user Edge Functions.
 * Checks current follow status on mount via app_follow table.
 */
export function FollowButton({ creatorId }: { creatorId: string }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkFollow() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      // Don't show follow button for own profile
      if (user.id === creatorId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("app_follow")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("followee_id", creatorId)
        .maybeSingle();

      if (!cancelled) {
        setFollowing(!!data);
        setLoading(false);
      }
    }

    checkFollow();
    return () => {
      cancelled = true;
    };
  }, [creatorId]);

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);

    const supabase = createClient();
    const fnName = following ? "unfollow_user" : "follow_user";

    const { error } = await supabase.functions.invoke(fnName, {
      body: { target_user_id: creatorId },
    });

    if (!error) {
      setFollowing(!following);
    }
    setToggling(false);
  }

  // Don't render while checking or if it's own profile
  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className="px-4 py-2 rounded-full text-xs font-bold font-headline disabled:opacity-50"
      style={
        following
          ? {
              color: "#475569",
              border: "1px solid rgba(0, 0, 0, 0.10)",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }
          : {
              color: "#FFFFFF",
              backgroundColor: "#FF6130",
              boxShadow:
                "0 2px 8px rgba(255, 97, 48, 0.30)",
            }
      }
    >
      {toggling ? "..." : following ? "Following" : "Follow"}
    </button>
  );
}
