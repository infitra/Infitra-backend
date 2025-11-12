// supabase/functions/precreate_rooms/index.ts
// Pre-create Daily rooms ~15 minutes before start_time.
// Idempotent: only fills live_room_id when it's still NULL.
// Auth: service-only (cron) via x-cron-secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  try {
    // Shared-secret check
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || hdr !== CRON_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 });
    }

    const nowIso = new Date().toISOString();
    const windowIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // NOTE: use start_time (not starts_at)
    const { data: sessions, error: selErr } = await admin
      .from("app_session")
      .select("id, title, status, start_time, live_provider, live_room_id, host_id")
      .eq("status", "published")
      .is("live_room_id", null)
      .not("start_time", "is", null)
      .gte("start_time", nowIso)
      .lte("start_time", windowIso);

    if (selErr) {
      return new Response(JSON.stringify({ ok: false, step: "select", detail: selErr.message }), { status: 500 });
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

        // idempotent fill
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

    // light debug info to see the window used
    return new Response(
      JSON.stringify({ ok: true, count: results.length, window: { from: nowIso, to: windowIso }, results }),
      { status: 200 },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});