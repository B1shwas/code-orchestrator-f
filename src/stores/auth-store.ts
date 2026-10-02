import { create } from "zustand";
import {
  fetchCurrentUser,
  getGithubAuthUrl,
  logoutRequest,
  setAccessToken,
  setUnauthorizedHandler,
  type ApiError,
  type LoginResponse,
  type UserProfile,
} from "@/lib/api";
import { clearClientCache } from "@/lib/query-client";
import { useUiStore } from "@/stores/ui-store";

type AuthStatus = "anonymous" | "authenticating" | "authenticated";

interface AuthState {
  /** Null = logged out. The JWT itself lives in the api client (memory only). */
  user: UserProfile | null;
  status: AuthStatus;
  /** Set by the 401 interceptor — UI observes this and forces GitHub re-login. */
  sessionExpired: boolean;
  error: ApiError | null;

  /** Fetch the GitHub OAuth URL, then redirect the browser to it. Returns the URL. */
  beginLogin: () => Promise<string>;
  /** Store the LoginResponse (from the backend callback) as the session. */
  setSession: (login: LoginResponse) => void;
  /**
   * Complete the OAuth round-trip from the /auth/callback page.
   * The backend redirects to /auth/callback?accessToken=<jwt>&user=<json?>;
   * when user is absent we fetch GET /auth/me with the token.
   */
  hydrateFromCallback: (
    accessToken: string,
    user: UserProfile | null,
  ) => Promise<void>;
  /** GET /auth/me — hydrate user on app boot when a session exists. */
  loadUser: () => Promise<void>;
  /** Record a restore failure (e.g. timed out) without touching the session. */
  restoreFailed: (message: string) => void;
  /** POST /auth/logout + discard JWT client-side. */
  logout: () => Promise<void>;
  /** Called by the api client's 401 interceptor. */
  handleUnauthorized: () => void;
  clearError: () => void;
}

function clearSession(): void {
  setAccessToken(null);
}

/**
 * Full client-side reset for a dead session: token, every cached server
 * response (keys are not user-scoped), and UI selection. Without this the
 * next login renders the previous account's repos/investigations, and
 * polling queries keep firing against the old session.
 */
function clearClientState(): void {
  clearSession();
  clearClientCache();
  useUiStore.getState().selectRepository(null);
  useUiStore.getState().setActiveInvestigation(null);
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: "anonymous",
  sessionExpired: false,
  error: null,

  beginLogin: async () => {
    set({ status: "authenticating", error: null, sessionExpired: false });
    try {
      const { url } = await getGithubAuthUrl();
      return url;
    } catch (error) {
      set({ status: "anonymous", error: error as ApiError });
      throw error;
    }
  },

  setSession: (login) => {
    setAccessToken(login.accessToken);
    set({
      user: login.user,
      status: "authenticated",
      sessionExpired: false,
      error: null,
    });
  },

  hydrateFromCallback: async (accessToken, user) => {
    setAccessToken(accessToken);
    if (user) {
      set({
        user,
        status: "authenticated",
        sessionExpired: false,
        error: null,
      });
      return;
    }
    try {
      const me = await fetchCurrentUser();
      set({
        user: me,
        status: "authenticated",
        sessionExpired: false,
        error: null,
      });
    } catch (error) {
      // 401 flows through handleUnauthorized via the interceptor.
      if (!get().sessionExpired) {
        set({ user: null, status: "anonymous", error: error as ApiError });
      }
      throw error;
    }
  },

  loadUser: async () => {
    try {
      const user = await fetchCurrentUser();
      set({ user, status: "authenticated", error: null });
    } catch (error) {
      // 401 here also flows through handleUnauthorized via the interceptor.
      if (!get().sessionExpired) {
        set({ user: null, status: "anonymous", error: error as ApiError });
      }
      throw error;
    }
  },

  restoreFailed: (message) => {
    const state = get();
    // Only speak up if nothing else already explained the failure
    // (real errors set error via loadUser; expiry sets sessionExpired).
    if (state.sessionExpired || state.status !== "anonymous" || state.error) {
      return;
    }
    set({
      error: { statusCode: 0, message, error: "RESTORE_TIMEOUT" },
    });
  },

  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Stateless logout — a failing call must not block local discard.
    } finally {
      clearClientState();
      set({ user: null, status: "anonymous", sessionExpired: false, error: null });
    }
  },

  handleUnauthorized: () => {
    clearClientState();
    set({ user: null, status: "anonymous", sessionExpired: true });
  },

  clearError: () => set({ error: null }),
}));

// Wire the api client's global 401 handling to this store (no import cycle:
// the store imports the client, never the reverse).
setUnauthorizedHandler(() => {
  useAuthStore.getState().handleUnauthorized();
});

/** Convenience selector — true when a session is active. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.status === "authenticated" && s.user !== null);
}
