import { apiClient } from "./client";
import type {
  ConnectRepositoryBody,
  GithubRepo,
  Repository,
} from "./types";

export interface ListGithubReposParams {
  page?: number; // default 1
  perPage?: number; // default 30, max 100
}

/** GET /repositories/github — live GitHub repos for the connect modal. */
export async function listGithubRepos(
  params?: ListGithubReposParams,
): Promise<GithubRepo[]> {
  const { data } = await apiClient.get<GithubRepo[]>("/repositories/github", {
    params: {
      ...(params?.page !== undefined ? { page: params.page } : {}),
      ...(params?.perPage !== undefined ? { per_page: params.perPage } : {}),
    },
  });
  return data;
}

/** GET /repositories — my linked repos, newest first. */
export async function listRepositories(): Promise<Repository[]> {
  const { data } = await apiClient.get<Repository[]>("/repositories");
  return data;
}

/**
 * POST /repositories — connect { owner, name } EXACTLY (unknown fields rejected).
 * Returns the repo with status PENDING; poll getRepository until READY|ERROR.
 */
export async function connectRepository(
  body: ConnectRepositoryBody,
): Promise<Repository> {
  const { data } = await apiClient.post<Repository>("/repositories", {
    owner: body.owner,
    name: body.name,
  });
  return data;
}

/** GET /repositories/:id — repo detail (404 if unlinked). Poll while PENDING/CLONING. */
export async function getRepository(id: string): Promise<Repository> {
  const { data } = await apiClient.get<Repository>(`/repositories/${id}`);
  return data;
}

/** POST /repositories/:id/retry — re-arms ERROR -> PENDING. No-op unless ERROR. */
export async function retryRepository(id: string): Promise<Repository> {
  const { data } = await apiClient.post<Repository>(`/repositories/${id}/retry`);
  return data;
}

/** DELETE /repositories/:id — unlink only (files kept). 204, empty body. */
export async function unlinkRepository(id: string): Promise<void> {
  await apiClient.delete(`/repositories/${id}`);
}
