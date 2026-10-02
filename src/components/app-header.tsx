"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "./ui/button";
import { WhycodeMark } from "./icons";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppHeader(): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [leaving, setLeaving] = React.useState(false);

  async function handleLogout(): Promise<void> {
    setLeaving(true);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <header className="flex h-10 items-center justify-between border-b border-border-default bg-surface-neutral px-4">
      <div className="flex items-center gap-2">
        <WhycodeMark className="size-5" />
        <span className="text-body-md font-semibold tracking-tight">
          WhyCODE
        </span>
        <span className="rounded border border-border-default bg-surface-raised px-1.5 py-px font-mono text-code-sm text-muted">
          dev
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white"
            >
              {initials(user.name, user.email)}
            </span>
            <span className="hidden max-w-40 truncate text-body-sm text-muted sm:block">
              {user.name ?? user.email ?? "GitHub user"}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleLogout()}
          disabled={leaving}
          aria-label="Log out"
        >
          <LogOut />
          <span className="hidden sm:inline">
            {leaving ? "Logging out…" : "Log out"}
          </span>
        </Button>
      </div>
    </header>
  );
}
