import type { HardwareStatus } from "@/types/celestial";
import { ENV } from "../constants";
import { toHardwareOnline, toHardwareStatus } from "./adapter";
import { getJson } from "./client";

const BASE = "/hardware";

const mockModule = () => import("../mock");

export async function fetchHardwareStatus(
  signal?: AbortSignal,
): Promise<HardwareStatus> {
  if (ENV.mock) return (await mockModule()).mockHardwareStatus(Date.now());

  return toHardwareStatus(await getJson<unknown>(`${BASE}/status`, { signal }));
}

export async function fetchHardwareOnline(
  signal?: AbortSignal,
): Promise<boolean> {
  if (ENV.mock) return true;

  return toHardwareOnline(await getJson<unknown>(`${BASE}/online`, { signal }));
}
