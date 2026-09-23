"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import type { DataOrigin, Feed, FeedStatus } from "@/types/celestial";
import { backoffDelay, ENV } from "@/lib/constants";

const OFFLINE_AFTER_FAILURES = 3;
const STALE_AGE_FACTOR = 2;

export type PollingOptions<T> = {
  intervalMs: number;
  enabled?: boolean;
  delayMs?: number;
  originOf?: (value: T) => DataOrigin;
};

type PollingSnapshot<T> = {
  data: T | null;
  status: FeedStatus;
  origin: DataOrigin;
  updatedAtMs: number | null;
  error: string | null;
};

function messageOf(cause: unknown): string {
  return cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Gagal memuat data";
}

export function usePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: PollingOptions<T>,
): Feed<T> {
  const { intervalMs, enabled = true, delayMs = 0, originOf } = options;

  const [snapshot, setSnapshot] = useState<PollingSnapshot<T>>(() => ({
    data: null,
    status: "loading",
    origin: ENV.mock ? "mock" : "live",
    updatedAtMs: null,
    error: null,
  }));

  const wakeRef = useRef<() => void>(() => {});

  const fetchLatest = useEffectEvent(fetcher);
  const resolveOrigin = useEffectEvent(
    (value: T): DataOrigin =>
      originOf === undefined ? (ENV.mock ? "mock" : "live") : originOf(value),
  );

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    let failures = 0;
    let inFlight = false;
    let immediate = false;
    let stopped = false;

    const schedule = (waitMs: number): void => {
      if (stopped) return;

      timer = setTimeout(() => void run(), waitMs);
    };

    const wake = (): void => {
      if (stopped) return;

      immediate = true;

      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }

      if (!inFlight) void run();
    };

    const run = async (): Promise<void> => {
      timer = null;

      if (stopped) return;

      if (inFlight) {
        immediate = true;
        return;
      }

      if (document.hidden) {
        schedule(intervalMs);
        return;
      }

      inFlight = true;
      immediate = false;

      const request = new AbortController();
      controller = request;

      let failed = false;

      try {
        const value = await fetchLatest(request.signal);

        if (stopped || request.signal.aborted) return;

        failures = 0;
        setSnapshot({
          data: value,
          status: "live",
          origin: resolveOrigin(value),
          updatedAtMs: Date.now(),
          error: null,
        });
      } catch (cause) {
        if (stopped || request.signal.aborted) return;

        failed = true;
        failures += 1;

        const exhausted = failures >= OFFLINE_AFTER_FAILURES;
        const message = messageOf(cause);

        setSnapshot((previous) => ({
          ...previous,
          status: exhausted || previous.data === null ? "offline" : "stale",
          error: message,
        }));
      } finally {
        inFlight = false;
        controller = null;

        if (stopped) return;

        schedule(
          immediate ? 0 : failed ? backoffDelay(failures - 1) : intervalMs,
        );
      }
    };


    const onVisibility = (): void => {
      if (document.hidden) return;

      setSnapshot((previous) =>
        previous.status === "live" &&
        previous.updatedAtMs !== null &&
        Date.now() - previous.updatedAtMs > intervalMs * STALE_AGE_FACTOR
          ? { ...previous, status: "stale" }
          : previous,
      );

      wake();
    };

    wakeRef.current = wake;
    document.addEventListener("visibilitychange", onVisibility);
    schedule(delayMs);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibility);
      wakeRef.current = () => {};

      if (timer !== null) clearTimeout(timer);

      controller?.abort();
    };
  }, [enabled, intervalMs, delayMs]);

  const refresh = useCallback((): void => {
    wakeRef.current();
  }, []);

  return { ...snapshot, refresh };
}
