import { apiClient } from "./client";
import type { CreateInvestigationBody, Investigation } from "./types";

export interface ListInvestigationsParams {
  repositoryId?: string; // omit for all-mine history
  limit?: number; // default 20, max 100
}

/**
 * POST /investigations — body EXACTLY { repositoryId, query, targetFile?, targetSymbol? }.
 * Returns status PENDING; poll getInvestigation until COMPLETED|FAILED.
 */
export async function createInvestigation(
  body: CreateInvestigationBody,
): Promise<Investigation> {
  const { data } = await apiClient.post<Investigation>("/investigations", {
    repositoryId: body.repositoryId,
    query: body.query,
    ...(body.targetFile !== undefined ? { targetFile: body.targetFile } : {}),
    ...(body.targetSymbol !== undefined
      ? { targetSymbol: body.targetSymbol }
      : {}),
  });
  return data;
}

/** GET /investigations — newest first. */
export async function listInvestigations(
  params?: ListInvestigationsParams,
): Promise<Investigation[]> {
  const { data } = await apiClient.get<Investigation[]>("/investigations", {
    params: {
      ...(params?.repositoryId !== undefined
        ? { repositoryId: params.repositoryId }
        : {}),
      ...(params?.limit !== undefined ? { limit: params.limit } : {}),
    },
  });
  return data;
}

/** GET /investigations/:id — full detail. Poll while PENDING/GATHERING_EVIDENCE/ANALYZING. */
export async function getInvestigation(id: string): Promise<Investigation> {
  const { data } = await apiClient.get<Investigation>(`/investigations/${id}`);
  return data;
}
