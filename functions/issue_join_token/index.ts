// supabase/functions/issue_join_token/index.ts
// Supabase Edge Function: issue_join_token (using live_provider adapter)
// - Auth required
// - Entitlement: host OR session cohost OR attendee
// - Rate limited via edge_rate_limit_use (per user & per IP)
// - Issues provider token, marks started_at on first join, upserts attendance & stream token
// - Returns a ready-to-open room_url using DAILY_DOMAIN (fallback: infitra.daily.co)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, issueToken } from "../live_provider/index.ts";

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DAILY_DOMAIN     = Deno.env.get("DAILY_DOMAIN") ?? "infitra.daily.co";

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
      return json({ error: "Unauthorized" }, 401);
    }
    const callerId = u.user.id;

    // 2) Input
    let payload: { session_id?: string };
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const { session_id } = payload;
    if (!session_id) {
      return json({ error: "Missing session_id" }, 400);
    }

    // 3) Rate limiting (per-user & per-IP, 60s window)
    try {
      const ip =
        req.headers.get("x-real-ip") ||
        (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
        "unknown";

      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/edge_rate_limit_use`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_fn: "issue_join_token",
          p_window_seconds: 60,
          p_limit_per_user: 10,
          p_limit_per_ip: 30,
          p_user_id: callerId,
          p_ip: ip,
        }),
      });

      if (!res.ok) {
        // PostgREST returns 400 with error text like 'rate_limited_user' / 'rate_limited_ip'
        const txt = await res.text();
        if (txt.includes("rate_limited")) {
          return json({ error: "Rate limit exceeded" }, 429);
        }
        return json({ error: "Rate limit check failed", detail: txt }, 500);
      }
    } catch (e) {
      // Fail-closed: if limiter can’t be checked, block to stay safe
      return json({ error: "Rate limiter unavailable", detail: String(e) }, 503);
    }

    // 4) Load session
    const { data: s, error: sErr } = await admin
      .from("app_session")
      .select("id, title, host_id, live_provider, live_room_id, started_at")
      .eq("id", session_id)
      .single();
    if (sErr || !s) {
      return json({ error: "Session not found" }, 404);
    }

    const activeProvider = provider();
    if (s.live_provider !== activeProvider || !s.live_room_id) {
      return json({ error: "Live room not initialized" }, 400);
    }

    // 5) Entitlement
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
      return json({ error: "Forbidden" }, 403);
    }

    // 6) Issue provider token
    const userName = u.user.email ?? "User";
    const { token } = await issueToken(s.live_room_id, userName);

    // 7) Mark started_at (first-join) and attendance idempotently
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

    // 8) Save token
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error: tokErr } = await admin
      .from("app_stream_token")
      .upsert(
        { session_id, user_id: callerId, token, expires_at: expires },
        { onConflict: "session_id,user_id" },
      );
    if (tokErr) {
      return json({ error: "Failed to save token", detail: tokErr.message }, 500);
    }

    // 9) Return token + ready-to-open URL
    const room_url = `https://${DAILY_DOMAIN}/${s.live_room_id}?t=${encodeURIComponent(token)}`;
    return json({ token, expires_at: expires, room_url }, 200);
  } catch (e) {
    return json({ error: "Unhandled exception", detail: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}