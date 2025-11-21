
import React, { useState } from 'react';
import { MediaItem } from '../types';
import { generateId, mockSearchMedia, MockSearchResult } from '../services/mediaService';
import { Icons } from '../components/Icons';

interface ImportProps {
  onImport: (items: MediaItem[]) => void;
  availableTypes: string[];
  availableStatuses: string[];
}

interface ImportRow {
  id: string;
  rawQuery: string;
  parsedTitle: string;
  customType: string;
  customStatus: string;
  isValid: boolean;
}

export const Import: React.FC<ImportProps> = ({ onImport, availableTypes, availableStatuses }) => {
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);

  const parseLine = (line: string): { title: string, type: string, status: string } => {
    // Try splitting by | or - or brackets
    // Format 1: Title | Type | Status
    if (line.includes('|')) {
        const parts = line.split('|').map(s => s.trim());
        return {
            title: parts[0] || 'Unknown',
            type: availableTypes.find(t => t.toLowerCase() === parts[1]?.toLowerCase()) || availableTypes[0],
            status: availableStatuses.find(s => s.toLowerCase() === parts[2]?.toLowerCase()) || availableStatuses[0]
        };
    }
    
    // Fallback: Just title
    return {
        title: line.trim(),
        type: availableTypes[0],
        status: availableStatuses[0]
    };
  };

  const handleProcess = async () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const rows: ImportRow[] = lines.map(line => {
        const parsed = parseLine(line);
        return {
            id: generateId(),
            rawQuery: line,
            parsedTitle: parsed.title,
            customType: parsed.type,
            customStatus: parsed.status,
            isValid: !!parsed.title
        };
    });

    setImportRows(rows);
    setStep('review');
  };

  const handleRowChange = (id: string, field: keyof ImportRow, value: string) => {
    setImportRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleRemoveRow = (id: string) => {
    setImportRows(prev => prev.filter(row => row.id !== id));
  };

  const handleConfirmImport = () => {
    const itemsToImport: MediaItem[] = importRows.map(row => ({
      id: generateId(),
      title: row.parsedTitle,
      type: row.customType,
      status: row.customStatus,
      coverUrl: '', // No placeholders
      rating: 0,
      progress: 0,
      tags: ['Imported'],
      description: 'Imported via Bulk Import.',
      notes: '',
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    onImport(itemsToImport);
    setInputText('');
    setImportRows([]);
    setStep('input');
  };

  if (step === 'input') {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
             <div className="p-3 bg-osmanthus-600/20 rounded-lg text-osmanthus-400">
                 <Icons.Import className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white">Bulk Import</h1>
                <p className="text-slate-400 text-sm">Paste titles or formatted lines to quick add.</p>
             </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Supported Formats</h3>
            <ul className="text-sm text-slate-300 space-y-1 font-mono">
                <li>• Title Only (Defaults to first type/status)</li>
                <li>• Title | Type | Status</li>
            </ul>
            <div className="mt-2 text-xs text-slate-500 italic">Example: Naruto | Anime | Completed</div>
        </div>
        
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-1 flex flex-col shadow-inner">
          <textarea
            className="flex-1 w-full bg-transparent border-none p-4 text-slate-200 focus:outline-none font-mono resize-none placeholder:text-slate-600"
            placeholder="Paste your list here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        
        <div className="mt-4 flex justify-end">
           <button 
            onClick={handleProcess}
            disabled={!inputText.trim()}
            className="px-6 py-3 bg-osmanthus-600 hover:bg-osmanthus-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
          >
            Review List <Icons.ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <div>
             <h1 className="text-2xl font-bold text-white">Review Items</h1>
             <p className="text-slate-400 text-sm">Adjust details before adding {importRows.length} items to your library.</p>
          </div>
          <button onClick={() => setStep('input')} className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded hover:bg-slate-800 transition">Cancel</button>
       </div>

       <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 flex flex-col bg-slate-900">
          <div className="grid grid-cols-12 gap-4 p-3 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wide">
              <div className="col-span-5 pl-2">Title</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-1 text-center">Action</div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
            {importRows.map((row) => (
              <div key={row.id} className="grid grid-cols-12 gap-4 items-center p-2 hover:bg-slate-800/50 rounded transition group">
                 <div className="col-span-5">
                     <input 
                       className="w-full bg-transparent border-b border-transparent focus:border-osmanthus-500 outline-none text-white text-sm py-1 font-medium"
                       value={row.parsedTitle}
                       onChange={(e) => handleRowChange(row.id, 'parsedTitle', e.target.value)}
                     />
                 </div>
                 <div className="col-span-3">
                     <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-osmanthus-500 outline-none"
                        value={row.customType}
                        onChange={(e) => handleRowChange(row.id, 'customType', e.target.value)}
                     >
                        {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>
                 <div className="col-span-3">
                     <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-osmanthus-500 outline-none"
                        value={row.customStatus}
                        onChange={(e) => handleRowChange(row.id, 'customStatus', e.target.value)}
                     >
                        {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                 </div>
                 <div className="col-span-1 flex justify-center">
                     <button 
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition opacity-0 group-hover:opacity-100"
                     >
                        <Icons.X className="w-4 h-4" />
                     </button>
                 </div>
              </div>
            ))}
          </div>
       </div>

       <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
           <button 
             onClick={handleConfirmImport}
             className="px-8 py-3 bg-osmanthus-600 hover:bg-osmanthus-500 text-white rounded font-medium shadow-lg shadow-osmanthus-900/20 transition flex items-center gap-2"
           >
             <Icons.Import className="w-4 h-4" />
             Import Items
           </button>
       </div>
    </div>
  );
};
