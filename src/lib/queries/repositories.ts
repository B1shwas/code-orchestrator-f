import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  connectRepository,
  getRepository,
  listGithubRepos,
  listRepositories,
  retryRepository,
  unlinkRepository,
  type ConnectRepositoryBody,
  type GithubRepo,
  type Repository,
} from "@/lib/api";
import { useUiStore } from "@/stores/ui-store";

const CLONE_POLL_INTERVAL_MS = 2_500;
const TERMINAL_STATUSES: readonly string[] = ["READY", "ERROR"];

export const repoKeys = {
  all: ["repositories"] as const,
  lists: () => [...repoKeys.all, "list"] as const,
  detail: (id: string) => [...repoKeys.all, "detail", id] as const,
  github: (page: number, perPage: number) =>
    [...repoKeys.all, "github", page, perPage] as const,
};

export interface UseRepositoriesOptions {
  enabled?: boolean;
  /** Refetch the list while any repo is non-terminal (clone polling). */
  poll?: boolean;
}

/** My linked repos, newest first. */
export function useRepositories(
  options?: UseRepositoriesOptions,
): UseQueryResult<Repository[]> {
  const poll = options?.poll ?? false;
  return useQuery({
    queryKey: repoKeys.lists(),
    queryFn: listRepositories,
    enabled: options?.enabled ?? true,
    refetchInterval: (query) => {
      if (!poll) return false;
      const data = query.state.data as Repository[] | undefined;
      if (!data) return CLONE_POLL_INTERVAL_MS;
      return data.some((repo) => !TERMINAL_STATUSES.includes(repo.status))
        ? CLONE_POLL_INTERVAL_MS
        : false;
    },
  });
}

/** Live GitHub repos for the connect modal. */
export function useGithubRepos(
  page = 1,
  perPage = 30,
  enabled = true,
): UseQueryResult<GithubRepo[]> {
  return useQuery({
    queryKey: repoKeys.github(page, perPage),
    queryFn: () => listGithubRepos({ page, perPage }),
    enabled,
  });
}

export interface UseRepositoryOptions {
  /** When true, refetch every 2.5s until READY|ERROR (clone polling). */
  poll?: boolean;
  enabled?: boolean;
}

/** Repo detail. Null id disables the query. 404 = unlinked (handle in UI). */
export function useRepository(
  id: string | null,
  options?: UseRepositoryOptions,
): UseQueryResult<Repository> {
  const poll = options?.poll ?? false;
  return useQuery({
    queryKey: id ? repoKeys.detail(id) : ["repositories", "detail", "none"],
    queryFn: id ? () => getRepository(id) : skipToken,
    enabled: (options?.enabled ?? true) && id !== null,
    refetchInterval: (query) => {
      if (!poll) return false;
      const data = query.state.data as Repository | undefined;
      if (!data) return CLONE_POLL_INTERVAL_MS;
      return TERMINAL_STATUSES.includes(data.status)
        ? false
        : CLONE_POLL_INTERVAL_MS;
    },
  });
}

/** Connect { owner, name } — seeds the detail cache with the PENDING repo. */
export function useConnectRepository(): UseMutationResult<
  Repository,
  Error,
  ConnectRepositoryBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectRepository,
    onSuccess: (repo) => {
      queryClient.setQueryData(repoKeys.detail(repo.id), repo);
      void queryClient.invalidateQueries({ queryKey: repoKeys.lists() });
    },
  });
}

/** Re-arm ERROR -> PENDING. Detail polling (if active) picks up the new state. */
export function useRetryRepository(): UseMutationResult<
  Repository,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryRepository,
    onSuccess: (repo) => {
      queryClient.setQueryData(repoKeys.detail(repo.id), repo);
      void queryClient.invalidateQueries({ queryKey: repoKeys.lists() });
    },
  });
}

/** Unlink — drops caches and clears selection if it pointed at the repo. */
export function useUnlinkRepository(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlinkRepository,
    onSuccess: (_, id) => {
      void queryClient.removeQueries({ queryKey: repoKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: repoKeys.lists() });
      const selected = useUiStore.getState().selectedRepositoryId;
      if (selected === id) useUiStore.getState().selectRepository(null);
    },
  });
}
