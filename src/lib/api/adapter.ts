import type {
  CaptureHistory,
  CaptureItem,
  CelestialPosition,
  CelestialType,
  GatewayType,
  HardwareStatus,
  ObjectsCatalog,
  PassInfo,
  SatelliteEntry,
  TrackTarget,
} from "@/types/celestial";
import { toCelestialType, toGatewayType } from "@/types/celestial";
import { ENV } from "../constants";
import { clamp, clampAltitude, normalizeAz } from "../coordinates";
import { toFiniteNumber } from "../format";
import { ApiError } from "./client";

const ISO_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const EPOCH_ISO = new Date(0).toISOString();

const HEARTBEAT_TIMEOUT_MS = 30_000;
const SERVO_MAX_ANGLE = 180;
const ABSOLUTE_URL = /^https?:\/\//i;

type RawRecord = Record<string, unknown>;

function contact(where: string, detail: string): ApiError {
  return new ApiError("contract", `Contract violation in ${where}: ${detail}`);
}

function asRecord(raw: unknown, where: string): RawRecord {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    throw contact(where, `expected object, got ${typeof raw}`);

  return raw as RawRecord;
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

function asIso(value: unknown): string | null {
  const text = asText(value);

  if (text === null || !ISO_OFFSET.test(text)) return null;

  return Number.isNaN(Date.parse(text)) ? null : text;
}

function asBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function listAt(raw: RawRecord, key: string): unknown[] {
  const value = raw[key];

  return Array.isArray(value) ? value : [];
}

function numberAt(raw: RawRecord, key: string): number | null {
  return toFiniteNumber(raw[key]);
}

function textAt(raw: RawRecord, key: string): string | null {
  return asText(raw[key]);
}

function boolAt(raw: RawRecord, key: string): boolean | null {
  return asBool(raw[key]);
}

function isoAt(raw: RawRecord, key: string): string | null {
  return asIso(raw[key]);
}

function needNumber(raw: RawRecord, key: string, where: string): number {
  const value = numberAt(raw, key);

  if (value === null)
    throw contact(where, `field "${key}" is not a finite number`);

  return value;
}

function needText(raw: RawRecord, key: string, where: string): string {
  const value = textAt(raw, key);

  if (value === null)
    throw contact(where, `field "${key}" is missing or empty`);

  return value;
}

function needIso(
  raw: RawRecord,
  key: string,
  where: string,
): { iso: string; ms: number } {
  const iso = isoAt(raw, key);
  const ms = iso === null ? Number.NaN : Date.parse(iso);

  if (!Number.isFinite(ms))
    throw contact(where, `field "${key}" is not an ISO 8601 timestamp`);

  return { iso: iso as string, ms };
}

function needKind(raw: RawRecord, where: string): CelestialType {
  const kind = toCelestialType(raw.type);

  if (kind === null)
    throw contact(
      where,
      `field "type" is not a celestial type: ${String(raw.type)}`,
    );

  return kind;
}

function needType(raw: RawRecord, where: string): GatewayType {
  const type = toGatewayType(raw.type);

  if (type === null)
    throw contact(
      where,
      `field "type" is not a gateway type: ${String(raw.type)}`,
    );

  return type;
}

function textListAt(raw: RawRecord, key: string): string[] {
  const seen = new Set<string>();
  const texts: string[] = [];

  for (const entry of listAt(raw, key)) {
    const text = asText(entry);

    if (text === null || seen.has(text)) continue;

    seen.add(text);
    texts.push(text);
  }

  return texts;
}

function satellitesAt(raw: RawRecord, key: string): SatelliteEntry[] {
  const satellites: SatelliteEntry[] = [];

  for (const entry of listAt(raw, key)) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry))
      continue;

    const record = entry as RawRecord;
    const name = asText(record.name);
    const noradId = numberAt(record, "noradId");

    if (name === null || noradId === null) continue;

    satellites.push({
      name,
      noradId,
      endpoint: textAt(record, "endpoint") ?? "",
    });
  }

  return satellites;
}


function imageUrlOf(raw: RawRecord, id: number): string {
  const direct = textAt(raw, "imageUrl");

  if (direct !== null && ABSOLUTE_URL.test(direct)) return direct;

  return `${ENV.apiBaseUrl}/capture/${id}/image`;
}

