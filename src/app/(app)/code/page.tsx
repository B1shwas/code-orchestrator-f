"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderGit2, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useRepositories } from "@/lib/queries/repositories";
import { useUiStore } from "@/stores/ui-store";

/**
 * Smart entry for /code — forwards to the deep link /code/[repoId] so a
 * refresh always reopens the same repository instead of losing context.
 */
export default function CodeIndexPage(): React.JSX.Element {
  const selectedId = useUiStore((s) => s.selectedRepositoryId);
  const { data: repos, isLoading } = useRepositories();
  const router = useRouter();

  // Navigation only (no setState) — resolves the entry to a deep link.
  React.useEffect(() => {
    if (selectedId) {
      router.replace(`/code/${selectedId}`);
      return;
    }
    const ready = repos?.find((r) => r.status === "READY");
    if (ready) router.replace(`/code/${ready.id}`);
  }, [selectedId, repos, router]);

  const showPicker =
    !isLoading && !selectedId && !(repos ?? []).some((r) => r.status === "READY");

  if (!showPicker) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-muted">
        <Loader2 className="size-4 animate-spin" />
        <span className="font-mono text-code-sm">opening code browser…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
          <FolderGit2 className="size-5" />
        </div>
        <div>
          <h1 className="text-headline-md font-semibold tracking-tight">
            No repository to browse
          </h1>
          <p className="mt-1 text-body-md text-muted">
            Connect a repository and wait for it to be READY, then open it
            from the list.
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
