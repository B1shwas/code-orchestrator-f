"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { AuthCard, CenteredScreen, Stack } from "@/components/layout";
import { GithubIcon, WhycodeMark } from "@/components/icons";
import type { ApiError } from "@/lib/api";

function errorMessage(error: ApiError): string {
  return Array.isArray(error.message) ? error.message.join(" ") : error.message;
}

export default function LoginPage(): React.JSX.Element {
  const status = useAuthStore((s) => s.status);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const error = useAuthStore((s) => s.error);
  const beginLogin = useAuthStore((s) => s.beginLogin);
  const router = useRouter();
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  async function handleContinue(): Promise<void> {
    setStarting(true);
    try {
      const url = await beginLogin();
      window.location.href = url;
    } catch {
      setStarting(false);
    }
  }

  return (
    <CenteredScreen>
      {/* dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, #232d45 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black 30%, transparent 75%)",
        }}
      />
      {/* indigo glow */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[38%] h-72 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(closest-side, #6366f1, transparent)",
        }}
      />

      <AuthCard className="max-w-[80%] lg:max-w-[50%]">
        <Stack className="items-center text-center" gap="gap-6">
          <Stack className="items-center" gap="gap-3">
            <WhycodeMark className="size-10" />
            <h1 className="text-headline-lg font-semibold tracking-tight text-primary">
              WhyCODE
            </h1>
            <p className="text-body-md text-muted">
              Understand any codebase. Ask questions, get answers with evidence.
            </p>
          </Stack>

          <Stack className="w-full" gap="gap-3">
            {sessionExpired && (
              <p
                role="status"
                className="rounded-md border border-status-pending/30 bg-status-pending/10 px-3 py-2 text-body-sm text-status-pending"
              >
                Session expired — please sign in again.
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-md border border-status-error/30 bg-status-error/10 px-3 py-2 font-mono text-code-sm text-status-error"
              >
                {errorMessage(error)}
              </p>
            )}
            <Button
              size="lg"
              className="w-full"
              onClick={() => void handleContinue()}
              disabled={starting || status === "authenticating"}
            >
              <GithubIcon />
              {starting || status === "authenticating"
                ? "Redirecting to GitHub…"
                : "Continue with GitHub"}
            </Button>
            <p className="text-center font-mono text-code-sm text-disabled">
              OAuth 2.0 — no passwords, GitHub only.
            </p>
          </Stack>
        </Stack>
      </AuthCard>
    </CenteredScreen>
  );
}
