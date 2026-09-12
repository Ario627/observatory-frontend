export const CELESTIAL_TYPES = [
  "satellite",
  "planet",
  "moon",
  "sun",
  "star",
] as const;

export type CelestialType = (typeof CELESTIAL_TYPES)[number];

export const GATEWAY_TYPE_ALIASES = {
  iss: "satellite",
} as const satisfies Record<string, CelestialType>;

export function isCelestialType(value: unknown): value is CelestialType {
  return (
    typeof value === "string" &&
    (CELESTIAL_TYPES as readonly string[]).includes(value)
  );
}

export function normalizeGatewayType(value: string): CelestialType | null {
  if (isCelestialType(value)) return value;

  const aliased =
    GATEWAY_TYPE_ALIASES[value as keyof typeof GATEWAY_TYPE_ALIASES];

  return aliased ?? null;
}

export type FeedStatus = "loading" | "live" | "stale" | "offline";

export type DataOrigin = "live" | "sim" | "mock";

export interface Feed<T> {
  readonly data: T | null;
  readonly status: FeedStatus;
  readonly origin: DataOrigin;
  readonly updatedAtMs: number | null;
  readonly error: Error | null;
  readonly refresh: () => Promise<void>;
}

export interface CelestialPosition {
  readonly name: string;
  readonly type: CelestialType;
  readonly azimuth: number;
  readonly altitude: number;
  readonly distanceKm: number | null;
  readonly distanceAu: number | null;
  readonly azimuthRate: number | null;
  readonly altitudeRate: number | null;
  readonly angularRate: number | null;
  readonly isVisible: boolean;
  readonly illuminated: boolean | null;
  readonly servoAzimuth: number | null;
  readonly servoAltitude: number | null;
  readonly timestamp: string;
  readonly timestampMs: number;
  readonly origin: DataOrigin;
}

export interface PassInfo {
  readonly name: string;
  readonly nextAos: string | null;
  readonly nextLos: string | null;
  readonly durationSeconds: number | null;
  readonly maxAltitude: number | null;
  readonly aosAzimuth: number | null;
  readonly losAzimuth: number | null;
}

export interface SatelliteEntry {
  readonly name: string;
  readonly noradId: number;
  readonly endpoint: string;
}

export interface ObjectsCatalog {
  readonly planets: readonly string[];
  readonly stars: readonly string[];
  readonly satellites: readonly SatelliteEntry[];
}

export interface HardwareStatus {
  readonly batteryPercent: number;
  readonly voltage: number;
  readonly solarVoltage: number | null;
  readonly temperature: number | null;
  readonly humidity: number | null;
  readonly servoAzAngle: number;
  readonly servoAltAngle: number;
  readonly wifiRssi: number | null;
  readonly uptimeSeconds: number;
  readonly loraEnabled: boolean;
  readonly cameraReady: boolean;
  readonly lastSeen: string;
  readonly lastSeenMs: number;
  readonly isOnline: boolean;
}

export interface CaptureItem {
  readonly id: number;
  readonly filename: string;
  readonly objectName: string | null;
  readonly azimuth: number | null;
  readonly altitude: number | null;
  readonly triggerReason: "auto" | "manual";
  readonly timestamp: string;
  readonly timestampMs: number;
  readonly imageUrl: string;
}

export interface CaptureHistory {
  readonly items: readonly CaptureItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface TrackTarget {
  readonly type: CelestialType;
  readonly id: string;
}

export interface SkySnapshot {
  readonly id: string;
  readonly kind: CelestialType;
  readonly az: number;
  readonly alt: number;
  readonly azRate: number | null;
  readonly altRate: number | null;
  readonly distanceKm: number | null;
  readonly visible: boolean;
  readonly ts: number;
}


export const SKY = ["day", "night", "twilight"] as const;
export type SkyPhase = (typeof SKY)[number];