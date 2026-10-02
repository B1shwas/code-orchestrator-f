import { create } from "zustand";
import {
  createInvestigation,
  getInvestigation,
  listInvestigations,
  type ApiError,
  type CreateInvestigationBody,
  type Investigation,
} from "@/lib/api";
import { pollUntil } from "@/lib/poll";

const TERMINAL_STATUSES = ["COMPLETED", "FAILED"] as const;

function upsert(list: Investigation[], item: Investigation): Investigation[] {
  const index = list.findIndex((i) => i.id === item.id);
  if (index === -1) return [item, ...list];
  const next = [...list];
  next[index] = item;
  return next;
}

interface InvestigationState {
  items: Investigation[];
  active: Investigation | null;
  listLoading: boolean;
  creating: boolean;
  error: ApiError | null;

  fetchAll: (params?: { repositoryId?: string; limit?: number }) => Promise<void>;
  /** POST /investigations — returns the PENDING item; caller polls via watch. */
  create: (body: CreateInvestigationBody) => Promise<Investigation>;
  load: (id: string) => Promise<Investigation>;
  /**
   * Poll GET /:id until COMPLETED|FAILED and keep `active` fresh on every tick.
   * On FAILED both evidence and llmResponse stay null — show generic failure UI.
   */
  watch: (id: string, signal?: AbortSignal) => Promise<Investigation>;
  setActive: (item: Investigation | null) => void;
  clearError: () => void;
}

export const useInvestigationStore = create<InvestigationState>()((set) => ({
  items: [],
  active: null,
  listLoading: false,
  creating: false,
  error: null,

  fetchAll: async (params) => {
    set({ listLoading: true, error: null });
    try {
      const items = await listInvestigations(params);
      set({ items, listLoading: false });
    } catch (error) {
      set({ listLoading: false, error: error as ApiError });
      throw error;
    }
  },

  create: async (body) => {
    set({ creating: true, error: null });
    try {
      const item = await createInvestigation(body);
      set((s) => ({
        items: upsert(s.items, item),
        active: item,
        creating: false,
      }));
      return item;
    } catch (error) {
      set({ creating: false, error: error as ApiError });
      throw error;
    }
  },

  load: async (id) => {
    try {
      const item = await getInvestigation(id);
      set((s) => ({ items: upsert(s.items, item), active: item }));
      return item;
    } catch (error) {
      set({ error: error as ApiError });
      throw error;
    }
  },

  watch: async (id, signal) => {
    return pollUntil(() => getInvestigation(id), {
      isTerminal: (item) =>
        (TERMINAL_STATUSES as readonly string[]).includes(item.status),
      onTick: (item) =>
        set((s) => ({ items: upsert(s.items, item), active: item })),
      signal,
    });
  },

  setActive: (active) => set({ active }),

  clearError: () => set({ error: null }),
}));
