"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishSession } from "@/app/actions/session";
import Link from "next/link";

export function PreviewActions({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    const result = await publishSession(sessionId);
    if (result?.error) {
      setError(result.error);
      setPublishing(false);
    } else {
      router.push(`/dashboard/sessions/${sessionId}`);
      router.refresh();
    }
  }

  return (
    <div className="mt-8">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
          <p className="text-sm text-[#FF6130]">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex-1 py-3.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)] disabled:opacity-50 disabled:hover:scale-100"
        >
          {publishing ? "Publishing..." : "Publish Session"}
        </button>
        <Link
          href={`/dashboard/sessions/${sessionId}`}
          className="px-6 py-3.5 rounded-full text-sm font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 transition-all font-headline"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
