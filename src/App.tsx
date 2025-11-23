import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadLibrary, saveLibrary, loadSettings, saveSettings, generateId } from './services/mediaService';
import { AppState, MediaItem, DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES } from './types';

// Components
import { Layout } from './components/layout';
import { Dashboard } from './views/Dashboard';
import { Library } from './views/Library';
import { MediaDetail } from './views/MediaDetail';
import { Import } from './views/Import';
import { Settings } from './views/Settings';
// FIX: Changed to lowercase 'searchoverlay' to match your file system
import { SearchOverlay } from './components/searchoverlay'; 

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    library: [],
    view: 'library',
    activeMediaId: null,
    theme: 'dark',
    libraryLayout: 'grid',
    modalPosition: { x: 0, y: 0 },
    settings: {
      apiKey: '', proxyUrl: '', enableAi: false, customTypes: [], customStatuses: [], gridColumns: 0, keybinds: { addMedia: 'Ctrl+Alt+n' }
    }
  });

  const [detailsPos, setDetailsPos] = useState({ x: 100, y: 50 });
  const [manualPos, setManualPos] = useState({ x: 100, y: 50 });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDirty = useRef(false);
  const [openInEditMode, setOpenInEditMode] = useState(false);

  const availableTypes = useMemo(() => [...DEFAULT_MEDIA_TYPES, ...state.settings.customTypes].sort(), [state.settings.customTypes]);
  const availableStatuses = useMemo(() => [...DEFAULT_MEDIA_STATUSES, ...state.settings.customStatuses], [state.settings.customStatuses]);

  useEffect(() => {
    const library = loadLibrary();
    const settings = loadSettings();
    setState(prev => ({ ...prev, library, settings }));
    const centerX = Math.max(0, (window.innerWidth - 1024) / 2);
    setDetailsPos({ x: centerX, y: 50 });
    setManualPos({ x: centerX, y: 50 });
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isLoaded && isDirty.current) { saveLibrary(state.library); }
  }, [state.library, isLoaded]);

  const updateLibrary = (newLibrary: MediaItem[]) => {
    isDirty.current = true;
    setState(prev => ({ ...prev, library: newLibrary }));
  };

  const handleManualAdd = useCallback(() => {
    const newItem: MediaItem = {
      id: generateId(), title: 'New Entry', type: '', status: '', coverUrl: '', rating: 0, progress: 0, tags: [], description: '', notes: '', addedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    setOpenInEditMode(true); setIsCreatingNew(true);
    setState(prev => ({ ...prev, library: [newItem, ...prev.library], activeMediaId: newItem.id }));
    isDirty.current = true;
  }, []);

  const navigate = (view: AppState['view']) => {
    if (view === 'settings') {
        setIsSettingsOpen(prev => !prev);
        return;
    }
    setState(prev => ({ ...prev, view }));
  };

  const handleSelectMedia = (id: string) => {
    setOpenInEditMode(false); setIsCreatingNew(false);
    setState(prev => ({ ...prev, activeMediaId: id }));
  };

  const handleUpdateMedia = (updatedItem: MediaItem) => {
    updateLibrary(state.library.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (isCreatingNew) setIsCreatingNew(false);
  };

  const handleDeleteMedia = (id: string) => {
    setState(prev => {
      const newLibrary = prev.library.filter(item => item.id !== id);
      return { ...prev, library: newLibrary, activeMediaId: prev.activeMediaId === id ? null : prev.activeMediaId };
    });
    isDirty.current = true;
  };

  const handleBulkDelete = (ids: string[]) => {
    setState(prev => {
      const newLibrary = prev.library.filter(item => !ids.includes(item.id));
      return { ...prev, library: newLibrary, activeMediaId: prev.activeMediaId && ids.includes(prev.activeMediaId) ? null : prev.activeMediaId };
    });
    isDirty.current = true;
  };

  const handleSaveSettings = (newSettings: AppState['settings']) => {
    saveSettings(newSettings);
    setState(prev => ({ ...prev, settings: newSettings }));
  };

  const handleImport = (newItems: MediaItem[]) => {
    updateLibrary([...state.library, ...newItems]);
    setIsSettingsOpen(false);
  };

  const renderContent = () => {
    switch (state.view) {
      case 'dashboard': return <Dashboard library={state.library} />;
      case 'library': return <Library 
          library={state.library} 
          onSelectItem={handleSelectMedia} 
          onBulkDelete={handleBulkDelete} 
          availableTypes={availableTypes} 
          availableStatuses={availableStatuses} 
          viewMode={state.libraryLayout} 
          onViewModeChange={(mode) => setState(prev => ({ ...prev, libraryLayout: mode }))} 
          gridColumns={state.settings.gridColumns} 
          onOpenSearch={() => setIsSearchOpen(true)} 
      />;
      case 'import': return <Import onImport={handleImport} availableTypes={availableTypes} availableStatuses={availableStatuses} />;
      default: return <Dashboard library={state.library} />;
    }
  };

  return (
    <Layout currentView={isSettingsOpen ? 'settings' : state.view} onNavigate={navigate} onManualAdd={handleManualAdd}>
      {renderContent()}
      <SearchOverlay 
         isOpen={isSearchOpen} 
         onClose={() => setIsSearchOpen(false)}
         library={state.library}
         onSelect={handleSelectMedia}
      />
      {state.activeMediaId && (
          <MediaDetail 
              item={state.library.find(i => i.id === state.activeMediaId)!} 
              isOpen={!!state.activeMediaId}
              onClose={() => setState(prev => ({ ...prev, activeMediaId: null }))}
              onSave={handleUpdateMedia}
              onDelete={handleDeleteMedia}
              availableTypes={availableTypes}
              availableStatuses={availableStatuses}
              initialPosition={isCreatingNew ? manualPos : detailsPos}
              onPositionSave={(pos) => isCreatingNew ? setManualPos(pos) : setDetailsPos(pos)}
              startInEditMode={openInEditMode}
              isNewEntry={isCreatingNew}
          />
      )}
      {isSettingsOpen && (
          <Settings 
            settings={state.settings}
            library={state.library}
            onSave={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
            onImport={handleImport}
            onClearLibrary={() => {
                updateLibrary([]); 
                alert("Library cleared successfully.");
            }}
          />
      )}
    </Layout>
  );
};

export default App;