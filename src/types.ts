// src/types.ts

export type MediaType = 'movie' | 'book' | 'game' | 'music' | 'other';
export type MediaStatus = 'planning' | 'in-progress' | 'completed' | 'dropped';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType | string; // Allow custom strings if you support custom types
  status: MediaStatus | string;
  rating: number;
  image?: string;
  review?: string;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
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
}

// Constants used by mediaService.ts
export const DEFAULT_MEDIA_TYPES: string[] = [
  "movie", 
  "book", 
  "game", 
  "music", 
  "tv"
];

export const DEFAULT_MEDIA_STATUSES: string[] = [
  "planning",
  "in-progress",
  "completed",
  "dropped"
];