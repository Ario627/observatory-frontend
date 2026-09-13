import type { CaptureHistory, CaptureItem, CelestialPosition, HardwareStatus, ObjectsCatalog, PassInfo, SatelliteEntry, TrackTarget } from "@/types/celestial";
import { ApiError } from "./client";
import { ENV } from "../constants";
import { clamp, normalizeAz } from "../coordinates";

const ISO_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;
const EPOCH = new Date(0).toISOString();

function contact(where: string, detail: string): ApiError {
    return new ApiError("contract", `Contract violation in ${where}: ${detail}`);
}

function asRecord(raw: unknown, where: string): Record<string, unknown> {
    if(typeof raw !== "object" || raw === null || Array.isArray(raw)) throw contact(where, `expected object, got ${typeof raw}`);
    return raw as Record<string, unknown>;
}

