// Supabase Edge Function: create_live_room (using live_provider adapter)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provider, createRoom } from "../live_provider/index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const body = await req.json();
    const { session_id, title = "Live Session" } = body ?? {};
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), { status: 400 });
    }

    // 3) Load session
    const { data: s, error: sErr } = await admin
      .from("app_session")
      .select("id, host_id, live_provider, live_room_id")
      .eq("id", session_id)
      .single();
    if (sErr || !s) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }

    // 4) Authorization: only host can create the room
    if (s.host_id !== callerId) {
      return new Response(JSON.stringify({ error: "Forbidden: not host" }), { status: 403 });
    }

    const activeProvider = provider();

    // 5) Reuse existing room if already created for the same provider
    if (s.live_room_id && s.live_provider === activeProvider) {
      return new Response(
        JSON.stringify({
          live_provider: s.live_provider,
          live_room_id: s.live_room_id,
          reused: true,
        }),
        { status: 200 },
      );
    }

    // 6) Create room via adapter
    const { roomId } = await createRoom(title);

    // 7) Persist on session
    const { error: upErr } = await admin
      .from("app_session")
      .update({ live_provider: activeProvider, live_room_id: roomId })
      .eq("id", session_id);
    if (upErr) {
      return new Response(JSON.stringify({ error: "DB update failed", detail: upErr.message }), { status: 500 });
    }

    // 8) Done
    return new Response(
      JSON.stringify({
        live_provider: activeProvider,
        live_room_id: roomId,
        reused: false,
      }),
      { status: 200 },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unhandled exception", detail: String(e) }), { status: 500 });
  }
});