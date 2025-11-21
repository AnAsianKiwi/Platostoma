
import React, { useState, useEffect } from 'react';
import { AppState, DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES } from '../types';
import { Icons } from '../components/Icons';

interface SettingsProps {
  settings: AppState['settings'];
  onSave: (newSettings: AppState['settings']) => void;
  onBack: () => void;
}

// Helper for recording keybinds
const KeybindRecorder = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void;
}) => {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Cmd');
      
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        parts.push(e.key);
        const combo = parts.join('+');
        onChange(combo);
        setIsRecording(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, onChange]);

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex-1 px-3 py-2 rounded border text-sm font-mono text-center ${
          isRecording 
            ? 'bg-osmanthus-900/50 border-osmanthus-500 text-osmanthus-200 animate-pulse' 
            : 'bg-slate-900 border-slate-600 text-slate-300'
        }`}
      >
        {isRecording ? 'Press keys...' : value}
      </div>
      <button
        onClick={() => setIsRecording(!isRecording)}
        className={`px-3 py-2 rounded text-sm font-medium border ${
          isRecording
            ? 'bg-red-600 border-red-500 text-white hover:bg-red-500'
            : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
        }`}
      >
        {isRecording ? 'Cancel' : 'Record'}
      </button>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onBack }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [newType, setNewType] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const handleChange = (field: keyof AppState['settings'], value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleKeybindChange = (key: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      keybinds: { ...prev.keybinds, [key]: value }
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    alert('Settings saved.');
  };

  const addCustomType = () => {
    if (newType && !localSettings.customTypes.includes(newType) && !DEFAULT_MEDIA_TYPES.includes(newType)) {
        setLocalSettings(prev => ({
            ...prev,
            customTypes: [...prev.customTypes, newType]
        }));
        setNewType('');
    }
  };

  const removeCustomType = (type: string) => {
      setLocalSettings(prev => ({
          ...prev,
          customTypes: prev.customTypes.filter(t => t !== type)
      }));
  };

  const addCustomStatus = () => {
    if (newStatus && !localSettings.customStatuses.includes(newStatus) && !DEFAULT_MEDIA_STATUSES.includes(newStatus)) {
        setLocalSettings(prev => ({
            ...prev,
            customStatuses: [...prev.customStatuses, newStatus]
        }));
        setNewStatus('');
    }
  };

  const removeCustomStatus = (status: string) => {
      setLocalSettings(prev => ({
          ...prev,
          customStatuses: prev.customStatuses.filter(s => s !== status)
      }));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto overflow-y-auto h-full pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button 
            onClick={onBack} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Go Back"
        >
            <Icons.ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-8">
        
        {/* General UI Settings */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Appearance & Behavior</h2>
          
          <div className="space-y-6">
             {/* Grid Columns */}
             <div>
               <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-400">Grid Columns (Library)</label>
                  <span className="text-xs font-bold text-osmanthus-400 bg-osmanthus-900/50 px-2 py-1 rounded border border-osmanthus-800">
                     {localSettings.gridColumns === 0 ? 'Auto' : localSettings.gridColumns}
                  </span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="8" 
                 step="1"
                 value={localSettings.gridColumns}
                 onChange={(e) => handleChange('gridColumns', parseInt(e.target.value))}
                 className="w-full accent-osmanthus-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
               />
               <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
                 <span>Auto</span>
                 <span>8</span>
               </div>
             </div>

             {/* Keybinds */}
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Keyboard Shortcuts</label>
                <div className="grid grid-cols-2 gap-4 items-center">
                   <span className="text-sm text-slate-300">Add New Media</span>
                   <KeybindRecorder 
                      value={localSettings.keybinds.addMedia} 
                      onChange={(val) => handleKeybindChange('addMedia', val)}
                   />
                </div>
             </div>
          </div>
        </section>

        {/* Customization */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-6">
           <h2 className="text-lg font-semibold text-white mb-4">Library Customization</h2>
           
           <div className="space-y-6">
             {/* Custom Types */}
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Custom Media Types</label>
               <div className="flex gap-2 mb-2">
                   <input 
                    type="text" 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="e.g., Donghua, Light Novel"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-osmanthus-500 outline-none"
                   />
                   <button onClick={addCustomType} className="px-3 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">Add</button>
               </div>
               <div className="flex flex-wrap gap-2">
                   {DEFAULT_MEDIA_TYPES.map(t => (
                       <span key={t} className="px-2 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-slate-500 cursor-default" title="Default Type">{t}</span>
                   ))}
                   {localSettings.customTypes.map(t => (
                       <span key={t} className="px-2 py-1 bg-osmanthus-900 rounded border border-osmanthus-700 text-xs text-osmanthus-200 flex items-center gap-1">
                           {t}
                           <button onClick={() => removeCustomType(t)} className="hover:text-white font-bold">×</button>
                       </span>
                   ))}
               </div>
             </div>

             {/* Custom Statuses */}
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Custom Statuses</label>
               <div className="flex gap-2 mb-2">
                   <input 
                    type="text" 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="e.g., On Hold (Indefinite)"
                    className="flex-1 bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm focus:border-osmanthus-500 outline-none"
                   />
                   <button onClick={addCustomStatus} className="px-3 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">Add</button>
               </div>
               <div className="flex flex-wrap gap-2">
                   {DEFAULT_MEDIA_STATUSES.map(t => (
                       <span key={t} className="px-2 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-slate-500 cursor-default" title="Default Status">{t}</span>
                   ))}
                   {localSettings.customStatuses.map(t => (
                       <span key={t} className="px-2 py-1 bg-osmanthus-900 rounded border border-osmanthus-700 text-xs text-osmanthus-200 flex items-center gap-1">
                           {t}
                           <button onClick={() => removeCustomStatus(t)} className="hover:text-white font-bold">×</button>
                       </span>
                   ))}
               </div>
             </div>
           </div>
        </section>

        {/* AI & API */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-6">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">AI Integration</h2>
              <div className="flex items-center">
                 <input 
                   type="checkbox" 
                   id="enableAi" 
                   checked={localSettings.enableAi}
                   onChange={(e) => handleChange('enableAi', e.target.checked)}
                   className="mr-2"
                 />
                 <label htmlFor="enableAi" className="text-sm text-slate-300">Enable AI Features</label>
              </div>
           </div>
           
           {localSettings.enableAi && (
             <div className="space-y-4 animate-fadeIn">
               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1">Gemini API Key</label>
                 <input 
                   type="password"
                   value={localSettings.apiKey}
                   onChange={(e) => handleChange('apiKey', e.target.value)}
                   placeholder="AIza..."
                   className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-osmanthus-500 focus:outline-none"
                 />
                 <p className="text-xs text-slate-500 mt-1">Used for recommendations and summary generation.</p>
               </div>
             </div>
           )}
        </section>

        {/* Network */}
        <section className="bg-slate-800 rounded-lg border border-slate-700 p-6">
           <h2 className="text-lg font-semibold text-white mb-4">Network & Proxy</h2>
           <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Custom Proxy URL</label>
               <input 
                 type="text"
                 value={localSettings.proxyUrl}
                 onChange={(e) => handleChange('proxyUrl', e.target.value)}
                 placeholder="http://localhost:8080"
                 className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-osmanthus-500 focus:outline-none"
               />
               <p className="text-xs text-slate-500 mt-1">Optional: Use a proxy for scraping metadata if rate limited.</p>
           </div>
        </section>

         {/* Save Button */}
         <div className="flex justify-end pt-4 border-t border-slate-700">
           <button 
             onClick={handleSave}
             className="px-6 py-2 bg-osmanthus-600 hover:bg-osmanthus-500 text-white rounded font-medium transition shadow-lg"
           >
             Save Changes
           </button>
         </div>
      </div>
    </div>
  );
};
