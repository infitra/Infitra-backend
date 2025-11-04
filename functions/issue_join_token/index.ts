// Supabase Edge Function: issue_join_token (using live_provider adapter)
// - Auth required
// - Entitlement: host OR session cohost OR attendee
// - Issues provider token, marks started_at on first join, upserts attendance & stream token
// - Returns a ready-to-open room_url using DAILY_DOMAIN (fallback: infitra.daily.co)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, issueToken } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Add: optional domain, default to your Daily subdomain
const DAILY_DOMAIN = Deno.env.get("DAILY_DOMAIN") ?? "infitra.daily.co";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    // 1) Auth
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const authed = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: u, error: uErr } = await authed.auth.getUser();
    if (uErr || !u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const callerId = u.user.id;

    // 2) Input
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), { status: 400 });
    }

    // 3) Load session
    const { data: s, error: sErr } = await admin
      .from("app_session")
      .select("id, title, host_id, live_provider, live_room_id, started_at")
      .eq("id", session_id)
      .single();
    if (sErr || !s) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }

    const activeProvider = provider();

    if (s.live_provider !== activeProvider || !s.live_room_id) {
      return new Response(JSON.stringify({ error: "Live room not initialized" }), { status: 400 });
    }

    // 4) Entitlement
    let entitled = s.host_id === callerId;

    if (!entitled) {
      const { data: ch } = await admin
        .from("app_session_cohost")
        .select("session_id")
        .eq("session_id", session_id)
        .eq("cohost_id", callerId)
        .maybeSingle();
      entitled = !!ch;
    }

    if (!entitled) {
      const { data: att } = await admin
        .from("app_attendance")
        .select("session_id")
        .eq("session_id", session_id)
        .eq("user_id", callerId)
        .maybeSingle();
      entitled = !!att;
    }

    if (!entitled) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // 5) Issue provider token
    const userName = u.user.email ?? "User";
    const { token } = await issueToken(s.live_room_id, userName);

    // 6) Mark started_at (first-join) and attendance idempotently
    await admin
      .from("app_session")
      .update({ started_at: new Date().toISOString() })
      .eq("id", session_id)
      .is("started_at", null);

    await admin
      .from("app_attendance")
      .upsert(
        { session_id, user_id: callerId, joined_at: new Date().toISOString() },
        { onConflict: "session_id,user_id" },
      );

    // 7) Save token
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error: tokErr } = await admin
      .from("app_stream_token")
      .upsert(
        { session_id, user_id: callerId, token, expires_at: expires },
        { onConflict: "session_id,user_id" },
      );
    if (tokErr) {
      return new Response(JSON.stringify({ error: "Failed to save token", detail: tokErr.message }), { status: 500 });
    }

    // 8) Return token + ready-to-open URL
    const room_url = `https://${DAILY_DOMAIN}/${s.live_room_id}?t=${encodeURIComponent(token)}`;
    return new Response(JSON.stringify({ token, expires_at: expires, room_url }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unhandled exception", detail: String(e) }), { status: 500 });
  }
});