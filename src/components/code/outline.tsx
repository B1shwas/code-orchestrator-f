"use client";

import { Braces, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSymbols } from "@/lib/queries/analysis";

const kindColor: Record<string, string> = {
  class: "text-brand-glow",
  interface: "text-secondary",
  function: "text-tertiary",
  method: "text-tertiary",
  enum: "text-status-pending",
};

/** Symbol outline — hidden entirely when the file exposes no symbols. */
export function Outline({
  repoId,
  path,
  onJump,
  className,
}: {
  repoId: string | null;
  path: string | null;
  onJump: (line: number) => void;
  className?: string;
}): React.JSX.Element | null {
  const symbols = useSymbols(repoId, path);

  if (!repoId || !path) return null;
  if (symbols.isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-4 text-muted", className)}>
        <Loader2 className="size-4 animate-spin" />
        <span className="font-mono text-code-sm">reading symbols…</span>
      </div>
    );
  }
  if (symbols.isError || !symbols.data || symbols.data.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col overflow-y-auto p-2", className)}>
      <p className="px-2 pb-2 font-mono text-code-sm uppercase tracking-widest text-disabled">
        Outline
      </p>
      <ul className="flex flex-col gap-0.5">
        {symbols.data.map((symbol) => {
          const indent = symbol.name.split(".").length - 1;
          return (
            <li key={`${symbol.name}:${symbol.startLine}`}>
              <button
                onClick={() => onJump(symbol.startLine)}
                title={`${symbol.kind} · lines ${symbol.startLine}–${symbol.endLine}`}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm py-1 pr-2 text-left text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand hover:bg-surface-raised hover:text-primary"
                style={{ paddingLeft: indent * 12 + 8 }}
              >
                <Braces
                  className={cn(
                    "size-3.5 shrink-0",
                    kindColor[symbol.kind] ?? "text-muted",
                  )}
                />
                <span className="truncate font-mono text-code-sm">
                  {symbol.name}
                </span>
                <span className="ml-auto shrink-0 font-mono text-code-sm text-disabled">
                  {symbol.startLine}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
