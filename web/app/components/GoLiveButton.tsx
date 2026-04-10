"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GoLiveButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoLive() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "create_live_room",
        { body: { session_id: sessionId } }
      );

      if (fnError) {
        setError(fnError.message || "Failed to create room.");
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Room created — navigate to live page
      router.push(`/dashboard/sessions/${sessionId}/live`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleGoLive}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:hover:scale-100"
        style={{
          backgroundColor: "#FF6130",
          boxShadow:
            "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
        }}
      >
        {loading ? (
          "Creating room..."
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            Go Live
          </>
        )}
      </button>
      {error && (
        <p className="text-xs mt-2" style={{ color: "#FF6130" }}>
          {error}
        </p>
      )}
    </div>
  );
}
