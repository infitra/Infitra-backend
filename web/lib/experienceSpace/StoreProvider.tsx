"use client";

/**
 * ExperienceSpaceStoreProvider — Bundle 5b.
 *
 * SSR-safe Zustand wiring for the Experience Space (one store per mount via a
 * ref, never a module singleton — same rationale as the workspace provider).
 */

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { type StoreApi } from "zustand/vanilla";
import {
  createExperienceSpaceStore,
  type ExperienceSpaceState,
  type ExperienceSpaceStore,
} from "./store";

const Ctx = createContext<StoreApi<ExperienceSpaceStore> | null>(null);

export function ExperienceSpaceStoreProvider({
  initialState,
  children,
}: {
  initialState: ExperienceSpaceState;
  children: ReactNode;
}) {
  const storeRef = useRef<StoreApi<ExperienceSpaceStore> | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createExperienceSpaceStore(initialState);
  }
  return <Ctx.Provider value={storeRef.current}>{children}</Ctx.Provider>;
}

export function useExperienceSpaceStore<T>(
  selector: (state: ExperienceSpaceStore) => T,
): T {
  const store = useContext(Ctx);
  if (store === null) {
    throw new Error(
      "useExperienceSpaceStore must be used within an ExperienceSpaceStoreProvider",
    );
  }
  return useStore(store, selector);
}
