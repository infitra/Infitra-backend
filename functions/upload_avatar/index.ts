// Edge Function: upload_avatar
//
// Uploads a profile avatar to the profile-images bucket and records it on
// app_profile — running with the SERVICE ROLE so it bypasses storage RLS.
//
// Why this exists: the app's user-JWT storage uploads (ssr server client,
// browser client, and a raw fetch forwarding the access token) all reached
// storage as `anon` and were rejected by the authenticated-only INSERT policy,
// even though the SAME token authenticates fine for DB and the policy itself is
// correct (verified by a rolled-back probe). Rather than depend on that broken
// session→storage auth, we identify the caller from their JWT via getUser
// (the auth server DOES accept the token) and then upload as the service role.
// The path is locked to the caller's own folder, so privilege isn't widened.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    // 1) Identify the caller from their JWT (validated by the auth server).
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);
    const { data: { user }, error: uErr } = await admin.auth.getUser(jwt);
    if (uErr || !user) return json({ error: "Unauthorized" }, 401);

    // 2) Read + validate the file.
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return json({ error: "No file provided" }, 400);
    if (file.size > MAX_BYTES) return json({ error: "Photo must be under 5MB" }, 400);
    if (file.type && !ALLOWED.has(file.type)) {
      return json({ error: `Unsupported image type${file.type ? ` (${file.type})` : ""}. Use JPG, PNG, WebP or GIF.` }, 400);
    }

    // 3) Upload as the service role (bypasses RLS) to the caller's own folder.
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("profile-images")
      .upload(path, bytes, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (upErr) return json({ error: `Upload failed: ${upErr.message}` }, 400);

    // 4) Record on the profile (cache-busted so a re-upload refreshes).
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/profile-images/${path}?v=${Date.now()}`;
    const { error: dbErr } = await admin
      .from("app_profile")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (dbErr) return json({ error: `Save failed: ${dbErr.message}` }, 500);

    return json({ avatar_url: publicUrl });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
