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
  /** GET /auth/me — hydrate user on app boot when a session exists. */
  loadUser: () => Promise<void>;
  /** POST /auth/logout + discard JWT client-side. */
  logout: () => Promise<void>;
  /** Called by the api client's 401 interceptor. */
  handleUnauthorized: () => void;
  clearError: () => void;
}

function clearSession(): void {
  setAccessToken(null);
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

  logout: async () => {
    try {
      await logoutRequest();
    } catch {
      // Stateless logout — a failing call must not block local discard.
    } finally {
      clearSession();
      set({ user: null, status: "anonymous", sessionExpired: false, error: null });
    }
  },

  handleUnauthorized: () => {
    clearSession();
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
