"use client";
import { POLL_MS } from "@/lib/constants";
import type { Feed, HardwareStatus } from "@/types/celestial";
import { usePolling } from "./usePolling";
import { fetchHardwareStatus } from "../lib/api/hardware";

export type HardwareFeed = Feed<HardwareStatus>;

export type HardwareOptions = {
  enabled?: boolean;
};


export function useHardwareStatus(
    options: HardwareOptions = {},
): HardwareFeed {
    const { enabled = true } = options;

    return usePolling((Signal) => fetchHardwareStatus(Signal), {
        intervalMs: POLL_MS.hardware,
        enabled,
    })
}