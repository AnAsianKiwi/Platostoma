// src/store/useLibraryStore.ts
import { create } from 'zustand';
import { db } from '../services/db';
import { MediaItem } from '../types';

interface LibraryState {
  items: MediaItem[];
  isLoading: boolean;
  refreshLibrary: () => Promise<void>;
  addItem: (item: MediaItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  isLoading: true,

  refreshLibrary: async () => {
    set({ isLoading: true });
    try {
      const items = await db.getLibrary();
      set({ items, isLoading: false });
    } catch (error) {
      console.error("Failed to load library:", error);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    // 1. Optimistic update (update UI instantly)
    set((state) => ({ items: [item, ...state.items] }));
    // 2. Save to DB
    await db.saveLibraryItem(item);
    // 3. Ensure sync
    await get().refreshLibrary();
  },

  removeItem: async (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    await db.deleteLibraryItem(id);
  }
}));