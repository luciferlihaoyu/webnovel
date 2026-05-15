import { create } from 'zustand';

export type Page = 'bookshelf' | 'editor' | 'characters' | 'world' | 'outline' | 'settings';

interface AppState {
  currentPage: Page;
  currentWorkId: number | null;
  setPage: (page: Page) => void;
  setWorkId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'bookshelf',
  currentWorkId: null,
  setPage: (page) => set({ currentPage: page }),
  setWorkId: (id) => set({ currentWorkId: id }),
}));
