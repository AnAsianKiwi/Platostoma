import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { MediaItem } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  library: MediaItem[];
  onSelect: (id: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, library, onSelect }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
        setQuery('');
        setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filtered = library.filter(item => 
     item.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit results

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      {/* Search Box */}
      <div className="w-[600px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center px-4 border-b border-slate-800">
            <Icons.Search className="w-5 h-5 text-slate-400 mr-3" />
            <input 
                ref={inputRef}
                type="text" 
                placeholder="Search library..." 
                className="flex-1 bg-transparent py-4 text-lg text-white placeholder:text-slate-500 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">ESC</div>
        </div>

        {query && (
            <div className="max-h-[400px] overflow-y-auto p-2">
                {filtered.length > 0 ? (
                    filtered.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { onSelect(item.id); onClose(); }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg group transition-colors text-left"
                        >
                            <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden flex-shrink-0 border border-slate-700">
                                {item.coverUrl && <img src={item.coverUrl} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <h4 className="text-white font-medium group-hover:text-osmanthus-400 transition-colors">{item.title}</h4>
                                <p className="text-xs text-slate-500 capitalize">{item.type} • {item.status}</p>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500">No results found.</div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};