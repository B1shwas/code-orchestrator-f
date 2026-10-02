"use client";

import * as React from "react";
import { Binary, Check, Copy, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFile } from "@/lib/queries/analysis";
import {
  displayNameForLang,
  getHighlightedHtml,
  languageForPath,
  tagLines,
} from "./highlight";
import { formatBytes } from "@/lib/format";

export interface JumpTarget {
  line: number;
  nonce: number;
}

function HighlightedCode({
  content,
  lang,
}: {
  content: string;
  lang: string;
}): React.JSX.Element {
  const html = React.use(getHighlightedHtml(content, lang));
  const tagged = React.useMemo(() => tagLines(html).html, [html]);
  return <div dangerouslySetInnerHTML={{ __html: tagged }} />;
}

function PlainCode({ content }: { content: string }): React.JSX.Element {
  return (
    <pre className="whitespace-pre py-0 pr-4 font-mono text-[13px] leading-6 text-primary">
      {content}
    </pre>
  );
}

/** VS Code-style file viewer — header, banners, gutter + highlighted code. */
export function FileViewer({
  repoId,
  path,
  jump,
  className,
}: {
  repoId: string;
  path: string;
  jump: JumpTarget | null;
  className?: string;
}): React.JSX.Element {
  const file = useFile(repoId, path);
  const [copied, setCopied] = React.useState(false);

  const content = file.data?.content ?? null;
  const lang = languageForPath(path);
  const lineCount = content ? content.split("\n").length : 0;
  const fileName = path.split("/").pop() ?? path;
  const activeLine = jump?.line ?? null;

  // Outline click → scroll the tagged line into view with a flash.
  // DOM sync is the legitimate use-case for an effect (no setState inside).
  React.useEffect(() => {
    if (!jump) return;
    const el = document.getElementById(`L${jump.line}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    el?.classList.add("line-flash");
    const timer = setTimeout(() => el?.classList.remove("line-flash"), 1300);
    return () => clearTimeout(timer);
  }, [jump]);

  async function copy(): Promise<void> {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border-default px-4">
        <span className="truncate font-mono text-code-md font-medium text-primary">
          {fileName}
        </span>
        <span className="rounded border border-border-default bg-surface-raised px-1.5 py-px font-mono text-code-sm text-muted">
          {displayNameForLang(lang)}
        </span>
        {file.data && (
          <span className="font-mono text-code-sm text-disabled">
            {formatBytes(file.data.size)}
          </span>
        )}
        <button
          onClick={() => void copy()}
          disabled={!content}
          aria-label="Copy file contents"
          className="ml-auto rounded-md p-1.5 text-muted transition-colors hover:bg-surface-raised hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand disabled:opacity-40"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>

      {file.data?.truncated && (
        <p
          role="note"
          className="flex shrink-0 items-center gap-2 border-b border-status-pending/30 bg-status-pending/10 px-4 py-1.5 text-body-sm text-status-pending"
        >
          <TriangleAlert className="size-3.5 shrink-0" />
          Showing the first 256KB of this file.
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {file.isLoading ? (
          <div className="flex items-center gap-2 p-4 text-muted">
            <Loader2 className="size-4 animate-spin" />
            <span className="font-mono text-code-sm">loading file…</span>
          </div>
        ) : file.isError ? (
          <div className="flex flex-col items-start gap-3 p-4">
            <p role="alert" className="font-mono text-code-sm text-status-error">
              Could not load this file.
            </p>
            <button
              onClick={() => void file.refetch()}
              className="cursor-pointer font-mono text-code-sm text-secondary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : file.data?.binary ? (
          <div className="flex items-center gap-2 p-4 text-muted">
            <Binary className="size-4 shrink-0" />
            <span className="font-mono text-code-sm">
              Binary file — preview is not available.
            </span>
          </div>
        ) : content === null ? (
          <p className="p-4 font-mono text-code-sm text-muted">
            No content to display.
          </p>
        ) : (
          <div className="flex w-max min-w-full">
            <div
              aria-hidden="true"
              className="sticky left-0 w-12 shrink-0 select-none bg-canvas pr-3 text-right"
            >
              {Array.from({ length: lineCount }, (_, i) => i + 1).map(
                (n) => (
                  <div
                    key={n}
                    className={cn(
                      "font-mono text-[13px] leading-6",
                      n === activeLine ? "text-primary" : "text-disabled",
                    )}
                  >
                    {n}
                  </div>
                ),
              )}
            </div>
            <div className="code-view min-w-0 flex-1">
              <React.Suspense fallback={<PlainCode content={content} />}>
                <HighlightedCode content={content} lang={lang} />
              </React.Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
