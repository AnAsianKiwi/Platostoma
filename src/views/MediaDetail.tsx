import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { Icons } from '../components/Icons';
import { DEFAULT_MEDIA_TYPES, DEFAULT_MEDIA_STATUSES, MediaItem } from '../types';

// UI Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';

export const MediaDetail: React.FC = () => {
  const { library, settings, addItem, updateItem, deleteItem } = useDataStore();
  const { activeMediaId, tempNewItem, closeDetail, triggerSaveAnimation, setView, addToast } = useUIStore(); // <--- Get addToast

  const itemToEdit = tempNewItem || library.find(i => i.id === activeMediaId);
  const isNewEntry = !!tempNewItem;

  const availableTypes = useMemo(() => [...DEFAULT_MEDIA_TYPES, ...settings.customTypes].sort(), [settings.customTypes]);
  const availableStatuses = useMemo(() => [...DEFAULT_MEDIA_STATUSES, ...settings.customStatuses], [settings.customStatuses]);

  const [formData, setFormData] = useState<MediaItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setFormData(itemToEdit);
      setIsEditing(isNewEntry);
    }
  }, [itemToEdit, isNewEntry]);

  if (!formData || !itemToEdit) return null;

  const handleChange = (field: keyof MediaItem, value: any) => setFormData(prev => prev ? ({ ...prev, [field]: value }) : null);
  
  const handleTagsChange = (value: string) => { 
    const tags = value.split(',').map(t => t.trim()).filter(t => t !== ''); 
    handleChange('tags', tags);
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!formData) return;
    const finalItem = { ...formData, updatedAt: new Date().toISOString() };
    
    if (isNewEntry) { 
        await addItem(finalItem); 
        setView('library'); 
    } else { 
        await updateItem(finalItem); 
    }
    
    triggerSaveAnimation(finalItem.id);
    // --- TOAST ---
    addToast({ type: 'success', message: isNewEntry ? 'Item added to library' : 'Changes saved successfully' });
    closeDetail();
  };

  const handleCancel = () => { isNewEntry ? closeDetail() : (setFormData(itemToEdit), setIsEditing(false)); };

  const handleFavoriteToggle = async () => { 
    if (!formData) return;
    const newItem = { ...formData, favorite: !formData.favorite }; 
    setFormData(newItem); 
    await updateItem(newItem);
    triggerSaveAnimation(newItem.id);
    // --- TOAST ---
    addToast({ 
        type: 'success', 
        message: newItem.favorite ? 'Added to favorites' : 'Removed from favorites',
        duration: 2000 
    });
  };

  const handleDeleteClick = async () => { 
    if (confirmDelete && formData) { 
        if (!isNewEntry) await deleteItem(formData.id); 
        // --- TOAST ---
        addToast({ type: 'info', message: 'Item deleted from library' });
        closeDetail(); 
    } else { 
        setConfirmDelete(true); 
        setTimeout(() => setConfirmDelete(false), 3000); 
    } 
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const file = e.target.files?.[0]; 
    if (file) { 
        const reader = new FileReader(); 
        reader.onloadend = () => { if (typeof reader.result === 'string') handleChange('coverUrl', reader.result); }; 
        reader.readAsDataURL(file); 
    } 
  };

  // ... (Render remains exactly the same as before) ...
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={isEditing ? undefined : closeDetail} />
      
      {isImageZoomed && (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-8 cursor-zoom-out animate-in fade-in duration-200" onClick={() => setIsImageZoomed(false)}>
            <img src={formData.coverUrl} alt={formData.title} className="max-h-full max-w-full object-contain shadow-2xl" />
        </div>
      )}

      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-full h-auto animate-in zoom-in-95 duration-200 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex-shrink-0 select-none">
          <div className="flex items-center gap-3 pointer-events-none">
             <h2 className="text-xl font-bold text-white font-sans">{isNewEntry ? 'Add Media' : (isEditing ? 'Edit Details' : 'Details')}</h2>
             {!isEditing && <Badge label={formData.status} />}
          </div>
          <div className="flex items-center gap-2">
             {!isEditing ? (
                <>
                   <Button size="icon" variant="ghost" onClick={handleFavoriteToggle} className={formData.favorite ? 'text-red-500' : ''}><Icons.Star className={`w-5 h-5 ${formData.favorite ? 'fill-current' : ''}`} /></Button>
                   <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}><Icons.Edit className="w-4 h-4" /> Edit</Button>
                </>
             ) : (
               <Button size="sm" variant={isNewEntry ? "secondary" : "ghost"} onClick={handleCancel}>Cancel</Button>
             )}
             {!isNewEntry && <Button size="icon" variant="ghost" onClick={closeDetail}><Icons.X className="w-5 h-5" /></Button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 [scrollbar-gutter:stable]">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Column (Image) */}
             <div className="lg:col-span-1 flex flex-col gap-4">
               <div className={`aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 relative group flex items-center justify-center flex-shrink-0 ${isEditing ? 'cursor-pointer hover:border-osmanthus-500' : ''}`} onClick={isEditing ? () => fileInputRef.current?.click() : () => formData.coverUrl && setIsImageZoomed(true)}>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 {formData.coverUrl ? (
                   <>
                      <img src={formData.coverUrl} alt={formData.title} className={`w-full h-full object-cover select-none will-change-transform ${!isEditing ? 'cursor-zoom-in hover:scale-105 transition-transform duration-500' : ''}`} />
                      {isEditing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="bg-osmanthus-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"><Icons.Import className="w-4 h-4" /> Change Image</div></div>}
                   </>
                 ) : (
                   <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center relative bg-slate-950 select-none">
                      {isEditing ? <div className="bg-osmanthus-600/20 text-osmanthus-400 border border-osmanthus-500/50 px-4 py-3 rounded-lg flex flex-col items-center"><Icons.Import className="w-8 h-8 mb-2" /><span className="font-bold text-sm uppercase tracking-wide">Click to Upload</span></div> : <div className="flex flex-col items-center opacity-40"><Icons.Dashboard className="w-16 h-16 mb-2" /><span className="font-bold text-xs uppercase tracking-widest border-2 border-slate-600 border-dashed p-2 rounded">No Image</span></div>}
                   </div>
                 )}
                 {!isEditing && formData.sourceUrl && ( <div className="absolute bottom-3 right-3 select-none" onClick={e => e.stopPropagation()}><a href={formData.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur hover:bg-osmanthus-600 text-white rounded-lg text-xs font-medium transition-all border border-white/10"><Icons.ExternalLink className="w-3 h-3" /> Open Source</a></div> )}
               </div>
               
               {isEditing && (
                 <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700 flex-shrink-0">
                   <Input label="Cover Image URL" value={formData.coverUrl || ''} onChange={(e) => handleChange('coverUrl', e.target.value)} placeholder="http://... or upload" icon={<Icons.Link className="w-3.5 h-3.5" />} />
                   <Input label="Source URL" value={formData.sourceUrl || ''} onChange={(e) => handleChange('sourceUrl', e.target.value)} placeholder="https://..." icon={<Icons.ExternalLink className="w-3.5 h-3.5" />} />
                 </div>
               )}
               {!isEditing && (
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-800"><span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Format</span><span className="text-sm font-medium text-white">{formData.type}</span></div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-800"><span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Added</span><span className="text-sm text-slate-300 font-mono">{new Date(formData.addedAt).toLocaleDateString()}</span></div>
                 </div>
               )}
             </div>

             {/* Right Column (Details) */}
             <div className="lg:col-span-2 flex flex-col">
               {!isEditing ? (
                 <div className="flex flex-col animate-in fade-in duration-300 select-text">
                    <div className="border-b border-slate-800 pb-4 mb-4">
                       <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">{formData.title}</h1>
                       {(formData.originalTitle || formData.author) && (
                         <div className="text-sm text-slate-400 font-medium flex flex-wrap gap-2 items-center">
                           {formData.author && <span className="text-osmanthus-400">{formData.author}</span>}
                           {formData.author && formData.originalTitle && <span className="text-slate-600">•</span>}
                           {formData.originalTitle && <span className="italic opacity-80">{formData.originalTitle}</span>}
                         </div>
                       )}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 select-none"><Icons.StickyNote className="w-3 h-3" /> Synopsis</h3>
                      <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap text-lg shadow-inner select-text">{formData.description || <span className="text-slate-600 italic">No description provided.</span>}</div>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 select-none"><Icons.Hash className="w-3 h-3" /> Tags</h3>
                        <div className="flex flex-wrap gap-2">{formData.tags.map(tag => <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full border border-slate-700">{tag}</span>)}</div>
                      </div>
                    )}
                    <div className="mt-6 space-y-6">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                           <div className="flex-1 min-w-[200px]">
                               <div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-slate-500 uppercase select-none">Progress</span><span className="text-sm font-mono text-white font-bold">{formData.progress} <span className="text-slate-600">/ {formData.total || '?'}</span></span></div>
                                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-osmanthus-500 shadow-[0_0_10px_rgba(78,153,86,0.5)]" style={{ width: `${formData.total ? Math.min(((formData.progress || 0) / formData.total) * 100, 100) : 0}%` }} /></div>
                           </div>
                           <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>
                           <div className="flex items-center gap-4">
                              <div className="text-right"><span className="block text-[10px] font-bold text-slate-500 uppercase select-none">User Rating</span><span className="text-xs text-slate-600 select-none">out of 10</span></div>
                              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700"><Icons.Star className={`w-5 h-5 ${formData.rating > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} /><span className={`text-lg font-bold ${formData.rating > 0 ? 'text-white' : 'text-slate-600'}`}>{formData.rating > 0 ? formData.rating : '-'}</span></div>
                           </div>
                        </div>
                        {formData.notes && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 select-none"><Icons.Edit className="w-3 h-3" /> Notes</h3>
                            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-amber-200/80 text-lg whitespace-pre-wrap select-text">{formData.notes}</div>
                          </div>
                        )}
                    </div>
                 </div>
               ) : (
                 <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in duration-300 h-full">
                       <div className="flex-shrink-0">
                           <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Title</label>
                           <input className="w-full bg-transparent border-b-2 border-slate-700 px-0 py-2 text-white text-xl font-bold focus:border-osmanthus-500 outline-none transition-colors placeholder:text-slate-700 font-sans" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Enter title..." />
                       </div>
                       
                       <div className="flex-shrink-0 grid grid-cols-2 gap-4">
                          <Input label="Author / Artist" value={formData.author || ''} onChange={(e) => handleChange('author', e.target.value)} />
                          <Input label="Original Title" value={formData.originalTitle || ''} onChange={(e) => handleChange('originalTitle', e.target.value)} />
                       </div>
                       
                       <Textarea label="Synopsis" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} placeholder="Synopsis..." minHeight="80px" />
                       <Input label="Tags" value={formData.tags.join(', ')} onChange={(e) => handleTagsChange(e.target.value)} placeholder="Fantasy, Action..." />
                       
                       <div className="flex-shrink-0 grid grid-cols-4 gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                          <Select label="Type" options={availableTypes} placeholder="-" value={formData.type} onChange={(e) => handleChange('type', e.target.value)} />
                          <Select label="Status" options={availableStatuses} placeholder="-" value={formData.status} onChange={(e) => handleChange('status', e.target.value)} />
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">Progress</label>
                            <div className="flex items-center gap-1">
                                <Input type="number" className="!px-2 !py-1.5" value={formData.progress} onChange={(e) => handleChange('progress', parseInt(e.target.value) || 0)} />
                                <span className="text-slate-500 select-none">/</span>
                                <Input type="number" className="!px-2 !py-1.5" value={formData.total || ''} placeholder="?" onChange={(e) => handleChange('total', e.target.value ? parseInt(e.target.value) : undefined)} />
                            </div>
                          </div>
                          
                          <Input type="number" label="Rating" min={0} max={10} step={0.1} className="font-bold" value={formData.rating} onChange={(e) => handleChange('rating', parseFloat(e.target.value) || 0)} />
                       </div>
                       
                       <Textarea label="Notes" value={formData.notes || ''} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Private notes..." minHeight="40px" />
                       
                       <div className="mt-auto flex-shrink-0 pt-4 border-t border-slate-800 flex items-center justify-between select-none">
                          {!isNewEntry ? ( 
                              <Button type="button" variant={confirmDelete ? "danger" : "ghost"} onClick={handleDeleteClick} className={confirmDelete ? "" : "text-red-400 hover:text-red-300 hover:bg-red-900/20"}>
                                  <Icons.Trash className="w-4 h-4" /> {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                              </Button> 
                          ) : ( <div></div> )}
                          <Button type="submit" variant="primary">
                              <Icons.Save className="w-4 h-4" /> {isNewEntry ? "Done" : "Save Changes"}
                          </Button>
                       </div>
                 </form>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};