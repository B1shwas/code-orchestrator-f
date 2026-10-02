"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhycodeMark } from "@/components/icons";
import type { UserProfile } from "@/lib/api";

/**
 * Completes the GitHub OAuth round-trip.
 * The backend redirects here as /auth/callback?accessToken=<jwt>&user=<json?>.
 * An absent `user` param falls back to GET /auth/me with the token.
 */
export function CallbackHandler(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hydrateFromCallback = useAuthStore((s) => s.hydrateFromCallback);
  const [failed, setFailed] = React.useState(false);
  const [message, setMessage] = React.useState("Completing sign-in…");
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run(): Promise<void> {
      const oauthError = searchParams.get("error");
      if (oauthError) {
        setMessage(
          searchParams.get("error_description") ??
            "GitHub sign-in was declined.",
        );
        setFailed(true);
        return;
      }
      const accessToken = searchParams.get("accessToken");
      if (!accessToken) {
        setMessage("Sign-in callback is missing its token. Please try again.");
        setFailed(true);
        return;
      }
      let user: UserProfile | null = null;
      const rawUser = searchParams.get("user");
      if (rawUser) {
        try {
          user = JSON.parse(rawUser) as UserProfile;
        } catch {
          user = null;
        }
      }
      try {
        await hydrateFromCallback(accessToken, user);
        router.replace("/");
      } catch {
        setMessage("Could not establish a session. Please try again.");
        setFailed(true);
      }
    }

    void run();
  }, [searchParams, hydrateFromCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center gap-3 pt-4">
          <WhycodeMark
            className={`size-7 ${failed ? "" : "animate-pulse"}`}
          />
          <div className="flex flex-col gap-2">
            <p
              role={failed ? "alert" : "status"}
              className={`text-body-md ${failed ? "text-status-error" : "text-muted"}`}
            >
              {message}
            </p>
            {failed && (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => router.replace("/login")}
              >
                Back to login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
