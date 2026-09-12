import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/celestial";

export { EXTRAPOLATION_LIMIT_MS as STALE_AFTER_MS } from "@/lib/coordinates";

const FALLBACK_API_BASE_URL = "http://localhost:3001/api";

function positive(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const ENV = {
  apiBaseUrl:
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "") ||
    FALLBACK_API_BASE_URL,
  timeoutMs: positive(process.env.NEXT_PUBLIC_API_TIMEOUT_MS, 8_000),
  mock: process.env.NEXT_PUBLIC_ENABLE_MOCK === "1",
} as const;

export const POLL_MS = {
  position: 5_000,
  pass: 60_000,
  hardware: 10_000,
} as const;

export const BACKOFF_MS = {
  start: 1_000,
  cap: 30_000,
} as const;

export const MOTION_MS = {
  fast: 150,
  med: 300,
  slow: 600,
  tick: 200,
} as const;

export const STAGGER_MS = 80;
export const CAPTURE_PAGE_SIZE = 12;
export const CATALOG_TTL_MS = 300_000;

const SERVER_EVENTS = {
  snapshot: "snapshot",
  celestial: "celestial:update",
  hardware: "hardware:update",
  pass: "pass:alert",
  capture: "capture:completed",
  lora: "lora:message",
  mqtt: "mqtt:status",
  target: "target:changed",
  servo: "servo:command",
  error: "error",
} as const satisfies Record<string, keyof ServerToClientEvents>;

const CLIENT_EVENTS = {
  ping: "ping",
  manualServo: "servo:manual",
} as const satisfies Record<string, keyof ClientToServerEvents>;

export const WS = {
  namespace: "events",
  server: SERVER_EVENTS,
  client: CLIENT_EVENTS,
} as const;

export type FeedKey = keyof typeof POLL_MS;
