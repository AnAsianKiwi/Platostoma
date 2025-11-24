import React, { useState, useMemo, forwardRef } from 'react';
import { Virtuoso, VirtuosoGrid, Components } from 'react-virtuoso';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { useLibraryFilters } from '../hooks/useLibraryFilters';
import { Icons } from '../components/Icons';
import { DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES, MediaItem } from '../types';

// --- HELPER COMPONENTS FOR VIRTUALIZATION ---

// The container for the Grid View (Applies the CSS Grid styles)
const GridContainer: Components['List'] = forwardRef(({ style, children, ...props }, ref) => {
  const { settings } = useDataStore();
  
  const gridStyle = {
    ...style,
    display: 'grid',
    gap: '1.5rem', // gap-6
    padding: '1.5rem', // p-6
    gridTemplateColumns: settings.gridColumns > 0 
      ? `repeat(${settings.gridColumns}, minmax(0, 1fr))` 
      : 'repeat(auto-fill, minmax(240px, 1fr))',
    boxSizing: 'border-box'
  } as React.CSSProperties;

  return (
    <div ref={ref} style={gridStyle} {...props}>
      {children}
    </div>
  );
});

// The wrapper for a specific Grid Item
const GridItemContainer: Components['Item'] = ({ children, ...props }) => (
  <div {...props} className="h-full">
    {children}
  </div>
);

// The container for the List View
const ListContainer: Components['List'] = forwardRef(({ style, children, ...props }, ref) => (
  <div ref={ref} style={{ ...style, padding: '1.5rem' }} className="flex flex-col gap-3" {...props}>
    {children}
  </div>
));


