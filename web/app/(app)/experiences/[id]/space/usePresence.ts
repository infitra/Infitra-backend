"use client";

/**
 * usePresence — Bundle 5c (locker-room v5). Who's in the space right now.
 *
 * A Supabase Realtime Presence channel for the Experience Space: each viewer
 * tracks themselves (keyed by user id, so multiple tabs collapse to one), and
 * the hook returns the de-duplicated set of people currently here. Powers the
 * header's "Active now: N" presence indicator.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PresentUser {
  id: string;
  name: string;
  avatar: string | null;
}

export function usePresence(
  spaceId: string,
  me: { id: string; name: string; avatar: string | null },
): PresentUser[] {
  const [present, setPresent] = useState<PresentUser[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`presence-space-${spaceId}`, {
      config: { presence: { key: me.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresentUser>();
        const users = Object.values(state)
          .map((entries) => entries[0])
          .filter(Boolean)
          .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));
        setPresent(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ id: me.id, name: me.name, avatar: me.avatar });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId, me.id, me.name, me.avatar]);

  return present;
}
