"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, Stack } from "@/components/layout";
import { InvestigationStatusBadge } from "@/components/status-badge";
import { useInvestigations } from "@/lib/queries/investigations";
import { formatApiError, formatRelativeTime } from "@/lib/format";
import type { Investigation } from "@/lib/api";

function InvestigationRow({ item }: { item: Investigation }): React.JSX.Element {
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-overlay text-muted">
        <MessageSquare className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-body-md font-medium text-primary">
            {item.query}
          </span>
          <InvestigationStatusBadge status={item.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-muted">
          {item.targetFile && (
            <span className="truncate font-mono text-code-sm">
              {item.targetFile}
            </span>
          )}
          <span>asked {formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>
    </li>
  );
}

function LoadingRows(): React.JSX.Element {
  return (
    <div aria-label="Loading investigations" className="flex flex-col">
      {[0, 1, 2].map((key) => (
        <div key={key} className="flex items-center gap-4 px-4 py-3">
          <div className="size-9 shrink-0 animate-pulse rounded-md bg-surface-overlay" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3 w-64 animate-pulse rounded bg-surface-overlay" />
            <div className="h-2.5 w-32 animate-pulse rounded bg-surface-overlay" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InvestigationsPage(): React.JSX.Element {
  const { data, isLoading, isError, error, refetch } = useInvestigations();
  const items = data ?? [];

  return (
    <PageShell>
      <Stack gap="gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-headline-lg font-semibold tracking-tight">
            Investigations
          </h1>
          <span className="rounded-full border border-border-default bg-surface-raised px-2 py-px font-mono text-code-sm text-muted">
            {items.length} total
          </span>
        </div>
        <p className="text-body-md text-muted">
          Questions asked across your repositories, newest first.
        </p>
      </Stack>

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
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
              <MessageSquare className="size-5" />
            </div>
            <Stack className="items-center" gap="gap-2">
              <h2 className="text-headline-md font-semibold tracking-tight">
                No investigations yet
              </h2>
              <p className="max-w-md text-body-md text-muted">
                Ask your first question from a READY repository to see it
                here with its evidence.
              </p>
            </Stack>
            <p className="font-mono text-code-sm text-disabled">
              ask flow lands in the next milestone
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border-default">
            {items.map((item) => (
              <InvestigationRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
