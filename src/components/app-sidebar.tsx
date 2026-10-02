"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileCode,
  FolderGit2,
  LogOut,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "./ui/button";
import { WhycodeMark } from "./icons";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/repositories", label: "Repositories", icon: FolderGit2 },
  { href: "/code", label: "Code Browser", icon: FileCode },
  { href: "/investigations", label: "Investigations", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/);
  if (parts.length > 1 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function useLogout(): { leaving: boolean; logout: () => void } {
  const logoutRequest = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [leaving, setLeaving] = React.useState(false);

  async function logout(): Promise<void> {
    setLeaving(true);
    try {
      await logoutRequest();
    } finally {
      router.replace("/login");
    }
  }

  return { leaving, logout: () => void logout() };
}

/** Desktop sidebar — logo, workspace nav, user footer. */
export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { leaving, logout } = useLogout();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border-default bg-surface-neutral md:flex">
      <div className="flex h-14 items-center gap-2 px-4">
        <WhycodeMark className="size-6" />
        <span className="text-body-md font-semibold tracking-tight text-primary">
          WhyCODE
        </span>
        <span className="rounded border border-border-default bg-surface-raised px-1.5 py-px font-mono text-code-sm text-muted">
          dev
        </span>
      </div>

      <nav aria-label="Workspace" className="flex-1 px-3 py-2">
        <p className="px-2 pb-2 font-mono text-code-sm uppercase tracking-widest text-disabled">
          Workspace
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 items-center gap-3 rounded-md px-3 text-body-md transition-colors",
                    active
                      ? "bg-surface-raised font-medium text-primary"
                      : "text-muted hover:bg-surface-raised hover:text-primary",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand"
                    />
                  )}
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border-default p-3">
        {user && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white"
            >
              {initials(user.name, user.email)}
            </span>
            <span className="min-w-0 flex-1 truncate text-body-sm text-muted">
              {user.name ?? user.email ?? "GitHub user"}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={logout}
          disabled={leaving}
          aria-label="Log out"
        >
          <LogOut />
          {leaving ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </aside>
  );
}

/** Compact top nav for small screens (sidebar is hidden below md). */
export function MobileNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-10 border-b border-border-default bg-canvas/95 backdrop-blur md:hidden">
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2">
        <WhycodeMark className="size-5 shrink-0" />
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-body-md",
                active
                  ? "bg-surface-raised font-medium text-primary"
                  : "text-muted",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
