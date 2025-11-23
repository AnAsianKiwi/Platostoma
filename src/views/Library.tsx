import React, { useState, useMemo, useRef } from 'react';
import { MediaItem } from '../types';
import { Icons } from '../components/Icons';

interface LibraryProps {
  library: MediaItem[];
  onSelectItem: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  availableTypes: string[];
  availableStatuses: string[];
  viewMode: 'grid' | 'list' | 'compact';
  onViewModeChange: (mode: 'grid' | 'list' | 'compact') => void;
  gridColumns: number;
  onOpenSearch: () => void;
}

type SortOption = 'updated' | 'added' | 'rating' | 'title';

// CACHED ITEM INTERFACE
interface CachedItemRect {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const Library: React.FC<LibraryProps> = ({ 
  library, 
  onSelectItem, 
  onBulkDelete, 
  availableTypes, 
  availableStatuses,
  viewMode,
  onViewModeChange,
  gridColumns,
  onOpenSearch
}) => {
  // Removed unused searchQuery
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [sortDesc, setSortDesc] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  
  // --- PERFORMANCE REFS ---
  const cachedContainerRect = useRef<DOMRect | null>(null);
  const cachedItems = useRef<CachedItemRect[]>([]);
  
  const dragStartDoc = useRef<{x: number, y: number} | null>(null);
  const currentMouseDoc = useRef<{x: number, y: number} | null>(null);
  
  const dragStartTime = useRef<number>(0);
  const initialSelectionSnapshot = useRef<Set<string>>(new Set());
  const selectionOperationMode = useRef<'add' | 'remove' | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isDragging = useRef(false);
  const clickedItemRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const getTitleClass = (title: string, mode: 'grid' | 'list') => {
    const len = title.length;
    if (mode === 'grid') {
        if (len > 50) return 'text-xs leading-tight line-clamp-3';
        if (len > 25) return 'text-sm leading-tight line-clamp-3';
        return 'text-lg font-bold leading-tight line-clamp-2';
    }
    return 'text-base font-bold';
  };

  const filteredItems = useMemo(() => {
    let result = library.filter(item => {
      const matchesType = filterType === 'All' || item.type === filterType;
      const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
      // Removed search query check since it's handled globally now
      const matchesAuthor = !authorFilter || item.author?.toLowerCase().includes(authorFilter.toLowerCase());
      return matchesType && matchesStatus && matchesAuthor;
    });
    return result.sort((a, b) => {
      let valA: any, valB: any;
      switch(sortBy) {
        case 'title': valA = a.title; valB = b.title; return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        case 'rating': valA = a.rating || 0; valB = b.rating || 0; break;
        case 'added': valA = new Date(a.addedAt).getTime(); valB = new Date(b.addedAt).getTime(); break;
        case 'updated': default: valA = new Date(a.updatedAt).getTime(); valB = new Date(b.updatedAt).getTime(); break;
      }
      if (valA < valB) return sortDesc ? 1 : -1;
      if (valA > valB) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [library, filterType, filterStatus, sortBy, sortDesc, authorFilter]);

  const handleRandomPick = () => {
    const pool = library.filter(i => i.status === 'Planning');
    const finalPool = pool.length > 0 ? pool : library;
    if (finalPool.length === 0) { alert("Library is empty!"); return; }
    const random = finalPool[Math.floor(Math.random() * finalPool.length)];
    onSelectItem(random.id);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  // --- 1. UPDATE VISUAL BOX (Sync) ---
  const updateVisualBox = () => {
    if (!dragStartDoc.current || !currentMouseDoc.current || !selectionBoxRef.current) return null;

    const startX = dragStartDoc.current.x;
    const startY = dragStartDoc.current.y;
    const curX = currentMouseDoc.current.x;
    const curY = currentMouseDoc.current.y;

    const left = Math.min(startX, curX);
    const top = Math.min(startY, curY);
    const width = Math.abs(curX - startX);
    const height = Math.abs(curY - startY);

    const style = selectionBoxRef.current.style;
    style.display = 'block';
    style.transform = `translate3d(${left}px, ${top}px, 0)`;
    style.width = `${width}px`;
    style.height = `${height}px`;

    return { left, top, right: left + width, bottom: top + height };
  };

  // --- 2. SELECTION LOGIC (Async/Throttled) ---
  const performSelectionLogic = (box: { left: number, top: number, right: number, bottom: number }) => {
    const intersectingIds: string[] = [];

    for (const item of cachedItems.current) {
        const intersects = !(
            box.left > item.right ||
            box.right < item.left ||
            box.top > item.bottom ||
            box.bottom < item.top
        );
        if (intersects) intersectingIds.push(item.id);
    }

    if (selectionOperationMode.current === null && intersectingIds.length > 0) {
         const firstId = intersectingIds[0]; 
         selectionOperationMode.current = initialSelectionSnapshot.current.has(firstId) ? 'remove' : 'add';
    }

    const nextSelected = new Set(initialSelectionSnapshot.current);
    const mode = selectionOperationMode.current;
    if (mode === 'add') intersectingIds.forEach(id => nextSelected.add(id));
    else if (mode === 'remove') intersectingIds.forEach(id => nextSelected.delete(id));
    
    setSelectedIds(nextSelected);
  };

  // --- HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a, [data-no-drag]')) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    if (e.clientX > rect.right - 20) return; 

    const itemEl = (e.target as HTMLElement).closest('[data-media-item]');
    clickedItemRef.current = itemEl ? itemEl.getAttribute('data-media-item') : null;

    e.preventDefault();
    e.stopPropagation();

    // Cache Layout
    cachedContainerRect.current = rect;
    cachedItems.current = [];
    
    itemRefs.current.forEach((el, id) => {
        const itemTop = el.offsetTop; 
        const itemLeft = el.offsetLeft;
        cachedItems.current.push({
            id,
            left: itemLeft,
            top: itemTop,
            right: itemLeft + el.offsetWidth,
            bottom: itemTop + el.offsetHeight
        });
    });

    const startX = e.clientX - rect.left + container.scrollLeft;
    const startY = e.clientY - rect.top + container.scrollTop;
    
    dragStartDoc.current = { x: startX, y: startY };
    currentMouseDoc.current = { x: startX, y: startY };
    
    dragStartTime.current = Date.now();
    isDragging.current = false;
    initialSelectionSnapshot.current = new Set(selectedIds);
    selectionOperationMode.current = null;

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!dragStartDoc.current || !containerRef.current || !cachedContainerRect.current) return;

    const container = containerRef.current;
    const rect = cachedContainerRect.current; 

    const curX = e.clientX - rect.left + container.scrollLeft;
    const curY = e.clientY - rect.top + container.scrollTop;
    
    currentMouseDoc.current = { x: curX, y: curY };

    if (!isDragging.current) {
        const timeElapsed = Date.now() - dragStartTime.current;
        const isIntentional = timeElapsed > 150 || (Math.abs(e.movementX) + Math.abs(e.movementY) > 5);
        if (isIntentional) {
            isDragging.current = true;
            setIsSelectionMode(true);
            if (clickedItemRef.current) {
                 const isSelected = initialSelectionSnapshot.current.has(clickedItemRef.current);
                 selectionOperationMode.current = isSelected ? 'remove' : 'add';
            }
        } else { return; }
    }

    const box = updateVisualBox();
    
    if (box && !rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
            performSelectionLogic(box);
            rafRef.current = null;
        });
    }
  };

  const handleScroll = () => {
      if (isDragging.current) {
          const box = updateVisualBox();
          if (box && !rafRef.current) {
              rafRef.current = requestAnimationFrame(() => {
                  performSelectionLogic(box);
                  rafRef.current = null;
              });
          }
      }
  };

  const handleGlobalMouseUp = (e: MouseEvent) => {
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (selectionBoxRef.current) {
        selectionBoxRef.current.style.display = 'none';
    }

    if (!isDragging.current) {
        if (clickedItemRef.current) {
            const id = clickedItemRef.current;
            if (e.ctrlKey || e.metaKey) {
                setIsSelectionMode(true);
                 setSelectedIds(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                });
            } else {
                onSelectItem(id);
            }
        } else {
             if (!e.ctrlKey && !e.shiftKey) {
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            }
        }
    }
    dragStartDoc.current = null;
    cachedContainerRect.current = null;
    cachedItems.current = [];
    isDragging.current = false;
  };

