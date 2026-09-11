"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useBackdropClose } from "@/app/components/useBackdropClose";

/**
 * The overlay the hero tiles open into.
 *
 * Not Dialog: that primitive frames its children in a white rounded card at
 * max-w-lg, which would put a second, badly fitting frame around the founding
 * card's own cream shell. This keeps Dialog's three hardened behaviours and
 * nothing else: a portal to document.body (so no ancestor filter or transform
 * can trap the fixed layer), Escape to close, and a body scroll lock that
 * restores the previous value. The backdrop closes through useBackdropClose,
 * so dragging a text selection out of the card cannot dismiss it.
 */
export function CardOverlay({
  open,
  label,
  onClose,
  children,
}: {
  open: boolean;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const closeRef = useRef<HTMLButtonElement>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKey]);

  const backdrop = useBackdropClose(onClose);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(12,38,46,0.88)" }} {...backdrop} aria-hidden="true" />
      <div
        className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center px-4 py-8"
        {...backdrop}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="max-w-3xl w-full my-auto relative">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-5 right-0 sm:-top-6 z-10 px-3 py-1 rounded-full text-[11px] font-bold font-headline uppercase tracking-[0.14em]"
            style={{
              color: "#F2EFE8",
              backgroundColor: "rgba(242,239,232,0.14)",
              border: "1px solid rgba(242,239,232,0.28)",
            }}
          >
            Close
          </button>
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
