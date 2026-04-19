"use client";

import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  ownerName: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Signature-moment modal for accepting collaboration terms.
 *
 * Structural principles (see design discussion):
 * - Content stays lean: a label line, three commitments, a single required
 *   checkbox. Re-reading the contract happens in the workspace body above,
 *   not in this modal.
 * - Primary CTA is disabled until the checkbox is ticked — the act of
 *   ticking is the commitment moment.
 * - The "reopening resets acceptances" procedural note lives in the top
 *   banner, NOT here. This modal is about the personal commitment only.
 */
export function AcceptTermsModal({ open, ownerName, submitting, onConfirm, onCancel }: Props) {
  const [checked, setChecked] = useState(false);

  // Reset state every time the modal opens so a re-open never inherits a tick
  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,34,41,0.5)" }}
      onClick={() => { if (!submitting) onCancel(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="accept-terms-title"
    >
      <div
        className="max-w-md w-full rounded-2xl p-7 infitra-card"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="accept-terms-title" className="text-xl font-black font-headline text-[#0F2229] mb-1">
          Accept the collaboration terms?
        </h2>

        <p className="text-sm font-bold text-[#94a3b8] mb-5">
          By accepting, you commit to the following:
        </p>

        <ul className="space-y-2.5 mb-6">
          <li className="flex gap-2.5 text-sm text-[#0F2229] leading-relaxed">
            <span className="text-[#0891b2] font-black shrink-0">·</span>
            <span>You agree to fulfill your contributions as stated.</span>
          </li>
          <li className="flex gap-2.5 text-sm text-[#0F2229] leading-relaxed">
            <span className="text-[#0891b2] font-black shrink-0">·</span>
            <span>
              You are authorising <span className="font-bold">{ownerName}</span> to publish this collaboration.
            </span>
          </li>
          <li className="flex gap-2.5 text-sm text-[#0F2229] leading-relaxed">
            <span className="text-[#0891b2] font-black shrink-0">·</span>
            <span>Once published, the terms are binding for everyone.</span>
          </li>
        </ul>

        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[#0891b2]"
          />
          <span className="text-sm font-bold text-[#0F2229]">
            I&apos;ve reviewed the terms and accept them.
          </span>
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!checked || submitting}
            className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
            style={{ backgroundColor: "#0891b2" }}
          >
            {submitting ? "Accepting..." : "Accept Terms"}
          </button>
        </div>
      </div>
    </div>
  );
}
