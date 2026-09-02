// Edge Function: upload_image
//
// Generic image upload to the profile-images bucket, run with the SERVICE ROLE
// so it bypasses storage RLS. Identifies the caller from their JWT via getUser
// (the auth server accepts the token), then uploads to the caller's OWN folder.
//
// Why everything routes through here: direct user-JWT storage uploads are
// currently rejected by storage as `anon` (a Supabase storage-side auth
// regression — the same token authenticates fine for GoTrue + the database;
// tracked via a support ticket). Service-role uploads don't depend on storage
// validating a user token, so they're immune. Pure upload: returns the public
// URL; the caller persists it (profile / post / challenge) via its own
// DB-authenticated path.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;
const KINDS = new Set(["avatar", "cover", "post", "content"]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);
    const { data: { user }, error: uErr } = await admin.auth.getUser(jwt);
    if (uErr || !user) return json({ error: "Unauthorized" }, 401);

    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "content");
    if (!(file instanceof File) || file.size === 0) return json({ error: "No file provided" }, 400);
    if (file.size > MAX_BYTES) return json({ error: "Image must be under 5MB" }, 400);
    if (!KINDS.has(kind)) return json({ error: "Invalid kind" }, 400);
    if (file.type && !ALLOWED.has(file.type)) {
      return json({ error: `Unsupported image type${file.type ? ` (${file.type})` : ""}. Use JPG, PNG, WebP or GIF.` }, 400);
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    // avatar/cover are one-per-user (fixed name, upsert); post/content are
    // append-only (timestamped, unique) — matching the existing path scheme.
    const fixed = kind === "avatar" || kind === "cover";
    const fileName = fixed ? `${kind}.${ext}` : `${kind}-${Date.now()}.${ext}`;
    const path = `${user.id}/${fileName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from("profile-images")
      .upload(path, bytes, { upsert: fixed, contentType: file.type || "application/octet-stream" });
    if (upErr) return json({ error: `Upload failed: ${upErr.message}` }, 400);

    const base = `${SUPABASE_URL}/storage/v1/object/public/profile-images/${path}`;
    // cache-bust the upsert (same-path) kinds so the browser shows the new image
    const url = fixed ? `${base}?v=${Date.now()}` : base;
    return json({ url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
