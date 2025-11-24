import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { MediaItem, DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES } from '../types';
import { generateId, mockSearchMedia, MockSearchResult } from '../services/mediaService';
import { Icons } from '../components/Icons';

// UI Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface ImportRow {
  id: string;
  rawQuery: string;
  title: string;
  type: string;
  status: string;
  coverUrl: string;
  searchStatus: 'success' | 'multiple' | 'not_found' | 'error';
  candidates: MockSearchResult[];
}

export const Import: React.FC = () => {
  const { settings, importItems } = useDataStore();
  const { setView , addToast } = useUIStore();

  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  
  // New Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTypes = useMemo(() => [...DEFAULT_MEDIA_TYPES, ...settings.customTypes].sort(), [settings.customTypes]);
  const availableStatuses = useMemo(() => [...DEFAULT_MEDIA_STATUSES, ...settings.customStatuses], [settings.customStatuses]);

  const parseLine = (line: string): { title: string, type: string, status: string } => {
    if (line.includes('|')) {
        const parts = line.split('|').map(s => s.trim());
        return {
            title: parts[0] || 'Unknown',
            type: availableTypes.find(t => t.toLowerCase() === parts[1]?.toLowerCase()) || availableTypes[0],
            status: availableStatuses.find(s => s.toLowerCase() === parts[2]?.toLowerCase()) || availableStatuses[0]
        };
    }
    return { title: line.trim(), type: availableTypes[0], status: availableStatuses[0] };
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
            candidates = await mockSearchMedia(parsed.title);
            if (candidates.length === 0) {
                searchStatus = 'not_found';
            } else if (candidates.length === 1) {
                searchStatus = 'success';
                finalTitle = candidates[0].title;
                finalType = candidates[0].type;
                finalCover = candidates[0].coverUrl;
            } else {
                searchStatus = 'multiple';
                const match = candidates.find(c => c.type.toLowerCase() === parsed.type.toLowerCase());
                if (match) { finalTitle = match.title; finalType = match.type; finalCover = match.coverUrl; } 
                else { finalTitle = candidates[0].title; finalType = candidates[0].type; finalCover = candidates[0].coverUrl; }
            }
        } catch { searchStatus = 'error'; }

        return { id, rawQuery: line, title: finalTitle, type: finalType, status: parsed.status, coverUrl: finalCover, searchStatus, candidates };
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
        
        // Use the extra details if they exist!
        const extraData = candidate.details || {};

        return {
            ...row,
            title: candidate.title,
            type: candidate.type,
            coverUrl: candidate.coverUrl,
            status: candidate.status || row.status, // Auto-fill status if provider knows it
            searchStatus: 'success',
            // We will need to pass these extra fields to the final import somehow
            // For now, we rely on the fact that we have the Candidate object
        };
    }));
  };

  const handleRemoveRow = (id: string) => { setImportRows(prev => prev.filter(row => row.id !== id)); };

  const handleConfirmImport = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const itemsToImport: MediaItem[] = importRows.map(row => {
        // Find the selected candidate to get full details
        // If searchStatus is success/multiple, try to find the best match
        let detailedInfo: any = {};
        
        // If user selected a specific candidate (or we auto-selected the first one)
        if (row.candidates.length > 0) {
             // Logic: If title matches a candidate, use that candidate's details.
             // Simplified: Just use the first candidate if we auto-matched, 
             // or finding the one that matches the current title/cover
             const match = row.candidates.find(c => c.title === row.title) || row.candidates[0];
             if (match) {
                 detailedInfo = {
                     description: match.description,
                     author: match.author,
                     rating: match.details?.rating || 0,
                     total: match.details?.total,
                     sourceUrl: match.details?.sourceUrl
                 };
             }
        }

        return {
            id: generateId(),
            title: row.title,
            type: row.type,
            status: row.status,
            coverUrl: row.coverUrl,
            rating: detailedInfo.rating || 0,
            progress: 0,
            total: detailedInfo.total,
            author: detailedInfo.author,
            description: detailedInfo.description || 'Imported via Bulk Import.',
            tags: ['Imported'],
            notes: `Original Query: ${row.rawQuery}`,
            sourceUrl: detailedInfo.sourceUrl,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
      });
      
      await importItems(itemsToImport);
      // ... rest of function ...

      // Reset Form
      setInputText('');
      setImportRows([]);
      setStep('input');
      
      // Success Feedback & Navigation
            addToast({
        type: 'success',
        title: 'Import Complete',
        message: `Successfully added ${itemsToImport.length} items to your library.`
      });
      
      setView('library');

    } catch (error) {
      console.error("Import failed:", error);
      // --- REPLACE ALERT ---
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: 'Check the console for technical details.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'input') {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex-shrink-0 flex items-center gap-3 mb-6">
             <div className="p-3 bg-osmanthus-600/20 rounded-lg text-osmanthus-400"><Icons.Import className="w-6 h-6" /></div>
             <div><h1 className="text-2xl font-bold text-white">Bulk Import</h1><p className="text-slate-400 text-sm">Paste titles. We'll try to find details automatically.</p></div>
        </div>
        
        {/* FIX: Ensure container shrinks properly with min-h-0 */}
        <div className="flex-1 min-h-0 bg-slate-800 rounded-lg border border-slate-700 p-1 flex flex-col shadow-inner overflow-hidden">
          <textarea 
            className="w-full h-full bg-transparent border-none p-4 text-slate-200 focus:outline-none font-mono resize-none placeholder:text-slate-600 overflow-y-auto" 
            placeholder="One Piece&#10;Frieren: Beyond Journey's End | Anime | Completed&#10;Naruto" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
          />
        </div>
        
        <div className="mt-4 flex-shrink-0 flex justify-between items-center">
           <p className="text-xs text-slate-500">Tip: You can still force type/status using "Title | Type | Status"</p>
           <Button onClick={handleProcess} disabled={!inputText.trim()} className="flex items-center">
             Process List <Icons.ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
           </Button>
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
          <div><h1 className="text-2xl font-bold text-white">Review Items</h1><p className="text-slate-400 text-sm">We found {importRows.filter(r => r.searchStatus === 'success' || r.searchStatus === 'multiple').length} matches. Please review.</p></div>
          <Button variant="secondary" onClick={() => setStep('input')} disabled={isSubmitting}>Back</Button>
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
                 <div className="col-span-1 flex justify-center">
                    <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden shadow-sm border border-slate-700 flex-shrink-0 relative">
                        {row.coverUrl ? (<img src={row.coverUrl} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><Icons.Dashboard className="w-4 h-4 text-slate-600" /></div>)}
                         {row.searchStatus === 'multiple' && (<div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full p-0.5 shadow-sm z-10"><Icons.Menu className="w-2 h-2" /></div>)}
                    </div>
                 </div>
                 <div className="col-span-5 space-y-2">
                     <div className="flex items-center gap-2">
                         <Input className="!bg-slate-900/50" value={row.title} onChange={(e) => handleRowChange(row.id, 'title', e.target.value)} placeholder="Title" />
                         {(row.searchStatus === 'not_found' || row.searchStatus === 'error') && (<span className="text-[10px] font-bold text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30 whitespace-nowrap">Not Found</span>)}
                         {row.searchStatus === 'success' && (<span className="text-osmanthus-400" title="Match Found"><Icons.Check className="w-4 h-4" /></span>)}
                         {row.searchStatus === 'multiple' && (<span className="text-[10px] font-bold text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-900/30 whitespace-nowrap">Ambiguous</span>)}
                     </div>
                     {row.candidates.length > 1 && (
                        <Select 
                            options={[]} 
                            className="!py-1 !text-xs"
                            onChange={(e) => handleCandidateSelect(row.id, parseInt(e.target.value))} defaultValue={0}
                        >
                             {row.candidates.map((c, idx) => (<option key={idx} value={idx}>{c.title} ({c.type}) {c.year ? `- ${c.year}` : ''}</option>))}
                        </Select>
                     )}
                     {(row.searchStatus === 'not_found' || row.searchStatus === 'error') && (<div className="text-xs text-red-400/80 flex items-center gap-1"><Icons.X className="w-3 h-3" /> No matches. Please enter details manually.</div>)}
                 </div>
                 <div className="col-span-3">
                     <Select options={availableTypes} value={row.type} onChange={(e) => handleRowChange(row.id, 'type', e.target.value)} />
                 </div>
                 <div className="col-span-2">
                     <Select options={availableStatuses} value={row.status} onChange={(e) => handleRowChange(row.id, 'status', e.target.value)} />
                 </div>
                 <div className="col-span-1 flex justify-center">
                     <Button size="icon" variant="ghost" onClick={() => handleRemoveRow(row.id)} className="text-slate-500 hover:text-red-400 hover:bg-red-900/20"><Icons.Trash className="w-4 h-4" /></Button>
                 </div>
              </div>
            ))}
          </div>
       </div>

       	   <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-400 mr-auto">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Not Found</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Ambiguous</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-osmanthus-500"></span> Resolved</div>
            </div>
           <Button 
             onClick={handleConfirmImport} 
             disabled={importRows.length === 0 || isSubmitting} 
             isLoading={isSubmitting}
             className="flex items-center gap-2"
            >
             {/* Conditionally render Icon only if NOT loading */}
             {!isSubmitting && <Icons.Import className="w-4 h-4" />} 
             {isSubmitting ? 'Importing...' : `Import ${importRows.length} Items`}
           </Button>
       </div>
    </div>
  );
};