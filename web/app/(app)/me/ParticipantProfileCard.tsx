"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFirstMoves } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";
const MUTED = "#64748b";

/**
 * Participant profile card on /me — lets a participant set or change their
 * tribe identity (photo + display name) at any time, not only on the one-time
 * post-purchase card. Closes the gap where a participant who skipped (or whose
 * upload failed on) the "first moves" card had no way back to it.
 *
 * The avatar uploads CLIENT-SIDE (the browser client carries the session, so
 * storage RLS sees `authenticated` and the path is the user's own folder —
 * matching profile_images_user_insert). saveFirstMoves then persists the name
 * + avatar_url. A `?v=` cache-buster on the stored URL makes a re-uploaded
 * photo (same path, upsert) refresh in the browser.
 */
export function ParticipantProfileCard({
  initialDisplayName,
  initialAvatarUrl,
}: {
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = (displayName.trim()[0] || "?").toUpperCase();

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB.");
      return;
    }
    setError(null);
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function cancel() {
    setEditing(false);
    setError(null);
    setAvatarFile(null);
    setPreview(avatarUrl);
    setDisplayName(initialDisplayName);
  }

  async function save() {
    const name = displayName.trim();
    if (name.length < 2 || name.length > 50) {
      setError("Display name must be 2–50 characters.");
      return;
    }
    setBusy(true);
    setError(null);

    let nextAvatarUrl = avatarUrl;
    if (avatarFile) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Your session expired — please sign in again."); setBusy(false); return; }
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-images")
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (upErr) { setError(`Photo upload failed: ${upErr.message}`); setBusy(false); return; }
      const base = supabase.storage.from("profile-images").getPublicUrl(path).data.publicUrl;
      nextAvatarUrl = `${base}?v=${Date.now()}`;
    }

    const fd = new FormData();
    fd.append("display_name", name);
    if (nextAvatarUrl) fd.append("avatar_url", nextAvatarUrl);
    const res = await saveFirstMoves(fd);
    if (res && "error" in res && res.error) { setError(res.error); setBusy(false); return; }

    setAvatarUrl(nextAvatarUrl);
    setPreview(nextAvatarUrl);
    setAvatarFile(null);
    setEditing(false);
    setBusy(false);
    router.refresh();
  }

  return (
    <div
      className="rounded-3xl p-5 sm:p-6 mb-8 flex items-center gap-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 4px 14px rgba(15,34,41,0.04)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: preview ? "transparent" : CYAN,
          border: "2px solid rgba(255,255,255,0.9)",
          boxShadow: "0 2px 8px rgba(15,34,41,0.12)",
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-black font-headline text-white">{initial}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!editing ? (
          <>
            <p className="text-[11px] font-bold font-headline uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              Your tribe profile
            </p>
            <p className="text-lg font-black font-headline truncate" style={{ color: INK }}>
              {displayName || "Add your name"}
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-1 text-xs font-bold font-headline transition-colors"
              style={{ color: ORANGE }}
            >
              {avatarUrl ? "Edit photo & name" : "Add a photo"}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 rounded-full text-xs font-bold font-headline"
                style={{ border: `1px solid ${INK}22`, color: INK, backgroundColor: "rgba(255,255,255,0.6)" }}
              >
                {preview ? "Change photo" : "Add a photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
            </div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              placeholder="Display name"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
              style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
            />
            {error && <p className="text-xs mb-2" style={{ color: "#b91c1c" }}>{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="px-4 py-2 rounded-full text-white text-xs font-black font-headline disabled:opacity-60"
                style={{ backgroundColor: ORANGE }}
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={busy}
                className="px-3 py-2 text-xs font-bold font-headline disabled:opacity-60"
                style={{ color: MUTED }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
        {!editing && error && <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>{error}</p>}
      </div>
    </div>
  );
}
