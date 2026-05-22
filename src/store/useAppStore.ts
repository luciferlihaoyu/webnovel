import { create } from 'zustand'

export type Page = 'bookshelf' | 'editor' | 'ai' | 'characters' | 'stats' | 'settings'

interface AppState {
  currentPage: Page
  currentWorkId: string | null
  currentWorkTitle: string
  showNewWorkDialog: boolean
  setPage: (page: Page) => void
  setWork: (id: string | null, title?: string) => void
  setShowNewWorkDialog: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'bookshelf',
  currentWorkId: null,
  currentWorkTitle: '',
  showNewWorkDialog: false,
  setPage: (page: Page) => set({ currentPage: page }),
  setWork: (id: string | null, title?: string) =>
    set({ currentWorkId: id, currentWorkTitle: title || '' }),
  setShowNewWorkDialog: (show: boolean) => set({ showNewWorkDialog: show }),
}))
