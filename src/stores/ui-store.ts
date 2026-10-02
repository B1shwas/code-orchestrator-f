import { create } from "zustand";

/**
 * Client UI state only — server state lives in TanStack Query.
 * Session state lives in the auth store.
 */
interface UiState {
  selectedRepositoryId: string | null;
  activeInvestigationId: string | null;
  selectRepository: (id: string | null) => void;
  setActiveInvestigation: (id: string | null) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  selectedRepositoryId: null,
  activeInvestigationId: null,
  selectRepository: (selectedRepositoryId) => set({ selectedRepositoryId }),
  setActiveInvestigation: (activeInvestigationId) =>
    set({ activeInvestigationId }),
}));
