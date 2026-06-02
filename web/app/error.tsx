"use client";

/**
 * Root error boundary — Bundle 5c hardening.
 *
 * Catches unexpected client/render errors anywhere below the root layout and
 * shows a recoverable, branded fallback instead of a blank white page (which is
 * what a stale-bundle / deploy-skew error produced when there was no boundary
 * to catch it). "Try again" is the framework soft-retry (re-fetch + re-render
 * the segment); "Reload" is the hard escape hatch that also recovers from an
 * out-of-date JS bundle.
 *
 * Error boundaries must be Client Components. In this Next fork the recovery
 * prop is `unstable_retry` (v16.2.0), not the older `reset`.
 */

import { useEffect } from "react";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "#F4F1EA" }}
    >
      <div className="max-w-sm w-full text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt=""
          width={44}
          height={44}
          className="mx-auto rounded-xl mb-6"
          style={{ opacity: 0.9 }}
        />
        <h1
          className="font-black font-headline tracking-tight"
          style={{ color: "#0F2229", fontSize: "clamp(1.4rem, 5vw, 1.9rem)", letterSpacing: "-0.02em" }}
        >
          Something went wrong
        </h1>
        <p className="text-sm mt-2.5 leading-relaxed" style={{ color: "#64748b" }}>
          That wasn&rsquo;t supposed to happen. Try again — and if it sticks,
          reload the page (it&rsquo;s often just an out-of-date tab).
        </p>
        <div className="flex flex-col items-center gap-2.5 mt-6">
          <button
            onClick={() => unstable_retry()}
            className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-bold font-headline"
            style={{ color: "#0891b2" }}
          >
            Reload the page
          </button>
        </div>
        {error?.digest && (
          <p className="text-[10px] mt-6" style={{ color: "#cbd5e1", fontFamily: "monospace" }}>
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
