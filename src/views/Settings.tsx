import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppSettings, MediaItem } from '../types';
import { 
  Save, RotateCcw, LayoutGrid, Bot, Tags, Database, 
  X, Plus, HardDrive, Download, Upload, Keyboard, AlertTriangle, RefreshCw
} from 'lucide-react';

// Define Defaults for Reset
const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '', proxyUrl: '', enableAi: false, customTypes: [], customStatuses: [], 
    gridColumns: 0, keybinds: { addMedia: 'Ctrl+Alt+n' }
};

interface SettingsProps {
  settings: AppSettings;
  library: MediaItem[];
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
  onImport: (items: MediaItem[]) => void;
  onClearLibrary: () => void; // <--- NEW PROP
}

type SettingsTab = 'general' | 'library' | 'ai' | 'data';

export const Settings: React.FC<SettingsProps> = ({ 
  settings, library, onSave, onClose, onImport, onClearLibrary 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DRAG LOGIC ---
  const [position, setPosition] = useState({ 
	x: (window.innerWidth - 900) / 2, 
    y: (window.innerHeight - 600) / 2
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT') return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // --- DATA LOGIC ---
  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const storageStats = useMemo(() => {
    const jsonString = JSON.stringify(library);
    const bytes = new TextEncoder().encode(jsonString).length;
    const kb = bytes / 1024; const mb = kb / 1024;
    return { items: library.length, size: mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`, percentage: Math.min((bytes / (5*1024*1024))*100, 100) };
  }, [library]);

  // NEW: Export with "Save As" Dialog
  const handleExport = async () => {
    const content = JSON.stringify(library, null, 2);
    const filename = `osmanthus_backup_${new Date().toISOString().slice(0,10)}.json`;

    try {
        // Try to use the modern File System Access API
        // @ts-ignore - Window type augmentation isn't set up, ignoring TS error for brevity
        if (window.showSaveFilePicker) {
            // @ts-ignore
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'JSON File', accept: {'application/json': ['.json']} }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            return;
        } 
        throw new Error("Fallback");
    } catch (err) {
        // Fallback to old download method if user cancels dialog or API not supported
        if ((err as Error).name === 'AbortError') return;
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(content);
        const node = document.createElement('a');
        node.setAttribute("href", dataStr); 
        node.setAttribute("download", filename);
        document.body.appendChild(node); node.click(); node.remove();
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed) && confirm(`Found ${parsed.length} items. This will merge into your current library. Continue?`)) {
            onImport(parsed);
            alert("Import successful!");
        }
      } catch { alert("Failed to parse JSON."); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  // NEW: Reset to Defaults
  const handleResetDefaults = () => {
      if(confirm("Are you sure you want to reset all settings to default? This cannot be undone.")) {
          setLocalSettings(DEFAULT_SETTINGS);
          setIsDirty(true);
      }
  };

  const handleArrayAdd = (field: 'customTypes'|'customStatuses', val: string) => {
    if(!val.trim()) return;
    setLocalSettings(p => ({...p, [field]: [...p[field], val.trim()]})); setIsDirty(true);
  };
  const handleArrayRemove = (field: 'customTypes'|'customStatuses', idx: number) => {
    setLocalSettings(p => ({...p, [field]: p[field].filter((_, i) => i !== idx)})); setIsDirty(true);
  };

  const handleSave = () => { onSave(localSettings); setIsDirty(false); };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="absolute w-[900px] h-[600px] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl shadow-black flex overflow-hidden pointer-events-auto select-none"
      >
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />

        {/* SIDEBAR */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col">
          <div onMouseDown={handleMouseDown} className="p-6 border-b border-slate-800 flex justify-between items-center cursor-move">
            <div>
                <h2 className="text-xl font-bold text-slate-100 pointer-events-none">Settings</h2>
                <p className="text-xs text-slate-500 mt-1 pointer-events-none">Configuration</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <TabButton icon={LayoutGrid} label="General & View" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
            <TabButton icon={Tags} label="Library" isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
            <TabButton icon={Bot} label="AI & Network" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
            <TabButton icon={Database} label="Data" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
          </nav>

          <div className="p-4 border-t border-slate-800 flex gap-2">
             <button onClick={onClose} className="w-full py-2 rounded-md bg-slate-800 text-slate-400 hover:bg-red-900/30 hover:text-red-200 text-sm font-medium transition-colors">
                Close
             </button>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 flex flex-col h-full bg-slate-950">
          <div onMouseDown={handleMouseDown} className="h-16 border-b border-slate-800 flex items-center justify-between px-8 cursor-move">
             <span className="text-sm text-slate-500 italic pointer-events-none">
                {isDirty ? 'Unsaved changes...' : 'All changes saved.'}
             </span>
             <div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
                <button onClick={() => { setLocalSettings(settings); setIsDirty(false); }} disabled={!isDirty} className="p-2 text-slate-500 hover:text-white disabled:opacity-30 transition-colors" title="Revert Changes">
                    <RotateCcw size={18} />
                </button>
                <button onClick={handleSave} disabled={!isDirty} className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-bold transition-all ${isDirty ? 'bg-osmanthus-600 text-white shadow-lg shadow-osmanthus-900/20 hover:bg-osmanthus-500' : 'bg-slate-800 text-slate-600'}`}>
                    <Save size={16} /> Apply
                </button>
                <button onClick={onClose} className="ml-2 p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 select-text cursor-auto">
            <div className="max-w-xl mx-auto space-y-8">
                {activeTab === 'general' && (
                    <>
                    <SectionHeader title="Appearance" description="Customize layout." />
                    <SettingRow label="Grid Columns" description="0 = Auto-fit">
                        <input type="number" min="0" max="12" value={localSettings.gridColumns} onChange={(e) => handleChange('gridColumns', parseInt(e.target.value)||0)} className="w-20 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-center focus:border-osmanthus-500 outline-none" />
                    </SettingRow>
                    <SettingRow label="Add Media Shortcut">
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-3 py-1">
                            <Keyboard size={14} className="text-slate-500" />
                            <input type="text" value={localSettings.keybinds.addMedia} onChange={(e) => { setLocalSettings(p => ({...p, keybinds: { ...p.keybinds, addMedia: e.target.value}})); setIsDirty(true); }} className="bg-transparent outline-none text-sm w-32 font-mono text-osmanthus-400" />
                        </div>
                    </SettingRow>
                    
                    {/* Reset Defaults Button */}
                    <div className="pt-4 border-t border-slate-800/50">
                         <button onClick={handleResetDefaults} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-2 transition-colors">
                             <RefreshCw size={12} /> Reset all settings to default
                         </button>
                    </div>
                    </>
                )}
                {activeTab === 'library' && (
                    <>
                    <SectionHeader title="Taxonomy" description="Manage types & statuses." />
                    <TagManager label="Custom Types" items={localSettings.customTypes} onAdd={(v:string) => handleArrayAdd('customTypes', v)} onRemove={(i:number) => handleArrayRemove('customTypes', i)} placeholder="e.g. Comic" />
                    <TagManager label="Custom Statuses" items={localSettings.customStatuses} onAdd={(v:string) => handleArrayAdd('customStatuses', v)} onRemove={(i:number) => handleArrayRemove('customStatuses', i)} placeholder="e.g. Archived" />
                    </>
                )}
                {activeTab === 'ai' && (
                    <>
                    <SectionHeader title="Intelligence" description="LLM Integration." />
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between mb-4">
                        <div><h4 className="text-slate-200 font-medium">Enable AI</h4><p className="text-xs text-slate-500">Auto-fill metadata</p></div>
                        <Toggle checked={localSettings.enableAi} onChange={(v) => handleChange('enableAi', v)} />
                    </div>
                    {localSettings.enableAi && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <SettingRow label="API Key"><input type="password" value={localSettings.apiKey} onChange={(e) => handleChange('apiKey', e.target.value)} placeholder="sk-..." className="bg-slate-900 border border-slate-700 rounded px-3 py-1 w-48 focus:border-osmanthus-500 outline-none" /></SettingRow>
                            <SettingRow label="Proxy URL"><input type="text" value={localSettings.proxyUrl} onChange={(e) => handleChange('proxyUrl', e.target.value)} placeholder="Optional" className="bg-slate-900 border border-slate-700 rounded px-3 py-1 w-48 focus:border-osmanthus-500 outline-none" /></SettingRow>
                        </div>
                    )}
                    </>
                )}
                {activeTab === 'data' && (
                    <>
                    <SectionHeader title="Storage" description="Manage database." />
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
                        <div className="flex justify-between mb-2"><span className="text-sm font-bold text-slate-200 flex gap-2"><HardDrive size={18}/> Local DB</span><span className="font-mono text-sm">{storageStats.size}</span></div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-osmanthus-600" style={{ width: `${storageStats.percentage}%` }} /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleExport} className="p-3 bg-slate-900 border border-slate-800 hover:border-osmanthus-500 rounded-lg flex flex-col items-center gap-2 text-xs font-medium text-slate-300 transition-all"><Download size={20}/> Export Data</button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-lg flex flex-col items-center gap-2 text-xs font-medium text-slate-300 transition-all"><Upload size={20}/> Import JSON</button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Danger Zone</h4>
                        <div className="flex items-center justify-between bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                             <span className="text-xs text-red-200/70">Permanently delete all items from library.</span>
                             
                             {/* HOLD TO CONFIRM BUTTON */}
                             <HoldButton onAction={onClearLibrary} label="Hold to Clear" />
                        </div>
                    </div>
                    </>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---
const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-slate-800 text-osmanthus-400 border-l-2 border-osmanthus-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'}`}>
    <Icon size={18} /> {label}
  </button>
);
const SectionHeader = ({ title, description }: { title: string, description: string }) => (
  <div className="mb-6 border-b border-slate-800 pb-4">
    <h3 className="text-xl font-light text-slate-100">{title}</h3>
    <p className="text-sm text-slate-500 mt-1">{description}</p>
  </div>
);
const SettingRow = ({ label, description, children }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-800/50">
    <div className="pr-4">
      <h4 className="font-medium text-slate-300">{label}</h4>
      {description && <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>}
    </div>
    <div>{children}</div>
  </div>
);
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-osmanthus-600' : 'bg-slate-700'}`}>
    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);
const TagManager = ({ label, items, onAdd, onRemove, placeholder }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="space-y-2 py-4">
             <h4 className="font-medium text-slate-300">{label}</h4>
             <div className="flex flex-wrap gap-2 mb-2">
                {items.map((item: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] rounded border border-slate-700">
                        {item} <button onClick={() => onRemove(idx)} className="hover:text-red-400"><X size={10} /></button>
                    </span>
                ))}
             </div>
             <div className="flex gap-2">
                 <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(input); setInput(''); }}} placeholder={placeholder} className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-xs focus:border-osmanthus-500 outline-none" />
                 <button onClick={() => { onAdd(input); setInput(''); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-700"><Plus size={14} /></button>
             </div>
        </div>
    )
}

// NEW: Time-Based Hold Button (Fixes spam clicking & visual bugs)
const HoldButton = ({ onAction, label }: { onAction: () => void, label: string }) => {
    const [progress, setProgress] = useState(0);
    const requestRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number>(0);
    const HOLD_DURATION = 1500; // 1.5 Seconds to clear

    const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const percentage = Math.min((elapsed / HOLD_DURATION) * 100, 100);
        
        setProgress(percentage);

        if (percentage >= 100) {
            // Action confirmed!
            onAction();
            stopHold(); // Reset immediately
        } else {
            // Keep animating
            requestRef.current = requestAnimationFrame(updateProgress);
        }
    };

    const startHold = (e: React.MouseEvent) => {
        // Only allow left click
        if (e.button !== 0) return;
        
        startTimeRef.current = Date.now();
        requestRef.current = requestAnimationFrame(updateProgress);
    };

    const stopHold = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        setProgress(0);
    };

    return (
        <button 
            type="button"
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            className="relative overflow-hidden px-4 py-2 bg-red-950 border border-red-800 text-red-200 rounded text-xs font-bold select-none active:scale-95 transition-transform group"
        >
            {/* Progress Bar Background - Brighter Red for visibility */}
            <div 
                className="absolute inset-0 bg-red-600 z-0 transition-none" 
                style={{ width: `${progress}%` }}
            />
            
            {/* Text Label - Ensures it stays on top */}
            <span className="relative z-10 flex items-center gap-2">
                {progress > 0 ? 'HOLDING...' : label}
            </span>
        </button>
    );
};