// supabase/functions/precreate_rooms/index.ts
// Self-contained precreate function: Daily adapter inline.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET  = Deno.env.get("CRON_SECRET")!;
const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY")!; // make sure this is set!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const DAILY_API = "https://api.daily.co/v1/rooms";

async function createRoom(opts: { nameHint: string; expiresInSeconds: number; ejectAtRoomExp: boolean }) {
  const res = await fetch(DAILY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: opts.nameHint,
      properties: {
        eject_at_room_exp: opts.ejectAtRoomExp,
        exp: Math.floor(Date.now() / 1000) + opts.expiresInSeconds,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily API error: ${await res.text()}`);
  return await res.json();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  try {
    const hdr = req.headers.get("x-cron-secret");
    if (!hdr || hdr !== CRON_SECRET) return json({ error: "forbidden" }, 403);

    const now = new Date();
    const in15 = new Date(Date.now() + 15 * 60 * 1000);

    const { data: sessions, error: selErr } = await admin
      .from("app_session")
      .select("id, title, start_time, live_provider, live_room_id, host_id, status")
      .eq("status", "published")
      .is("live_room_id", null)
      .not("start_time", "is", null)
      .gte("start_time", now.toISOString())
      .lte("start_time", in15.toISOString());

    if (selErr) return json({ ok: false, step: "select", detail: selErr.message }, 500);
    if (!sessions?.length) return json({ ok: true, count: 0, results: [] });

    const results: Array<{ id: string; created?: string; error?: string }> = [];

    for (const s of sessions) {
      try {
        const room = await createRoom({
          nameHint: `sess_${s.id}`,
          expiresInSeconds: 3 * 60 * 60,
          ejectAtRoomExp: true,
        });

        const roomName = room.name || room.id;
        const { error: updErr } = await admin
          .from("app_session")
          .update({ live_provider: "daily", live_room_id: roomName })
          .eq("id", s.id)
          .is("live_room_id", null);

        if (updErr) throw updErr;
        results.push({ id: s.id, created: roomName });
      } catch (e) {
        results.push({ id: s.id, error: String(e) });
      }
    }

    return json({ ok: true, count: results.length, results });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});