"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchObjectsCatalog } from "../lib/api/celestial"
import { ENV } from "@/lib/constants"
import type { Feed, FeedStatus, ObjectsCatalog } from "@/types/celestial"

export type CatalogFeed = Feed<ObjectsCatalog>;


export function useObjectsCatalog(enabled = true): CatalogFeed {
    const [catalog, setCatalog] = useState<ObjectsCatalog | null>(null);
    const [status, setStatus] = useState<FeedStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const [updatedAtMs, setUpdatedAtMs] = useState<number | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        fetchObjectsCatalog()
            .then((value) => {
                if (cancelled) return;

                setCatalog(value);
                setStatus("live")
                setError(null);
                setUpdatedAtMs(Date.now());
            })

            .catch((cause: unknown) => {
                if (cancelled) return;

                setStatus("offline");
                setError(
                    cause instanceof Error ? cause.message : "Katalog objek gagal dimuat",
                );
            })

        return() => {
            cancelled = true;
        }
    }, [enabled, attempt]);

    const refresh = useCallback((): void => {
        setAttempt((previous) => previous + 1);
    }, [])

    return {
        data: catalog,
        status,
        origin: ENV.mock ? "mock" : "live",
        updatedAtMs,
        error,
        refresh,
    }
}