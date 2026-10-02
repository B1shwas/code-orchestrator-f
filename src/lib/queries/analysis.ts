import {
  skipToken,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  getFile,
  getSymbols,
  getTree,
  type FileContent,
  type SymbolInfo,
  type TreeEntry,
} from "@/lib/api";

export const analysisKeys = {
  all: ["analysis"] as const,
  tree: (repoId: string, path: string, depth: number) =>
    [...analysisKeys.all, "tree", repoId, path, depth] as const,
  file: (repoId: string, path: string) =>
    [...analysisKeys.all, "file", repoId, path] as const,
  symbols: (repoId: string, path: string) =>
    [...analysisKeys.all, "symbols", repoId, path] as const,
};

export interface UseTreeOptions {
  depth?: number;
  enabled?: boolean;
}

/** Lazy folder listing. Null repoId disables the query. */
export function useTree(
  repoId: string | null,
  path: string,
  options?: UseTreeOptions,
): UseQueryResult<TreeEntry[]> {
  const depth = options?.depth ?? 1;
  return useQuery({
    queryKey: repoId
      ? analysisKeys.tree(repoId, path, depth)
      : ["analysis", "tree", "none"],
    queryFn: repoId ? () => getTree(repoId, { path, depth }) : skipToken,
    enabled: (options?.enabled ?? true) && repoId !== null,
  });
}

/** File content. Null repoId or empty path disables the query. */
export function useFile(
  repoId: string | null,
  path: string | null,
): UseQueryResult<FileContent> {
  const enabled = repoId !== null && path !== null && path !== "";
  return useQuery({
    queryKey:
      repoId && path ? analysisKeys.file(repoId, path) : ["analysis", "file", "none"],
    queryFn: repoId && path ? () => getFile(repoId, path) : skipToken,
    enabled,
  });
}

/** Symbol outline for the open file. Empty for non-code files (hide outline). */
export function useSymbols(
  repoId: string | null,
  path: string | null,
): UseQueryResult<SymbolInfo[]> {
  const enabled = repoId !== null && path !== null && path !== "";
  return useQuery({
    queryKey:
      repoId && path
        ? analysisKeys.symbols(repoId, path)
        : ["analysis", "symbols", "none"],
    queryFn: repoId && path ? () => getSymbols(repoId, path) : skipToken,
    enabled,
  });
}
