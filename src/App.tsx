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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    library: [],
    view: 'library',
    activeMediaId: null,
    theme: 'dark',
    libraryLayout: 'grid',
    modalPosition: { 
        x: Math.max(0, (window.innerWidth - 1024) / 2), 
        y: 50
    },
    settings: {
      apiKey: '', proxyUrl: '', enableAi: false, customTypes: [], customStatuses: [], gridColumns: 0, keybinds: { addMedia: 'Ctrl+Alt+n' }
    }
  });

  // --- POSITION MEMORY ---
  const [addModalPosition, setAddModalPosition] = useState({ 
    x: Math.max(0, (window.innerWidth - 1024) / 2), 
    y: 50 
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // --- TEMP ITEM STATE ---
  // Instead of adding to library immediately, we hold the new item here
  const [tempNewItem, setTempNewItem] = useState<MediaItem | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const isDirty = useRef(false);
  const [lastModifiedId, setLastModifiedId] = useState<string | null>(null);

  const availableTypes = useMemo(() => [...DEFAULT_MEDIA_TYPES, ...state.settings.customTypes].sort(), [state.settings.customTypes]);
  const availableStatuses = useMemo(() => [...DEFAULT_MEDIA_STATUSES, ...state.settings.customStatuses], [state.settings.customStatuses]);

  useEffect(() => {
    const library = loadLibrary();
    const settings = loadSettings();
    setState(prev => ({ ...prev, library, settings }));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && isDirty.current) { saveLibrary(state.library); }
  }, [state.library, isLoaded]);

  const updateLibrary = (newLibrary: MediaItem[]) => {
    isDirty.current = true;
    setState(prev => ({ ...prev, library: newLibrary }));
  };

  // --- UPDATED: Manual Add Logic ---
  const handleManualAdd = useCallback(() => {
    const newItem: MediaItem = {
      id: generateId(), title: 'New Entry', type: '', status: '', coverUrl: '', rating: 0, progress: 0, tags: [], description: '', notes: '', addedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    // DO NOT add to library yet. Set as temp item.
    setTempNewItem(newItem);
  }, []);

  const navigate = (view: AppState['view']) => {
    if (view === 'settings') {
        setIsSettingsOpen(prev => !prev);
        return;
    }
    setState(prev => ({ ...prev, view }));
  };

  const handleSelectMedia = (id: string) => {
    setTempNewItem(null); // Clear any temp item
    setState(prev => ({ ...prev, activeMediaId: id }));
  };

  // --- UPDATED: Save Logic ---
  const handleSaveMedia = (itemToSave: MediaItem) => {
    if (tempNewItem) {
        // CASE 1: Adding New Item
        // Add to library now
        setState(prev => ({ 
            ...prev, 
            library: [itemToSave, ...prev.library],
            view: 'library' // Force navigation back to library
        }));
        setTempNewItem(null);
    } else {
        // CASE 2: Updating Existing
        updateLibrary(state.library.map(item => item.id === itemToSave.id ? itemToSave : item));
    }

    // Trigger Animation
    setLastModifiedId(itemToSave.id);
    setTimeout(() => setLastModifiedId(null), 2000);
    
    isDirty.current = true;
  };

  const handleDeleteMedia = (id: string) => {
    if (tempNewItem && tempNewItem.id === id) {
        setTempNewItem(null);
        return;
    }
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
      case 'dashboard': return <Dashboard library={state.library} onNavigateToLibrary={() => navigate('library')} />;
      case 'library': return (
        <Library 
            library={state.library} 
            onSelectItem={handleSelectMedia} 
            onBulkDelete={handleBulkDelete} 
            availableTypes={availableTypes} 
            availableStatuses={availableStatuses} 
            viewMode={state.libraryLayout} 
            onViewModeChange={(mode) => setState(prev => ({ ...prev, libraryLayout: mode }))} 
            gridColumns={state.settings.gridColumns}
            // @ts-ignore
            highlightId={lastModifiedId}
        />
      );
      case 'import': return <Import onImport={handleImport} availableTypes={availableTypes} availableStatuses={availableStatuses} />;
      default: return <Dashboard library={state.library} onNavigateToLibrary={() => navigate('library')} />;
    }
  };

  // --- DERIVED: Determine which item is active ---
  const activeItem = tempNewItem || (state.activeMediaId ? state.library.find(i => i.id === state.activeMediaId) : null);
  const isAddMode = !!tempNewItem;

  return (
    <Layout currentView={isSettingsOpen ? 'settings' : state.view} onNavigate={navigate} onManualAdd={handleManualAdd}>
      
      {/* Always render content (Library/Dashboard) in background */}
      <div key={state.view} className="w-full h-full">
        {renderContent()}
      </div>
      
      {/* Modal Logic */}
      {activeItem && (
          <MediaDetail 
              item={activeItem}
              isOpen={!!activeItem}
              onClose={() => {
                  if (isAddMode) setTempNewItem(null);
                  else setState(prev => ({ ...prev, activeMediaId: null }));
              }}
              onSave={handleSaveMedia}
              onDelete={handleDeleteMedia}
              availableTypes={availableTypes}
              availableStatuses={availableStatuses}
              
              // --- POSITIONING ---
              initialPosition={isAddMode ? addModalPosition : state.modalPosition}
              onPositionSave={(pos) => {
                if (isAddMode) setAddModalPosition(pos);
                else setState(prev => ({ ...prev, modalPosition: pos }));
              }}
              
              startInEditMode={isAddMode} // Always edit if adding
              isNewEntry={isAddMode}
          />
      )}

      {/* Settings Modal */}
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