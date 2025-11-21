
import { MediaItem, DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES } from '../types';

const STORAGE_KEY = 'osmanthus_library_v2';
const SETTINGS_KEY = 'osmanthus_settings_v2';

export const MOCK_DATA: MediaItem[] = [
  {
    id: '1',
    title: 'The Beginning After The End',
    type: 'Manhua', 
    status: 'In Progress',
    coverUrl: '', // Removed placeholder
    rating: 9.5,
    author: 'TurtleMe',
    progress: 175,
    total: undefined,
    tags: ['Isekai', 'Magic', 'Action', 'Adventure'],
    description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power.',
    notes: 'Catching up on the latest season.',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceUrl: 'https://tapas.io',
    favorite: true
  },
  {
    id: '2',
    title: 'Frieren: Beyond Journey\'s End',
    type: 'Anime',
    status: 'Completed',
    coverUrl: '', // Removed placeholder
    rating: 10,
    author: 'Kanehito Yamada',
    progress: 28,
    total: 28,
    tags: ['Fantasy', 'Slice of Life', 'Adventure'],
    description: 'The adventure is over but life goes on for an elf mage just beginning to learn what living is all about.',
    notes: 'Absolute masterpiece. Need to read the manga now.',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relatedIds: ['3'],
    favorite: true
  },
  {
    id: '3',
    title: 'Frieren: Beyond Journey\'s End (Manga)',
    type: 'Manga',
    status: 'Planning',
    coverUrl: '', // Removed placeholder
    rating: 0,
    author: 'Kanehito Yamada',
    progress: 0,
    tags: ['Fantasy', 'Slice of Life'],
    description: 'Manga version of the anime.',
    notes: '',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    relatedIds: ['2'],
    favorite: false
  },
  {
    id: '4',
    title: 'Omniscient Reader\'s Viewpoint',
    type: 'Novel',
    status: 'In Progress',
    coverUrl: '', // Removed placeholder
    rating: 9.0,
    author: 'Sing Shong',
    progress: 400,
    total: 551,
    tags: ['System', 'Apocalypse', 'Meta'],
    description: 'Only I know the end of this world.',
    notes: 'Reading the webnovel translation.',
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favorite: false
  }
];

export const loadLibrary = (): MediaItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data if empty for demo purposes
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DATA));
  return MOCK_DATA;
};

export const saveLibrary = (library: MediaItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
};

export const loadSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  const defaults = { 
    apiKey: '', 
    proxyUrl: '', 
    enableAi: false,
    customTypes: [],
    customStatuses: [],
    gridColumns: 0,
    keybinds: {
      addMedia: 'Ctrl+Alt+n'
    }
  };

  if (stored) {
    const settings = JSON.parse(stored);
    // Merge with defaults to handle new fields
    return { ...defaults, ...settings, keybinds: { ...defaults.keybinds, ...settings.keybinds } };
  }
  return defaults;
};

export const saveSettings = (settings: any) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Mock Search Service for Import functionality
export interface MockSearchResult {
  title: string;
  type: string;
  coverUrl: string;
  year?: number;
}

export const mockSearchMedia = async (query: string): Promise<MockSearchResult[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const q = query.toLowerCase();
  
  // Simulate "Not Found"
  if (q.includes('error') || q.includes('xyz')) {
    return [];
  }

  // Simulate "Multiple Options" (Ambiguous titles)
  if (q.includes('one piece') || q.includes('naruto') || q.includes('bleach') || q.includes('fate')) {
    return [
      { title: query, type: 'Anime', coverUrl: `https://cdn.myanimelist.net/images/manga/2/253146.jpg`, year: 2000 },
      { title: query, type: 'Manga', coverUrl: `https://jumpg-assets.tokyo-cdn.com/secure/title/100020/title_thumbnail_portrait_list/326439.jpg?hash=61qqSDl8HuepoLLvk4uBwQ&expires=2145884400`, year: 1999 },
      { title: `${query} (Movie)`, type: 'Movie', coverUrl: `https://m.media-amazon.com/images/M/MV5BNDk5MDFlYjYtZjQ5ZS00ZjhkLWJkYmMtYzhmZjkyOWExY2M3XkEyXkFqcGc@._V1_.jpg`, year: 2010 },
    ];
  }

  // Default: Found single result
  const types = [...DEFAULT_MEDIA_TYPES];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return [{
    title: query,
    type: randomType,
    coverUrl: `https://m.media-amazon.com/images/M/MV5BZjliMWNmYzUtYTM0Ny00YWUyLTg3ZmItMDgxNWJmYzU5MjBiXkEyXkFqcGc@._V1_.jpg`,
    year: 2023
  }];
};
