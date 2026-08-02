"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * DashboardOverlay — THE secondary-surface shell for both dashboards
 * (founder's coherence pass). Everything that used to be its own page or
 * side panel (Account settings, Edit profile, Your people) now opens as one
 * large pop-up INSIDE the dashboard: no navigation, no labyrinth, one visual
 * grammar — the settings-card style the founder picked as the reference
 * (uppercase tracked section labels, soft white cards, minimal chrome).
 *
 * Pattern mirrors ProfileModalHost: mount ONE <OverlayHost> per page,
 * declare each surface with <OverlayPanel id="...">, open from anywhere
 * below via useOverlay()("id") or <OverlayTrigger id="...">.
 */

const INK = "#0F2229";

const OverlayCtx = createContext<((id: string) => void) | null>(null);
const OverlayRegisterCtx = createContext<{
  openId: string | null;
  close: () => void;
} | null>(null);

export function useOverlay() {
  const open = useContext(OverlayCtx);
  return open ?? (() => {});
}

export function OverlayHost({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openId, close]);

  return (
    <OverlayCtx.Provider value={open}>
      <OverlayRegisterCtx.Provider value={{ openId, close }}>
        {children}
      </OverlayRegisterCtx.Provider>
    </OverlayCtx.Provider>
  );
}

/** A button that opens an overlay panel. Styled as the standard quiet
 *  quick-action row unless custom children styling is passed. */
export function OverlayTrigger({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const open = useOverlay();
  return (
    <button type="button" onClick={() => open(id)} className={className}>
      {children}
    </button>
  );
}

/**
 * OverlayPanel — declares one overlay surface. Renders nothing until its id
 * is opened; then portals the big centered pop-up with the standard header.
 * `wide` for content-heavy surfaces (people grid).
 */
export function OverlayPanel({
  id,
  title,
  intro,
  wide,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const reg = useContext(OverlayRegisterCtx);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!reg || reg.openId !== id || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,34,41,0.45)" }}
      onClick={reg.close}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-xl"} rounded-2xl overflow-hidden flex flex-col`}
        style={{
          backgroundColor: "#FAF9F6",
          maxHeight: "min(86vh, 760px)",
          boxShadow: "0 24px 60px rgba(15,34,41,0.28)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Standard header — the one grammar every surface shares. */}
        <div
          className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(15,34,41,0.08)", backgroundColor: "#FFFFFF" }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "#FF6130" }} />
              <h2
                className="text-lg font-headline font-black tracking-tight truncate"
                style={{ color: INK, letterSpacing: "-0.02em" }}
              >
                {title}
              </h2>
            </div>
            {intro && (
              <p className="text-[12px] mt-1 ml-[14px]" style={{ color: "#64748b" }}>
                {intro}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={reg.close}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(15,34,41,0.06)] shrink-0"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Section inside an overlay — the settings-card grammar. */
export function OverlaySection({
  label,
  intro,
  children,
}: {
  label: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-5 mb-4 last:mb-0"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(15,34,41,0.08)" }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.2em] font-headline mb-1"
        style={{ color: "#475569", fontWeight: 700 }}
      >
        {label}
      </p>
      {intro && (
        <p className="text-[12px] mb-4" style={{ color: "#64748b" }}>
          {intro}
        </p>
      )}
      {children}
    </section>
  );
}

/** The standard quiet quick-action row used in both dashboard rails. */
export function railActionClass() {
  return "flex w-full items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[13px] font-black font-headline transition-colors hover:bg-[rgba(15,34,41,0.03)]";
}
export const railActionStyle: React.CSSProperties = {
  color: "#475569",
  border: "1px solid rgba(15,34,41,0.12)",
  backgroundColor: "rgba(255,255,255,0.6)",
};
