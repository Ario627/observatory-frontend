"use client";

import { useSyncExternalStore } from "react";


const QUERY = "(prefers-reduced-motion: reduce)";

let media: MediaQueryList | null = null;


function query(): MediaQueryList | null {

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return null;
    }

    media ??= window.matchMedia(QUERY);
    
    return media;
}


function subscribe(onChange: () => void): () => void {
    const list = query();
    if (list === null) return () => {};

    list.addEventListener("change", onChange);

    return () => {
        list.removeEventListener("change", onChange);
    }
}

function getSnapshot(): boolean {
    return query()?.matches ?? false;
}

function getServerSnapshot(): boolean {
    return false;
}

export function useReduceMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