export const Library: React.FC = () => {
  // --- STORE ACCESS ---
  const { library, settings, bulkDeleteItems } = useDataStore();
  const { 
    openDetail, 
    libraryLayout: viewMode, 
    setLibraryLayout: setViewMode,
    lastModifiedId: highlightId 
  } = useUIStore();

  // --- LOCAL STATE ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- HOOKS ---
  const {
    filteredItems,
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    sortBy, setSortBy,
    sortDesc, setSortDesc,
    authorFilter, setAuthorFilter
  } = useLibraryFilters(library);

  // --- DERIVED DATA ---
  const availableTypes = useMemo(() => [...DEFAULT_MEDIA_TYPES, ...settings.customTypes].sort(), [settings.customTypes]);
  const availableStatuses = useMemo(() => [...DEFAULT_MEDIA_STATUSES, ...settings.customStatuses], [settings.customStatuses]);

  // --- HELPERS ---
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'text-blue-400 bg-blue-400/10';
      case 'Completed': return 'text-green-400 bg-green-400/10';
      case 'Planning': return 'text-yellow-400 bg-yellow-400/10';
      case 'Dropped': return 'text-red-400 bg-red-400/10';
      case 'Paused': return 'text-slate-400 bg-slate-400/10';
      default: return 'text-osmanthus-400 bg-osmanthus-400/10';
    }
  };

  const getTitleClass = (title: string, mode: 'grid' | 'list') => {
    const len = title.length;
    if (mode === 'grid') {
        if (len > 50) return 'text-xs leading-tight line-clamp-3';
        if (len > 25) return 'text-sm leading-tight line-clamp-3';
        return 'text-lg font-bold leading-tight line-clamp-2';
    }
    return len > 60 ? 'text-sm font-bold' : 'text-base font-bold';
  };

  // --- ACTIONS ---
  const handleRandomPick = () => {
    const pool = library.filter(i => i.status === 'Planning');
    const finalPool = pool.length > 0 ? pool : library;
    if (finalPool.length === 0) { alert("Library is empty!"); return; }
    const random = finalPool[Math.floor(Math.random() * finalPool.length)];
    openDetail(random.id);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const handleMassDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) {
      bulkDeleteItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    if (isSelectionMode || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      setIsSelectionMode(true);
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      openDetail(id);
    }
  };

  // --- RENDERERS ---
  const renderCover = (item: MediaItem, containerClass: string = "w-full h-full") => {
    if (item.coverUrl) {
      return (
        <img 
          src={item.coverUrl} 
          alt={item.title}
          className={`${containerClass} object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform`}
          loading="lazy"
          draggable={false}
        />
      );
    }
    return (
      <div className={`${containerClass} bg-slate-800 flex flex-col items-center justify-center p-2 text-center border-2 border-slate-700 border-dashed`}>
        <Icons.Dashboard className="w-8 h-8 text-slate-600 mb-1" />
        <span className="text-[10px] text-slate-500 font-medium uppercase">No Image</span>
      </div>
    );
  };

  // The actual Card content
  const GridCard = ({ item }: { item: MediaItem }) => {
    const isSelected = selectedIds.has(item.id);
    const isHighlighted = item.id === highlightId;
    
    return (
        <div 
          onClick={(e) => handleCardClick(e, item.id)}
          className={`
            group bg-slate-800 rounded-xl overflow-hidden border transition-all duration-200 relative flex flex-col h-full cursor-pointer
            ${isHighlighted ? 'animate-pop ring-2 ring-green-400' : ''}
            ${isSelected 
              ? 'border-osmanthus-500 ring-4 ring-osmanthus-500/50 shadow-[0_0_20px_rgba(78,153,86,0.5)] transform scale-[0.98] z-10' 
              : 'border-slate-700 hover:border-osmanthus-400 hover:ring-2 hover:ring-osmanthus-400 hover:shadow-[0_0_20px_rgba(78,153,86,0.3)] hover:-translate-y-1.5 hover:z-10'
            }
          `}
        >
          <div className="relative aspect-[2/3] overflow-hidden bg-slate-950 pointer-events-none">
            {renderCover(item)}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
            {isSelectionMode && (
              <div className={`absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                {isSelected ? <div className="bg-osmanthus-500 text-white rounded-full p-2 shadow-lg transform scale-125"><Icons.Check className="w-8 h-8" /></div> : <div className="bg-slate-900/80 text-slate-400 rounded-full p-2 border-2 border-slate-500"><Icons.Square className="w-6 h-6" /></div>}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-0 pointer-events-none">
               <h3 className={`text-white font-bold ${getTitleClass(item.title, 'grid')}`} title={item.title}>{item.title}</h3>
               {(item.originalTitle || item.author) && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{item.author ? item.author : item.originalTitle}</p>}
            </div>
            <div className="absolute top-3 right-3 z-10 flex gap-1">
              {item.favorite && <span className="bg-slate-900/80 backdrop-blur-sm text-red-500 p-1.5 rounded shadow border border-white/10 flex items-center justify-center"><Icons.Star className="w-3.5 h-3.5 fill-current" /></span>}
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded bg-slate-900/80 backdrop-blur text-white border border-slate-600 shadow-sm">{item.type}</span>
            </div>
          </div>
          <div className="p-4 space-y-3 flex-1 flex flex-col pointer-events-none">
            <div className="flex justify-between items-center text-sm">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(item.status)}`}>{item.status}</span>
              {item.rating > 0 && <div className="flex items-center text-yellow-500 gap-1"><Icons.Star className="w-3.5 h-3.5 fill-current" /><span className="font-bold text-sm">{item.rating}</span></div>}
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-400 font-medium"><span>Progress</span><span>{item.progress} <span className="text-slate-600">/</span> {item.total || '?'}</span></div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-osmanthus-500 rounded-full" style={{ width: `${item.total ? Math.min(((item.progress || 0) / item.total) * 100, 100) : 0}%` }} /></div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              {item.tags.slice(0, 3).map(tag => (<span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-600 line-clamp-1 max-w-[80px]">{tag}</span>))}
              {item.tags.length > 3 && <span className="px-1.5 py-0.5 text-[10px] text-slate-500 bg-slate-800 rounded border border-slate-700">+{item.tags.length - 3}</span>}
            </div>
          </div>
        </div>
    );
  };

  const ListCard = ({ item }: { item: MediaItem }) => {
    const isSelected = selectedIds.has(item.id);
    const isHighlighted = item.id === highlightId;
    
    return (
        <div 
          onClick={(e) => handleCardClick(e, item.id)}
          className={`
            group flex bg-slate-800 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer h-32
            ${isHighlighted ? 'animate-pop ring-2 ring-green-400' : ''}
            ${isSelected 
              ? 'border-osmanthus-500 ring-2 ring-osmanthus-500/50 bg-slate-800/90 z-10' 
              : 'border-slate-700 hover:border-osmanthus-500 hover:bg-slate-700/30'
            }
          `}
        >
          <div className="w-24 h-full flex-shrink-0 relative bg-slate-900 pointer-events-none">
            {renderCover(item)}
            {isSelectionMode && isSelected && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="bg-osmanthus-500 rounded-full p-1"><Icons.Check className="w-4 h-4 text-white" /></div></div>}
          </div>
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0 pointer-events-none">
            <div>
               <div className="flex justify-between items-start"><h3 className={`text-white ${getTitleClass(item.title, 'list')} truncate pr-2`}>{item.title}</h3><div className="flex gap-2">{item.favorite && <Icons.Star className="w-4 h-4 text-red-500 fill-current" />}<span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">{item.type}</span></div></div>
               <p className="text-xs text-slate-400 truncate">{item.author || item.originalTitle || 'Unknown Author'}</p>
            </div>
            <div className="flex items-center gap-3 mt-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(item.status)}`}>{item.status}</span><div className="flex items-center text-yellow-500 gap-1 text-xs"><Icons.Star className="w-3 h-3 fill-current" /><span>{item.rating > 0 ? item.rating : '-'}</span></div></div>
            <div className="flex items-center gap-3 mt-1"><div className="flex-1 max-w-[200px]"><div className="h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-osmanthus-500 rounded-full" style={{ width: `${item.total ? Math.min(((item.progress || 0) / item.total) * 100, 100) : 0}%` }} /></div></div><span className="text-xs text-slate-500 font-mono">{item.progress} / {item.total || '?'}</span></div>
          </div>
        </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      
      {/* HEADER - No longer sticky, it sits at the top of the flex container */}
      <div className="px-6 pt-4 pb-4 bg-slate-950 z-20 flex-shrink-0">
          <div className="flex flex-col gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search titles, tags..." className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-osmanthus-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-2 flex-wrap items-center justify-end flex-shrink-0">
                {isSelectionMode ? (
                  <>
                    <button onClick={handleMassDelete} disabled={selectedIds.size === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition-colors"><Icons.Trash className="w-4 h-4" /> Delete ({selectedIds.size})</button>
                    <button onClick={toggleSelectionMode} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"><Icons.X className="w-4 h-4" /> Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={toggleSelectionMode} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"><Icons.Check className="w-4 h-4" /> Select</button>
                    <button onClick={handleRandomPick} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-osmanthus-500/30 bg-osmanthus-500/10 text-osmanthus-300 text-sm font-medium whitespace-nowrap hover:bg-osmanthus-500/20 transition-colors"><Icons.Random className="w-4 h-4" /> Surprise Me</button>
                  </>
                )}
                <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${showAdvanced ? 'bg-osmanthus-600 text-white border-osmanthus-600' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}><Icons.Filter className="w-4 h-4" /> Filters</button>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 relative">
                    <select className="bg-slate-900 text-sm text-white px-2 py-1.5 outline-none cursor-pointer rounded appearance-none pr-8" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}><option value="updated">Last Updated</option><option value="added">Date Added</option><option value="rating">Rating</option><option value="title">Title</option></select>
                    <Icons.Sort className={`absolute right-2 w-4 h-4 text-slate-400 pointer-events-none transition-transform ${sortDesc ? '' : 'rotate-180'}`} />
                    <button onClick={() => setSortDesc(!sortDesc)} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 ml-2 flex-shrink-0">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Icons.LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}><Icons.LayoutList className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700 animate-in slide-in-from-top-2">
                <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Media Type</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="All">All Types</option>{availableTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Status</label><select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="All">All Statuses</option>{availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Author / Artist</label><div className="relative"><Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" /><input type="text" placeholder="Filter by author..." value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none" />{authorFilter && <button onClick={() => setAuthorFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><Icons.X className="w-3 h-3" /></button>}</div></div>
              </div>
            )}
          </div>
      </div>

      {/* SCROLLABLE AREA - Managed by Virtuoso */}
      <div className="flex-1 w-full min-h-0">
        {filteredItems.length === 0 ? (
          <div className="h-full flex items-center justify-center">
             <div className="text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed p-10">
                <Icons.Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-xl font-medium">No items found</p>
             </div>
          </div>
        ) : viewMode === 'grid' ? (
          <VirtuosoGrid
            style={{ height: '100%' }}
            totalCount={filteredItems.length}
            components={{
              List: GridContainer,
              Item: GridItemContainer,
            }}
            itemContent={(index) => <GridCard item={filteredItems[index]} />}
            overscan={200}
          />
        ) : (
          <Virtuoso
            style={{ height: '100%' }}
            totalCount={filteredItems.length}
            components={{ List: ListContainer }}
            itemContent={(index) => <ListCard item={filteredItems[index]} />}
            overscan={200}
          />
        )}
      </div>
    </div>
  );
};