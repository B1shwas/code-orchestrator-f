import { apiClient } from "./client";
import type { FileContent, SearchMatch, SymbolInfo, TreeEntry } from "./types";

export interface TreeParams {
  path?: string; // repo-relative, default ""
  depth?: number; // default 2, max 5
  limit?: number; // default 100, max 200
}

/**
 * GET /repositories/:id/tree — lazy-load per folder.
 * Hidden server-side: .git, node_modules, dist, coverage, dotfiles (except .gitignore).
 */
export async function getTree(
  repositoryId: string,
  params?: TreeParams,
): Promise<TreeEntry[]> {
  const { data } = await apiClient.get<TreeEntry[]>(
    `/repositories/${repositoryId}/tree`,
    {
      params: {
        ...(params?.path !== undefined ? { path: params.path } : {}),
        ...(params?.depth !== undefined ? { depth: params.depth } : {}),
        ...(params?.limit !== undefined ? { limit: params.limit } : {}),
      },
    },
  );
  return data;
}

/** GET /repositories/:id/file?path= — path is required, repo-relative. */
export async function getFile(
  repositoryId: string,
  path: string,
): Promise<FileContent> {
  const { data } = await apiClient.get<FileContent>(
    `/repositories/${repositoryId}/file`,
    { params: { path } },
  );
  return data;
}

/** GET /repositories/:id/search — literal, case-sensitive text search. */
export async function searchCode(
  repositoryId: string,
  q: string,
  limit?: number,
): Promise<SearchMatch[]> {
  const { data } = await apiClient.get<SearchMatch[]>(
    `/repositories/${repositoryId}/search`,
    {
      params: {
        q,
        ...(limit !== undefined ? { limit } : {}),
      },
    },
  );
  return data;
}

/**
 * GET /repositories/:id/symbols — [] for non-code files (hide outline, don't error).
 */
export async function getSymbols(
  repositoryId: string,
  path: string,
): Promise<SymbolInfo[]> {
  const { data } = await apiClient.get<SymbolInfo[]>(
    `/repositories/${repositoryId}/symbols`,
    { params: { path } },
  );
  return data;
}

/** GET /repositories/:id/symbol — FileContent of exactly that symbol's lines. */
export async function getSymbol(
  repositoryId: string,
  path: string,
  name: string,
): Promise<FileContent> {
  const { data } = await apiClient.get<FileContent>(
    `/repositories/${repositoryId}/symbol`,
    { params: { path, name } },
  );
  return data;
}
