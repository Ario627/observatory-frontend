import type { SkyPhase } from "@/types/celestial";

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SampleAltAz {
  readonly az: number;
  readonly alt: number;
  readonly azRate: number | null;
  readonly altRate: number | null;
  readonly ts: number;
}

export interface InterpolatedAzAlt {
  readonly az: number;
  readonly alt: number;
  readonly extrapolated: boolean;
  readonly stale: boolean;
}

export const OBSERVER = {
  latitude: -6.9667,
  longitude: 110.4167,
  altitudeM: 6,
  timeZone: "Asia/Jakarta",
  label: "Semarang",
} as const;

export const STARFIELD_RADIUS = 2100;
export const OBJECT_DOME_RADIUS = 2300;
export const SKY_DOME_RADIUS = 2500;
export const CAMERA_HEIGHT = 1.6;

export const FOV_DEFAULT = 55;
export const FOV_MIN = 30;
export const FOV_MAX = 90;

export const LAT_MIN = -12;
export const LAT_MAX = 86;

export const EXTRAPOLATION_LIMIT_MS = 30_000;

const DEG_TO_RAD = Math.PI / 180;
const TWILIGHT_SUN_ALT = -8;
const SUN_INTENSITY_GAIN = 1.8;
const SUN_INTENSITY_OFFSET = 0.08;
const BELOW_HORIZON_SPAN = 0.3;

export function deg2rad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

export function rad2deg(radians: number): number {
  return radians / DEG_TO_RAD;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeAz(az: number): number {
  return ((az % 360) + 360) % 360;
}

export function clampAltitude(alt: number): number {
  return clamp(alt, -90, 90);
}

export function isBelowHorizon(alt: number): boolean {
  return alt < 0;
}

export function dirFromAzAlt(az: number, alt: number): Vec3 {
  const azRad = deg2rad(az);
  const altRad = deg2rad(alt);
  const cosAlt = Math.cos(altRad);

  return {
    x: cosAlt * Math.sin(azRad),
    y: Math.sin(altRad),
    z: cosAlt * Math.cos(azRad),
  };
}

export function shortestAzDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

function toRate(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function azAltInterpolate(
  sample: SampleAltAz,
  nowMs: number,
): InterpolatedAzAlt {
  const elapsedMs = nowMs - sample.ts;
  const stale = elapsedMs > EXTRAPOLATION_LIMIT_MS;

  const az = normalizeAz(sample.az);
  const alt = clampAltitude(sample.alt);
  const azRate = toRate(sample.azRate);
  const altRate = toRate(sample.altRate);

  if (stale || elapsedMs <= 0 || (azRate === null && altRate === null)) {
    return { az, alt, extrapolated: false, stale };
  }

  const elapsedSec = elapsedMs / 1000;

  return {
    az: normalizeAz(az + (azRate ?? 0) * elapsedSec),
    alt: clampAltitude(alt + (altRate ?? 0) * elapsedSec),
    extrapolated: true,
    stale: true,
  };
}

export function skyPhaseFromSunAlt(sunAlt: number): SkyPhase {
  if (sunAlt > 0) return "day";

  return sunAlt >= TWILIGHT_SUN_ALT ? "twilight" : "night";
}

export function sunIntensityFromAlt(sunAlt: number): number {
  return clamp(
    (Math.sin(deg2rad(sunAlt)) + SUN_INTENSITY_OFFSET) * SUN_INTENSITY_GAIN,
    0,
    1,
  );
}

export interface DialPoint {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly belowHorizon: boolean;
}

export function azAltToDial(az: number, alt: number): DialPoint {
  const altitude = clampAltitude(alt);
  const belowHorizon = isBelowHorizon(altitude);
  const radius = belowHorizon
    ? 1 + (Math.abs(altitude) / 90) * BELOW_HORIZON_SPAN
    : Math.cos(deg2rad(altitude));
  const azRad = deg2rad(az);

  return {
    x: radius * Math.sin(azRad),
    y: radius * Math.cos(azRad),
    radius,
    belowHorizon,
  };
}