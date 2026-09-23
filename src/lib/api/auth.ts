import { ENV } from "../constants";
import { tokenStore } from "../token";
import { toAccessToken } from "./adapter";
import { ApiError, isApiError, postJson } from "./client";

const VERIFY_PIN = "/auth/verify-pin";
const PIN_PATTERN = /^\d{4,6}$/;
const PIN_WHITESPACE = /\s+/g;
const UNAUTHORIZED = 401;

declare const pinBrand: unique symbol;

export type Pin = string & { readonly [pinBrand]: true };

export function isPin(value: unknown): value is Pin {
  return typeof value === "string" && PIN_PATTERN.test(value);
}

export function toPin(value: string): Pin | null {
  const compact = value.replace(PIN_WHITESPACE, "");

  return isPin(compact) ? compact : null;
}

const PIN_FAILURES: readonly (readonly [string, string])[] = [
  [
    "too many attempts",
    "Terlalu banyak percobaan. Tunggu PIN baru dari perangkat.",
  ],
  [
    "expired or not received",
    "PIN belum diterima dari perangkat atau sudah kedaluwarsa.",
  ],
  ["invalid pin", "PIN salah."],
];

function pinFailure(error: ApiError): ApiError {
  const message = error.message.toLowerCase();
  const matched = PIN_FAILURES.find(([fragment]) => message.includes(fragment));
  const translated = new ApiError(
    error.code,
    matched?.[1] ?? error.message,
    error.status,
  );

  translated.cause = error;

  return translated;
}


export async function signInWithPin(pin: Pin, signal?: AbortSignal): Promise<void> {
    if (ENV.mock) {
        tokenStore.signIn((await import("../mock")).mockAccessToken(Date.now()));
        return;

    }

    try {
        tokenStore.signIn(
            toAccessToken(await postJson<unknown>(VERIFY_PIN, { pin }, { signal })),
        )
    } catch (error) {
        if (isApiError(error) && error.status === UNAUTHORIZED) {
            throw pinFailure(error);
        }

        throw error;
    }
}


export function signOut(): void {
    tokenStore.signOut();
}