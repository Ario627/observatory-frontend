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

