import { Suspense } from "react";
import { CenteredScreen } from "@/components/layout";
import { CallbackHandler } from "./callback-handler";

export default function AuthCallbackPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <CenteredScreen>
          <p className="font-mono text-code-sm text-muted">
            Completing sign-in&hellip;
          </p>
        </CenteredScreen>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
