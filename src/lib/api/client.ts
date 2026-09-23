import axios, { type AxiosRequestConfig } from "axios";
import { ENV } from "../constants";
import { tokenStore } from "../token";
import type { ApiErrorBody, ServerEnvelope } from "@/types/celestial";

export type FailureCode =
  | "cancelled"
  | "timeout"
  | "network"
  | "http"
  | "contract";

const RETRYABLE_STATUS = new Set([408, 429]);

const TIMEOUT_MESSAGE = "Backend tidak merespons tepat waktu";

export class ApiError extends Error {
  readonly code: FailureCode;
  readonly status?: number | null;

  constructor(
    code: FailureCode,
    message: string,
    status: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }

  get retryable(): boolean {
    switch (this.code) {
      case "cancelled":
      case "contract":
        return false;
      case "timeout":
      case "network":
        return true;
      default:
        return (
          this.status != null &&
          (this.status >= 500 || RETRYABLE_STATUS.has(this.status))
        );
    }
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

function statusMessage(status: number): string {
  if (status === 401) return "Sesi berakhir, masuk ulang";
  if (status === 403) return "Akun ini tidak berwenang untuk perintah tersebut";
  if (status === 404) return "Data belum tersedia di backend";
  if (status === 429) return "Terlalu banyak permintaan, coba lagi sebentar";
  if (status >= 500) return "Backend gagal memproses permintaan";

  return "Backend menolak permintaan";
}

function serverMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;

  const message = (payload as Partial<ApiErrorBody>).message;
  if (!Array.isArray(message)) return null;

  const first = message.find((m) => typeof m === "string" && m.trim() !== "");

  return typeof first === "string" ? first.trim() : null;
}

function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (!axios.isAxiosError(error)) {
    return new ApiError("contract", "Bentuk respons backend tidak dikenali");
  }

  if (axios.isCancel(error)) {
    return new ApiError("cancelled", "Permintaan dibatalkan");
  }
  if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
    return new ApiError("timeout", TIMEOUT_MESSAGE);
  }

  if (error.code === "ERR_NETWORK" || error.code === "ERR_INVALID_URL") {
    return new ApiError("network", "Backend tidak terjangkau");
  }

  const status = error.response?.status ?? null;

  if (status === null) {
    return new ApiError("network", "Backend tidak terjangkau");
  }

  if (status === 401) tokenStore.signOut();

  return new ApiError(
    "http",
    serverMessage(error.response?.data) ?? statusMessage(status),
    status,
  );
}

const client = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: ENV.timeoutMs,
  headers: { Accept: "application/json" },
  transitional: { clarifyTimeoutError: true },
  redact: ["Authorization"],
});

client.interceptors.request.use(
  (config) => {
    const { accessToken } = tokenStore.getSnapshot();
    if (accessToken !== "") {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return config;
  },
  undefined,
  { synchronous: true },
);

type RequestOptions = Omit<
  AxiosRequestConfig,
  "baseURL" | "method" | "url" | "data"
>;

function isEnvelope(value: unknown): value is ServerEnvelope<unknown> {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return candidate.success === true && "data" in candidate;
}

function unwrap<T>(payload: unknown): T {
  return (isEnvelope(payload) ? payload.data : payload) as T;
}

function trace(
  method: string,
  url: string,
  status: number | null,
  startedAt: number,
): void {
  if (process.env.NODE_ENV === "production") return;

  const elapsed = Math.round(performance.now() - startedAt);

  console.debug(
    `[api] ${method.toUpperCase()} ${url} → ${status ?? "gagal"} (${elapsed} ms)`,
  );
}

async function send<T>(
  method: "get" | "post",
  url: string,
  body: unknown,
  options: RequestOptions | undefined,
): Promise<T> {
  const startedAt = performance.now();

  try {
    const response = await client.request<unknown>({
      ...options,
      method,
      url,
      data: body,
    });

    trace(method, url, response.status, startedAt);

    return unwrap<T>(response.data);
  } catch (err) {
    const fail = toApiError(err);
    trace(method, url, fail.status ?? null, startedAt);

    throw fail;
  }
}

export function getJson<T>(url: string, options?: RequestOptions): Promise<T> {
  return send<T>("get", url, undefined, options);
}

export function postJson<T>(
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  return send<T>("post", url, body, options);
}