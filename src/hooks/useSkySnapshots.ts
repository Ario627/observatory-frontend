"use client";

import type {
  CelestialPosition,
  Feed,
  SkySnapshot,
  TrackTarget,
} from "@/types/celestial";
import { fetchCelestialPosition } from "@/lib/api/celestial";
import { POLL_MS } from "@/lib/constants";
import { usePolling } from "./usePolling";

const STAGGER_MS = 300;

export type SkyOptions = {
  enabled?: boolean;
  staggerMs?: number;
};

function identityOf(targets: readonly TrackTarget[]): string {
  return targets.map((target) => `${target.type}:${target.id}`).join("|");
}

function toSnapshot(
  target: TrackTarget,
  position: CelestialPosition,
): SkySnapshot {
  return {
    id: target.id,
    kind: position.type,
    az: position.azimuth,
    alt: position.altitude,
    azRate: position.azimuthRate,
    altRate: position.altitudeRate,
    distanceKm: position.distanceKm,
    illuminated: position.illuminated,
    visible: position.isVisible,
    ts: position.timestampMs,
  };
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();

  return new Promise((resolve) => {
    const done = (): void => {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    };

    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done);
  });
}

async function collect(
  targets: readonly TrackTarget[],
  staggerMs: number,
  signal: AbortSignal,
): Promise<SkySnapshot[]> {
  const settled = await Promise.allSettled(
    targets.map(async (targets, index) => {
      await pause(staggerMs * index, signal);

      return toSnapshot(targets, await fetchCelestialPosition(targets, signal));
    }),
  );

  const snapshots: SkySnapshot[] = [];

  let cause: unknown = null;
  let failed = 0;

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") snapshots.push(outcome.value);
    else {
      failed++;
      cause = outcome.reason;
    }
  }

  if (failed === targets.length && targets.length > 0) throw cause;

  return snapshots;
}

export function useSkySnapshots(
  targets: readonly TrackTarget[],
  options: SkyOptions = {},
): Feed<SkySnapshot[]> {
  const { enabled = true, staggerMs = STAGGER_MS } = options;

  return usePolling((signal) => collect(targets, staggerMs, signal), {
    intervalMs: POLL_MS.position,
    enabled: enabled && targets.length > 0,
    resetKey: identityOf(targets),
  });
}