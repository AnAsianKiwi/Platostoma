import React, { useState, useRef, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { AppSettings } from '../types';
import { 
  Save, RotateCcw, LayoutGrid, Bot, Tags, Database, 
  X, Plus, HardDrive, Download, Upload, Keyboard, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '', proxyUrl: '', enableAi: false, customTypes: [], customStatuses: [], 
    gridColumns: 0, keybinds: { addMedia: 'Ctrl+Alt+n' }
};

type SettingsTab = 'general' | 'library' | 'ai' | 'data';

export const Settings: React.FC = () => {
  const { settings, library, updateSettings, importItems, clearLibrary } = useDataStore();
  const { toggleSettings, addToast } = useUIStore(); // <--- Get addToast
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => { 
      await updateSettings(localSettings); 
      setIsDirty(false); 
      // --- TOAST ---
      addToast({ type: 'success', title: 'Settings Saved', message: 'Your configuration has been updated.' });
  };
  
  const handleArrayAdd = (field: 'customTypes'|'customStatuses', val: string) => {
    if(!val.trim()) return;
    setLocalSettings(p => ({...p, [field]: [...p[field], val.trim()]})); 
    setIsDirty(true);
  };
  
  const handleArrayRemove = (field: 'customTypes'|'customStatuses', idx: number) => {
    setLocalSettings(p => ({...p, [field]: p[field].filter((_, i) => i !== idx)})); 
    setIsDirty(true);
  };

  const storageStats = useMemo(() => {
    const jsonString = JSON.stringify(library);
    const bytes = new TextEncoder().encode(jsonString).length;
    const kb = bytes / 1024; const mb = kb / 1024;
    return { 
        items: library.length, 
        size: mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`, 
        percentage: Math.min((bytes / (5*1024*1024))*100, 100) 
    };
  }, [library]);

  const handleExport = () => {
    const content = JSON.stringify(library, null, 2);
    const filename = `osmanthus_backup_${new Date().toISOString().slice(0,10)}.json`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(content);
    const node = document.createElement('a');
    node.setAttribute("href", dataStr); 
    node.setAttribute("download", filename);
    document.body.appendChild(node); node.click(); node.remove();
    // --- TOAST ---
    addToast({ type: 'success', message: 'Backup downloaded successfully.' });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed) && confirm(`Found ${parsed.length} items. Merge?`)) {
            importItems(parsed);
            // --- TOAST ---
            addToast({ type: 'success', title: 'Import Successful', message: `Merged ${parsed.length} items into library.` });
        }
      } catch { 
          addToast({ type: 'error', title: 'Import Failed', message: 'Invalid JSON file.' });
      }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleClearLibrary = () => {
      clearLibrary();
      addToast({ type: 'info', title: 'Library Cleared', message: 'All items have been removed.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
      <div className="w-[900px] h-[600px] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex overflow-hidden">
        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />

        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-slate-100">Settings</h2>
            <p className="text-xs text-slate-500 mt-1">Configuration</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <TabButton icon={LayoutGrid} label="General & View" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
            <TabButton icon={Tags} label="Library" isActive={activeTab === 'library'} onClick={() => setActiveTab('library')} />
            <TabButton icon={Bot} label="AI & Network" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
            <TabButton icon={Database} label="Data" isActive={activeTab === 'data'} onClick={() => setActiveTab('data')} />
          </nav>
          <div className="p-4 border-t border-slate-800">
             <Button variant="secondary" className="w-full justify-center" onClick={toggleSettings}>Close</Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full bg-slate-950">
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/20">
             <span className="text-sm text-slate-500 italic">{isDirty ? 'Unsaved changes...' : 'All changes saved.'}</span>
             <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setLocalSettings(settings); setIsDirty(false); }} disabled={!isDirty} title="Revert Changes"><RotateCcw size={18} /></Button>
                <Button variant="primary" disabled={!isDirty} onClick={handleSave}><Save size={16} /> Apply</Button>
                <Button variant="ghost" size="icon" onClick={toggleSettings}><X size={20} /></Button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 select-text">
            <div className="max-w-xl mx-auto space-y-8">
                {activeTab === 'general' && (
                    <>
                    <SectionHeader title="Appearance" description="Customize layout." />
                    <SettingRow label="Grid Columns" description="0 = Auto-fit">
                        <Input type="number" min="0" max="12" value={localSettings.gridColumns} onChange={(e) => handleChange('gridColumns', parseInt(e.target.value)||0)} className="w-20 text-center" />
                    </SettingRow>
                    <SettingRow label="Add Media Shortcut">
                        <Input value={localSettings.keybinds.addMedia} onChange={(e) => { setLocalSettings(p => ({...p, keybinds: { ...p.keybinds, addMedia: e.target.value}})); setIsDirty(true); }} className="w-32 font-mono" icon={<Keyboard size={14} />} />
                    </SettingRow>
                    <div className="pt-4 border-t border-slate-800/50">
                         <Button variant="ghost" size="sm" onClick={() => { setLocalSettings(DEFAULT_SETTINGS); setIsDirty(true); addToast({type:'info', message:'Settings reset.'}); }}><RefreshCw size={12} /> Reset all settings to default</Button>
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
                        <Toggle checked={localSettings.enableAi} onChange={(v: boolean) => handleChange('enableAi', v)} />
                    </div>
                    {localSettings.enableAi && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <SettingRow label="API Key"><Input type="password" value={localSettings.apiKey} onChange={(e) => handleChange('apiKey', e.target.value)} placeholder="sk-..." className="w-64" /></SettingRow>
                            <SettingRow label="Proxy URL"><Input value={localSettings.proxyUrl} onChange={(e) => handleChange('proxyUrl', e.target.value)} placeholder="Optional" className="w-64" /></SettingRow>
                        </div>
                    )}
                    </>
                )}
                {activeTab === 'data' && (
                    <>
                    <SectionHeader title="Storage" description="Manage database." />
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
                        <div className="flex justify-between mb-2"><span className="text-sm font-bold text-slate-200 flex gap-2"><HardDrive size={18}/> Local DB</span><span className="font-mono text-sm text-slate-400">{storageStats.size}</span></div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-osmanthus-600" style={{ width: `${storageStats.percentage}%` }} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={handleExport}><Download size={20}/> Export Data</Button>
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}><Upload size={20}/> Import JSON</Button>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-800">
                        <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Danger Zone</h4>
                        <div className="flex items-center justify-between bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                             <span className="text-xs text-red-200/70">Permanently delete all items.</span>
                             <HoldButton onAction={handleClearLibrary} label="Hold to Clear" />
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

// ... Helper Components (Keep exactly as they were in previous step) ...
const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-slate-800 text-osmanthus-400 border-l-2 border-osmanthus-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'}`}>
    <Icon size={18} /> {label}
  </button>
);
const SectionHeader = ({ title, description }: any) => (
  <div className="mb-6 border-b border-slate-800 pb-4">
    <h3 className="text-xl font-light text-slate-100">{title}</h3>
    <p className="text-sm text-slate-500 mt-1">{description}</p>
  </div>
);
const SettingRow = ({ label, description, children }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-800/50">
    <div className="pr-4"><h4 className="font-medium text-slate-300">{label}</h4>{description && <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>}</div>
    <div>{children}</div>
  </div>
);
const Toggle = ({ checked, onChange }: any) => (
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
                 <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(input); setInput(''); }}} placeholder={placeholder} className="flex-1" />
                 <Button variant="secondary" size="icon" onClick={() => { onAdd(input); setInput(''); }}><Plus size={14} /></Button>
             </div>
        </div>
    )
}
const HoldButton = ({ onAction, label }: { onAction: () => void, label: string }) => {
    const [progress, setProgress] = useState(0);
    const requestRef = useRef<number | undefined>(undefined);
    const startTimeRef = useRef<number>(0);
    const HOLD_DURATION = 1500;
    const updateProgress = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const percentage = Math.min((elapsed / HOLD_DURATION) * 100, 100);
        setProgress(percentage);
        if (percentage >= 100) { onAction(); stopHold(); } else { requestRef.current = requestAnimationFrame(updateProgress); }
    };
    const startHold = (e: React.MouseEvent) => { if (e.button !== 0) return; startTimeRef.current = Date.now(); requestRef.current = requestAnimationFrame(updateProgress); };
    const stopHold = () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); setProgress(0); };
    return (
        <button type="button" onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold} className="relative overflow-hidden px-4 py-2 bg-red-950 border border-red-800 text-red-200 rounded text-xs font-bold select-none active:scale-95 transition-transform group">
            <div className="absolute inset-0 bg-red-600 z-0 transition-none" style={{ width: `${progress}%` }} />
            <span className="relative z-10 flex items-center gap-2">{progress > 0 ? 'HOLDING...' : label}</span>
        </button>
    );
};