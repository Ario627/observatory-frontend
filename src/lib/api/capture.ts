import type { CaptureHistory } from "@/types/celestial";
import { CAPTURE_PAGE_SIZE, ENV } from "../constants";
import { clamp } from "../coordinates";
import { toFiniteNumber } from "../format";
import { toCaptureHistory } from "./adapter";
import { getJson, postJson } from "./client";


const BASE = "/capture";
const MAX_LIMIT = 100;

const mockModule = () => import("../mock");

export async function fetchCaptureHistory(
  query: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
): Promise<CaptureHistory> {
  const page = Math.max(1, Math.trunc(toFiniteNumber(query.page) ?? 1));
  const limit = clamp(
    Math.trunc(toFiniteNumber(query.limit) ?? CAPTURE_PAGE_SIZE),
    1,
    MAX_LIMIT,
  );

  if (ENV.mock)
    return (await mockModule()).mockCaptureHistory(page, limit, Date.now());

  return toCaptureHistory(
    await getJson<unknown>(`${BASE}/history`, {
      signal,
      params: { page, limit },
    }),
  );
}

export async function triggerCapture(signal?: AbortSignal): Promise<void> {
  if (ENV.mock) return;

  await postJson<unknown>(BASE, undefined, { signal });
}