const TIME_ZONE = "Asia/Jakarta";
const DECIMAL_LOCALE = "en-US";
const GROUP_SEPARATOR = "\u202F";
const MINUS = "\u2212";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3_600;
const SECONDS_PER_DAY = 86_400;

const MONTHS_WIB = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

const CARDINALS = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"] as const;

export const DASH = "—";
export const WIB_LABEL = "WIB";

type WibParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

let wibFormat: Intl.DateTimeFormat | null = null;

const numberFormats = new Map<number, Intl.NumberFormat>();
const dateFormats = new Map<string, Intl.DateTimeFormat>();

function number(digits: number): Intl.NumberFormat {
  let format = numberFormats.get(digits);

  if (format === undefined) {
    format = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    numberFormats.set(digits, format);
  }

  return format;
}

function dateFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}-${JSON.stringify(options)}`;
  let format = dateFormats.get(key);

  if (format === undefined) {
    format = new Intl.DateTimeFormat(locale, {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      ...options,
    });
    dateFormats.set(key, format);
  }
  return format;
}

function partOf(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string | undefined {
  return parts.find((part) => part.type === type)?.value;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function formatDecimal(value: number, digits: number): string {
  return number(digits)
    .format(roundTo(value, digits))
    .replaceAll(",", GROUP_SEPARATOR);
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toEpochMs(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDeg(value: number | null, digits = 1): string {
  const safe = toFiniteNumber(value);
  if (safe === null) return DASH;
  const rounded = roundTo(safe, digits);
  const sign = rounded < 0 ? MINUS : "";
  return `${sign}${formatDecimal(Math.abs(rounded), digits)}°`;
}

export function formatAzimuth(value: number | null, digits = 1): string {
  const safe = toFiniteNumber(value);
  if (safe === null) return DASH;
  const wrapped = ((safe % 360) + 360) % 360;
  return `${formatDecimal(roundTo(wrapped, digits), digits)}°`;
}

export function formatAltitude(value: number | null, digits = 1): string {
  const safe = toFiniteNumber(value);
  if (safe === null) return DASH;
  const rounded = roundTo(safe, digits);
  const sign = safe < 0 ? MINUS : "+";
  return `${sign}${formatDecimal(Math.abs(rounded), digits)}°`;
}

export function formatKm(value: number | null): string {
  const safe = toFiniteNumber(value);
  return safe === null ? DASH : `${formatDecimal(safe, 0)} km`;
}

export function formatAu(value: number | null): string {
  const safe = toFiniteNumber(value);
  return safe === null ? DASH : `${formatDecimal(safe, 2)} au`;
}

export function formatDistance(
  distanceKm: number | null,
  distanceAu: number | null,
): string {
  if (toFiniteNumber(distanceKm) !== null) return formatKm(distanceKm);
  if (toFiniteNumber(distanceAu) !== null) return formatAu(distanceAu);
  return DASH;
}

const WIB_FIELDS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

function wibParts(value: unknown): WibParts | null {
  const epochMs = toEpochMs(value);

  if (epochMs === null) return null;

  wibFormat ??= dateFormat("en-US", WIB_FIELDS);

  const parts = wibFormat.formatToParts(new Date(epochMs));
  const read = (type: Intl.DateTimeFormatPartTypes): number | null =>
    toFiniteNumber(partOf(parts, type));

  const year = read("year");
  const month = read("month");
  const day = read("day");
  const hour = read("hour");
  const minute = read("minute");
  const second = read("second");

  return year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    second === null
    ? null
    : { year, month, day, hour, minute, second };
}

export function formatClockWIB(value: unknown): string {
  const parts = wibParts(value);

  return parts === null
    ? DASH
    : `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

export function formatDateWIB(value: unknown): string {
  const parts = wibParts(value);

  return parts === null
    ? DASH
    : `${parts.day} ${MONTHS_WIB[parts.month - 1]} ${parts.year}`;
}

export function formatDayKeyWIB(value: unknown): string {
  const parts = wibParts(value);

  return parts === null
    ? DASH
    : `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function formatAge(updatedAtMs: number | null, nowMs: number): string {
  const updated = toFiniteNumber(updatedAtMs);
  const now = toFiniteNumber(nowMs);

  if (updated === null || now === null) return DASH;

  const elapsed = Math.max(0, Math.round((now - updated) / 1_000));

  if (elapsed < 5) return "baru saja";
  if (elapsed < SECONDS_PER_MINUTE) return `${elapsed}s`;

  const minutes = Math.floor(elapsed / SECONDS_PER_MINUTE);

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}