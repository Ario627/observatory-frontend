"use client";

import {
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { fetchActiveTarget, trackTarget } from "@/lib/api/celestial";
import { SERVO_LOCKOUT_MS } from "@/lib/constants";
import type { FeedStatus, TrackTarget } from "@/types/celestial";

export type TrackController = {
  target: TrackTarget | null;
  status: FeedStatus;
  applying: boolean;
  locked: boolean;
  error: string | null;
  select: (target: TrackTarget) => void;
  reload: () => void;
};

export type TrackOptions = {
  enabled?: boolean;
};

const DEFAULT_TARGET: TrackTarget = { type: "iss", id: "iss" };

function sameTarget(candidate: TrackTarget | null, next: TrackTarget): boolean {
  return (
    candidate !== null &&
    candidate.type === next.type &&
    candidate.id === next.id
  );
}

export function useTrackTarget(options: TrackOptions = {}): TrackController {
  const { enabled = true } = options;

  const [serverTarget, setServerTarget] = useState<TrackTarget | null>(null);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [applying, startTransition] = useTransition();

  const [target, setOptimisticTarget] = useOptimistic(serverTarget);

  const writing = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let cancelled = false;

    fetchActiveTarget(controller.signal)
      .then((value) => {
        if (cancelled) return;

        setServerTarget(value);
        setStatus("live");
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;

        setServerTarget((previous) => previous ?? DEFAULT_TARGET);
        setStatus("offline");
        setError(
          cause instanceof Error
            ? cause.message
            : "Target aktif tidak diketahui",
        );
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, attempt]);

  useEffect(
    () => () => {
      if (lockTimer.current !== null) clearTimeout(lockTimer.current);
    },
    [],
  );

  const reload = useCallback((): void => {
    setAttempt((previous) => previous + 1);
  }, []);

  const select = useCallback(
    (next: TrackTarget): void => {
      if (locked || writing.current) return;
      if (sameTarget(serverTarget, next)) return;

      writing.current = true;
      setError(null);

      startTransition(async () => {
        setOptimisticTarget(next);

        try {
          const applied = await trackTarget(next);

          startTransition(() => {
            setServerTarget(applied);
            setStatus("live");
          });
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Target gagal diubah",
          );
        } finally {
          writing.current = false;
          setLocked(true);

          if (lockTimer.current !== null) clearTimeout(lockTimer.current);

          lockTimer.current = setTimeout(() => {
            lockTimer.current = null;
            setLocked(false);
          }, SERVO_LOCKOUT_MS);
        }
      });
    },
    [locked, serverTarget, setOptimisticTarget, startTransition],
  );

  return {
    target,
    status,
    applying,
    locked,
    error,
    select,
    reload,
  };
}
