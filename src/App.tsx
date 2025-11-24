import React, { useEffect } from 'react';
import { useDataStore } from './store/useDataStore';
import { useUIStore } from './store/useUIStore';
import { useHotkeys } from './hooks/useHotkeys';

// Components
import { Layout } from './components/layout';
import { Dashboard } from './views/Dashboard';
import { Library } from './views/Library';
import { MediaDetail } from './views/MediaDetail';
import { Import } from './views/Import';
import { Settings } from './views/Settings';
import { Toaster } from './components/ui/Toaster'; // <--- IMPORT THIS

const App: React.FC = () => {
  const { isLoaded, init } = useDataStore();
  const { currentView, activeMediaId, isSettingsOpen, tempNewItem } = useUIStore();

  useHotkeys();

  useEffect(() => {
    init();
  }, [init]);

  const activeItem = tempNewItem || activeMediaId; 

  const renderContent = () => {
    if (!isLoaded) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Library...</div>;

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'library': return <Library />;
      case 'import': return <Import />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="w-full h-full">
        {renderContent()}
      </div>
      
      {activeItem && <MediaDetail />}
      {isSettingsOpen && <Settings />}
      
      {/* MOUNT TOASTER HERE */}
      <Toaster />
    </Layout>
  );
};

export default App;