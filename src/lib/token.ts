import type { AuthSession } from "@/types/celestial";

const STORAGE_KEY = "ambis.access-token";
const EXPIRY_SKEW_MS = 30_000;
const ANONYMOUS: AuthSession = { accessToken: "", expiresAtMs: null };

type Listener = () => void;

const listeners = new Set<Listener>();

let snapshot: AuthSession | null = null;

function decodeClaims(token: string): Record<string, unknown> | null {
  const segment = token.split(".")[1];

  if (segment === undefined) return null;

  try {
    const binary = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    );
    const claims: unknown = JSON.parse(json);

    return typeof claims === "object" && claims !== null
      ? (claims as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function toSession(token: string | null): AuthSession {
  if (token === null) return ANONYMOUS;

  const exp = decodeClaims(token)?.exp;

  return {
    accessToken: token,
    expiresAtMs:
      typeof exp === "number" && Number.isFinite(exp) ? exp * 1000 : null,
  };
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function persist(token: string | null): void {
  try {
    if (token === null) window.sessionStorage.removeItem(STORAGE_KEY);
    else window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // 
  }
}

function getSnapshot(): AuthSession {
  snapshot ??= toSession(readStoredToken());

  return snapshot;
}

function getServerSnapshot(): AuthSession {
  return ANONYMOUS;
}

function commit(token: string | null): void {
  snapshot = toSession(token);
  persist(token);

  for (const listener of listeners) listener();
}

export function isExpired(session: AuthSession, nowMs: number): boolean {
  return (
    session.expiresAtMs !== null &&
    nowMs + EXPIRY_SKEW_MS >= session.expiresAtMs
  );
}

export const tokenStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot,
  getServerSnapshot,
  signIn(token: string): void {
    commit(token.trim() || null);
  },
  signOut(): void {
    commit(null);
  },
};
