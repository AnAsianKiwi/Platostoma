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

  // New State for the Modal
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
    setIsLoaded(true);
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

  // Navigation Handler
  const navigate = (view: AppState['view']) => {
    // If Settings is clicked, we toggle the modal instead of changing the main view
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
    // Optional: Close modal on save? 
    // setIsSettingsOpen(false); 
  };

  const handleImport = (newItems: MediaItem[]) => {
    updateLibrary([...state.library, ...newItems]);
    setIsSettingsOpen(false); // Close settings after import
  };

  // Main Content Render Logic
  const renderContent = () => {
    switch (state.view) {
      case 'dashboard': return <Dashboard library={state.library} onNavigateToLibrary={() => navigate('library')} />;
      case 'library': return <Library library={state.library} onSelectItem={handleSelectMedia} onBulkDelete={handleBulkDelete} availableTypes={availableTypes} availableStatuses={availableStatuses} viewMode={state.libraryLayout} onViewModeChange={(mode) => setState(prev => ({ ...prev, libraryLayout: mode }))} gridColumns={state.settings.gridColumns} />;
      case 'import': return <Import onImport={handleImport} availableTypes={availableTypes} availableStatuses={availableStatuses} />;
      default: return <Dashboard library={state.library} onNavigateToLibrary={() => navigate('library')} />;
    }
  };

  return (
    <Layout currentView={isSettingsOpen ? 'settings' : state.view} onNavigate={navigate} onManualAdd={handleManualAdd}>
      
      {/* The Main View behind the modal */}
      {renderContent()}
      
      {/* 1. Media Detail Modal */}
      {state.activeMediaId && (
          <MediaDetail 
              item={state.library.find(i => i.id === state.activeMediaId)!} 
              isOpen={!!state.activeMediaId}
              onClose={() => setState(prev => ({ ...prev, activeMediaId: null }))}
              onSave={handleUpdateMedia}
              onDelete={handleDeleteMedia}
              availableTypes={availableTypes}
              availableStatuses={availableStatuses}
              initialPosition={state.modalPosition}
              onPositionSave={(pos) => setState(prev => ({ ...prev, modalPosition: pos }))}
              startInEditMode={openInEditMode}
              isNewEntry={isCreatingNew}
          />
      )}

      {/* 2. Settings Modal */}
      {isSettingsOpen && (
          <Settings 
            settings={state.settings}
            library={state.library}
            onSave={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
            onImport={handleImport}
            onClearLibrary={() => {
                updateLibrary([]); // Clears the entire library state
                alert("Library cleared successfully.");
            }}
          />
      )}
    </Layout>
  );
};

export default App;