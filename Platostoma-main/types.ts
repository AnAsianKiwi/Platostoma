
export const DEFAULT_MEDIA_TYPES = [
  'Anime',
  'Manga',
  'Novel',
  'Movie',
  'TV Show',
  'Comic',
  'Book',
  'Manhua',
  'Donghua'
];

export const DEFAULT_MEDIA_STATUSES = [
  'Planning',
  'In Progress',
  'Completed',
  'Dropped',
  'Paused'
];

export interface MediaItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: string; // Changed from enum to string for flexibility
  status: string; // Changed from enum to string
  coverUrl: string;
  bannerUrl?: string;
  rating: number; // 0-10
  author?: string;
  progress: number; // Current chapter/episode
  total?: number; // Total chapters/episodes
  tags: string[];
  description: string;
  notes: string;
  sourceUrl?: string; // Where user is reading/watching
  addedAt: string;
  updatedAt: string;
  relatedIds?: string[]; // IDs of other formats (e.g., Manga version of an Anime)
  favorite?: boolean;
}

export interface AppState {
  library: MediaItem[];
  view: 'dashboard' | 'library' | 'details' | 'import' | 'settings';
  activeMediaId: string | null;
  theme: 'dark' | 'light';
  libraryLayout: 'grid' | 'list' | 'compact'; // Persist view mode
  modalPosition: { x: number; y: number }; // Persist modal position
  settings: {
    apiKey: string;
    proxyUrl: string;
    enableAi: boolean;
    customTypes: string[];
    customStatuses: string[];
    gridColumns: number; // 0 for auto
    keybinds: {
      addMedia: string;
    };
  };
}

export type ViewType = AppState['view'];
