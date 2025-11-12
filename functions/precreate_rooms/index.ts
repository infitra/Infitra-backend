// supabase/functions/precreate_rooms/index.ts
// Schedules pre-creation of Daily rooms ~15 minutes before start_time.
// Idempotent: skips sessions that already have a room.
// Auth: service-only (cron), so we verify a shared secret header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom } from "../live_provider/index.ts";

const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET   = Deno.env.get("CRON_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  try {
    // shared-secret check
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || hdr !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
    }

    // pull sessions starting within 15 min and missing a room
    const nowIso = new Date().toISOString();
    const soonIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: sessions, error } = await admin
      .from("app_session")
      .select("id, title, status, start_time, live_provider, live_room_id, host_id")
      .eq("status", "published")
      .is("live_room_id", null)
      .not("start_time", "is", null)
      .gte("start_time", nowIso)
      .lte("start_time", soonIso);

    if (error) {
      return new Response(JSON.stringify({ ok: false, step: "select", detail: error.message }), { status: 500 });
    }

    const active = provider();
    const results: Array<{ id: string; created?: string; skipped?: boolean; error?: string }> = [];

    for (const s of sessions ?? []) {
      try {
        const room = await createRoom({
          nameHint: `sess_${s.id}`,
          expiresInSeconds: 3 * 60 * 60,
          ejectAtRoomExp: true,
        });

        await admin
          .from("app_session")
          .update({ live_provider: active, live_room_id: room.name || room.id })
          .eq("id", s.id)
          .is("live_room_id", null); // idempotent

        results.push({ id: s.id, created: room.name || room.id });
      } catch (e) {
        results.push({ id: s.id, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});