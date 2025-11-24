import { create } from 'zustand';
import { db } from '../services/db';
import { AppSettings, MediaItem } from '../types';
import { loadSettings as loadDefaultSettings } from '../services/mediaService';
// 1. Import Service
import { cacheImage } from '../services/imageService';

interface DataState {
  isLoaded: boolean;
  library: MediaItem[];
  settings: AppSettings;
  
  init: () => Promise<void>;
  addItem: (item: MediaItem) => Promise<void>;
  updateItem: (item: MediaItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  bulkDeleteItems: (ids: string[]) => Promise<void>;
  importItems: (items: MediaItem[]) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  clearLibrary: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  isLoaded: false,
  library: [],
  settings: {
    apiKey: '', proxyUrl: '', enableAi: false, customTypes: [], customStatuses: [], 
    gridColumns: 0, keybinds: { addMedia: 'Ctrl+Alt+n' }
  },

  init: async () => {
    try {
      const [libData, settingsData] = await Promise.all([
        db.getLibrary(),
        db.getSettings()
      ]);
      const defaults = loadDefaultSettings();
      const mergedSettings = { ...defaults, ...settingsData };
      set({ library: libData, settings: mergedSettings, isLoaded: true });
    } catch (error) {
      console.error("Failed to initialize data store:", error);
      set({ isLoaded: true });
    }
  },

  addItem: async (item) => {
    // Cache image before saving
    const localCover = await cacheImage(item.coverUrl || '', item.id);
    const finalItem = { ...item, coverUrl: localCover };

    set((state) => ({ library: [finalItem, ...state.library] }));
    await db.saveLibraryItem(finalItem);
  },

  updateItem: async (item) => {
    // Check if cover URL changed or is still remote
    // If it starts with 'http', it needs caching. If 'asset://', it's already local.
    let finalItem = item;
    if (item.coverUrl && item.coverUrl.startsWith('http')) {
       const localCover = await cacheImage(item.coverUrl, item.id);
       finalItem = { ...item, coverUrl: localCover };
    }

    set((state) => ({
      library: state.library.map((i) => (i.id === finalItem.id ? finalItem : i))
    }));
    await db.saveLibraryItem(finalItem);
  },

  deleteItem: async (id) => {
    set((state) => ({ library: state.library.filter((i) => i.id !== id) }));
    await db.deleteLibraryItem(id);
    // Note: In a full app, you'd also delete the local file here to save space
  },

  bulkDeleteItems: async (ids) => {
    const idSet = new Set(ids);
    set((state) => ({ library: state.library.filter((i) => !idSet.has(i.id)) }));
    await db.bulkDeleteItems(ids);
  },

  importItems: async (newItems) => {
    // 1. Optimistic UI update with remote URLs (so user sees them instantly)
    set((state) => ({
      library: [...newItems, ...state.library]
    }));
    
    // 2. Process caching in background
    // We do this in parallel to speed it up, but batched to not kill network
    const processedItems: MediaItem[] = [];
    
    // Process in chunks of 5 to avoid network congestion
    for (let i = 0; i < newItems.length; i += 5) {
        const chunk = newItems.slice(i, i + 5);
        const promises = chunk.map(async (item) => {
            if (item.coverUrl) {
                const localPath = await cacheImage(item.coverUrl, item.id);
                return { ...item, coverUrl: localPath };
            }
            return item;
        });
        const chunkResults = await Promise.all(promises);
        processedItems.push(...chunkResults);
    }

    // 3. Update Store with new local paths
    set((state) => {
        // Create map for O(1) lookup
        const incomingMap = new Map(processedItems.map(i => [i.id, i]));
        return {
            library: state.library.map(i => incomingMap.get(i.id) || i)
        };
    });

    // 4. Save to DB
    await db.saveBulkLibraryItems(processedItems);
  },

  updateSettings: async (newSettings) => {
    set({ settings: newSettings });
    await db.saveSettings(newSettings);
  },

  clearLibrary: async () => {
    const allIds = get().library.map(i => i.id);
    set({ library: [] });
    await db.bulkDeleteItems(allIds);
  }
}));