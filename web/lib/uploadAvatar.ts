import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a profile avatar via the `upload_avatar` edge function, which runs
 * with the service role and also persists app_profile.avatar_url.
 *
 * Why not upload directly from the client/server: the app's user-JWT storage
 * uploads (browser client, ssr server client, and a raw fetch forwarding the
 * token) were all rejected by storage as `anon` — the session→storage auth is
 * broken for this project, even though the same token works for DB and the
 * storage policy itself is correct. The edge function identifies the caller
 * from their JWT (the auth server accepts it) and uploads as the service role,
 * sidestepping that entirely. Returns the new public URL.
 */
export async function uploadAvatar(file: File): Promise<{ avatar_url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Your session expired — please sign in again." };

  const fd = new FormData();
  fd.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload_avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: fd,
    });
  } catch {
    return { error: "Network error — please try again." };
  }

  const j = await res.json().catch(() => ({} as { avatar_url?: string; error?: string }));
  if (!res.ok) return { error: j.error ?? `Photo upload failed (${res.status})` };
  return { avatar_url: j.avatar_url };
}
