"use client";

import * as React from "react";
import Link from "next/link";
import { FolderGit2, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RepoStatusBadge } from "@/components/status-badge";
import { BrowserPanes } from "@/components/code/browser-panes";
import { useRepository } from "@/lib/queries/repositories";
import { useUiStore } from "@/stores/ui-store";

/**
 * Deep-linkable code browser — refresh keeps you on the same repo.
 * The URL is the source of truth; the global selection follows it.
 */
export default function CodeRepoPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}): React.JSX.Element {
  const { repoId } = React.use(params);
  const selectRepository = useUiStore((s) => s.selectRepository);
  const { data: repo, isLoading, isError } = useRepository(repoId);

  // URL → store sync (external-store write, runs on repo change only).
  React.useEffect(() => {
    selectRepository(repoId);
  }, [repoId, selectRepository]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-muted">
        <Loader2 className="size-4 animate-spin" />
        <span className="font-mono text-code-sm">loading workspace…</span>
      </div>
    );
  }

  if (isError || !repo) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
            <FolderGit2 className="size-5" />
          </div>
          <div>
            <h1 className="text-headline-md font-semibold tracking-tight">
              Repository unavailable
            </h1>
            <p className="mt-1 text-body-md text-muted">
              This repository is no longer linked. Pick another one.
            </p>
          </div>
          <Link
            href="/repositories"
            className={buttonVariants({ variant: "secondary" })}
          >
            Go to repositories
          </Link>
        </div>
      </div>
    );
  }

  return (
    // flex-none + definite viewport height: flex-basis no longer fights the
    // height, so on desktop this box is exactly 100dvh and only the panes
    // inside it scroll. Mobile keeps natural stacked page scroll.
    <div className="flex w-full flex-1 flex-col gap-3 p-4 min-h-0 lg:h-dvh lg:flex-none lg:overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-headline-lg font-semibold tracking-tight">
          Code Browser
        </h1>
        <span className="truncate font-mono text-code-sm text-muted">
          {repo.owner}/{repo.name}
        </span>
        <RepoStatusBadge status={repo.status} />
      </div>

      <BrowserPanes key={repo.id} repo={repo} />
    </div>
  );
}
