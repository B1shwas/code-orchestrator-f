"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTree } from "@/lib/queries/analysis";
import type { TreeEntry } from "@/lib/api";

function FileIcon({ name }: { name: string }): React.JSX.Element {
  return <File className="size-4 shrink-0 text-muted" aria-label={name} />;
}

interface NodeProps {
  repoId: string;
  entry: TreeEntry;
  depth: number;
  activePath: string | null;
  onSelectFile: (path: string) => void;
}

/** One tree row — folders lazy-load children on expand. */
function TreeNode({
  repoId,
  entry,
  depth,
  activePath,
  onSelectFile,
}: NodeProps): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(depth === 0);
  const children = useTree(repoId, entry.path, {
    enabled: entry.type === "dir" && expanded,
  });
  const isActive = entry.type === "file" && entry.path === activePath;

  if (entry.type === "file") {
    return (
      <button
        onClick={() => onSelectFile(entry.path)}
        title={entry.path}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1.5 rounded-sm py-1 pr-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
          isActive
            ? "bg-surface-raised text-primary"
            : "text-muted hover:bg-surface-raised hover:text-primary",
        )}
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-0 h-5 w-0.5 rounded-full bg-brand"
          />
        )}
        <FileIcon name={entry.name} />
        <span className="truncate font-mono text-code-sm">{entry.name}</span>
      </button>
    );
  }

  const Icon = expanded ? FolderOpen : Folder;
  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={entry.path || "/"}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand hover:bg-surface-raised hover:text-primary"
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0" />
        )}
        <Icon className="size-4 shrink-0" />
        <span className="truncate text-body-sm font-medium">
          {entry.name || "/"}
        </span>
        {expanded && children.isLoading && (
          <Loader2 className="size-3 animate-spin" />
        )}
      </button>
      {expanded && (
        <div className="flex flex-col">
          {children.isError ? (
            <button
              onClick={() => void children.refetch()}
              className="cursor-pointer py-1 pr-2 text-left font-mono text-code-sm text-status-error hover:underline"
              style={{ paddingLeft: (depth + 1) * 12 + 8 }}
            >
              Failed to load — retry
            </button>
          ) : (
            (children.data ?? []).map((child) => (
              <TreeNode
                key={child.path}
                repoId={repoId}
                entry={child}
                depth={depth + 1}
                activePath={activePath}
                onSelectFile={onSelectFile}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  repoId,
  activePath,
  onSelectFile,
  className,
}: {
  repoId: string;
  activePath: string | null;
  onSelectFile: (path: string) => void;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn("flex flex-col gap-0.5 overflow-y-auto p-2", className)}>
      <TreeNode
        repoId={repoId}
        entry={{ name: "/", path: "", type: "dir" }}
        depth={0}
        activePath={activePath}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}
