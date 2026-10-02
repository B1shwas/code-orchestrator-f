import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  createInvestigation,
  getInvestigation,
  listInvestigations,
  type CreateInvestigationBody,
  type Investigation,
} from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

const INVESTIGATION_POLL_INTERVAL_MS = 2_500;
const TERMINAL_STATUSES: readonly string[] = ["COMPLETED", "FAILED"];

export const investigationKeys = {
  all: ["investigations"] as const,
  lists: () => [...investigationKeys.all, "list"] as const,
  list: (repositoryId?: string, limit?: number) =>
    [...investigationKeys.all, "list", repositoryId ?? "all", limit ?? 20] as const,
  detail: (id: string) => [...investigationKeys.all, "detail", id] as const,
};

export interface UseInvestigationsOptions {
  repositoryId?: string;
  limit?: number;
  enabled?: boolean;
}

/** Investigation history, newest first. */
export function useInvestigations(
  options?: UseInvestigationsOptions,
): UseQueryResult<Investigation[]> {
  return useQuery({
    queryKey: investigationKeys.list(options?.repositoryId, options?.limit),
    queryFn: () =>
      listInvestigations({
        ...(options?.repositoryId !== undefined
          ? { repositoryId: options.repositoryId }
          : {}),
        ...(options?.limit !== undefined ? { limit: options.limit } : {}),
      }),
    enabled: options?.enabled ?? true,
  });
}

export interface UseInvestigationOptions {
  /** When true, refetch every 2.5s until COMPLETED|FAILED. */
  poll?: boolean;
  enabled?: boolean;
}

/** Investigation detail. Null id disables the query. */
export function useInvestigation(
  id: string | null,
  options?: UseInvestigationOptions,
): UseQueryResult<Investigation> {
  const poll = options?.poll ?? false;
  return useQuery({
    queryKey: id
      ? investigationKeys.detail(id)
      : ["investigations", "detail", "none"],
    queryFn: id ? () => getInvestigation(id) : skipToken,
    enabled: (options?.enabled ?? true) && id !== null,
    refetchInterval: (query) => {
      if (!poll) return false;
      const data = query.state.data as Investigation | undefined;
      if (!data) return INVESTIGATION_POLL_INTERVAL_MS;
      return TERMINAL_STATUSES.includes(data.status)
        ? false
        : INVESTIGATION_POLL_INTERVAL_MS;
    },
  });
}

/**
 * Ask a question — seeds caches with the PENDING investigation and marks it
 * active. The detail hook (poll: true) takes over progress from there.
 */
export function useCreateInvestigation(): UseMutationResult<
  Investigation,
  Error,
  CreateInvestigationBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvestigation,
    onSuccess: (item) => {
      queryClient.setQueryData(investigationKeys.detail(item.id), item);
      void queryClient.invalidateQueries({
        queryKey: investigationKeys.lists(),
      });
      useUiStore.getState().setActiveInvestigation(item.id);
    },
  });
}