  const handleMassDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} items?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

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

  const renderViewModeToggle = () => (
    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 ml-2 flex-shrink-0">
      <button onClick={() => onViewModeChange('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} data-no-drag title="Grid View"><Icons.LayoutGrid className="w-4 h-4" /></button>
      <button onClick={() => onViewModeChange('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`} data-no-drag title="List View"><Icons.LayoutList className="w-4 h-4" /></button>
    </div>
  );

  const renderCover = (item: MediaItem, containerClass: string = "w-full h-full") => {
    if (item.coverUrl) {
      return (
        <img 
          src={item.coverUrl} 
          alt={item.title}
          className={`${containerClass} object-cover will-change-transform`}
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

  const gridStyle = viewMode === 'grid' ? {
    gridTemplateColumns: gridColumns > 0 
      ? `repeat(${gridColumns}, minmax(0, 1fr))` 
      : 'repeat(auto-fill, minmax(240px, 1fr))'
  } : {};

  return (
    <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full flex flex-col p-6 space-y-6 overflow-y-auto relative select-none [scrollbar-gutter:stable] focus:outline-none"
        onMouseDown={handleMouseDown}
    >
      <div ref={selectionBoxRef} className="absolute z-50 bg-blue-500/20 border border-blue-400 pointer-events-none" style={{ display: 'none', top: 0, left: 0, width: 0, height: 0, willChange: 'transform, width, height' }} />

      <div className="flex flex-col gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-sm flex-shrink-0" data-no-drag>
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* GLOBAL SEARCH BUTTON */}
          <button 
             onClick={onOpenSearch}
             className="flex-1 flex items-center gap-3 w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 hover:text-white hover:border-slate-600 transition-colors text-left group"
          >
             <Icons.Search className="w-4 h-4 group-hover:text-osmanthus-400 transition-colors" />
             <span className="text-sm">Search library...</span>
             <span className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Ctrl+K</span>
          </button>

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
                <select className="bg-slate-900 text-sm text-white px-2 py-1.5 outline-none cursor-pointer rounded appearance-none pr-8" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}><option value="updated">Last Updated</option><option value="added">Date Added</option><option value="rating">Rating</option><option value="title">Title</option></select>
                <Icons.Sort className={`absolute right-2 w-4 h-4 text-slate-400 pointer-events-none transition-transform ${sortDesc ? '' : 'rotate-180'}`} />
                <button onClick={() => setSortDesc(!sortDesc)} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
             </div>
             {renderViewModeToggle()}
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

      {filteredItems.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
          <Icons.Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-xl font-medium">No items found</p>
        </div>
      ) : (
        <div className={`pb-20 ${viewMode === 'grid' ? 'grid gap-6' : 'flex flex-col gap-3'}`} style={gridStyle}>
          {filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            
            // --- GRID VIEW ---
            if (viewMode === 'grid') {
              return (
                <div 
                  key={item.id} 
                  ref={el => { if(el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                  data-media-item={item.id}
                  className={`
                    group bg-slate-800 rounded-xl overflow-hidden border transition-all duration-200 relative flex flex-col h-full cursor-pointer
                    ${isSelected 
                      ? 'border-osmanthus-500 ring-4 ring-osmanthus-500/50 shadow-[0_0_20px_rgba(78,153,86,0.5)] transform scale-[0.98] z-10' 
                      : 'border-slate-700 hover:border-osmanthus-400 hover:ring-2 hover:ring-osmanthus-400 hover:shadow-[0_0_20px_rgba(78,153,86,0.3)] hover:-translate-y-1.5 hover:z-10'
                    }
                  `}
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-slate-950 pointer-events-none">
                    {renderCover(item)}
                    <div 
                      className="absolute inset-0 opacity-90 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, #0f172a 0%, #0f172a 15%, transparent 60%)' }} 
                    />
                    
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
            }

            // --- LIST VIEW ---
            if (viewMode === 'list') {
               return (
                <div 
                  key={item.id}
                  ref={el => { if(el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                  data-media-item={item.id}
                  className={`
                    group flex bg-slate-800 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer h-32
                    ${isSelected 
                      ? 'border-osmanthus-500 ring-4 ring-osmanthus-500/50 bg-slate-800/90 z-10' 
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
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};