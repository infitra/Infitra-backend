// supabase/functions/precreate_rooms/index.ts
// PRIMARY room provisioning: creates the Daily room for every published
// session entering the 15-minute pre-start window. Invoked every minute by
// the pg_cron job `precreate-rooms` (secret from Vault) — the external cron
// service this function was originally built for (pre-dating Supabase cron)
// is retired.
//
// The 15-minute lead also gates the product: the experience space shows the
// "Live now" card only once live_room_id is provisioned, so rooms appearing
// 15 minutes early is by design, not an implementation detail.
//
// FALLBACK: issue_join_token lazily creates the room for an entitled caller
// if this cron misses (down, late, or a session created inside the window).
// Both paths share the live_provider adapter, so room properties can never
// drift again — the previous inline Daily copy here created rooms WITHOUT
// privacy:"private", i.e. publicly joinable by anyone who saw the URL.
//
// Auth: x-cron-secret shared secret (CRON_SECRET env; same value in Vault
// for the cron job). Not a user endpoint.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom, sessionRoomExp } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  try {
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || !CRON_SECRET || hdr !== CRON_SECRET) return json({ error: "forbidden" }, 403);

    const now = new Date();
    const in15 = new Date(Date.now() + 15 * 60 * 1000);

    const { data: sessions, error: selErr } = await admin
      .from("app_session")
      .select("id, title, start_time, duration_minutes, live_room_id")
      .eq("status", "published")
      .is("live_room_id", null)
      .not("start_time", "is", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", in15.toISOString());

    if (selErr) return json({ ok: false, step: "select", detail: selErr.message }, 500);
    if (!sessions?.length) return json({ ok: true, count: 0, results: [] });

    const activeProvider = provider();
    const results: Array<{ id: string; created?: string; error?: string }> = [];

    for (const s of sessions) {
      try {
        const { roomId } = await createRoom(s.title ?? "Live Session", {
          expUnix: sessionRoomExp(s.start_time, s.duration_minutes),
        });

        // Race guard: persist only if still unset (the lazy fallback in
        // issue_join_token may have won). The loser's room simply expires.
        const { error: updErr } = await admin
          .from("app_session")
          .update({ live_provider: activeProvider, live_room_id: roomId })
          .eq("id", s.id)
          .is("live_room_id", null);

        if (updErr) throw updErr;
        results.push({ id: s.id, created: roomId });
      } catch (e) {
        // Per-session containment: one Daily failure must not block the
        // other sessions in the window. The next tick retries.
        results.push({ id: s.id, error: String(e) });
      }
    }

    return json({ ok: true, count: results.length, results });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
