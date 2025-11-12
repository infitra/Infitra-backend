// supabase/functions/precreate_rooms/index.ts
// Pre-create Daily rooms ~15 minutes before start_time.
// Idempotent: only updates sessions that still have live_room_id = NULL.
// Auth: shared secret via x-cron-secret; we do NOT require Supabase auth here.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!; // set in Edge Function secrets

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    // 1) Shared-secret check
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || hdr !== CRON_SECRET) {
      return json({ error: "forbidden" }, 403);
    }

    const now = new Date();
    const in15 = new Date(Date.now() + 15 * 60 * 1000);

    // 2) Pull sessions starting within 15 min and missing a room
    const { data: sessions, error: selErr } = await admin
      .from("app_session")
      .select("id, title, status, start_time, live_provider, live_room_id, host_id")
      .eq("status", "published")
      .is("live_room_id", null)
      .not("start_time", "is", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", in15.toISOString());

    if (selErr) {
      return json({ ok: false, step: "select", detail: selErr.message }, 500);
    }

    const active = provider();
    const results: Array<{ id: string; created?: string; skipped?: boolean; error?: string }> = [];

    for (const s of sessions ?? []) {
      try {
        // 3) Create Daily room with sane defaults
        const room = await createRoom({
          nameHint: `sess_${s.id}`,
          expiresInSeconds: 3 * 60 * 60, // 3h TTL
          ejectAtRoomExp: true,
        });

        // 4) Idempotent update (only if still NULL)
        const { error: updErr } = await admin
          .from("app_session")
          .update({ live_provider: active, live_room_id: room.name || (room as any).id })
          .eq("id", s.id)
          .is("live_room_id", null);

        if (updErr) throw updErr;

        results.push({ id: s.id, created: room.name || (room as any).id });
      } catch (e) {
        results.push({ id: s.id, error: String(e) });
      }
    }

    return json({ ok: true, count: results.length, results });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});