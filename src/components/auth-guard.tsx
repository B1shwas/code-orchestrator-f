"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { CenteredScreen } from "./layout";
import { WhycodeMark } from "./icons";

/** Redirects anonymous visitors to /login; renders a loader while resolving. */
export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const status = useAuthStore((s) => s.status);
  const loadUser = useAuthStore((s) => s.loadUser);
  const router = useRouter();
  const [restoring, setRestoring] = React.useState(false);

  // Survive a full-page refresh: the JWT persists in sessionStorage, so
  // re-hydrate the session before deciding to bounce to /login.
  React.useEffect(() => {
    let cancelled = false;
    async function restore(): Promise<void> {
      if (
        useAuthStore.getState().status === "anonymous" &&
        getAccessToken()
      ) {
        setRestoring(true);
        try {
          await loadUser();
        } catch {
          // loadUser / the 401 interceptor already reset auth state.
        } finally {
          if (!cancelled) setRestoring(false);
        }
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

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
