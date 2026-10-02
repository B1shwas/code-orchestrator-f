import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";

const defaultOptions: QueryClientConfig["defaultOptions"] = {
  queries: {
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Auth and gone/unlinked are terminal UI states, never worth retrying.
      if (isApiError(error, 401) || isApiError(error, 404)) return false;
      return failureCount < 2;
    },
  },
  mutations: {
    retry: false,
  },
};

let client: QueryClient | null = null;

/**
 * App-wide singleton. One instance (not per-mount) so any module — including
 * the auth store, which can never use hooks — can reach the cache.
 */
export function getQueryClient(): QueryClient {
  if (!client) client = new QueryClient({ defaultOptions });
  return client;
}

/**
 * Drop all server state: cancel in-flight requests, then remove everything.
 * Called on logout and session expiry — cache keys are not user-scoped, so
 * without this the next session would see the previous account's data.
 */
export function clearClientCache(): void {
  if (!client) return;
  void client.cancelQueries();
  client.clear();
}
