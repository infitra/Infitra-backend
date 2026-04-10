"use client";

import { useEffect, useCallback, useRef } from "react";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * SlideOver — slides a panel in from the right for quick previews.
 *
 * 480px on desktop, full-width on mobile. Closes on Escape or backdrop click.
 * No transitions (instant open/close to match INFITRA's no-transition card philosophy).
 * Content scrolls independently inside the panel.
 */
export function SlideOver({ open, onClose, title, children }: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(15, 34, 41, 0.25)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-full md:w-[480px] flex flex-col"
        style={{
          backgroundColor: "#F2EFE8",
          borderLeft: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.10)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.08)" }}
        >
          {title ? (
            <h2 className="text-base font-bold font-headline text-[#0F2229] truncate">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/5"
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#0F2229"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
