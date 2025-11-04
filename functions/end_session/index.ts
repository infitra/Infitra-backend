// Supabase Edge Function: end_session
// Ends a session (host-only), sets ended_at, and writes a rich session_ended feed event.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Env
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Clients
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  try {
    // 1) Auth: must include a valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ code: 401, message: "Missing authorization header" }), { status: 401 });
    }
    const jwt = authHeader.replace("Bearer ", "").trim();
    const caller = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: u, error: uErr } = await caller.auth.getUser();
    if (uErr || !u?.user) {
      return new Response(JSON.stringify({ code: 401, message: "Invalid or expired JWT" }), { status: 401 });
    }
    const callerId = u.user.id;

    // 2) Parse input
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ code: 400, message: "Missing session_id" }), { status: 400 });
    }

    // 3) Verify session + ownership
    const { data: s, error: sErr } = await admin
      .from("app_session")
      .select("id, host_id, status")
      .eq("id", session_id)
      .single();
    if (sErr || !s) {
      return new Response(JSON.stringify({ code: 404, message: "Session not found" }), { status: 404 });
    }
    if (s.host_id !== callerId) {
      return new Response(JSON.stringify({ code: 403, message: "Forbidden - Not host" }), { status: 403 });
    }
    if (s.status === "ended") {
      // idempotent behavior
      return new Response(JSON.stringify({ message: "Session already ended" }), { status: 200 });
    }

    // 4) End the session
    const now = new Date().toISOString();
    const { error: upErr } = await admin
      .from("app_session")
      .update({ status: "ended", ended_at: now })
      .eq("id", session_id);
    if (upErr) {
      return new Response(JSON.stringify({ code: 500, message: "Failed to update session", detail: upErr.message }), { status: 500 });
    }

    // 5) Pull overview to enrich metadata (duration, net, attendees, title)
    const { data: ov } = await admin
      .from("app_session_overview")
      .select("title, duration_min, net, attendees")
      .eq("session_id", session_id)
      .single();

    const meta = {
      ended_at: now,
      title: ov?.title ?? null,
      duration_min: ov?.duration_min ?? null,
      net_earned: ov?.net ?? null,
      attendees: ov?.attendees ?? null,
    };

    // 6) Insert feed event (session_ended)
    const { error: feedErr } = await admin.from("app_feed_event").insert({
      type: "session_ended",
      actor_id: callerId,
      session_id,
      metadata: meta,
    });
    if (feedErr) {
      // non-fatal: log and continue
      console.error("Feed insert failed:", feedErr);
    }

    return new Response(
      JSON.stringify({ message: "Session successfully ended", session_id, ended_at: now, metadata: meta }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response(JSON.stringify({ code: 500, message: "Unhandled error", detail: String(e) }), { status: 500 });
  }
});