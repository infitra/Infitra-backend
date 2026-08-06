"use client";

import { useRef } from "react";

/**
 * useBackdropClose — closes an overlay on a backdrop click WITHOUT the
 * select-text trap.
 *
 * The bug this kills (founder hit it three times in the material sheet):
 * start selecting text inside a modal input, drag past the panel's edge,
 * release over the backdrop. The browser dispatches the click on the
 * COMMON ANCESTOR of mousedown and mouseup — the backdrop — and a plain
 * `onClick={close}` treats a text-selection drag as a deliberate dismiss.
 *
 * The guard: close only when the interaction STARTED on the backdrop
 * itself. Spread the returned handlers on the backdrop element in place of
 * `onClick={close}`.
 */
export function useBackdropClose(close: () => void) {
  const armed = useRef(false);
  return {
    onMouseDown: (e: React.MouseEvent) => {
      armed.current = e.target === e.currentTarget;
    },
    onClick: (e: React.MouseEvent) => {
      if (armed.current && e.target === e.currentTarget) close();
      armed.current = false;
    },
  };
}
