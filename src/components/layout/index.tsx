import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Full-viewport centered screen — used by login, callback, and guard loader.
 * Consistent padding and centering across all auth screens.
 */
export function CenteredScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Standard auth card — consistent width, padding, and rhythm.
 * All auth screens (login, callback, errors) use this.
 */
export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "relative w-full max-w-md rounded-lg border border-border-default bg-surface-neutral p-6 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.65)] sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Standard dashboard page shell — consistent width, gutters, and vertical rhythm.
 * Used by all authenticated pages.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Consistent vertical stack with standard gap.
 */
export function Stack({
  children,
  className,
  gap = "gap-4",
}: {
  children: React.ReactNode;
  className?: string;
  gap?: string;
}): React.JSX.Element {
  return (
    <div className={cn("flex flex-col", gap, className)}>{children}</div>
  );
}
