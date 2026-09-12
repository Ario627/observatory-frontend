import { OBSERVER } from "./coordinates";
import { contentOf, keysOfKinds } from "./celestial-content";
import type {
  CaptureHistory,
  CaptureItem,
  CelestialPosition,
  CelestialType,
  HardwareStatus,
  ObjectsCatalog,
  PassInfo,
  TrackTarget,
} from "@/types/celestial";
import { degrees } from "framer-motion";

const DEG = Math.PI / 180;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const AU_KM = 149_597_871;
const OBLIQUITY = 23.4393;
const MOON_LATITUDE = 5.145;
const ISS_INCLINATION = 51.64;
const TROPICAL_YEAR = 365.2422;
const SIDEREAL_MONTH = 27.3217;
const ANOMALISTIC_MONTH = 27.5546;
const MARCH_EQUINOX_DAY = 79;
const DEGREES_PER_HOUR = 15;
const SECONDS_PER_HOUR = 3_600;
const EARTH_SHADOW_RADIUS = 70.1;
const PASS_MIN_ALTITUDE = 10;

const CAPTURE_TOTAL = 47;
const CAPTURE_GAP_MS = 17 * 60_000;
const MAX_PAGE_SIZE = 100;
const BOOT_MS = Date.UTC(2026, 0, 1);
const BATTERY_FLOOR = 24;
const BATTERY_CEILING = 100;
const BATTERY_CYCLE_MS = 6 * HOUR_MS;
const DISCHARGE_SHARE = 0.75;
const ISS_MEAN_ALTITUDE_KM = 415;
const MOON_MEAN_DISTANCE_KM = 384_400;
const MOON_DISTANCE_SWING_KM = 20_905;

const SIDEREAL_DAYS: Partial<Record<string, number>> = {
  mercury: 87.969,
  venus: 224.701,
  mars: 686.98,
  jupiter: 4332.589,
  saturn: 10759.22,
  uranus: 30685.4,
  neptune: 60189,
  pluto: 90560,
};

const SEMI_MAJOR_AU: Partial<Record<string, number>> = {
  mercury: 0.3871,
  venus: 0.7233,
  mars: 1.5237,
  jupiter: 5.2029,
  saturn: 9.537,
  uranus: 19.189,
  neptune: 30.07,
  pluto: 39.48,
};

const STAR_DECLINATION: Partial<Record<string, number>> = {
  sirius: -16.716,
  canopus: -52.696,
  arcturus: 19.182,
  vega: 38.784,
  capella: 45.998,
  rigel: -8.202,
  procyon: 5.225,
  betelgeuse: 7.407,
  altair: 8.868,
  aldebaran: 16.509,
  spica: -11.161,
  antares: -26.432,
  polaris: 89.264,
  deneb: 45.28,
  fomalhaut: -29.622,
  regulus: 11.967,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
const wrapAz = (degrees: number): number => ((degrees % 360) + 360) % 360;

const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const frac = (value: number): number => value - Math.floor(value);

function mix32(seed: number): number {
  let state = (seed + 0x9e3779b9) | 0;
  let mixed = state ^ (state >>> 16);

  mixed = Math.imul(mixed, 0x21f0aaad) | 0;
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x735a2d97);

  return (mixed ^ (mixed >>> 15)) >>> 0;
}

function hash32(text: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) | 0;
  }
  return mix32(hash);
}

const unitOf = (text: string, salt: string): number =>
  hash32(`${salt}:${text}`) / 4_294_967_296;

const signedOf = (text: string, salt: string): number =>
  unitOf(text, salt) * 2 - 1;

type Ephemeris = {
  dec: number;
  ra: number;
  raRate: number;
};

function equatorialOf(lamda: number, beta: number, period: number): Ephemeris {
    const lamdaRad = lamda * DEG;
    const betaRad = beta * DEG;
    const obliquityRad = OBLIQUITY * DEG;

    return {
        dec:
            Math.asin(
                Math.sin(betaRad) * Math.cos(obliquityRad) +
                Math.cos(betaRad) * Math.sin(obliquityRad) * Math.sin(lamdaRad),
            ) / DEG,

        ra: 
            Math.atan2(
                Math.sin(lamdaRad) * Math.cos(obliquityRad) - 
                    Math.tan(betaRad) *  Math.sin(obliquityRad),
                Math.cos(lamdaRad),
            ) / DEG,

        raRate: period === 0 ? 0 : 360 / (period * DAY_MS),

    }
}

function ephemerisOf(key: string, kind: CelestialType, days: number): Ephemeris {
    switch(kind ) {
        case "sun": {
            return equatorialOf(
                (360 * (days / MARCH_EQUINOX_DAY)) % TROPICAL_YEAR,
                0,
                TROPICAL_YEAR,
            );
        }

        case "moon": {
            return equatorialOf(
                360 * (days / SIDEREAL_MONTH + unitOf(key, "lamda")),
                MOON_LATITUDE,
                SIDEREAL_MONTH,
            )
        }

        case "satellite": {
            return {
                dec: ISS_INCLINATION * signedOf(key, "dec"),
                ra: 360 * unitOf(key, "ra"),
                raRate: 0,
            }
        }

        default: {
            const peroid = SIDEREAL_DAYS[key] ?? TROPICAL_YEAR


            return equatorialOf(
                360 * (days / peroid + unitOf(key, "lamda")),
                0,
                peroid,
            )
        }
    }
}

type Horizontal = {
    alt: number;
    az: number;
    altRate: number | null;
    azRate: number | null;
}

function horizontalOf(dec: number, hourAngle: number, lat: number, hourAngleRate: number | null): Horizontal {
    const decRad = dec * DEG;
    const latRad = lat * DEG;
    const haRad = hourAngle * DEG;

    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const sinDec = Math.sin(decRad);
    const cosDec = Math.cos(decRad);
    const sinHour = Math.sin(haRad);
    const cosHour = Math.cos(haRad);

    const alt = Math.asin( clamp(sinLat * sinDec + cosLat * cosDec * cosHour, -1, 1)) / DEG;
    const az =
      Math.atan2(
        -cosDec * sinHour,
        cosLat * sinDec - sinLat * cosDec * cosHour,
    ) / DEG;

    const cosAlt = Math.cos(alt * DEG);

    if(cosAlt <= 1e-4) {
        return {alt, az: wrapAz(az), altRate: 0, azRate: 0};
    }

    return {
      alt,
      az: wrapAz(az),
      altRate: ((-cosLat * cosDec * sinHour) / cosAlt) * hourAngleRate!,
      azRate:
        ((sinLat * cosDec * cosDec - cosLat * sinDec * cosDec * cosHour) /
          (cosAlt * cosAlt)) *
        hourAngleRate!,
    };
}