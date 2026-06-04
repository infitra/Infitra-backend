"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveFirstMoves } from "@/app/actions/profile";
import { submitIntro } from "@/app/actions/intro";

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const INK = "#0F2229";
const MUTED = "#64748b";

/**
 * Post-purchase "first moves" card. Sits below the "You're in!" confirmation.
 * Everything is optional — the escape is labelled "Later", never "Skip".
 *
 *   - Photo / name / privacy → global profile (saveFirstMoves). No entitlement
 *     needed, so these always save.
 *   - Intro answer → a cohort post in THIS Experience (submitIntro). Needs the
 *     membership row; if the webhook hasn't landed it defers silently to the
 *     in-space prompt (same object, second entry point).
 *
 * "Enter your Experience" saves what's filled, then routes into the space
 * (or My Programs while enrollment is still finalizing). "Later" just goes.
 */
export function FirstMovesCard({
  challengeId,
  entitled,
  introPrompt,
  initialDisplayName,
  initialAvatarUrl,
}: {
  challengeId: string;
  entitled: boolean;
  introPrompt: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [introText, setIntroText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = entitled ? `/experiences/${challengeId}/space` : "/me";

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleEnter() {
    setBusy(true);
    setError(null);

    const fd = new FormData();
    if (displayName.trim()) fd.append("display_name", displayName.trim());
    if (avatarFile) fd.append("avatar", avatarFile);
    const res = await saveFirstMoves(fd);
    if (res && "error" in res && res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }

    const intro = introText.trim();
    if (intro) {
      // Fire-and-forget: if not enrolled yet, it defers to the in-space prompt.
      await submitIntro(challengeId, intro);
    }

    router.push(destination);
  }

  const initial = (displayName.trim()[0] || "?").toUpperCase();

  return (
    <div
      className="rounded-3xl p-6 md:p-7"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(15,34,41,0.10)",
        boxShadow: "0 10px 30px rgba(15,34,41,0.06)",
      }}
    >
      <p
        className="text-[11px] font-black font-headline uppercase tracking-[0.15em] mb-5"
        style={{ color: MUTED }}
      >
        Your first moves
      </p>

      {/* Photo */}
      <div className="flex items-center gap-4 mb-6">
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
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-full text-xs font-bold font-headline transition-colors"
            style={{ border: `1px solid ${INK}22`, color: INK, backgroundColor: "rgba(255,255,255,0.6)" }}
          >
            {preview ? "Change photo" : "Add a photo"}
          </button>
          <p className="text-[11px] mt-1.5" style={{ color: MUTED }}>
            So your tribe recognizes you.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />
        </div>
      </div>

      {/* Display name — what the tribe sees (app_profile.display_name). Not the
          reserved `username` slug, which stays backend-only for now. */}
      <label className="block text-xs font-bold font-headline mb-1.5" style={{ color: INK }}>
        Display name
      </label>
      <input
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        maxLength={50}
        className="w-full px-4 py-2.5 rounded-xl text-sm mb-1.5 outline-none"
        style={{ border: "1px solid rgba(15,34,41,0.14)", color: INK, backgroundColor: "white" }}
      />
      <p className="text-[11px] mb-6" style={{ color: MUTED }}>
        How your tribe sees you.
      </p>

      {/* Intro */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: `inset 3.5px 0 0 ${CYAN}` }}
      >
        <p
          className="text-[11px] font-black font-headline uppercase tracking-[0.12em] mb-1.5"
          style={{ color: CYAN }}
        >
          Your experts asked
        </p>
        <p className="text-sm font-semibold mb-3" style={{ color: INK }}>
          {introPrompt}
        </p>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Share a little about yourself with the tribe…"
          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ border: "1px solid rgba(8,145,178,0.25)", color: INK, backgroundColor: "white" }}
        />
      </div>

      {error && (
        <p className="text-xs mb-3 text-center" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleEnter}
        disabled={busy}
        className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.01] transition-transform text-center disabled:opacity-60"
        style={{
          backgroundColor: ORANGE,
          boxShadow: "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
        }}
      >
        {busy ? "Saving…" : entitled ? "Enter your Experience" : "Continue"}
      </button>
      <button
        type="button"
        onClick={() => router.push(destination)}
        disabled={busy}
        className="w-full py-3 mt-1 text-sm font-bold font-headline transition-colors disabled:opacity-60"
        style={{ color: MUTED }}
      >
        Later
      </button>
    </div>
  );
}
