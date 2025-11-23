export type MediaType = 'movie' | 'book' | 'game' | 'music' | 'tv' | string;
export type MediaStatus = 'planning' | 'in-progress' | 'completed' | 'dropped' | string;
export type ViewType = 'dashboard' | 'library' | 'import' | 'settings';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  rating: number;
  tags: string[];
  
  // Fields that were missing causing errors:
  coverUrl?: string;
  sourceUrl?: string;
  author?: string;         // For books/music
  originalTitle?: string; 
  description?: string;
  notes?: string;
  favorite?: boolean;
  progress?: number;       // e.g., current page or episode
  total?: number;          // e.g., total pages
  relatedIds?: string[];
  
  // Date handling - Using strings (ISO) is easier for JSON serialization
  addedAt: string;     
  updatedAt: string;
}

export interface AppSettings {
  apiKey: string;
  proxyUrl: string;
  enableAi: boolean;
  customTypes: string[];
  customStatuses: string[];
  gridColumns: number;
  keybinds: {
    addMedia: string;
    [key: string]: string;
  };
}

export interface AppState {
  library: MediaItem[];
  settings: AppSettings;
  
  // UI State fields that were missing:
  view: ViewType;
  activeMediaId: string | null;
  theme: 'light' | 'dark';
  libraryLayout: 'grid' | 'list' | 'compact';
  modalPosition: { x: number; y: number };
}

export const DEFAULT_MEDIA_TYPES: string[] = [
  "movie", "book", "game", "music", "tv"
];

export const DEFAULT_MEDIA_STATUSES: string[] = [
  "planning", "in-progress", "completed", "dropped"
];