export function toCelestialPosition(raw: unknown): CelestialPosition {
  const where = "celestial.position";
  const record = asRecord(raw, where);
  const azimuth = needNumber(record, "azimuth", where);
  const altitude = needNumber(record, "altitude", where);
  const stamp = needIso(record, "timestamp", where);
  const azimuthRate = numberAt(record, "azimuthRate");
  const altitudeRate = numberAt(record, "altitudeRate");
  const clampedAltitude = clampAltitude(altitude);

  return {
    name: needText(record, "name", where),
    type: needKind(record, where),
    azimuth: normalizeAz(azimuth),
    altitude: clampedAltitude,
    distanceKm: numberAt(record, "distanceKm"),
    distanceAu: numberAt(record, "distanceAu"),
    azimuthRate,
    altitudeRate,
    angularRate:
      numberAt(record, "angularRate") ??
      (azimuthRate === null || altitudeRate === null
        ? null
        : Math.hypot(azimuthRate, altitudeRate)),
    isVisible: boolAt(record, "isVisible") ?? clampedAltitude > 0,
    illuminated: boolAt(record, "illuminated"),
    servoAzimuth: numberAt(record, "servoAzimuth"),
    servoAltitude: numberAt(record, "servoAltitude"),
    timestamp: stamp.iso,
    timestampMs: stamp.ms,
    origin: azimuth === 0 && altitude === 0 ? "sim" : "live",
  };
}

export function toPassInfo(raw: unknown): PassInfo {
  const where = "celestial.pass";
  const record = asRecord(raw, where);

  return {
    name: needText(record, "name", where),
    nextAos: isoAt(record, "nextAos"),
    nextLos: isoAt(record, "nextLos"),
    durationSeconds: numberAt(record, "durationSeconds"),
    maxAltitude: numberAt(record, "maxAltitude"),
    aosAzimuth: numberAt(record, "aosAzimuth"),
    losAzimuth: numberAt(record, "losAzimuth"),
  };
}

export function toHardwareStatus(raw: unknown): HardwareStatus {
  const where = "hardware.status";
  const record = asRecord(raw, where);
  const lastSeen = isoAt(record, "lastSeen") ?? isoAt(record, "timestamp");
  const lastSeenMs = lastSeen === null ? 0 : Date.parse(lastSeen);
  const fresh =
    lastSeenMs > 0 && Date.now() - lastSeenMs <= HEARTBEAT_TIMEOUT_MS;

  return {
    batteryPercent: clamp(needNumber(record, "batteryPercent", where), 0, 100),
    voltage: needNumber(record, "voltage", where),
    solarVoltage: numberAt(record, "solarVoltage"),
    temperature: numberAt(record, "temperature"),
    humidity: numberAt(record, "humidity"),
    servoAzAngle: clamp(
      needNumber(record, "servoAzAngle", where),
      0,
      SERVO_MAX_ANGLE,
    ),
    servoAltAngle: clamp(
      needNumber(record, "servoAltAngle", where),
      0,
      SERVO_MAX_ANGLE,
    ),
    wifiRssi: numberAt(record, "wifiRssi"),
    uptimeSeconds: Math.max(0, needNumber(record, "uptimeSeconds", where)),
    loraEnabled: boolAt(record, "loraEnabled") ?? false,
    cameraReady: boolAt(record, "cameraReady") ?? false,
    lastSeen: lastSeen ?? EPOCH_ISO,
    lastSeenMs,
    isOnline: boolAt(record, "isOnline") ?? fresh,
  };
}

export function toHardwareOnline(raw: unknown): boolean {
  const where = "hardware.online";
  const record = asRecord(raw, where);
  const isOnline = boolAt(record, "isOnline");

  if (isOnline === null)
    throw contact(where, 'field "isOnline" is not a boolean');

  return isOnline;
}

export function toCaptureItem(raw: unknown): CaptureItem {
  const where = "capture.item";
  const record = asRecord(raw, where);
  const id = needNumber(record, "id", where);
  const stamp = needIso(record, "timestamp", where);

  return {
    id,
    filename: needText(record, "filename", where),
    objectName: textAt(record, "objectName"),
    azimuth: numberAt(record, "azimuth"),
    altitude: numberAt(record, "altitude"),
    triggerReason:
      textAt(record, "triggerReason") === "manual" ? "manual" : "auto",
    timestamp: stamp.iso,
    timestampMs: stamp.ms,
    imageUrl: imageUrlOf(record, id),
  };
}

export function toCaptureHistory(raw: unknown): CaptureHistory {
  const where = "capture.history";
  const record = asRecord(raw, where);
  const items = listAt(record, "items");

  return {
    items: items.map((item) => toCaptureItem(item)),
    total: numberAt(record, "total") ?? items.length,
    page: numberAt(record, "page") ?? 1,
    limit: numberAt(record, "limit") ?? items.length,
  };
}

export function toObjectsCatalog(raw: unknown): ObjectsCatalog {
  const record = asRecord(raw, "celestial.objects");

  return {
    planets: textListAt(record, "planets"),
    stars: textListAt(record, "stars"),
    satellites: satellitesAt(record, "satellites"),
  };
}

export function toTrackTarget(raw: unknown): TrackTarget {
  const where = "celestial.target";
  const record = asRecord(raw, where);

  return { type: needType(record, where), id: needText(record, "id", where) };
}

export function toAccessToken(raw: unknown): string {
  const where = "auth.verify-pin";
  const record = asRecord(raw, where);

  return needText(record, "token", where);
}



