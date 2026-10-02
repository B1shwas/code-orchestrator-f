"use client";

import * as React from "react";
import Link from "next/link";
import { FolderGit2, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RepoStatusBadge } from "@/components/status-badge";
import { FileTree } from "@/components/code/file-tree";
import { FileViewer, type JumpTarget } from "@/components/code/file-viewer";
import { Outline } from "@/components/code/outline";
import { useRepositories, useRepository } from "@/lib/queries/repositories";
import { useUiStore } from "@/stores/ui-store";
import type { Repository } from "@/lib/api";

function Breadcrumb({ path }: { path: string | null }): React.JSX.Element {
  if (!path) {
    return (
      <span className="truncate font-mono text-code-sm text-disabled">
        select a file from the explorer
      </span>
    );
  }
  const parts = path.split("/");
  return (
    <nav aria-label="File path" className="flex min-w-0 items-center gap-1 truncate">
      {parts.map((part, i) => (
        <React.Fragment key={`${part}-${i}`}>
          {i > 0 && <span className="shrink-0 text-disabled">/</span>}
          <span
            className={
              i === parts.length - 1
                ? "truncate font-mono text-code-sm font-medium text-primary"
                : "shrink-0 font-mono text-code-sm text-muted"
            }
          >
            {part}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

/**
 * The three panes. Keyed by repo id from the parent, so switching
 * repositories remounts with a fresh open file instead of syncing state.
 */
function BrowserPanes({ repo }: { repo: Repository }): React.JSX.Element {
  const [path, setPath] = React.useState<string | null>(null);
  const [jump, setJump] = React.useState<JumpTarget | null>(null);

  return (
    <div className="flex flex-1 flex-col gap-3 min-h-0 lg:flex-row lg:overflow-hidden">
      <section
        aria-label="Explorer"
        className="flex flex-col rounded-lg border border-border-default bg-surface-neutral min-h-0 lg:w-72 lg:shrink-0"
      >
        <p className="shrink-0 border-b border-border-default px-4 py-2 font-mono text-code-sm uppercase tracking-widest text-disabled">
          Explorer
        </p>
        <FileTree
          repoId={repo.id}
          activePath={path}
          onSelectFile={setPath}
          className="max-h-72 min-h-0 flex-1 lg:max-h-none"
        />
      </section>

      <section
        aria-label="Editor"
        className="flex min-h-[24rem] flex-1 flex-col rounded-lg border border-border-default bg-surface-neutral min-h-0 overflow-hidden lg:min-h-0"
      >
        <div className="flex h-10 shrink-0 items-center border-b border-border-default px-4">
          <Breadcrumb path={path} />
        </div>
        {path ? (
          <FileViewer repoId={repo.id} path={path} jump={jump} />
        ) : (
          <p className="flex flex-1 items-center justify-center p-8 text-center font-mono text-code-sm text-muted">
            Select a file from the explorer to view it.
          </p>
        )}
      </section>

      <aside
        aria-label="Outline"
        className="hidden w-64 shrink-0 flex-col rounded-lg border border-border-default bg-surface-neutral min-h-0 xl:flex"
      >
        <Outline
          repoId={repo.id}
          path={path}
          onJump={(line) => setJump({ line, nonce: Date.now() })}
          className="min-h-0 flex-1"
        />
        {!path && (
          <p className="p-4 font-mono text-code-sm text-muted">
            Open a file to see its symbols.
          </p>
        )}
      </aside>
    </div>
  );
}

export default function CodePage(): React.JSX.Element {
  const selectedId = useUiStore((s) => s.selectedRepositoryId);
  const { data: repos, isLoading: reposLoading } = useRepositories();
  const { data: repo, isError: repoError } = useRepository(selectedId);

  if (reposLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-muted">
        <Loader2 className="size-4 animate-spin" />
        <span className="font-mono text-code-sm">loading workspace…</span>
      </div>
    );
  }

  if (!repos?.length || !selectedId || repoError || !repo) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
            <FolderGit2 className="size-5" />
          </div>
          <div>
            <h1 className="text-headline-md font-semibold tracking-tight">
              {repoError ? "Repository unavailable" : "No repository selected"}
            </h1>
            <p className="mt-1 text-body-md text-muted">
              {repoError
                ? "This repository is no longer linked. Pick another one."
                : "Connect a repository to start browsing code."}
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
    <div className="flex w-full flex-1 flex-col gap-3 p-4 min-h-0 lg:h-screen lg:overflow-hidden">
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
