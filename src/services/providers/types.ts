import { MediaItem } from '../../types';

export interface SearchResult {
  id: string; // External ID (e.g., MAL ID)
  title: string;
  coverUrl: string;
  type: string;
  year?: number;
  description?: string;
  author?: string;
  status?: string; // Try to map 'finished' -> 'Completed'
  details?: Partial<MediaItem>; // Extra data if available
}

export interface MediaProvider {
  name: string;
  version: string;
  isEnabled: boolean;
  
  // Returns true if this provider handles specific URLs (for scraping)
  canHandleUrl(url: string): boolean;
  
  // Search by text query
  search(query: string): Promise<SearchResult[]>;
  
  // Get detailed info (optional, for expanding a result)
  getDetails?(id: string): Promise<Partial<MediaItem>>;
}