"use client"

import { useSyncExternalStore } from "react"

type Support = "unknown" | "yes" | "no";

const listeners = new Set<() => void>();

let support: Support = "unknown";

function detect(): boolean {
    try {
        const canvas  = document.createElement("canvas");
        const context = canvas.getContext("webgl2")

        if (context === null) return false;

        context.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
    } catch {
        return false;
    }
}


function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (support === "unknown") {
        support = detect() ? "yes" : "no";
        for (const current of [...listeners]) current();
    }

    return () => {
        listeners.delete(listener);
    }
}


function getSnapshot(): Support {
  return support;
}

function getServerSnapshot(): Support {
  return "unknown";
}


export function useWebGLSupport(): boolean | null {
    const state = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    return state === "unknown" ? null : state === "yes";
}