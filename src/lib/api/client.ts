import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const API_PREFIX = "/api/v1";

// ---------------------------------------------------------------------------
// Token + session-expiry wiring.
// The JWT lives ONLY here (module memory) — never in zustand state, never in
// localStorage (logout is a client-side discard). The auth store registers
// itself via setUnauthorizedHandler; api modules never import stores, so
// there are no import cycles.
// ---------------------------------------------------------------------------
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

// ---------------------------------------------------------------------------
// Error normalization — everything thrown from api modules is an ApiError.
// ---------------------------------------------------------------------------
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const data = axiosError.response?.data;
    if (
      data &&
      typeof data === "object" &&
      typeof (data as ApiError).statusCode === "number"
    ) {
      return data as ApiError;
    }
    const status = axiosError.response?.status ?? 0;
    return {
      statusCode: status,
      message: axiosError.message || "Network request failed",
      error: axiosError.code ?? "NETWORK_ERROR",
    };
  }
  return {
    statusCode: 0,
    message: error instanceof Error ? error.message : "Unknown error",
    error: "UNKNOWN_ERROR",
  };
}

export function isApiError(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as ApiError).statusCode === status
  );
}

// ---------------------------------------------------------------------------
// Instance (prefix /api/v1 baked in; /health bypasses it via checkHealth).
// ---------------------------------------------------------------------------
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

function attachAuth(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
}

apiClient.interceptors.request.use(attachAuth);

/** Set on a request config to bypass the global 401 -> logout handling. */
export interface SkippableAuthRequestConfig extends InternalAxiosRequestConfig {
  _skipAuthHandler?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const skipHandler =
      axios.isAxiosError(error) &&
      (error.config as SkippableAuthRequestConfig | undefined)?._skipAuthHandler;
    if (axios.isAxiosError(error) && error.response?.status === 401 && !skipHandler) {
      // 401 anywhere -> session is dead (JWT expired or GitHub token revoked).
      // Clear auth; UI observes sessionExpired and forces GitHub re-login.
      setAccessToken(null);
      unauthorizedHandler?.();
    }
    return Promise.reject(toApiError(error));
  },
);

/** Liveness probe — no prefix, no auth. Shape intentionally unknown. */
export async function checkHealth(): Promise<unknown> {
  const response = await axios.get(`${API_BASE_URL}/health`, {
    timeout: 10_000,
  });
  return response.data as unknown;
}
