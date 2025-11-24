import { create } from 'zustand';
import { ViewType, MediaItem } from '../types';
import { generateId } from '../services/mediaService';

// --- NEW TOAST TYPES ---
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface UIState {
  // ... existing state ...
  currentView: ViewType;
  activeMediaId: string | null;
  isSettingsOpen: boolean;
  tempNewItem: MediaItem | null;
  libraryLayout: 'grid' | 'list';
  theme: 'light' | 'dark';
  lastModifiedId: string | null;

  // --- NEW TOAST STATE ---
  toasts: Toast[];

  // Actions
  setView: (view: ViewType) => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  toggleSettings: () => void;
  setLibraryLayout: (layout: 'grid' | 'list') => void;
  startManualAdd: () => void;
  cancelManualAdd: () => void;
  triggerSaveAnimation: (id: string) => void;
  
  // --- NEW TOAST ACTIONS ---
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'library',
  activeMediaId: null,
  isSettingsOpen: false,
  tempNewItem: null,
  libraryLayout: 'grid',
  theme: 'dark',
  lastModifiedId: null,
  
  // Init Toasts
  toasts: [],

  setView: (view) => set({ currentView: view }),
  openDetail: (id) => set({ activeMediaId: id, tempNewItem: null }),
  closeDetail: () => set({ activeMediaId: null, tempNewItem: null }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setLibraryLayout: (layout) => set({ libraryLayout: layout }),

  startManualAdd: () => {
    const newItem: MediaItem = {
      id: generateId(), title: 'New Entry', type: 'book', status: 'planning', coverUrl: '', rating: 0, progress: 0, tags: [], description: '', notes: '', addedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    set({ tempNewItem: newItem, activeMediaId: null });
  },

  cancelManualAdd: () => set({ tempNewItem: null }),

  triggerSaveAnimation: (id) => {
    set({ lastModifiedId: id });
    setTimeout(() => set({ lastModifiedId: null }), 2000);
  },

  // --- TOAST IMPLEMENTATION ---
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  }
}));