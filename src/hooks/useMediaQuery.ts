"use client";

import { useSyncExternalStore } from "react";

type MediaStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
};

const stores = new Map<string, MediaStore>();

function mediaFor(query: string): MediaQueryList | null {
  if (typeof window === "undefined") return null;
  if (typeof window.matchMedia !== "function") return null;

  return window.matchMedia(query);
}

function storeFor(query: string): MediaStore {
  const existing = stores.get(query);
  if (existing !== undefined) return existing;

  let list: MediaQueryList | null = null;

  const resolve = (): MediaQueryList | null => {
    list ??= mediaFor(query);

    return list;
  };

  const store: MediaStore = {
    subscribe(listener) {
      const media = resolve();

      if (media === null) return () => {};

      media.addEventListener("change", listener);

      return () => media.removeEventListener("change", listener);
    },
    getSnapshot: () => resolve()?.matches ?? false,
  };

  stores.set(query, store);

  return store;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useMediaQuery(query: string): boolean {
  const store = storeFor(query);

  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
}
