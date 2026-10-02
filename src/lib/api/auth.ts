import { apiClient } from "./client";
import type {
  AuthUrlResponse,
  LoginResponse,
  LogoutResponse,
  UserProfile,
} from "./types";

/** GET /auth/github — returns the GitHub OAuth URL to redirect the user to. */
export async function getGithubAuthUrl(): Promise<AuthUrlResponse> {
  const { data } = await apiClient.get<AuthUrlResponse>("/auth/github");
  return data;
}

/** GET /auth/me (guarded) — current user profile. */
export async function fetchCurrentUser(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>("/auth/me");
  return data;
}

/**
 * POST /auth/logout (guarded) — stateless; server returns { ok: true }.
 * The caller MUST discard the JWT afterwards (the store does this).
 */
export async function logoutRequest(): Promise<LogoutResponse> {
  const { data } = await apiClient.post<LogoutResponse>("/auth/logout");
  return data;
}

export type { LoginResponse };
