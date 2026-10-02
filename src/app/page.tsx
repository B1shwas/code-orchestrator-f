import { FolderGit2 } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export default function Home(): React.JSX.Element {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-canvas font-sans text-primary">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
              <FolderGit2 className="size-5" />
            </div>
            <div>
              <h1 className="text-headline-md font-semibold tracking-tight">
                No repository selected
              </h1>
              <p className="mt-1 text-body-md text-muted">
                Connect a codebase to start asking questions with evidence.
              </p>
            </div>
            <Button disabled>Connect repository</Button>
            <p className="font-mono text-code-sm text-disabled">
              repositories UI lands in the next milestone
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
