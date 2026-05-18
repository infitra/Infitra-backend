"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Tailwind max-w utility — defaults to `max-w-lg` to match
   *  SessionDetailModal. Pass `max-w-2xl` etc. for wider forms. */
  maxWidthClass?: string;
  /** Closes when the user clicks the backdrop. Defaults to true.
   *  Disable for forms where you don't want accidental dismiss while
   *  the user is mid-typing. */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}

/**
 * Centered modal dialog primitive.
 *
 * Backdrop + ESC-to-close + body-scroll-lock + click-outside-to-close
 * (opt-out via `closeOnBackdrop=false`). The card itself is intentionally
 * NOT styled here — pass any header/body/footer structure as children.
 *
 * Polish v12.L.1 hardening:
 * - **Portaled to `document.body`** via React portal so the dialog
 *   escapes any ancestor with `transform`, `filter`, `backdrop-filter`,
 *   `perspective`, or `will-change` — those create a new containing
 *   block for `position: fixed`, which was causing the backdrop to be
 *   sized to the parent card (not the viewport) and leak the original
 *   page background at the bottom of taller modals.
 * - **Backdrop is its own sibling element**, not the same node as the
 *   scroll container. Backdrop is a static `fixed inset-0` colour
 *   layer that always covers the viewport; the scroll container floats
 *   on top of it and handles overflow independently. Scrolling a tall
 *   form no longer affects backdrop coverage.
 */
export function Dialog({
  open,
  onClose,
  maxWidthClass = "max-w-lg",
  closeOnBackdrop = true,
  children,
}: DialogProps) {
  // Portal mounts post-hydration only — `document` doesn't exist on
  // the server. `mounted` gates the createPortal call so SSR/RSC
  // returns null and the client takes over on mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKey]);

  if (!open || !mounted) return null;

  return createPortal(
    <>
      {/* Backdrop — its own static layer, always covers viewport,
          never scrolls, never resizes with content. */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: "rgba(15,34,41,0.5)" }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      {/* Scroll container — sits on top of the backdrop. Click on the
          empty area around the card (= container itself) closes the
          dialog when `closeOnBackdrop`; click on the card stops
          propagation. */}
      <div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
        onClick={closeOnBackdrop ? onClose : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`${maxWidthClass} w-full rounded-2xl overflow-hidden infitra-card my-auto`}
          style={{ backgroundColor: "#FFFFFF" }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
