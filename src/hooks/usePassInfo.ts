"use client";

import { POLL_MS } from "@/lib/constants";
import type { Feed, PassInfo, TrackTarget } from "@/types/celestial";
import { usePolling } from "./usePolling";
import { fetchPassInfo } from "@/lib/api/celestial";

export type PassFeed = Feed<PassInfo | null>;

function hasPasses(target: TrackTarget | null): boolean {
  return (
    target !== null && (target.type === "iss" || target.type === "satellite")
  );
}

function identityOf(target: TrackTarget | null): string {
  return target === null ? "" : `${target.type}:${target.id}`;
}

function requireTarget(target: TrackTarget | null): TrackTarget {
  if (target === null) throw new Error("Target belum dipilih");

  return target;
}

export function usePassInfo(target: TrackTarget | null): PassFeed {
  return usePolling((signal) => fetchPassInfo(requireTarget(target), signal), {
    intervalMs: POLL_MS.pass,
    enabled: hasPasses(target),
    resetKey: identityOf(target),
  });
}


