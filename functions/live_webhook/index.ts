// Supabase Edge Function: live_webhook (using live_provider adapter)
// - Validates shared secret header
// - Normalizes provider payload via adapter
// - Logs event to app_stream_event
// - If meeting ended, marks session ended

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseWebhook } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("LIVE_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    // 1) Verify shared secret
    const hdr = req.headers.get("x-live-webhook-secret");
    if (!hdr || hdr !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2) Parse payload + normalize via adapter
    const payload = await req.json().catch(() => ({}));
    const { provider, eventName, roomName, isEnded } = parseWebhook(req, payload);

    // 3) Resolve session_id by live_room_id
    let session_id: string | null = null;
    if (roomName) {
      const { data: s } = await admin
        .from("app_session")
        .select("id")
        .eq("live_room_id", roomName)
        .maybeSingle();
      session_id = s?.id ?? null;
    }

    // 4) Audit log
    await admin.from("app_stream_event").insert({
      session_id,
      provider,
      event_type: eventName || "unknown",
      payload,
    });

    // 5) Mark ended if applicable
    if (session_id && isEnded) {
      await admin
        .from("app_session")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", session_id);
    }

    return new Response(JSON.stringify({ ok: true, handled: isEnded }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});