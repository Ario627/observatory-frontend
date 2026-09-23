import type {
  CelestialPosition,
  ObjectsCatalog,
  PassInfo,
  TrackTarget,
} from "@/types/celestial";
import { CATALOG_TTL_MS, ENV } from "../constants";
import {
  toCelestialPosition,
  toObjectsCatalog,
  toPassInfo,
  toTrackTarget,
} from "./adapter";
import { getJson, isApiError, postJson } from "./client";

const BASE = "/celestial";
const NOT_FOUND = 404;

const mockModule = () => import("../mock");

function pathOf(target: TrackTarget, suffix = ""): string {
  return `${BASE}/${target.type}/${encodeURIComponent(target.id)}${suffix}`;
}

export async function fetchCelestialPosition(
  target: TrackTarget,
  signal?: AbortSignal,
): Promise<CelestialPosition> {
  if (ENV.mock)
    return (await mockModule()).mockCelestialPosition(target, Date.now());

  return toCelestialPosition(
    await getJson<unknown>(pathOf(target), { signal }),
  );
}

export async function fetchPassInfo(
  target: TrackTarget,
  signal?: AbortSignal,
): Promise<PassInfo | null> {
  if (ENV.mock) return (await mockModule()).mockPassInfo(target, Date.now());

  try {
    return toPassInfo(
      await getJson<unknown>(pathOf(target, "/pass"), { signal }),
    );
  } catch (error) {
    if (isApiError(error) && error.status === NOT_FOUND) return null;

    throw error;
  }
}

let activeTarget: TrackTarget = { type: "iss", id: "iss" };

export async function fetchActiveTarget(
  signal?: AbortSignal,
): Promise<TrackTarget> {
  if (ENV.mock) return activeTarget;

  return toTrackTarget(await getJson<unknown>(`${BASE}/target`, { signal }));
}

export async function trackTarget(
  target: TrackTarget,
  signal?: AbortSignal,
): Promise<TrackTarget> {
  if (ENV.mock) {
    activeTarget = target;

    return target;
  }

  return toTrackTarget(
    await postJson<unknown>(`${BASE}/track`, target, { signal }),
  );
}

let catalog: { value: ObjectsCatalog; expires: number } | null = null;
let catalogRequest: Promise<ObjectsCatalog> | null = null;

export async function fetchObjectsCatalog(): Promise<ObjectsCatalog> {
  if (ENV.mock) return (await mockModule()).mockObjectsCatalog();

  const cached = catalog;

  if (cached !== null && cached.expires > Date.now()) return cached.value;

  if (catalogRequest === null) {
    catalogRequest = loadCatalog().finally(() => {
      catalogRequest = null;
    });
  }

  return catalogRequest;
}

async function loadCatalog(): Promise<ObjectsCatalog> {
  const value = toObjectsCatalog(await getJson<unknown>(`${BASE}/objects`));

  catalog = { value, expires: Date.now() + CATALOG_TTL_MS };

  return value;
}