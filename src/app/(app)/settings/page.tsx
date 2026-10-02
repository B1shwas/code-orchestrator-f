"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { PageShell, Stack } from "@/components/layout";
import { useAuthStore } from "@/stores/auth-store";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function SettingsPage(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell>
      <Stack gap="gap-1">
        <h1 className="text-headline-lg font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-body-md text-muted">
          Profile and workspace preferences.
        </p>
      </Stack>

      <section className="rounded-lg border border-border-default bg-surface-neutral p-6">
        <Stack gap="gap-4">
          <h2 className="text-headline-md font-semibold tracking-tight">
            Profile
          </h2>
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
            >
              {initials(user?.name ?? null, user?.email ?? null)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-body-lg font-medium text-primary">
                {user?.name ?? "GitHub user"}
              </span>
              <span className="truncate font-mono text-code-sm text-muted">
                {user?.email ?? "no email"}
              </span>
            </div>
          </div>
        </Stack>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border-default bg-surface-neutral px-6 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg border border-border-default bg-surface-raised text-muted">
          <SettingsIcon className="size-5" />
        </div>
        <Stack className="items-center" gap="gap-2">
          <h2 className="text-headline-md font-semibold tracking-tight">
            Repository settings land here
          </h2>
          <p className="max-w-md text-body-md text-muted">
            Indexing rules, branches, webhooks, and the danger zone from the
            Stitch design land in the next milestone.
          </p>
        </Stack>
        <p className="font-mono text-code-sm text-disabled">
          settings UI lands in the next milestone
        </p>
      </section>
    </PageShell>
  );
}
