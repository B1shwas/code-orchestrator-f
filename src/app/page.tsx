import { FolderGit2, Plus, Search } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";

export default function Home(): React.JSX.Element {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-canvas font-sans text-primary">
        <AppHeader />
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-8">
          {/* page head */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-headline-lg font-semibold tracking-tight">
                  Repositories
                </h1>
                <span className="rounded-full border border-border-default bg-surface-raised px-2 py-px font-mono text-code-sm text-muted">
                  0 active
                </span>
              </div>
              <p className="mt-1 text-body-md text-muted">
                Connected codebases indexed for questions and evidence
                tracing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-disabled" />
                <input
                  disabled
                  placeholder="Filter repositories…"
                  aria-label="Filter repositories"
                  className="h-8 w-64 rounded-md border border-border-default bg-surface-neutral pl-8 pr-14 text-body-md text-muted placeholder:text-disabled disabled:opacity-60"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border-default bg-surface-overlay px-1 font-mono text-[10px] text-muted">
                  Cmd+F
                </kbd>
              </div>
              <Button variant="secondary" disabled>
                Sync all
              </Button>
              <Button disabled>
                <Plus />
                Connect repo
              </Button>
            </div>
          </div>

          {/* content canvas */}
          <section className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-default bg-surface-neutral px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
              <FolderGit2 className="size-5" />
            </div>
            <h2 className="text-headline-md font-semibold tracking-tight">
              Connect your first repository
            </h2>
            <p className="max-w-md text-body-md text-muted">
              Index any public or private repo to trace code decisions with
              evidence.
            </p>
            <Button disabled>
              <Plus />
              Connect repository
            </Button>
            <p className="font-mono text-code-sm text-disabled">
              repositories UI lands in the next milestone
            </p>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
