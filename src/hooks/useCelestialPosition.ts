"use client";

import { POLL_MS } from "@/lib/constants";
import type { CelestialPosition, Feed, TrackTarget } from "@/types/celestial";
import { usePolling } from "./usePolling";
import { fetchCelestialPosition } from "@/lib/api/celestial";

export type PositionOptions = {
  delayMs?: number;
};

export type PositionFeed = Feed<CelestialPosition>;

function identityOf(target: TrackTarget | null): string {
  return target === null ? "" : `${target.type}/${target.id}`;
}

function requireTarget(target: TrackTarget | null): TrackTarget {
  if (target === null) throw new Error("Target is required");
  return target;
}

export function useCelestialPosition(
  target: TrackTarget | null,
  options: PositionOptions = {},
): PositionFeed {
  const { delayMs = 0 } = options;

  return usePolling(
    (signal) => fetchCelestialPosition(requireTarget(target), signal),
    {
      intervalMs: POLL_MS.position,
      enabled: target !== null,
      delayMs,
      resetKey: identityOf(target),
      originOf: (position) => position.origin,
    },
  );
}