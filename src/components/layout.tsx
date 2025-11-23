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

  // --- DIMENSIONS ---
  const WIDTH_COLLAPSED = 'w-20';
  const WIDTH_EXPANDED = 'w-60';

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
          group relative flex items-center w-full h-12 mb-2 transition-all duration-300 ease-out
          ${isActive 
              ? 'text-osmanthus-400' 
              : variant === 'action'
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
          }
          ${isActive && !isCollapsed ? 'bg-slate-800/50 rounded-r-lg mr-3' : ''}
        `}
        title={isCollapsed ? label : undefined}
      >
        {isActive && (
            <div className={`
                absolute left-0 top-2 bottom-2 w-1 bg-osmanthus-500 rounded-r-full shadow-[0_0_12px_rgba(78,153,86,0.6)]
                transition-all duration-300
            `} />
        )}

        <div className="w-20 flex items-center justify-center flex-shrink-0 z-10">
             <Icon className={`
                transition-transform duration-300 group-hover:scale-110
                w-6 h-6
            `} />
        </div>
        
        <div 
            className={`
                absolute left-20 flex items-center h-full
                transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
                ${isCollapsed 
                    ? 'opacity-0 -translate-x-4 pointer-events-none'
                    : 'opacity-100 translate-x-0'
                }
            `}
        >
          <span className="text-base font-medium tracking-wide whitespace-nowrap">{label}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`
          flex flex-col border-r border-slate-800/50 bg-slate-950 flex-shrink-0
          transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width]
          ${isCollapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED}
        `}
      >
        <div className="h-16 flex items-center relative flex-shrink-0 overflow-hidden">
          <div className={`
             absolute left-0 top-0 bottom-0 flex items-center pl-[18px] transition-all duration-300
             ${isCollapsed ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
          `}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-osmanthus-600 text-white font-bold shadow-md shadow-osmanthus-900/30 flex-shrink-0 mr-3">
                  <span className="text-base">O</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-100 whitespace-nowrap">Osmanthus</span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
               p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-300 absolute
               ${isCollapsed 
                  ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                  : 'right-3 top-1/2 -translate-y-1/2'
               }
            `}
          >
            <Icons.Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 pt-10 pb-2 overflow-x-hidden overflow-y-auto [scrollbar-width:none]">
          <nav>
            <NavItem icon={Icons.Library} label="Library" isActive={currentView === 'library'} onClick={() => onNavigate('library')} />
            <NavItem icon={Icons.Dashboard} label="Dashboard" isActive={currentView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
            <NavItem icon={Icons.Import} label="Import Media" isActive={currentView === 'import'} onClick={() => onNavigate('import')} />
          </nav>
        </div>

        <div className="py-2 border-t border-slate-800/50 flex-shrink-0 overflow-hidden space-y-1">
           <NavItem icon={Icons.Plus} label="Manual Add" onClick={onManualAdd} variant="action" />
           <NavItem icon={Icons.Settings} label="Settings" isActive={currentView === 'settings'} onClick={() => onNavigate('settings')} />
        </div>
      </aside>

      {/* MAIN CONTENT - CHANGED: removed 'overflow-y-scroll' */}
      <main className="flex-1 h-full min-w-0 relative bg-slate-950 overflow-hidden">
         {children}
      </main>
    </div>
  );
};