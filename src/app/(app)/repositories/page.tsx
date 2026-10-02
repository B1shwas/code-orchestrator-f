"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, FolderGit2, GitBranch, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, Stack } from "@/components/layout";
import { RepoStatusBadge } from "@/components/status-badge";
import { ConnectRepoModal } from "@/components/connect-repo-modal";
import { useRepositories } from "@/lib/queries/repositories";
import { useUiStore } from "@/stores/ui-store";
import { formatApiError, formatBytes, formatRelativeTime } from "@/lib/format";
import type { Repository } from "@/lib/api";

function RepoRow({ repo }: { repo: Repository }): React.JSX.Element {
  const router = useRouter();
  const selectRepository = useUiStore((s) => s.selectRepository);

  function open(): void {
    selectRepository(repo.id);
    if (repo.status === "READY") router.push(`/code/${repo.id}`);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") open();
      }}
      className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-overlay text-muted">
        <FolderGit2 className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-mono text-code-md font-medium text-primary">
            {repo.owner}/{repo.name}
          </span>
          <RepoStatusBadge status={repo.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-muted">
          <span className="inline-flex items-center gap-1 font-mono text-code-sm">
            <GitBranch className="size-3" />
            {repo.defaultBranch}
          </span>
          <span>updated {formatRelativeTime(repo.updatedAt)}</span>
          <span>{formatBytes(repo.sizeBytes)}</span>
          <span>
            {repo.investigationCount} investigation
            {repo.investigationCount === 1 ? "" : "s"}
          </span>
        </div>
        {repo.status === "CLONING" && repo.progress !== null && (
          <div
            className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-surface-overlay"
            role="progressbar"
            aria-valuenow={repo.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${repo.progress}%` }}
            />
          </div>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-disabled" />
    </div>
  );
}

function LoadingRows(): React.JSX.Element {
  return (
    <div aria-label="Loading repositories" className="flex flex-col">
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex items-center gap-4 px-4 py-3">
          <div className="size-9 shrink-0 animate-pulse rounded-md bg-surface-overlay" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-48 animate-pulse rounded bg-surface-overlay" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-surface-overlay" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RepositoriesPage(): React.JSX.Element {
  const { data, isLoading, isError, error, refetch } = useRepositories({
    poll: true,
  });
  const [filter, setFilter] = React.useState("");
  const [connectOpen, setConnectOpen] = React.useState(false);

  const repos = data ?? [];
  const visible = repos.filter((repo) =>
    `${repo.owner}/${repo.name}`
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  );

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Stack gap="gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-headline-lg font-semibold tracking-tight">
              Repositories
            </h1>
            <span className="rounded-full border border-border-default bg-surface-raised px-2 py-px font-mono text-code-sm text-muted">
              {repos.length} active
            </span>
          </div>
          <p className="text-body-md text-muted">
            Connected codebases indexed for questions and evidence tracing.
          </p>
        </Stack>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-disabled" />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter repositories…"
              aria-label="Filter repositories"
              className="h-8 w-64 rounded-md border border-border-default bg-surface-neutral pl-8 pr-14 text-body-md text-primary placeholder:text-disabled"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border-default bg-surface-overlay px-1 font-mono text-[10px] text-muted">
              Cmd+F
            </kbd>
          </div>
          <Button variant="secondary" disabled>
            Sync all
          </Button>
              <Button onClick={() => setConnectOpen(true)}>
                <Plus />
                Connect repo
              </Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-border-default bg-surface-neutral">
        {isLoading ? (
          <LoadingRows />
        ) : isError && error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p role="alert" className="font-mono text-code-sm text-status-error">
              {formatApiError(error)}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
              <FolderGit2 className="size-5" />
            </div>
            <Stack className="items-center" gap="gap-2">
              <h2 className="text-headline-md font-semibold tracking-tight">
                {repos.length === 0
                  ? "Connect your first repository"
                  : "No repositories match"}
              </h2>
              <p className="max-w-md text-body-md text-muted">
                {repos.length === 0
                  ? "Index any public or private repo to trace code decisions with evidence."
                  : "Try a different filter."}
              </p>
            </Stack>
            {repos.length === 0 && (
              <Button onClick={() => setConnectOpen(true)}>
                <Plus />
                Connect repository
              </Button>
            )}
            <p className="font-mono text-code-sm text-disabled">
              connect flow lands in the next milestone
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border-default">
            {visible.map((repo) => (
              <li key={repo.id}>
                <RepoRow repo={repo} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConnectRepoModal open={connectOpen} onOpenChange={setConnectOpen} />
    </PageShell>
  );
}
