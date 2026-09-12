export const CELESTIAL_TYPES = [
  "satellite",
  "planet",
  "moon",
  "sun",
  "star",
] as const;

export const GATEWAY_TYPES = [...CELESTIAL_TYPES, "iss"] as const;

export type CelestialType = (typeof CELESTIAL_TYPES)[number];
export type GatewayType = (typeof GATEWAY_TYPES)[number];

function literalGuard<T extends string>(values: readonly T[]) {
  const allowed = new Set<string>(values);

  return (value: unknown): value is T =>
    typeof value === "string" && allowed.has(value);
}

export const isCelestialType = literalGuard(CELESTIAL_TYPES);
export const isGatewayType = literalGuard(GATEWAY_TYPES);

export function toGatewayType(value: unknown): GatewayType | null {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";

  return isGatewayType(key) ? key : null;
}

export function toCelestialType(value: unknown): CelestialType | null {
  const gateway = toGatewayType(value);

  if (gateway === null) return null;

  return gateway === "iss" ? "satellite" : gateway;
}

export type FeedStatus = "loading" | "live" | "stale" | "offline";

export type DataOrigin = "live" | "sim" | "mock";

export type Feed<T> = {
  data: T | null;
  status: FeedStatus;
  origin: DataOrigin;
  updatedAtMs: number | null;
  error: string | null;
  refresh: () => void;
};

export type ServerEnvelope<T> = {
  data: T;
  timestamp: string;
  success: boolean;
};

export type ApiErrorBody = {
  statusCode: number;
  message: string[];
  error: string;
  timestamp: string;
  path: string;
};

export type ServoSpeed = "slow" | "normal" | "fast";
export type ServoSource = "auto" | "manual";
export type LoraDirection = "inbound" | "outbound";
export type CaptureReason = "auto" | "manual";

export const SKY_PHASES = ["day", "twilight", "night"] as const;

export type SkyPhase = (typeof SKY_PHASES)[number];

export type CelestialPosition = {
  name: string;
  type: CelestialType;
  azimuth: number;
  altitude: number;
  distanceKm: number | null;
  distanceAu: number | null;
  azimuthRate: number | null;
  altitudeRate: number | null;
  angularRate: number | null;
  isVisible: boolean;
  illuminated: boolean | null;
  servoAzimuth: number | null;
  servoAltitude: number | null;
  timestamp: string;
  timestampMs: number;
  origin: DataOrigin;
};

export type PassInfo = {
  name: string;
  nextAos: string | null;
  nextLos: string | null;
  durationSeconds: number | null;
  maxAltitude: number | null;
  aosAzimuth: number | null;
  losAzimuth: number | null;
};

export type SatelliteEntry = {
  name: string;
  noradId: number;
  endpoint: string;
};

export type ObjectsCatalog = {
  planets: readonly string[];
  stars: readonly string[];
  satellites: readonly SatelliteEntry[];
};

export type HardwareStatus = {
  batteryPercent: number;
  voltage: number;
  solarVoltage: number | null;
  temperature: number | null;
  humidity: number | null;
  servoAzAngle: number;
  servoAltAngle: number;
  wifiRssi: number | null;
  uptimeSeconds: number;
  loraEnabled: boolean;
  cameraReady: boolean;
  lastSeen: string;
  lastSeenMs: number;
  isOnline: boolean;
};

export type CaptureItem = {
  id: number;
  filename: string;
  objectName: string | null;
  azimuth: number | null;
  altitude: number | null;
  triggerReason: CaptureReason;
  timestamp: string;
  timestampMs: number;
  imageUrl: string;
};

export type CaptureHistory = {
  items: readonly CaptureItem[];
  total: number;
  page: number;
  limit: number;
};

export type TrackTarget = {
  type: GatewayType;
  id: string;
};

export type AuthSession = {
  accessToken: string;
  expiresAtMs: number | null;
};

export type SkySnapshot = {
  id: string;
  kind: CelestialType;
  az: number;
  alt: number;
  azRate: number | null;
  altRate: number | null;
  distanceKm: number | null;
  visible: boolean;
  ts: number;
};


export type CelestialUpdatePayload = {
  name: string;
  type: CelestialType;
  azimuth: number;
  altitude: number;
  distanceKm: number | null;
  distanceAu: number | null;
  azimuthRate: number | null;
  altitudeRate: number | null;
  nextAos: string | null;
  nextLos: string | null;
  passDuration: number | null;
  maxAltitude: number | null;
  aosAzimuth: number | null;
  losAzimuth: number | null;
  isVisible: boolean;
  illuminated: boolean | null;
  servoAzimuth: number;
  servoAltitude: number;
  timestamp: string;
};

export type PassAlertPayload = {
  objectName: string;
  nextAos: string | null;
  nextLos: string | null;
  duration: number | null;
  maxAltitude: number | null;
  aosAzimuth: number | null;
  losAzimuth: number | null;
};

export type CaptureCompletedPayload = {
  id: number;
  filename: string;
  triggerReason: CaptureReason;
  objectName: string | null;
  azimuth: number | null;
  altitude: number | null;
  fileSize: number;
  timestamp: string;
};

export type LoraMessagePayload = {
  id: number;
  direction: LoraDirection;
  message: string;
  rssi: number | null;
  snr: number | null;
  timestamp: string;
};

export type MqttStatusPayload = {
  connected: boolean;
};

export type ServoCommandPayload = {
  azimuth: number;
  altitude: number;
  speed: ServoSpeed;
  source: ServoSource;
};

export type ManualServoPayload = {
  azimuth: number;
  altitude: number;
};

export type WsErrorPayload = {
  message: string;
  code: string;
  status: number;
  timestamp: string;
};

export type LiveSnapshotPayload = {
  celestial: CelestialUpdatePayload | null;
  hardware: HardwareStatus | null;
  target: TrackTarget | null;
  mqttConnected: boolean;
  serverTime: string;
};

export type ServerToClientEvents = {
  snapshot: (payload: LiveSnapshotPayload) => void;
  "celestial:update": (payload: CelestialUpdatePayload) => void;
  "hardware:update": (payload: HardwareStatus) => void;
  "pass:alert": (payload: PassAlertPayload) => void;
  "capture:completed": (payload: CaptureCompletedPayload) => void;
  "lora:message": (payload: LoraMessagePayload) => void;
  "mqtt:status": (payload: MqttStatusPayload) => void;
  "target:changed": (payload: TrackTarget) => void;
  "servo:command": (payload: ServoCommandPayload) => void;
  error: (payload: WsErrorPayload) => void;
};

export type ClientToServerEvents = {
  ping: () => void;
  "servo:manual": (payload: ManualServoPayload) => void;
};
