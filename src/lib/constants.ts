import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/celestial";

const API_FALLBACK = "http://localhost:3001/api";
const timeoutEnv = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);

export const ENV = {
  apiBaseUrl:
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "") ||
    API_FALLBACK,
  timeoutMs: Number.isFinite(timeoutEnv) && timeoutEnv > 0 ? timeoutEnv : 8_000,
  mock: process.env.NEXT_PUBLIC_ENABLE_MOCK === "1",
} as const;

export const POLL_MS = {
  position: 5_000,
  pass: 60_000,
  hardware: 10_000,
} as const;

export type FeedKey = keyof typeof POLL_MS;

const BACKOFF_FIRST_MS = 1_000;
const BACKOFF_CEILING_MS = 30_000;

export const backoffDelay = (attempt: number): number =>
  Math.min(BACKOFF_FIRST_MS * 2 ** Math.max(0, attempt), BACKOFF_CEILING_MS);

export const MOTION = {
  fast: 150,
  base: 300,
  slow: 600,
  tick: 200,
  stagger: 80,
  easing: [0.16, 1, 0.3, 1],
} as const;

export const SERVO_LOCKOUT_MS = 3_000;
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
