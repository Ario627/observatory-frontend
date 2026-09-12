const WIB_TIME_ZONE = "Asia/Jakarta";
export const DASH = "—";

const MINUS = "\u2212";
const GROUP_SEPARATOR = "\u202F";

const decimalFormatterss = new Map<number, Intl.NumberFormat>();

function decimalFormatter(digits: number): Intl.NumberFormat {
  const cached = decimalFormatterss.get(digits);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  decimalFormatterss.set(digits, formatter);
  return formatter;
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
}

function formatDecimal(value: number, digits: number): string {
  return decimalFormatter(digits)
    .format(roundTo(value, digits))
    .replaceAll(",", GROUP_SEPARATOR);
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toFiniteNumber(value: unknown): number | null {
    if(typeof value === "number") return Number.isFinite(value) ? value : null;
    if(typeof value === "string" && value.trim() !== "")  {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function toEpochMs(value: number |  string | null | undefined): number | null {
    if(typeof value === "number") return Number.isFinite(value) ? value : null;
    if(typeof value === "string") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ?  null : parsed;
    }

    return null;


}


export function formatDeg(value: number | null, digits = 1): string {
    const safe = toFiniteNumber(value);
    if(safe === null) return DASH;
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

export function formatDistance(distanceKm: number | null, distanceAu: number | null): string {
    if(toFiniteNumber(distanceKm) !== null) return formatKm(distanceKm);
    if(toFiniteNumber(distanceAu) !== null) return formatAu(distanceAu);
    return DASH;
}