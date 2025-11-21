
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadLibrary, saveLibrary, loadSettings, saveSettings, generateId } from './services/mediaService';
import { AppState, MediaItem, DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES } from './types';
import { Icons } from './components/Icons';

// Views
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    setState(prev => ({ ...prev, view }));
  };

  const handleSettingsToggle = () => {
    if (state.view === 'settings') {
      navigate(previousViewRef.current);
    } else {
      previousViewRef.current = state.view;
      navigate('settings');
    }
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
    // Atomic update: clear active ID if it matches, and filter library
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
    console.log("App: handleBulkDelete called with IDs:", ids);
    setState(prev => {
      const newLibrary = prev.library.filter(item => !ids.includes(item.id));
      console.log("App: New library size:", newLibrary.length);
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
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 font-sans selection:bg-osmanthus-500 selection:text-white">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-20 md:w-64'} flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-900 z-40 transition-all duration-300`}>
        
        <div className={`h-16 flex items-center border-b border-slate-800 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
          
          {/* Logo Section - Hidden when collapsed */}
          {!isSidebarCollapsed && (
            <div className="flex items-center overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <div className="w-8 h-8 bg-osmanthus-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-osmanthus-500/30 flex-shrink-0">
                O
              </div>
              <span className="ml-3 font-bold text-lg tracking-tight text-slate-200 hidden md:block">Osmanthus</span>
            </div>
          )}

          {/* Toggle Button */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 text-slate-400 hover:text-white focus:outline-none transition-colors rounded-md hover:bg-slate-800 hidden md:block"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
             <Icons.Menu className="w-6 h-6" /> 
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          <SidebarItem 
            icon={<Icons.Library className="w-6 h-6" />} 
            label="Library" 
            active={state.view === 'library'} 
            onClick={() => navigate('library')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Icons.Dashboard className="w-6 h-6" />} 
            label="Dashboard" 
            active={state.view === 'dashboard'} 
            onClick={() => navigate('dashboard')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Icons.Import className="w-6 h-6" />} 
            label="Import" 
            active={state.view === 'import'} 
            onClick={() => navigate('import')} 
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <SidebarItem 
              icon={<Icons.Plus className="w-6 h-6" />} 
              label="Manual Add" 
              active={false} 
              onClick={handleManualAdd} 
              collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            icon={<Icons.Settings className="w-6 h-6" />} 
            label="Settings" 
            active={state.view === 'settings'} 
            onClick={handleSettingsToggle} 
            collapsed={isSidebarCollapsed}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-slate-900">
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
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
  collapsed: boolean;
}> = ({ icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group
      ${active 
        ? 'bg-osmanthus-600 text-white shadow-md shadow-osmanthus-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }
      ${collapsed ? 'justify-center' : ''}
    `}
    title={collapsed ? label : undefined}
  >
    <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-osmanthus-400 transition-colors'} flex-shrink-0`}>
      {icon}
    </span>
    {!collapsed && <span className="ml-3 hidden md:block font-medium text-sm">{label}</span>}
  </button>
);

export default App;
