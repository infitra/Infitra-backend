"use client";

/**
 * Global error boundary — last resort (Bundle 5c hardening).
 *
 * Catches errors in the ROOT layout itself, which app/error.tsx cannot reach.
 * It REPLACES the whole document, so it must render its own <html>/<body> and
 * cannot rely on global CSS, Tailwind, or custom fonts — everything here is
 * inline. Primary action is a hard reload: if the root layout failed (e.g. a
 * stale bundle after a deploy), re-rendering the same code is unlikely to help,
 * but a fresh load pulls the current bundle.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#F4F1EA",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <title>Something went wrong — INFITRA</title>
        <div style={{ maxWidth: "360px", width: "100%", textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: "12px", marginBottom: "24px", opacity: 0.9 }}
          />
          <h1
            style={{
              color: "#0F2229",
              fontSize: "1.6rem",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, marginTop: "10px" }}>
            We hit an unexpected error. Reloading usually fixes it — it&rsquo;s
            often just an out-of-date tab.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "24px",
              padding: "12px 26px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "#FF6130",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 800,
              boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
            }}
          >
            Reload the page
          </button>
          {error?.digest && (
            <p style={{ fontSize: "10px", color: "#cbd5e1", marginTop: "24px", fontFamily: "monospace" }}>
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
