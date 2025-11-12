// supabase/functions/precreate_rooms/index.ts
// Precreate Daily rooms ~15 minutes before start_time.
// Idempotent: only updates sessions that still have live_room_id IS NULL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    // Require a shared secret so only your scheduler can call this.
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || hdr !== CRON_SECRET) {
      return json({ error: "forbidden" }, 403);
    }

    const now = new Date();
    const in15 = new Date(now.getTime() + 15 * 60 * 1000);

    // NOTE: use start_time (not starts_at)
    const { data: sessions, error } = await admin
      .from("app_session")
      .select("id, title, status, start_time, live_provider, live_room_id, host_id")
      .eq("status", "published")
      .is("live_room_id", null)
      .not("start_time", "is", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", in15.toISOString());

    if (error) {
      return json({ ok: false, step: "select", detail: error.message }, 500);
    }

    const active = provider();
    const results: Array<{ id: string; created?: string; skipped?: boolean; error?: string }> = [];

    for (const s of sessions ?? []) {
      try {
        const room = await createRoom({
          nameHint: `sess_${s.id}`,
          expiresInSeconds: 3 * 60 * 60, // 3h TTL
          ejectAtRoomExp: true,
        });

        await admin
          .from("app_session")
          .update({ live_provider: active, live_room_id: room.name || room.id })
          .eq("id", s.id)
          .is("live_room_id", null); // idempotent guard

        results.push({ id: s.id, created: room.name || room.id });
      } catch (e) {
        results.push({ id: s.id, error: String(e) });
      }
    }

    return json({ ok: true, count: results.length, results }, 200);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});