"use client";

import Link from "next/link";
import { FileCode, FolderGit2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageShell, Stack } from "@/components/layout";
import { useRepository } from "@/lib/queries/repositories";
import { useUiStore } from "@/stores/ui-store";

export default function CodePage(): React.JSX.Element {
  const selectedId = useUiStore((s) => s.selectedRepositoryId);
  const { data: repo } = useRepository(selectedId);

  return (
    <PageShell>
      <Stack gap="gap-1">
        <h1 className="text-headline-lg font-semibold tracking-tight">
          Code Browser
        </h1>
        <p className="font-mono text-code-sm text-muted">
          {repo ? `${repo.owner}/${repo.name}` : "no repository selected"}
        </p>
      </Stack>

      <section className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border-default bg-surface-neutral px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
          {repo ? (
            <FileCode className="size-5" />
          ) : (
            <FolderGit2 className="size-5" />
          )}
        </div>
        <Stack className="items-center" gap="gap-2">
          <h2 className="text-headline-md font-semibold tracking-tight">
            {repo ? "File tree lands here" : "Select a repository first"}
          </h2>
          <p className="max-w-md text-body-md text-muted">
            {repo
              ? `Lazy-loaded tree, file viewer, search, and outline for ${repo.owner}/${repo.name} land in the next milestone.`
              : "Pick a READY repository from the list to start browsing code."}
          </p>
        </Stack>
        {!repo && (
          <Link
            href="/repositories"
            className={buttonVariants({ variant: "secondary" })}
          >
            Go to repositories
          </Link>
        )}
        <p className="font-mono text-code-sm text-disabled">
          code browser lands in the next milestone
        </p>
      </section>
    </PageShell>
  );
}
