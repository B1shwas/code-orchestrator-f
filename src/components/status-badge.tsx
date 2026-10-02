import { cn } from "@/lib/utils";
import type { InvestigationStatus, RepoStatus } from "@/lib/api";

type Tone = "amber" | "sky" | "emerald" | "rose" | "gray";

const toneClasses: Record<Tone, string> = {
  amber: "border-status-pending/30 bg-status-pending/10 text-status-pending",
  sky: "border-status-cloning/30 bg-status-cloning/10 text-status-cloning",
  emerald: "border-status-ready/30 bg-status-ready/10 text-status-ready",
  rose: "border-status-error/30 bg-status-error/10 text-status-error",
  gray: "border-border-default bg-surface-raised text-muted",
};

/** Monospaced status pill with a 6px dot (Obsidian Precision lifecycle style). */
export function StatusBadge({
  tone,
  pulse = false,
  children,
  className,
}: {
  tone: Tone;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-px font-mono text-code-sm font-medium uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full bg-current", pulse && "animate-pulse")}
      />
      {children}
    </span>
  );
}

const repoTone: Record<RepoStatus, { tone: Tone; pulse?: boolean }> = {
  PENDING: { tone: "amber", pulse: true },
  CLONING: { tone: "sky", pulse: true },
  READY: { tone: "emerald" },
  ERROR: { tone: "rose" },
};

export function RepoStatusBadge({ status }: { status: RepoStatus }): React.JSX.Element {
  const { tone, pulse } = repoTone[status];
  return (
    <StatusBadge tone={tone} pulse={pulse}>
      {status}
    </StatusBadge>
  );
}

const investigationTone: Record<InvestigationStatus, { tone: Tone; label: string; pulse?: boolean }> = {
  PENDING: { tone: "gray", label: "PENDING", pulse: true },
  GATHERING_EVIDENCE: { tone: "sky", label: "GATHERING", pulse: true },
  ANALYZING: { tone: "sky", label: "ANALYZING", pulse: true },
  COMPLETED: { tone: "emerald", label: "COMPLETED" },
  FAILED: { tone: "rose", label: "FAILED" },
};

export function InvestigationStatusBadge({
  status,
}: {
  status: InvestigationStatus;
}): React.JSX.Element {
  const { tone, label, pulse } = investigationTone[status];
  return (
    <StatusBadge tone={tone} pulse={pulse}>
      {label}
    </StatusBadge>
  );
}
