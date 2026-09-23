"use client";
import { useSyncExternalStore } from "react";

const DEFAULT_PERIOD_MS = 1_000;

type Clock = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => number;
  getServerSnapshot: () => number;
};

const clocks = new Map<number, Clock>();

function createClock(periodMs: number): Clock {
    const listeners = new Set<() => void>();
    
    let handle: ReturnType<typeof setInterval> | null = null;
    let epochMs = 0;

    const publish = (): void => {
        epochMs = Date.now();

        for (const listener of listeners) listener();
    }

    const onVisble = (): void => {
        if(!document.hidden) publish();
    }

    const start = (): void => {
        publish();
        handle = setInterval(publish, periodMs);
        document.addEventListener("visibilitychange", onVisble);
    }

    const stop = (): void => {
        if (handle !== null) {clearInterval(handle)};

        handle = null;
        document.removeEventListener("visibilitychange", onVisble);
    }

    return {
        subscribe(listener) {
            listeners.add(listener);
            if  (handle === null) start();

            return () => {
                listeners.delete(listener);
                if (listeners.size === 0) stop();   
            }
        },
        getSnapshot: () => epochMs,
        getServerSnapshot: () => 0,
    }
}

function clockFor(periodMs: number): Clock {
    const period = Math.max(Math.trunc(periodMs), 1_000);

    const existing = clocks.get(period);
    if (existing !== undefined) return existing;

    const created = createClock(period);
    clocks.set(period, created);
    return created;
}

export  function useNow(periodMs: number = DEFAULT_PERIOD_MS): number {
    const clock = clockFor(periodMs);

    return useSyncExternalStore(
        clock.subscribe,
        clock.getSnapshot,
        clock.getServerSnapshot,
    );
}