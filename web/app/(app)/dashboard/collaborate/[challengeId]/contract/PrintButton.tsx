"use client";

import { useEffect } from "react";

/**
 * PrintButton — "Export as PDF" via the browser's print dialog (P6e, lean by
 * design: every OS ships a save-as-PDF printer, so this delivers the artifact
 * experts need with zero PDF tooling). Print CSS in globals.css strips the app
 * chrome so only the contract document prints.
 */
export function PrintButton() {
  // A closed <details> renders nothing on paper and CSS cannot open it, so
  // the sessions list would vanish from the export. Open every details
  // before printing — via the button AND beforeprint (Cmd+P) — and restore
  // the previously-closed ones afterwards.
  useEffect(() => {
    const opened: HTMLDetailsElement[] = [];
    const before = () => {
      document.querySelectorAll("details:not([open])").forEach((d) => {
        (d as HTMLDetailsElement).open = true;
        opened.push(d as HTMLDetailsElement);
      });
    };
    const after = () => {
      opened.splice(0).forEach((d) => (d.open = false));
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hide inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black font-headline transition-colors hover:bg-[rgba(8,145,178,0.08)]"
      style={{ color: "#0891b2", border: "1.5px solid rgba(8,145,178,0.30)" }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Export as PDF
    </button>
  );
}
