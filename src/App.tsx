import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadLibrary, saveLibrary, loadSettings, saveSettings, generateId } from './services/mediaService';
import { AppState, MediaItem, DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES } from './types';

// Components
import { Layout } from './components/Layout';
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
    modalPosition: { x: 100, y: 100 },
    settings: {
      apiKey: '',
      proxyUrl: '',
      enableAi: false,
      customTypes: [],
      customStatuses: [],
      gridColumns: 0,
      keybinds: { addMedia: 'Ctrl+Alt+n' }
    }
  });

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Helper to track if a save is pending to prevent overwrites
  const isDirty = useRef(false);

  // Keep track of the view before entering settings
  const previousViewRef = useRef<AppState['view']>('library');

  // State to control if MediaDetail opens in edit mode (for manual add)
  const [openInEditMode, setOpenInEditMode] = useState(false);

  // Compute available options combining defaults and customs
  const availableTypes = useMemo(() => 
    [...DEFAULT_MEDIA_TYPES, ...state.settings.customTypes].sort(), 
    [state.settings.customTypes]
  );

  const availableStatuses = useMemo(() => 
    [...DEFAULT_MEDIA_STATUSES, ...state.settings.customStatuses], 
    [state.settings.customStatuses]
  );

  // Load data on mount
  useEffect(() => {
    const library = loadLibrary();
    const settings = loadSettings();
    setState(prev => ({ ...prev, library, settings }));
    setIsLoaded(true);
  }, []);

  // Save library on change - ONLY if loaded
  useEffect(() => {
    if (isLoaded && isDirty.current) {
      saveLibrary(state.library);
    }
  }, [state.library, isLoaded]);

  // Helper to update library and mark dirty
  const updateLibrary = (newLibrary: MediaItem[]) => {
    isDirty.current = true;
    setState(prev => ({ ...prev, library: newLibrary }));
  };

  const handleManualAdd = useCallback(() => {
    const newItem: MediaItem = {
      id: generateId(),
      title: 'New Entry',
      type: '',
      status: '',
      coverUrl: '', 
      rating: 0,
      progress: 0,
      tags: [],
      description: '',
      notes: '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setOpenInEditMode(true);
    setIsCreatingNew(true);
    
    setState(prev => ({
      ...prev,
      library: [newItem, ...prev.library],
      activeMediaId: newItem.id 
    }));
    isDirty.current = true;
  }, []);

  // Global Keybind Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keybind = state.settings.keybinds.addMedia.toLowerCase();
      const keys = keybind.split('+');
      
      const needsCtrl = keys.includes('ctrl');
      const needsAlt = keys.includes('alt');
      const needsShift = keys.includes('shift');
      const needsMeta = keys.includes('meta') || keys.includes('cmd');
      const triggerKey = keys.find(k => !['ctrl','alt','shift','meta','cmd'].includes(k));

      const pressedCtrl = e.ctrlKey;
      const pressedAlt = e.altKey;
      const pressedShift = e.shiftKey;
      const pressedMeta = e.metaKey;
      const pressedKey = e.key.toLowerCase();

      if (
        pressedCtrl === needsCtrl &&
        pressedAlt === needsAlt &&
        pressedShift === needsShift &&
        pressedMeta === needsMeta &&
        pressedKey === triggerKey
      ) {
        e.preventDefault();
        handleManualAdd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.settings.keybinds.addMedia, handleManualAdd]);

  // Navigation handlers
  const navigate = (view: AppState['view']) => {
    if (view === 'settings') {
       previousViewRef.current = state.view;
    }
    setState(prev => ({ ...prev, view }));
  };

  const handleSettingsBack = () => {
     navigate(previousViewRef.current);
  };

  const handleSelectMedia = (id: string) => {
    setOpenInEditMode(false);
    setIsCreatingNew(false);
    setState(prev => ({ ...prev, activeMediaId: id }));
  };

  const handleCloseMedia = () => {
    setState(prev => ({ ...prev, activeMediaId: null }));
    setOpenInEditMode(false);
    setIsCreatingNew(false);
  }

  const handleUpdateMedia = (updatedItem: MediaItem) => {
    updateLibrary(state.library.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (isCreatingNew) setIsCreatingNew(false);
  };

  const handleDeleteMedia = (id: string) => {
    setState(prev => {
      const newLibrary = prev.library.filter(item => item.id !== id);
      return {
        ...prev,
        library: newLibrary,
        activeMediaId: prev.activeMediaId === id ? null : prev.activeMediaId
      };
    });
    isDirty.current = true;
  };

  const handleBulkDelete = (ids: string[]) => {
    setState(prev => {
      const newLibrary = prev.library.filter(item => !ids.includes(item.id));
      const isActiveDeleted = prev.activeMediaId && ids.includes(prev.activeMediaId);
      return {
        ...prev,
        library: newLibrary,
        activeMediaId: isActiveDeleted ? null : prev.activeMediaId
      };
    });
    isDirty.current = true;
  };

  const handleImport = (newItems: MediaItem[]) => {
    updateLibrary([...state.library, ...newItems]);
    setState(prev => ({ ...prev, view: 'library' }));
  };

  const handleSaveSettings = (newSettings: AppState['settings']) => {
    saveSettings(newSettings);
    setState(prev => ({ ...prev, settings: newSettings }));
  };

  // View Rendering
  const renderContent = () => {
    switch (state.view) {
      case 'dashboard':
        return <Dashboard library={state.library} onNavigateToLibrary={() => navigate('library')} />;
      case 'library':
        return <Library 
          library={state.library} 
          onSelectItem={handleSelectMedia} 
          onBulkDelete={handleBulkDelete}
          availableTypes={availableTypes}
          availableStatuses={availableStatuses}
          viewMode={state.libraryLayout}
          onViewModeChange={(mode) => setState(prev => ({ ...prev, libraryLayout: mode }))}
          gridColumns={state.settings.gridColumns}
        />;
      case 'import':
        return <Import 
          onImport={handleImport} 
          availableTypes={availableTypes} 
          availableStatuses={availableStatuses}
        />;
      case 'settings':
        return <Settings 
            settings={state.settings} 
            onSave={handleSaveSettings} 
            onBack={handleSettingsBack}
        />;
      default:
        return <Dashboard library={state.library} onNavigateToLibrary={() => navigate('library')} />;
    }
  };

  return (
    <Layout 
      currentView={state.view} 
      onNavigate={navigate} 
      onManualAdd={handleManualAdd}
    >
      {renderContent()}
      
      {/* Modal Layer */}
      {state.activeMediaId && (
          <MediaDetail 
              item={state.library.find(i => i.id === state.activeMediaId)!} 
              isOpen={!!state.activeMediaId}
              onClose={handleCloseMedia}
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
    </Layout>
  );
};

export default App;
