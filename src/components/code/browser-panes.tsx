"use client";

import * as React from "react";
import { FileTree } from "./file-tree";
import { FileViewer, type JumpTarget } from "./file-viewer";
import { Outline } from "./outline";
import type { Repository } from "@/lib/api";

export function Breadcrumb({ path }: { path: string | null }): React.JSX.Element {
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
 * Explorer + editor + outline. Holds the open file and jump target locally —
 * the parent keys this by repo id, so switching repositories remounts with
 * a fresh file instead of syncing state in effects.
 */
export function BrowserPanes({ repo }: { repo: Repository }): React.JSX.Element {
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
