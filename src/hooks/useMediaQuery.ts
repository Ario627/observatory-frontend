"use client";

import { useSyncExternalStore } from "react";

type MediaStore = {
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => boolean;
    getServerSnapshot: () => boolean;
}

const stores = new Map<string, MediaStore>();

function createStore(query: string): MediaStore {
    let list: MediaQueryList | null = null;

    const listFor = (): MediaQueryList | null => {
        if (typeof window === "undefined") return null;
        if (typeof window.matchMedia !== "function") return null;

        list ??= window.matchMedia(query);
        
        return list;
    }

    return {
        subscribe(listener) {
            const media = listFor();    
            if (media === null) return () => {};
            
            media.addEventListener("change", listener);

            return () => media.removeEventListener("change", listener);
        },
        getSnapshot: () => listFor()?.matches ?? false,
    }
}


function storeFor(query: string): MediaStore {
    const existing = stores.get(query);
    if (existing !== undefined) return existing;

    const store = createStore(query);
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