"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useSyncExternalStore } from "react";
import { signInWithPin, signOut as clearSession } from "@/lib/api/auth";
import type { Pin } from "@/lib/api/auth";
import { isExpired, tokenStore } from "@/lib/token";
import type { AuthSession } from "@/types/celestial";

export type AuthController = {
  session: AuthSession;
  authenticated: boolean;
  verifying: boolean;
  error: string | null;
  verify: (pin: Pin) => void;
  forget: () => void;
};

const MAX_TIMEOUT_MS = 2_147_483_647;

export function useAuth(): AuthController {
    const session = useSyncExternalStore(
        tokenStore.subscribe,
        tokenStore.getSnapshot,
        tokenStore.getServerSnapshot,
    )

    const [error, setError] = useState<string | null>(null);
    const [verifying, startTransition] = useTransition();

    const expiresAtsMs = session.expiresAtMs

    useEffect(() => {
        if (expiresAtsMs === null) return;

        const delay = expiresAtsMs - Date.now();
        const timer = setTimeout(() => tokenStore.signOut(), Math.min(Math.max(delay, 0), MAX_TIMEOUT_MS));
        return () => clearTimeout(timer);
    }, [expiresAtsMs])


    const verify = useCallback((pin: Pin): void => {
        setError(null);
        startTransition(async () => {
            try {
                await signInWithPin(pin);
            } catch (cause) {
                startTransition(() => {
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "PIN gagal diverifikasi",
                  );
                });
            }
        })
    }, [])

    const forget = useCallback((): void => {
      setError(null);
      clearSession();
    }, []);

    return {
      session,
      authenticated:
        session.accessToken !== "" && !isExpired(session, Date.now()),
      verifying,
      error,
      verify,
      forget,
    };
}