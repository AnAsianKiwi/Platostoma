
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
  
  // Current form values
  title: string;
  type: string;
  status: string;
  coverUrl: string;
  
  // Search state
  searchStatus: 'success' | 'multiple' | 'not_found' | 'error';
  candidates: MockSearchResult[];
}

export const Import: React.FC<ImportProps> = ({ onImport, availableTypes, availableStatuses }) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);

  const parseLine = (line: string): { title: string, type: string, status: string } => {
    // Format: Title | Type | Status
    if (line.includes('|')) {
        const parts = line.split('|').map(s => s.trim());
        return {
            title: parts[0] || 'Unknown',
            type: availableTypes.find(t => t.toLowerCase() === parts[1]?.toLowerCase()) || availableTypes[0],
            status: availableStatuses.find(s => s.toLowerCase() === parts[2]?.toLowerCase()) || availableStatuses[0]
        };
    }
    return {
        title: line.trim(),
        type: availableTypes[0],
        status: availableStatuses[0]
    };
  };

  const handleProcess = async () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    setStep('processing');

    const processedRows: ImportRow[] = await Promise.all(lines.map(async (line) => {
        const id = generateId();
        const parsed = parseLine(line);
        let candidates: MockSearchResult[] = [];
        let searchStatus: ImportRow['searchStatus'] = 'not_found';
        let finalTitle = parsed.title;
        let finalType = parsed.type;
        let finalCover = '';

        try {
            // Perform search
            candidates = await mockSearchMedia(parsed.title);
            
            if (candidates.length === 0) {
                searchStatus = 'not_found';
            } else if (candidates.length === 1) {
                searchStatus = 'success';
                finalTitle = candidates[0].title;
                finalType = candidates[0].type; // Override type if found
                finalCover = candidates[0].coverUrl;
            } else {
                searchStatus = 'multiple';
                // Attempt to auto-match type if possible to select default
                const match = candidates.find(c => c.type.toLowerCase() === parsed.type.toLowerCase());
                if (match) {
                    finalTitle = match.title;
                    finalType = match.type;
                    finalCover = match.coverUrl;
                } else {
                    // Default to first
                    finalTitle = candidates[0].title;
                    finalType = candidates[0].type;
                    finalCover = candidates[0].coverUrl;
                }
            }
        } catch (error) {
            console.error("Search failed for", parsed.title, error);
            searchStatus = 'error';
        }

        return {
            id,
            rawQuery: line,
            title: finalTitle,
            type: finalType,
            status: parsed.status,
            coverUrl: finalCover,
            searchStatus,
            candidates
        };
    }));

    setImportRows(processedRows);
    setStep('review');
  };

  const handleRowChange = (id: string, field: keyof ImportRow, value: any) => {
    setImportRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleCandidateSelect = (id: string, index: number) => {
    setImportRows(prev => prev.map(row => {
        if (row.id !== id) return row;
        const candidate = row.candidates[index];
        return {
            ...row,
            title: candidate.title,
            type: candidate.type,
            coverUrl: candidate.coverUrl,
            searchStatus: 'success' // Mark as resolved/success visually once user manually picks
        };
    }));
  };

  const handleRemoveRow = (id: string) => {
    setImportRows(prev => prev.filter(row => row.id !== id));
  };

  const handleConfirmImport = () => {
    const itemsToImport: MediaItem[] = importRows.map(row => ({
      id: generateId(),
      title: row.title,
      type: row.type,
      status: row.status,
      coverUrl: row.coverUrl,
      rating: 0,
      progress: 0,
      tags: ['Imported'],
      description: 'Imported via Bulk Import.',
      notes: `Original Query: ${row.rawQuery}`,
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
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex items-center gap-3 mb-6">
             <div className="p-3 bg-osmanthus-600/20 rounded-lg text-osmanthus-400">
                 <Icons.Import className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-white">Bulk Import</h1>
                <p className="text-slate-400 text-sm">Paste titles. We'll try to find details automatically.</p>
             </div>
        </div>
        
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 p-1 flex flex-col shadow-inner">
          <textarea
            className="flex-1 w-full bg-transparent border-none p-4 text-slate-200 focus:outline-none font-mono resize-none placeholder:text-slate-600"
            placeholder="One Piece&#10;Frieren: Beyond Journey's End | Anime | Completed&#10;Naruto"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        
        <div className="mt-4 flex justify-between items-center">
           <p className="text-xs text-slate-500">
             Tip: You can still force type/status using "Title | Type | Status"
           </p>
           <button 
            onClick={handleProcess}
            disabled={!inputText.trim()}
            className="px-6 py-3 bg-osmanthus-600 hover:bg-osmanthus-500 text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg transition-all"
          >
            Process List <Icons.ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
      return (
          <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
              <Icons.Spinner className="w-12 h-12 text-osmanthus-500 animate-spin" />
              <h2 className="text-xl font-bold text-white">Searching Media...</h2>
              <p className="text-slate-400">Matching your titles against the database.</p>
          </div>
      );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
       <div className="flex justify-between items-center mb-6">
          <div>
             <h1 className="text-2xl font-bold text-white">Review Items</h1>
             <p className="text-slate-400 text-sm">We found {importRows.filter(r => r.searchStatus === 'success' || r.searchStatus === 'multiple').length} matches. Please review.</p>
          </div>
          <button onClick={() => setStep('input')} className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded hover:bg-slate-800 transition">Back</button>
       </div>

       <div className="flex-1 overflow-hidden rounded-lg border border-slate-700 flex flex-col bg-slate-900">
          <div className="grid grid-cols-12 gap-4 p-3 bg-slate-800 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wide sticky top-0 z-10">
              <div className="col-span-1 text-center">Cover</div>
              <div className="col-span-5 pl-2">Title & Match</div>
              <div className="col-span-3">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-center"></div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
            {importRows.map((row) => (
              <div key={row.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded transition border ${row.searchStatus === 'not_found' || row.searchStatus === 'error' ? 'bg-red-900/10 border-red-900/30' : (row.searchStatus === 'multiple' ? 'bg-yellow-900/10 border-yellow-900/30' : 'bg-slate-800/50 border-slate-800 hover:border-slate-600')}`}>
                 
                 {/* Cover */}
                 <div className="col-span-1 flex justify-center">
                    <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden shadow-sm border border-slate-700 flex-shrink-0 relative">
                        {row.coverUrl ? (
                            <img src={row.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Icons.Dashboard className="w-4 h-4 text-slate-600" />
                            </div>
                        )}
                        
                        {/* Status Indicator Icon on Cover */}
                         {row.searchStatus === 'multiple' && (
                             <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5 shadow-sm z-10">
                                <Icons.Menu className="w-2 h-2" />
                             </div>
                         )}
                    </div>
                 </div>

                 {/* Title & Match Selection */}
                 <div className="col-span-5 space-y-2">
                     <div className="flex items-center gap-2">
                         <input 
                           className="w-full bg-transparent border-b border-transparent focus:border-osmanthus-500 outline-none text-white text-sm font-medium placeholder:text-slate-600"
                           value={row.title}
                           onChange={(e) => handleRowChange(row.id, 'title', e.target.value)}
                           placeholder="Title"
                         />
                         
                         {/* Status Badges */}
                         {(row.searchStatus === 'not_found' || row.searchStatus === 'error') && (
                             <span className="text-[10px] font-bold text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30 whitespace-nowrap">
                                Not Found
                             </span>
                         )}
                         {row.searchStatus === 'success' && (
                             <span className="text-osmanthus-400" title="Match Found">
                                <Icons.Check className="w-4 h-4" />
                             </span>
                         )}
                         {row.searchStatus === 'multiple' && (
                             <span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-900/30 whitespace-nowrap">
                                Ambiguous
                             </span>
                         )}
                     </div>
                     
                     {/* Multiple Choice Dropdown */}
                     {row.candidates.length > 1 && (
                         <div className="relative">
                             <select 
                                className="w-full bg-slate-900/50 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-osmanthus-500 appearance-none cursor-pointer pr-6 hover:bg-slate-800"
                                onChange={(e) => handleCandidateSelect(row.id, parseInt(e.target.value))}
                                defaultValue={0} 
                             >
                                 {row.candidates.map((c, idx) => (
                                     <option key={idx} value={idx} className="bg-slate-800 text-slate-200">
                                         {c.title} ({c.type}) {c.year ? `- ${c.year}` : ''}
                                     </option>
                                 ))}
                             </select>
                             <Icons.Sort className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                         </div>
                     )}
                     
                     {/* Error Message */}
                     {(row.searchStatus === 'not_found' || row.searchStatus === 'error') && (
                         <div className="text-xs text-red-400/80 flex items-center gap-1">
                             <Icons.X className="w-3 h-3" />
                             No matches. Please enter details manually.
                         </div>
                     )}
                 </div>

                 {/* Type */}
                 <div className="col-span-3">
                     <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-osmanthus-500 outline-none"
                        value={row.type}
                        onChange={(e) => handleRowChange(row.id, 'type', e.target.value)}
                     >
                        {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>

                 {/* Status */}
                 <div className="col-span-2">
                     <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-osmanthus-500 outline-none"
                        value={row.status}
                        onChange={(e) => handleRowChange(row.id, 'status', e.target.value)}
                     >
                        {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                 </div>

                 {/* Remove */}
                 <div className="col-span-1 flex justify-center">
                     <button 
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition"
                        title="Remove Item"
                     >
                        <Icons.Trash className="w-4 h-4" />
                     </button>
                 </div>
              </div>
            ))}
          </div>
       </div>

       <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-400 mr-auto">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Not Found
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Ambiguous
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-osmanthus-500"></span> Resolved
                </div>
            </div>

           <button 
             onClick={handleConfirmImport}
             disabled={importRows.length === 0}
             className="px-8 py-3 bg-osmanthus-600 hover:bg-osmanthus-500 text-white rounded font-medium shadow-lg shadow-osmanthus-900/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Icons.Import className="w-4 h-4" />
             Import {importRows.length} Items
           </button>
       </div>
    </div>
  );
};
