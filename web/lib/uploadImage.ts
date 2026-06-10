import { createClient } from "@/lib/supabase/client";

export type UploadKind = "avatar" | "cover" | "post" | "content";

/**
 * Uploads an image via the `upload_image` edge function (service role), which
 * bypasses the broken storage→user-JWT auth (direct uploads land as anon and
 * are rejected by RLS). Returns the public URL; the caller persists it
 * (profile, post, challenge) via its own DB-authenticated path.
 */
export async function uploadImage(
  file: File,
  kind: UploadKind,
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { error: "Your session expired — please sign in again." };

  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);

  let res: Response;
  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload_image`, {
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

  const j = await res.json().catch(() => ({} as { url?: string; error?: string }));
  if (!res.ok) return { error: j.error ?? `Upload failed (${res.status})` };
  return { url: j.url };
}
