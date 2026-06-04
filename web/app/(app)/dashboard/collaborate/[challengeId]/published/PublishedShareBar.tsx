"use client";

/**
 * PublishedShareBar — sticky-on-scroll share bar for the success page.
 *
 * Sits below the celebratory header. Once the creator scrolls past the
 * hero, this bar sticks to the top of the viewport with: a copyable
 * link, a "Open public page" link. The constant share affordance is
 * the whole point of the success page — make it impossible to miss.
 *
 * Copy uses navigator.clipboard with a small "Copied!" toast inline.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Props {
  challengeId: string;
  title: string;
}

export function PublishedShareBar({ challengeId, title: _title }: Props) {
  const [stuck, setStuck] = useState(false);
  const [copied, setCopied] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // The bar starts in-flow at the top of the public preview. Once the
  // sentinel scrolls out of view, we switch the bar to fixed + add a
  // visual shadow to lift it off the content.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/experiences/${challengeId}`
      : `/experiences/${challengeId}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard might be denied — fallback: select the text input
      const input = document.getElementById(
        "published-share-url-input",
      ) as HTMLInputElement | null;
      if (input) {
        input.select();
        document.execCommand?.("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    }
  }

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" />
      <div
        className={`px-4 lg:px-12 py-3 transition-shadow ${stuck ? "sticky top-0 z-20" : ""}`}
        style={{
          backgroundColor: stuck ? "rgba(252,250,246,0.95)" : "transparent",
          backdropFilter: stuck ? "blur(12px) saturate(1.2)" : undefined,
          WebkitBackdropFilter: stuck ? "blur(12px) saturate(1.2)" : undefined,
          borderBottom: stuck ? "1px solid rgba(15,34,41,0.08)" : "1px solid transparent",
          boxShadow: stuck ? "0 4px 20px rgba(15,34,41,0.06)" : "none",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2 lg:gap-3">
          {/* Copyable URL field (read-only) */}
          <div className="flex-1 min-w-0">
            <label
              className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] hidden lg:block"
              style={{ color: "#94a3b8" }}
              htmlFor="published-share-url-input"
            >
              Share link
            </label>
            <div
              className="rounded-full flex items-center gap-2 pl-3 pr-1 py-1 mt-0.5"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(15,34,41,0.10)",
              }}
            >
              <span
                className="hidden sm:inline shrink-0 text-[11px] font-bold font-headline"
                style={{ color: "#94a3b8" }}
              >
                🔗
              </span>
              <input
                id="published-share-url-input"
                readOnly
                value={publicUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 bg-transparent text-xs lg:text-sm font-mono truncate focus:outline-none"
                style={{ color: "#0F2229" }}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black font-headline transition-colors"
                style={{
                  backgroundColor: copied ? "#15803d" : "#0891b2",
                  color: "white",
                }}
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          </div>

          {/* "View public page" CTA */}
          <Link
            href={`/experiences/${challengeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3 lg:px-4 py-2.5 rounded-full text-[11px] lg:text-xs font-black font-headline transition-colors"
            style={{
              backgroundColor: "#FF6130",
              color: "white",
              boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
            }}
          >
            <span className="hidden sm:inline">Open public page </span>↗
          </Link>
        </div>
      </div>
    </>
  );
}
