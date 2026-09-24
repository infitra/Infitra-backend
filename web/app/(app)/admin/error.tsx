"use client";

/**
 * The admin board's own error boundary.
 *
 * This page is founder-only, so unlike every public surface it should show
 * what actually broke rather than a polite apology. The generic boundary
 * gave nothing but a digest, which cost a debugging session (24 Sep 2026).
 *
 * Next scrubs the message of SERVER errors in production and leaves only the
 * digest, so both are printed: a message means the crash happened while
 * rendering on the client, a bare digest means it happened on the server and
 * the digest is the key to the hosting log.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen px-4 py-10 md:px-8" style={{ backgroundColor: "#F2EFE8", color: "#0F2229" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-headline mb-2" style={{ fontWeight: 700 }}>
          Admin board crashed
        </h1>
        <p className="text-sm mb-5" style={{ color: "#475569" }}>
          Shown in full because this page is founder-only.
        </p>

        <pre
          className="text-xs whitespace-pre-wrap break-all rounded-xl p-4 mb-4"
          style={{ backgroundColor: "rgba(180,35,24,0.06)", border: "1px solid rgba(180,35,24,0.20)", color: "#b42318" }}
        >
          {error.message || "(no message: the error was thrown on the server and Next scrubbed it)"}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          {error.stack ? `\n\n${error.stack}` : ""}
        </pre>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-full text-sm font-headline text-white"
            style={{ backgroundColor: "#FF6130", fontWeight: 700 }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-full text-sm font-headline"
            style={{ border: "1px solid rgba(15,34,41,0.15)", fontWeight: 600 }}
          >
            Back to workspace
          </a>
        </div>
      </div>
    </div>
  );
}
