"use client";

import { useEffect, useCallback } from "react";

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
 * Polish v12 extracted this from SessionDetailModal so it could be
 * reused for the invite-collaborator flow and the session add/edit flow.
 *
 * z-index 50 matches the existing SessionDetailModal so they don't fight.
 * Backdrop colour `rgba(15,34,41,0.5)` matches the brand text colour at
 * 50% — neutral but warm enough to not feel like a gray scrim.
 */
export function Dialog({
  open,
  onClose,
  maxWidthClass = "max-w-lg",
  closeOnBackdrop = true,
  children,
}: DialogProps) {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(15,34,41,0.5)" }}
      onClick={closeOnBackdrop ? onClose : undefined}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${maxWidthClass} w-full rounded-2xl overflow-hidden infitra-card my-auto`}
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
