"use client";

import * as React from "react";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  useConnectRepository,
  useGithubRepos,
  useRepositories,
} from "@/lib/queries/repositories";
import { formatApiError } from "@/lib/format";

const NAME_RE = /^[a-zA-Z0-9_.-]+$/;
const PER_PAGE = 30;

type Tab = "github" | "manual";

function FieldError({ message }: { message: string | null }): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p role="alert" className="font-mono text-code-sm text-status-error">
      {message}
    </p>
  );
}

function GithubTab({ onDone }: { onDone: () => void }): React.JSX.Element {
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  const [failure, setFailure] = React.useState<string | null>(null);

  const github = useGithubRepos(page, PER_PAGE, true);
  const linked = useRepositories({ enabled: true });
  const connect = useConnectRepository();

  const connected = React.useMemo(() => {
    const set = new Set<string>();
    for (const repo of linked.data ?? []) {
      set.add(`${repo.owner}/${repo.name}`.toLowerCase());
    }
    return set;
  }, [linked.data]);

  const rows = (github.data ?? []).filter((repo) =>
    `${repo.owner}/${repo.name}`.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  const isLastPage = (github.data?.length ?? 0) < PER_PAGE;

  function submit(owner: string, name: string): void {
    const key = `${owner}/${name}`.toLowerCase();
    setPending(key);
    setFailure(null);
    connect.mutate(
      { owner, name },
      {
        onSuccess: () => {
          setPending(null);
          onDone();
        },
        onError: (error) => {
          setPending(null);
          setFailure(formatApiError(error));
        },
      },
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-border-default p-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-disabled" />
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by owner or name…"
            aria-label="Filter GitHub repositories"
            className="pl-8"
          />
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {github.isLoading ? (
          <div aria-label="Loading GitHub repositories" className="flex flex-col p-4 gap-3">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-9 animate-pulse rounded-md bg-surface-overlay" />
            ))}
          </div>
        ) : github.isError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p role="alert" className="font-mono text-code-sm text-status-error">
              {formatApiError(github.error)}
            </p>
            <Button variant="secondary" size="sm" onClick={() => void github.refetch()}>
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-body-md text-muted">
            {filter ? "No repositories match." : "No GitHub repositories found."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border-default">
            {rows.map((repo) => {
              const key = `${repo.owner}/${repo.name}`.toLowerCase();
              const isConnected = connected.has(key);
              const isPending = pending === key;
              return (
                <li key={repo.githubRepoId} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-mono text-code-md font-medium text-primary">
                      {repo.owner}/{repo.name}
                    </span>
                    <span className="font-mono text-code-sm text-muted">
                      {repo.private ? "Private" : "Public"}
                      {repo.defaultBranch ? ` · ${repo.defaultBranch}` : ""}
                    </span>
                  </div>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 font-mono text-code-sm text-status-ready">
                      <Check className="size-3.5" />
                      Connected
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isPending || connect.isPending}
                      onClick={() => submit(repo.owner, repo.name)}
                    >
                      {isPending ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Plus />
                      )}
                      {isPending ? "Connecting…" : "Connect"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {failure && (
        <p role="alert" className="border-t border-border-default px-4 py-2 font-mono text-code-sm text-status-error">
          {failure}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border-default px-4 py-2.5">
        <span className="font-mono text-code-sm text-muted">Page {page}</span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || github.isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isLastPage || github.isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function ManualTab({ onDone }: { onDone: () => void }): React.JSX.Element {
  const [owner, setOwner] = React.useState("");
  const [name, setName] = React.useState("");
  const [failure, setFailure] = React.useState<string | null>(null);
  const connect = useConnectRepository();

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    const cleanOwner = owner.trim();
    const cleanName = name.trim();
    if (!cleanOwner || !cleanName) {
      setFailure("Owner and repository name are both required.");
      return;
    }
    if (!NAME_RE.test(cleanOwner) || !NAME_RE.test(cleanName)) {
      setFailure("Only letters, numbers, dot, dash, and underscore are allowed.");
      return;
    }
    setFailure(null);
    connect.mutate(
      { owner: cleanOwner, name: cleanName },
      {
        onSuccess: onDone,
        onError: (error) => setFailure(formatApiError(error)),
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="connect-owner" className="text-body-md font-medium text-primary">
          Owner
        </label>
        <Input
          id="connect-owner"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="e.g. stripe"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="connect-name" className="text-body-md font-medium text-primary">
          Repository
        </label>
        <Input
          id="connect-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. payment-engine"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <FieldError message={failure} />
      <Button type="submit" disabled={connect.isPending} className="self-start">
        {connect.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        {connect.isPending ? "Connecting…" : "Connect repository"}
      </Button>
      <p className="font-mono text-code-sm text-disabled">
        Uses your stored GitHub token — no PAT needed.
      </p>
    </form>
  );
}

export function ConnectRepoModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const [tab, setTab] = React.useState<Tab>("github");

  function handleOpenChange(next: boolean): void {
    if (!next) setTab("github");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Connect repository</DialogTitle>
          <DialogDescription>
            Index a codebase to ask questions with evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-border-default px-4 pt-3" role="tablist" aria-label="Connect options">
          <div className="flex gap-1">
            {(
              [
                { id: "github", label: "GitHub" },
                { id: "manual", label: "Owner / name" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "cursor-pointer rounded-t-md px-3 py-2 text-body-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                  tab === item.id
                    ? "bg-surface-raised font-medium text-primary"
                    : "text-muted hover:text-primary",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "github" ? (
          <GithubTab onDone={() => handleOpenChange(false)} />
        ) : (
          <ManualTab onDone={() => handleOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
