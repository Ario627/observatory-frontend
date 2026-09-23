import { OBSERVER } from "./coordinates";
import { contentOf, FEATURED, keysOfKinds } from "./celestial-content";
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
import { ENV } from "./constants";

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

const MOCK_SESSION_MS = 24 * HOUR_MS;

function base64Url(text: string): string {
  return btoa(text)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

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
          Math.tan(betaRad) * Math.sin(obliquityRad),
        Math.cos(lamdaRad),
      ) / DEG,

    raRate: period === 0 ? 0 : 360 / (period * DAY_MS),
  };
}

function ephemerisOf(
  key: string,
  kind: CelestialType,
  days: number,
): Ephemeris {
  switch (kind) {
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
      );
    }

    case "satellite": {
      return {
        dec: ISS_INCLINATION * signedOf(key, "dec"),
        ra: 360 * unitOf(key, "ra"),
        raRate: 0,
      };
    }

    default: {
      const peroid = SIDEREAL_DAYS[key] ?? TROPICAL_YEAR;

      return equatorialOf(
        360 * (days / peroid + unitOf(key, "lamda")),
        0,
        peroid,
      );
    }
  }
}

type Horizontal = {
  alt: number;
  az: number;
  altRate: number | null;
  azRate: number | null;
};

function horizontalOf(
  dec: number,
  hourAngle: number,
  lat: number,
  hourAngleRate: number | null,
): Horizontal {
  const decRad = dec * DEG;
  const latRad = lat * DEG;
  const haRad = hourAngle * DEG;

  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinDec = Math.sin(decRad);
  const cosDec = Math.cos(decRad);
  const sinHour = Math.sin(haRad);
  const cosHour = Math.cos(haRad);

  const alt =
    Math.asin(clamp(sinLat * sinDec + cosLat * cosDec * cosHour, -1, 1)) / DEG;
  const az =
    Math.atan2(-cosDec * sinHour, cosLat * sinDec - sinLat * cosDec * cosHour) /
    DEG;

  const cosAlt = Math.cos(alt * DEG);

  if (cosAlt <= 1e-4) {
    return { alt, az: wrapAz(az), altRate: 0, azRate: 0 };
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

function solarHours(atMs: number): number {
  return ((atMs / DAY_MS) % 24) + OBSERVER.longitude / DEGREES_PER_HOUR;
}

function hourAngleOf(ep: Ephemeris, sunRa: number, atMs: number): number {
  return DEGREES_PER_HOUR * (solarHours(atMs) - 12) + (sunRa - ep.ra);
}

function hourAngleRateOf(ep: Ephemeris): number {
  return DEGREES_PER_HOUR / SECONDS_PER_HOUR - ep.raRate;
}

function distanceOf(
  key: string,
  kind: CelestialType,
  days: number,
  sunL: number,
): number | null {
  if (kind === "star") return null;
  if (kind === "sun") return AU_KM;
  if (kind === "moon") {
    return (
      MOON_MEAN_DISTANCE_KM -
      (MOON_DISTANCE_SWING_KM * Math.cos(2 * Math.PI * days)) /
        ANOMALISTIC_MONTH
    );
  }

  if (kind === "satellite")
    return ISS_MEAN_ALTITUDE_KM + 12 + Math.sin((2 * Math.PI * days) / 0.3);

  const semiMajor = SEMI_MAJOR_AU[key] ?? 1;
  const lamda =
    360 * (days / (SIDEREAL_DAYS[key] ?? TROPICAL_YEAR) + unitOf(key, "lamda"));

  const elongation = (lamda - sunL + 100) * DEG;

  return (
    AU_KM *
    Math.sqrt(1 + semiMajor * semiMajor - 2 * semiMajor * Math.cos(elongation))
  );
}

function toTarget(key: string): TrackTarget {
  return { type: contentOf(key)?.kind ?? "planet", id: key };
}

function separationFromSun(
  sunAlt: number,
  sunAz: number,
  alt: number,
  az: number,
): number {
  return (
    Math.acos(
      clamp(
        Math.sin(sunAlt * DEG) * Math.sin(alt * DEG) +
          Math.cos(sunAlt * DEG) *
            Math.cos(alt * DEG) *
            Math.cos((sunAz - az) * DEG),
        -1,
        1,
      ),
    ) / DEG
  );
}

export function mockCelestialPosition(
  target: TrackTarget,
  atMs: number,
): CelestialPosition {
  const key = target.id.trim().toLowerCase();
  const content = contentOf(key);
  const kind = content?.kind ?? "satellite";
  const days = atMs / DAY_MS;

  const sun = ephemerisOf("sun", "sun", days);
  const sunHorizontal = horizontalOf(
    sun.dec,
    DEGREES_PER_HOUR * (solarHours(atMs) - 12),
    OBSERVER.latitude,
    DEGREES_PER_HOUR / SECONDS_PER_HOUR - sun.raRate,
  );

  const body = ephemerisOf(key, kind, days);
  const { alt, az, altRate, azRate } = horizontalOf(
    body.dec,
    hourAngleOf(body, sun.ra, atMs),
    OBSERVER.latitude,
    hourAngleRateOf(body),
  );

  const distanceKm = distanceOf(
    key,
    kind,
    days,
    (360 * (days - MARCH_EQUINOX_DAY)) / TROPICAL_YEAR,
  );

  return {
    name: content?.label ?? target.id,
    type: kind,
    azimuth: az,
    altitude: alt,
    distanceKm: distanceKm === null ? null : round(distanceKm, 1),
    distanceAu: distanceKm === null ? null : round(distanceKm / AU_KM, 6),
    azimuthRate: azRate,
    altitudeRate: altRate,
    angularRate:
      azRate === null || altRate === null ? null : Math.hypot(azRate, altRate),
    isVisible: alt > 0,
    illuminated:
      kind === "satellite"
        ? separationFromSun(sunHorizontal.alt, sunHorizontal.az, alt, az) <
          180 - EARTH_SHADOW_RADIUS
        : null,
    servoAzimuth: Math.round((az / 360) * 180),
    servoAltitude: Math.round(clamp(alt, -90, 90) + 90),
    timestamp: new Date(atMs).toISOString(),
    timestampMs: atMs,
    origin: "mock",
  };
}

export function mockPassInfo(
  target: TrackTarget,
  nowMs: number,
): PassInfo | null {
  const key = target.id.trim().toLowerCase();
  const content = contentOf(key);
  if (content?.kind !== "satellite" && content?.kind !== "moon") return null;

  const days = nowMs / DAY_MS;
  const sun = ephemerisOf("sun", "sun", days);
  const body = ephemerisOf(key, content.kind, days);
  const latitude = OBSERVER.latitude;

  const cosThreshold =
    (Math.sin(PASS_MIN_ALTITUDE * DEG) -
      Math.sin(latitude * DEG) * Math.sin(body.dec * DEG)) /
    (Math.cos(latitude * DEG) * Math.cos(body.dec * DEG));
  if (Math.abs(cosThreshold) > 1) return null;

  const half = Math.acos(cosThreshold) / DEG;
  const current = hourAngleOf(body, sun.ra, nowMs);
  const hoursPerTurn =
    360 / (DEGREES_PER_HOUR / SECONDS_PER_HOUR - body.raRate);
  const turn = Math.ceil((current + half) / 360);
  const toRise = (turn * 360 - half - current) / DEGREES_PER_HOUR;

  const aosMs = nowMs + toRise * HOUR_MS;
  const losMs = nowMs + (toRise + (2 * half * hoursPerTurn) / 24) * HOUR_MS;

  const aos = horizontalOf(
    body.dec,
    current + DEGREES_PER_HOUR * toRise,
    latitude,
    0,
  );
  const los = horizontalOf(
    body.dec,
    current + DEGREES_PER_HOUR * (toRise + (2 * half * hoursPerTurn) / 24),
    latitude,
    0,
  );

  return {
    name: content.label,
    nextAos: new Date(aosMs).toISOString(),
    nextLos: new Date(losMs).toISOString(),
    durationSeconds: Math.round((losMs - aosMs) / 1_000),
    maxAltitude: round(90 - Math.abs(latitude - body.dec), 1),
    aosAzimuth: round(aos.az, 1),
    losAzimuth: round(los.az, 1),
  };
}

const SUN_CLEARANCE = 0.02;

type Drift = {
  periodMs: number;
  phase: number;
  base: number;
  swing: number;
};

const DRIFT = {
  ambient: { periodMs: 30 * 60_000, phase: 0, base: 27.5, swing: 2.4 },
  humidity: { periodMs: 30 * 60_000, phase: Math.PI, base: 64, swing: 6 },
  pan: { periodMs: 214_000, phase: 0, base: 90, swing: 88 },
  tilt: { periodMs: 331_000, phase: 0, base: 90, swing: 74 },
  link: { periodMs: 214_000, phase: Math.PI / 2, base: -58, swing: 9 },
} satisfies Record<string, Drift>;

const PACK_MIN_VOLTS = 3.2;
const PACK_MAX_VOLTS = 4.15;
const CHARGE_VOLTS = 4.9;
const MANUAL_TRIGGER_SHARE = 0.2;
const ISS_NORAD_ID = 25_544;

function driftOf(field: Drift, elapsedMs: number): number {
  return (
    field.base +
    field.swing *
      Math.sin((2 * Math.PI * elapsedMs) / field.periodMs + field.phase)
  );
}

export function mockHardwareStatus(atMs: number): HardwareStatus {
  const elapsed = atMs - BOOT_MS;
  const span = BATTERY_CEILING - BATTERY_FLOOR;
  const cycle = (elapsed % BATTERY_CYCLE_MS) / BATTERY_CYCLE_MS;
  const charging = cycle >= DISCHARGE_SHARE;
  const batteryPercent = round(
    charging
      ? BATTERY_FLOOR +
          span * ((cycle - DISCHARGE_SHARE) / (1 - DISCHARGE_SHARE))
      : BATTERY_CEILING - span * (cycle / DISCHARGE_SHARE),
    1,
  );

  const charge = (batteryPercent - BATTERY_FLOOR) / span;

  return {
    batteryPercent,
    voltage: round(
      PACK_MIN_VOLTS + (PACK_MAX_VOLTS - PACK_MIN_VOLTS) * charge,
      2,
    ),
    solarVoltage: charging ? CHARGE_VOLTS : null,
    temperature: round(driftOf(DRIFT.ambient, elapsed), 1),
    humidity: round(driftOf(DRIFT.humidity, elapsed), 0),
    servoAzAngle: round(driftOf(DRIFT.pan, elapsed), 0),
    servoAltAngle: round(driftOf(DRIFT.tilt, elapsed), 0),
    wifiRssi: round(driftOf(DRIFT.link, elapsed), 0),
    uptimeSeconds: Math.floor(elapsed / 1_000),
    loraEnabled: true,
    cameraReady: true,
    lastSeen: new Date(atMs).toISOString(),
    lastSeenMs: atMs,
    isOnline: true,
  };
}

export function mockCaptureHistory(
  page: number,
  limit: number,
  atMs: number,
): CaptureHistory {
  const safeLimit = clamp(Math.trunc(limit), 1, MAX_PAGE_SIZE);

  const safePage = Math.max(1, Math.trunc(page));
  const offset = (safePage - 1) * safeLimit;
  const items: CaptureItem[] = [];

  for (let i = 0; i < safeLimit; i++) {
    const sequence = offset + i;
    if (sequence >= CAPTURE_TOTAL) break;

    const id = CAPTURE_TOTAL - sequence;
    const takenMs = atMs - CAPTURE_GAP_MS * (sequence + 1);
    const position = mockCelestialPosition(
      toTarget(FEATURED[sequence % FEATURED.length]),
      takenMs,
    );

    items.push({
      id,
      filename: `capture_${String(id).padStart(4, "0")}.jpg`,
      objectName: position.name,
      azimuth: round(position.azimuth, 1),
      altitude: round(position.altitude, 1),
      triggerReason:
        unitOf(String(id), "trigger") < MANUAL_TRIGGER_SHARE
          ? "manual"
          : "auto",
      timestamp: new Date(takenMs).toISOString(),
      timestampMs: takenMs,
      imageUrl: `${ENV.apiBaseUrl}/capture/${id}/image`,
    });
  }

  return { items, total: CAPTURE_TOTAL, page: safePage, limit: safeLimit };
}

export function mockObjectsCatalog(): ObjectsCatalog {
  return {
    planets: keysOfKinds("sun", "moon", "planet"),
    stars: keysOfKinds("star"),
    satellites: [{ name: "ISS", noradId: ISS_NORAD_ID, endpoint: "/iss" }],
  };
}

export function mockAccessToken(atMs: number): string {
  const header = base64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      role: "operator",
      deviceId: "mock",
      mock: true,
      exp: Math.floor((atMs + MOCK_SESSION_MS) / 1_000),
    }),
  );

  return `${header}.${claims}.mock`;
}