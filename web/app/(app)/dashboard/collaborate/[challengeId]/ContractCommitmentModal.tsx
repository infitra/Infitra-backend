"use client";

import { useEffect, useState, ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  introLine: string;
  bullets: ReactNode[];
  checkboxLabel: string;
  confirmLabel: string;
  submittingLabel?: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic "signature moment" modal for binding contract actions.
 *
 * Used for both:
 * - Cohost accepting the terms (authorise owner to publish)
 * - Owner publishing the collaboration (the final binding step)
 *
 * Structural principles (see design discussion):
 * - Content stays lean: label line, three commitments, single required
 *   checkbox. Contract body is re-read in the workspace above, not here.
 * - Primary CTA disabled until the checkbox is ticked — the tick IS the
 *   commitment moment.
 * - Procedural context (e.g. "reopening resets acceptances") lives in the
 *   top banner, never here.
 */
export function ContractCommitmentModal({
  open,
  title,
  introLine,
  bullets,
  checkboxLabel,
  confirmLabel,
  submittingLabel,
  submitting,
  onConfirm,
  onCancel,
}: Props) {
  const [checked, setChecked] = useState(false);

  // Reset on every open so a re-open never inherits a stale tick
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
      aria-labelledby="contract-commitment-title"
    >
      <div
        className="max-w-md w-full rounded-2xl p-7 infitra-card"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="contract-commitment-title" className="text-xl font-black font-headline text-[#0F2229] mb-1">
          {title}
        </h2>

        <p className="text-sm font-bold text-[#94a3b8] mb-5">{introLine}</p>

        <ul className="space-y-2.5 mb-6">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-[#0F2229] leading-relaxed">
              <span className="text-[#0891b2] font-black shrink-0">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <label className="flex items-start gap-3 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[#0891b2]"
          />
          <span className="text-sm font-bold text-[#0F2229]">{checkboxLabel}</span>
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
            {submitting ? (submittingLabel ?? "Submitting…") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
