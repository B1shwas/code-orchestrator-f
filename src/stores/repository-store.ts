import { create } from "zustand";
import {
  connectRepository,
  getRepository,
  isApiError,
  listRepositories,
  retryRepository,
  unlinkRepository,
  type ApiError,
  type ConnectRepositoryBody,
  type Repository,
} from "@/lib/api";
import { pollUntil } from "@/lib/poll";

const TERMINAL_STATUSES = ["READY", "ERROR"] as const;

function upsert(list: Repository[], repo: Repository): Repository[] {
  const index = list.findIndex((r) => r.id === repo.id);
  if (index === -1) return [repo, ...list];
  const next = [...list];
  next[index] = repo;
  return next;
}

interface RepositoryState {
  repositories: Repository[];
  /** Detail of the currently open repo (null until selected). */
  selected: Repository | null;
  listLoading: boolean;
  detailLoading: boolean;
  mutating: boolean;
  error: ApiError | null;

  fetchAll: () => Promise<void>;
  /** Load detail for a repo and mark it selected. */
  select: (id: string) => Promise<void>;
  clearSelection: () => void;
  /** POST /repositories — returns the PENDING repo; caller polls via waitForReady. */
  connect: (body: ConnectRepositoryBody) => Promise<Repository>;
  /** Poll GET /:id until READY|ERROR. 404 -> treated as unlinked (removed, rethrown). */
  waitForReady: (id: string, signal?: AbortSignal) => Promise<Repository>;
  retry: (id: string) => Promise<Repository>;
  unlink: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useRepositoryStore = create<RepositoryState>()((set) => {
  function applyPolled(repo: Repository): void {
    set((s) => ({
      repositories: upsert(s.repositories, repo),
      selected: s.selected?.id === repo.id ? repo : s.selected,
    }));
  }

  return {
    repositories: [],
    selected: null,
    listLoading: false,
    detailLoading: false,
    mutating: false,
    error: null,

    fetchAll: async () => {
      set({ listLoading: true, error: null });
      try {
        const repositories = await listRepositories();
        set({ repositories, listLoading: false });
      } catch (error) {
        set({ listLoading: false, error: error as ApiError });
        throw error;
      }
    },

    select: async (id) => {
      set({ detailLoading: true, error: null });
      try {
        const selected = await getRepository(id);
        set((s) => ({
          selected,
          repositories: upsert(s.repositories, selected),
          detailLoading: false,
        }));
      } catch (error) {
        if (isApiError(error, 404)) {
          // Not linked (anymore) — drop it and clear selection.
          set((s) => ({
            repositories: s.repositories.filter((r) => r.id !== id),
            selected: s.selected?.id === id ? null : s.selected,
            detailLoading: false,
            error: error as ApiError,
          }));
        } else {
          set({ detailLoading: false, error: error as ApiError });
        }
        throw error;
      }
    },

    clearSelection: () => set({ selected: null }),

    connect: async (body) => {
      set({ mutating: true, error: null });
      try {
        const repo = await connectRepository(body);
        set((s) => ({
          repositories: upsert(s.repositories, repo),
          mutating: false,
        }));
        return repo;
      } catch (error) {
        set({ mutating: false, error: error as ApiError });
        throw error;
      }
    },

    waitForReady: async (id, signal) => {
      try {
        return await pollUntil(() => getRepository(id), {
          isTerminal: (repo) =>
            (TERMINAL_STATUSES as readonly string[]).includes(repo.status),
          onTick: applyPolled,
          signal,
        });
      } catch (error) {
        if (isApiError(error, 404)) {
          set((s) => ({
            repositories: s.repositories.filter((r) => r.id !== id),
            selected: s.selected?.id === id ? null : s.selected,
          }));
        }
        throw error;
      }
    },

    retry: async (id) => {
      set({ mutating: true, error: null });
      try {
        const repo = await retryRepository(id);
        set((s) => ({
          repositories: upsert(s.repositories, repo),
          selected: s.selected?.id === id ? repo : s.selected,
          mutating: false,
        }));
        return repo;
      } catch (error) {
        set({ mutating: false, error: error as ApiError });
        throw error;
      }
    },

    unlink: async (id) => {
      set({ mutating: true, error: null });
      try {
        await unlinkRepository(id);
        set((s) => ({
          repositories: s.repositories.filter((r) => r.id !== id),
          selected: s.selected?.id === id ? null : s.selected,
          mutating: false,
        }));
      } catch (error) {
        // 404 here also means "gone" — still drop it locally.
        if (isApiError(error, 404)) {
          set((s) => ({
            repositories: s.repositories.filter((r) => r.id !== id),
            selected: s.selected?.id === id ? null : s.selected,
            mutating: false,
            error: null,
          }));
          return;
        }
        set({ mutating: false, error: error as ApiError });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  };
});

/** Machine stage -> display copy (contract: map client-side). */
export function formatCloneStage(stage: string | null): string {
  switch (stage) {
    case "cloning":
      return "Cloning repository";
    case "finalizing":
      return "Finalizing index";
    default:
      return "Preparing";
  }
}
