"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createContinuationDraft } from "@/app/actions/challenge";
import { useBackdropClose } from "@/app/components/useBackdropClose";

/**
 * CreateNextRunButton — the continuation door on a completed experience
 * card. It does NOT go to the old workspace: it creates the continuation
 * draft and lands the expert in that draft's workspace.
 *
 * Because that action copies real things (the team gets re-invited, the
 * sessions come across), it explains itself first. The founder's rule: a
 * button that quietly duplicates an experience is a button people are
 * afraid to press.
 */

const ORANGE = "#FF6130";
const INK = "#0F2229";

export function CreateNextRunButton({ sourceId, title }: { sourceId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const backdrop = useBackdropClose(() => setOpen(false));

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="mt-2 w-full text-[11px] uppercase tracking-widest font-headline py-1.5 transition-colors hover:text-[#FF6130] text-left"
        style={{ color: ORANGE, fontWeight: 700 }}
      >
        Create the next run →
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15,34,41,0.45)" }}
            {...backdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Create the next run"
          >
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(15,34,41,0.08)" }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: ORANGE }} />
                  <h2 className="text-lg font-black font-headline tracking-tight" style={{ color: INK, letterSpacing: "-0.02em" }}>
                    Run it again
                  </h2>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#475569" }}>
                  This creates a fresh draft of{" "}
                  <span className="font-bold font-headline" style={{ color: INK }}>{title}</span>{" "}
                  for a new group. Here is exactly what happens:
                </p>

                <ul className="space-y-2.5 mb-5">
                  <Point text="Your collaborators are invited again, on the same terms. They confirm before it can publish." />
                  <Point text="Every session comes across with its structure intact. You set the new dates." />
                  <Point text="Nothing is published yet. It is a draft you can change freely, or keep exactly as it was." />
                  <Point text="Your completed run stays untouched, with its space and its people." />
                </ul>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startTransition(() => createContinuationDraft(sourceId))}
                    disabled={pending}
                    className="flex-1 rounded-full py-3 px-5 text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: ORANGE, fontWeight: 700, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
                  >
                    {pending ? "Preparing…" : "Create the draft →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="px-3 py-2.5 text-xs font-bold font-headline transition-colors disabled:opacity-40"
                    style={{ color: "#94a3b8" }}
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Point({ text }: { text: string }) {
  return (
    <li className="flex gap-2.5">
      <span className="shrink-0 mt-[3px]" style={{ color: ORANGE }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <span className="text-[12.5px] leading-snug" style={{ color: "#475569" }}>
        {text}
      </span>
    </li>
  );
}
