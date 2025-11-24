import { useState, useMemo } from 'react';
import { MediaItem } from '../types';

type SortOption = 'updated' | 'added' | 'rating' | 'title';

export const useLibraryFilters = (items: MediaItem[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [sortDesc, setSortDesc] = useState(true);
  const [authorFilter, setAuthorFilter] = useState('');

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchesType = filterType === 'All' || item.type === filterType;
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(searchLower) || 
        item.tags.some(t => t.toLowerCase().includes(searchLower));
        
      const matchesAuthor = !authorFilter || 
        (item.author && item.author.toLowerCase().includes(authorFilter.toLowerCase()));
      
      return matchesType && matchesStatus && matchesSearch && matchesAuthor;
    });

    return result.sort((a, b) => {
      let valA: any, valB: any;
      switch(sortBy) {
        case 'title': 
          valA = a.title; valB = b.title; 
          return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        case 'rating': 
          valA = a.rating || 0; valB = b.rating || 0; 
          break;
        case 'added': 
          valA = new Date(a.addedAt).getTime(); valB = new Date(b.addedAt).getTime(); 
          break;
        case 'updated': 
        default: 
          valA = new Date(a.updatedAt).getTime(); valB = new Date(b.updatedAt).getTime(); 
          break;
      }
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [items, filterType, filterStatus, searchQuery, sortBy, sortDesc, authorFilter]);

  return {
    filteredItems,
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    sortBy, setSortBy,
    sortDesc, setSortDesc,
    authorFilter, setAuthorFilter
  };
};