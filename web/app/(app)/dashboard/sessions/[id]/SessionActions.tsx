"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishSession, deleteSession } from "@/app/actions/session";

export function SessionActions({
  sessionId,
  status,
}: {
  sessionId: string;
  status: string;
}) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = status === "draft";

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    const result = await publishSession(sessionId);
    if (result?.error) {
      setError(result.error);
      setPublishing(false);
    } else {
      router.refresh();
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this draft session? This cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    const result = await deleteSession(sessionId);
    if (result?.error) {
      setError(result.error);
      setDeleting(false);
    }
    // deleteSession redirects to /dashboard/sessions on success
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
          <p className="text-sm text-[#FF6130]">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {isDraft && (
          <>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-3 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] disabled:opacity-50 disabled:hover:scale-100"
            >
              {publishing ? "Publishing..." : "Publish Session"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-3 rounded-full text-sm font-bold text-red-400/60 hover:text-red-400 border border-red-400/15 hover:border-red-400/30 transition-all font-headline disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Draft"}
            </button>
          </>
        )}

        {status === "published" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-400/8 border border-green-400/20">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-bold text-green-400 font-headline">
              Live &mdash; visible to participants
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
