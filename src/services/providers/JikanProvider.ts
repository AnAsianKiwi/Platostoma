import { MediaProvider, SearchResult } from './types';

// Rate limiting helper (Jikan allows ~3 requests/sec)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const JikanProvider: MediaProvider = {
  name: 'Jikan (MyAnimeList)',
  version: '1.0',
  isEnabled: true,

  canHandleUrl: (url) => url.includes('myanimelist.net'),

  search: async (query: string): Promise<SearchResult[]> => {
    try {
      // Wait a tiny bit to be nice to the API
      await sleep(300);
      
      const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (!data.data) return [];

      return data.data.map((item: any) => ({
        id: item.mal_id.toString(),
        title: item.title_english || item.title,
        coverUrl: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        type: 'Anime',
        year: item.year,
        description: item.synopsis,
        status: item.status === 'Finished Airing' ? 'Completed' : 'In Progress',
        author: item.studios?.[0]?.name || 'Unknown Studio',
        details: {
            rating: item.score,
            total: item.episodes,
            sourceUrl: item.url
        }
      }));
    } catch (error) {
      console.error("Jikan API Error:", error);
      return [];
    }
  }
};