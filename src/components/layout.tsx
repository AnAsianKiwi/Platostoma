import React, { useState } from 'react';
import { Icons } from './Icons';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onManualAdd: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onNavigate,
  onManualAdd
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavItem = ({ 
    icon: Icon, 
    label, 
    isActive, 
    onClick,
    variant = 'default'
  }: { 
    icon: React.FC<React.SVGProps<SVGSVGElement>>; 
    label: string; 
    isActive?: boolean; 
    onClick: () => void;
    variant?: 'default' | 'action';
  }) => {
    return (
      <button
        onClick={onClick}
        className={`
          group flex items-center w-full p-2 rounded-md text-sm font-medium transition-all duration-200
          ${isCollapsed ? 'justify-center' : 'justify-start'}
          ${variant === 'action' 
            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
            : isActive 
              ? 'bg-osmanthus-600 text-white shadow-sm' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
          }
        `}
        title={isCollapsed ? label : undefined}
      >
        <Icon className={`
          ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} 
          ${isActive ? 'text-current' : 'text-slate-400 group-hover:text-slate-100'}
          flex-shrink-0
        `} />
        
        {!isCollapsed && (
          <span className="truncate">{label}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar Shell */}
      <aside 
        className={`
          relative flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Header / Logo */}
        <div className={`
            flex h-14 items-center border-b border-slate-800 px-3 
            ${isCollapsed ? 'justify-center' : 'justify-between'}
        `}>
          {/* Logo Logic */}
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-semibold tracking-tight animate-in fade-in duration-300">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-osmanthus-600 text-xs font-bold text-white">
                O
              </div>
              <span className="text-slate-100">Osmanthus</span>
            </div>
          )}
          
          {/* Toggle Button - Kept consistent inside header */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <Icons.Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            <NavItem 
              icon={Icons.Library} 
              label="Library" 
              isActive={currentView === 'library'} 
              onClick={() => onNavigate('library')} 
            />
            <NavItem 
              icon={Icons.Dashboard} 
              label="Dashboard" 
              isActive={currentView === 'dashboard'} 
              onClick={() => onNavigate('dashboard')} 
            />
            <NavItem 
              icon={Icons.Import} 
              label="Import Media" 
              isActive={currentView === 'import'} 
              onClick={() => onNavigate('import')} 
            />
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 p-2 space-y-1">
           <NavItem 
              icon={Icons.Plus} 
              label="Manual Add" 
              onClick={onManualAdd}
              variant="action" 
            />
            <NavItem 
              icon={Icons.Settings} 
              label="Settings" 
              isActive={currentView === 'settings'} 
              onClick={() => onNavigate('settings')}
            />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-slate-950 text-slate-100">
        {children}
      </main>
    </div>
  );
};