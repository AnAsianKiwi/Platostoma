import { JikanProvider } from './providers/JikanProvider';
import { GoogleBooksProvider } from './providers/GoogleBooksProvider';
import { SearchResult } from './providers/types';
import { MediaItem } from '../types';

const PROVIDERS = [JikanProvider, GoogleBooksProvider];

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const mockSearchMedia = async (query: string): Promise<SearchResult[]> => {
  const promises = PROVIDERS
    .filter(p => p.isEnabled)
    .map(p => p.search(query));

  const results = await Promise.allSettled(promises);

  let allMatches: SearchResult[] = [];
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allMatches = [...allMatches, ...result.value];
    }
  });

  return allMatches;
};

export type { SearchResult as MockSearchResult } from './providers/types';

// --- CONFIG & DEFAULTS ---

export const loadSettings = () => ({
    apiKey: '', 
    proxyUrl: '', 
    enableAi: false, 
    customTypes: [], 
    customStatuses: [], 
    gridColumns: 0, 
    keybinds: { addMedia: 'Ctrl+Alt+n' }
});

export const MOCK_DATA: MediaItem[] = [
  {
    id: '1',
    title: 'The Beginning After The End',
    type: 'Manhua', 
    status: 'In Progress',
    coverUrl: 'https://imgs.search.brave.com/J8yE9d6HjE7yE_x3d_x3d/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9jb3Zl/cnMuYWxwaGFjb2Rl/cnMuY29tL2RhdGEv/NTg5LzU4OTQ0Lmpw/Zw',
    rating: 9.5,
    author: 'TurtleMe',
    progress: 175,
    tags: ['Isekai', 'Magic', 'Action'],
    description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability.',
    notes: 'Catching up on the latest season.',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: true
  },
  {
    id: '2',
    title: 'Frieren: Beyond Journey\'s End',
    type: 'Anime',
    status: 'Completed',
    coverUrl: 'https://imgs.search.brave.com/J8yE9d6HjE7yE_x3d_x3d/rs:fit:860:0:0/g:ce/aHR0cHM6Ly9jb3Zl/cnMuYWxwaGFjb2Rl/cnMuY29tL2RhdGEv/NTg5LzU4OTQ0Lmpw/Zw',
    rating: 10,
    author: 'Kanehito Yamada',
    progress: 28,
    total: 28,
    tags: ['Fantasy', 'Slice of Life'],
    description: 'The adventure is over but life goes on.',
    notes: 'Masterpiece.',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: true
  }
];