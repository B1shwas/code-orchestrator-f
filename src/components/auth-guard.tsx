"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { WhycodeMark } from "./icons";

/** Redirects anonymous visitors to /login; renders a loader while resolving. */
export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  React.useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-muted">
          <WhycodeMark className="size-7 animate-pulse" />
          <span className="font-mono text-code-sm">
            loading workspace&hellip;
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
