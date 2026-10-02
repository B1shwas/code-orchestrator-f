import { Suspense } from "react";
import { CallbackHandler } from "./callback-handler";

export default function AuthCallbackPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <p className="font-mono text-code-sm text-muted">
            Completing sign-in&hellip;
          </p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
