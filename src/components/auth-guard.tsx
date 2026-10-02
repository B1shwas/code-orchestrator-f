"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { CenteredScreen } from "./layout";
import { WhycodeMark } from "./icons";

/** Upper bound for session restore — the loader can never stick past this. */
const RESTORE_TIMEOUT_MS = 15_000;

/** Redirects anonymous visitors to /login; renders a loader while resolving. */
export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const status = useAuthStore((s) => s.status);
  const loadUser = useAuthStore((s) => s.loadUser);
  const restoreFailed = useAuthStore((s) => s.restoreFailed);
  const router = useRouter();
  // Token present at mount (restored from sessionStorage) → hold the
  // redirect until restore finishes. Lazy init runs before any effect,
  // so the redirect effect below can never fire first with stale state.
  // Server-safe: the module token is always null during prerender.
  const [restoring, setRestoring] = React.useState(
    () => getAccessToken() !== null,
  );

  // Survive a full-page refresh: the JWT persists in sessionStorage, so
  // re-hydrate the session before deciding to bounce to /login. The timeout
  // guarantees the loader can never stick forever on a hung request.
  React.useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    async function restore(): Promise<void> {
      if (
        useAuthStore.getState().status === "anonymous" &&
        getAccessToken()
      ) {
        setRestoring(true);
        try {
          await Promise.race([
            loadUser().finally(() => {
              if (timeoutId !== undefined) clearTimeout(timeoutId);
            }),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(
                () => reject(new Error("Session restore timed out")),
                RESTORE_TIMEOUT_MS,
              );
            }),
          ]);
        } catch (error) {
          // Real failures are already recorded by loadUser / the 401
          // interceptor; this only surfaces when WE gave up waiting.
          restoreFailed(
            error instanceof Error ? error.message : "Could not restore session",
          );
        } finally {
          if (!cancelled) setRestoring(false);
        }
      }
    }
    void restore();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [loadUser, restoreFailed]);

  React.useEffect(() => {
    if (!restoring && status === "anonymous") router.replace("/login");
  }, [status, restoring, router]);

  if (restoring || status !== "authenticated") {
    return (
      <CenteredScreen>
        <div className="flex items-center gap-3 text-muted">
          <WhycodeMark className="size-7 animate-pulse" />
          <span className="font-mono text-code-sm">loading workspace&hellip;</span>
        </div>
      </CenteredScreen>
    );
  }

  return <>{children}</>;
}
