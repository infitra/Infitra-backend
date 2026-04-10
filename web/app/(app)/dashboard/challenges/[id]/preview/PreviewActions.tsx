"use client";

import { useState } from "react";
import { publishChallenge } from "@/app/actions/challenge";
import Link from "next/link";

export function PreviewActions({ challengeId }: { challengeId: string }) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    const result = await publishChallenge(challengeId);
    // publishChallenge redirects on success, so we only get here on error
    if (result?.error) {
      setError(result.error);
      setPublishing(false);
    }
  }

  return (
    <div className="mt-8">
      {error && (
        <div
          className="mb-4 p-3 rounded-xl"
          style={{
            backgroundColor: "rgba(255, 97, 48, 0.10)",
            border: "1px solid rgba(255, 97, 48, 0.30)",
          }}
        >
          <p className="text-sm" style={{ color: "#FF6130" }}>
            {error}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="flex-1 py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
          style={{
            backgroundColor: "#FF6130",
            boxShadow:
              "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          {publishing ? "Publishing..." : "Publish Challenge"}
        </button>
        <Link
          href={`/dashboard/challenges/${challengeId}`}
          className="px-6 py-3.5 rounded-full text-sm font-bold transition-all font-headline hover:opacity-80"
          style={{
            color: "#475569",
            backgroundColor: "rgba(255, 255, 255, 0.78)",
            border: "1px solid rgba(15, 34, 41, 0.15)",
          }}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
