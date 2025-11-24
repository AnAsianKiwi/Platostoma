import { MediaProvider, SearchResult } from './types';

export const GoogleBooksProvider: MediaProvider = {
  name: 'Google Books',
  version: '1.0',
  isEnabled: true,

  canHandleUrl: (url) => url.includes('books.google'),

  search: async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
      const data = await response.json();

      if (!data.items) return [];

      return data.items.map((item: any) => {
        const info = item.volumeInfo;
        return {
          id: item.id,
          title: info.title,
          coverUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
          type: 'Book',
          year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : undefined,
          description: info.description,
          author: info.authors ? info.authors.join(', ') : 'Unknown',
          status: 'Planning',
          details: {
              total: info.pageCount,
              rating: info.averageRating ? info.averageRating * 2 : 0, // Convert 5 star to 10 star
              sourceUrl: info.infoLink
          }
        };
      });
    } catch (error) {
      console.error("Google Books Error:", error);
      return [];
    }
  }
};