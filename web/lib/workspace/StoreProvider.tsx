"use client";

/**
 * WorkspaceStoreProvider — Bundle 3.5 Phase 1.
 *
 * SSR-safe Zustand wiring for the workspace. Per Zustand's Next.js
 * guidance, the store is created ONCE PER MOUNT (held in a ref) and
 * provided via React Context — never a module-level singleton, which on
 * the App Router would be shared across server requests and bleed one
 * user's workspace state into another's initial render.
 *
 * Phase 1: the provider wraps the workspace but no descendant reads from
 * it yet — this is inert plumbing. Consumers switch to `useWorkspaceStore`
 * selectors in Phase 2.
 */

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { type StoreApi } from "zustand/vanilla";
import {
  createWorkspaceStore,
  type WorkspaceState,
  type WorkspaceStore,
} from "./store";

const WorkspaceStoreContext = createContext<StoreApi<WorkspaceStore> | null>(
  null,
);

export function WorkspaceStoreProvider({
  initialState,
  children,
}: {
  initialState: WorkspaceState;
  children: ReactNode;
}) {
  // One store per mount. The ref ensures the store survives re-renders and
  // is never recreated; the seed value is read only on first construction.
  const storeRef = useRef<StoreApi<WorkspaceStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createWorkspaceStore(initialState);
  }

  return (
    <WorkspaceStoreContext.Provider value={storeRef.current}>
      {children}
    </WorkspaceStoreContext.Provider>
  );
}

/**
 * Subscribe to a slice of the workspace store. Selector-based so only
 * components reading the changed slice re-render (the reason for Zustand
 * over Context — see Bundle 3.5 spec).
 */
export function useWorkspaceStore<T>(
  selector: (state: WorkspaceStore) => T,
): T {
  const store = useContext(WorkspaceStoreContext);
  if (store === null) {
    throw new Error(
      "useWorkspaceStore must be used within a WorkspaceStoreProvider",
    );
  }
  return useStore(store, selector);
}
