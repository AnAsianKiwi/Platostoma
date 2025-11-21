
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { MediaItem } from '../types';
import { Icons } from '../components/Icons';

interface MediaDetailsProps {
  item: MediaItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  availableTypes: string[];
  availableStatuses: string[];
  initialPosition: { x: number, y: number };
  onPositionSave: (pos: { x: number, y: number }) => void;
  startInEditMode?: boolean;
  isNewEntry?: boolean;
}

// Helper component for auto-resizing textareas
const AutoResizeTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  minHeight = "50px" 
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, parseInt(minHeight))}px`;
    }
  }, [value, minHeight]);

  return (
    <textarea
      ref={textareaRef}
      className={`${className} resize-y overflow-hidden font-sans select-text`}
      style={{ minHeight }}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export const MediaDetail: React.FC<MediaDetailsProps> = ({ 
  item, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  availableTypes, 
  availableStatuses,
  initialPosition,
  onPositionSave,
  startInEditMode = false,
  isNewEntry = false
}) => {
  const [formData, setFormData] = useState<MediaItem>(item);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(startInEditMode);
  
  // Refs for drag and DOM access
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when item changes
  useEffect(() => {
    setFormData(item);
    setConfirmDelete(false);
    setIsEditing(startInEditMode);
  }, [item, startInEditMode]);

  // Initialize position
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.style.left = `${initialPosition.x}px`;
      modalRef.current.style.top = `${initialPosition.y}px`;
    }
  }, [isOpen, initialPosition]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    const modal = modalRef.current;
    if (!modal) return;

    // Prevent selection
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
    
    // Calculate the mouse offset relative to the modal's top-left corner
    const rect = modal.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Remove any transitions to make drag instant
    modal.style.transition = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();

        // Calculate new position directly
        let newX = moveEvent.clientX - offsetX;
        let newY = moveEvent.clientY - offsetY;

        // Clamp to window edges strictly
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const maxX = winW - rect.width;
        const maxY = winH - rect.height;

        // Ensure it touches the very edge but doesn't go out
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        // Apply directly to DOM for instant response
        modal.style.left = `${newX}px`;
        modal.style.top = `${newY}px`;
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        modal.style.transition = '';

        // Save final position
        const finalRect = modal.getBoundingClientRect();
        onPositionSave({ x: finalRect.left, y: finalRect.top });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleChange = (field: keyof MediaItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(t => t.trim()).filter(t => t !== '');
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, updatedAt: new Date().toISOString() });
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isNewEntry) {
      onDelete(item.id);
    } else {
      setFormData(item);
      setIsEditing(false);
    }
  };

  const handleFavoriteToggle = () => {
    const newItem = { ...formData, favorite: !formData.favorite };
    setFormData(newItem);
    onSave(newItem);
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(item.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleChange('coverUrl', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Planning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Dropped': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Paused': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-osmanthus-400 bg-osmanthus-400/10 border-osmanthus-400/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" 
        onClick={isEditing ? undefined : onClose} 
      />
      
      <div 
        ref={modalRef}
        className="absolute w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] h-auto animate-in zoom-in-95 duration-200 pointer-events-auto select-text"
      >
        
        {/* Header - Draggable */}
        <div 
           onMouseDown={handleDragStart}
           className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex-shrink-0 cursor-move active:cursor-move select-none"
        >
          <div className="flex items-center gap-3 pointer-events-none">
             <h2 className="text-xl font-bold text-white font-sans">
                {isNewEntry ? 'Add New Media' : (isEditing ? 'Edit Details' : 'Details')}
             </h2>
             {!isEditing && (
               <span className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider border ${getStatusColor(item.status)}`}>
                 {item.status}
               </span>
             )}
          </div>
          
          <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
             {!isEditing ? (
                <>
                   <button 
                     onClick={handleFavoriteToggle}
                     className={`p-2 rounded-lg hover:bg-slate-800 transition-colors ${formData.favorite ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                     title="Toggle Favorite"
                   >
                     <Icons.Star className={`w-5 h-5 ${formData.favorite ? 'fill-current' : ''}`} />
                   </button>
                   <button 
                     onClick={() => setIsEditing(true)} 
                     className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm transition-colors border border-slate-700"
                   >
                     <Icons.Edit className="w-4 h-4" /> Edit
                   </button>
                </>
             ) : (
               <button 
                  onClick={handleCancel} 
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isNewEntry 
                      ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>
             )}
             
             {!isNewEntry && (
               <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                 <Icons.X className="w-5 h-5" />
               </button>
             )}
          </div>
        </div>

        {/* Main Content - Use auto overflow so scrollbar only shows when needed, plus stable gutter to prevent layout shift */}
        <div 
            className="flex-1 overflow-y-auto p-6 relative [scrollbar-gutter:stable]" 
            onMouseDown={e => e.stopPropagation()}
        >
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Left Column: Image */}
             <div className="lg:col-span-1 flex flex-col gap-4">
               <div 
                 className={`aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 relative group flex items-center justify-center flex-shrink-0 ${isEditing ? 'cursor-pointer hover:border-osmanthus-500' : ''}`}
                 onClick={isEditing ? triggerFileInput : undefined}
               >
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   className="hidden"
                   accept="image/*"
                   onChange={handleImageUpload}
                 />
                 
                 {formData.coverUrl ? (
                   <>
                      <img src={formData.coverUrl} alt={formData.title} className="w-full h-full object-cover select-none pointer-events-none" />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="bg-osmanthus-600 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                             <Icons.Import className="w-4 h-4" /> Change Image
                           </div>
                        </div>
                      )}
                   </>
                 ) : (
                   <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center relative bg-slate-950 select-none">
                      {isEditing ? (
                         <div className="bg-osmanthus-600/20 text-osmanthus-400 border border-osmanthus-500/50 px-4 py-3 rounded-lg flex flex-col items-center">
                           <Icons.Import className="w-8 h-8 mb-2" />
                           <span className="font-bold text-sm uppercase tracking-wide">Click to Upload</span>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center opacity-40">
                           <Icons.Dashboard className="w-16 h-16 mb-2" />
                           <span className="font-bold text-xs uppercase tracking-widest border-2 border-slate-600 border-dashed p-2 rounded">No Image</span>
                         </div>
                      )}
                   </div>
                 )}
                 
                 {!isEditing && formData.sourceUrl && (
                    <div className="absolute bottom-3 right-3 select-none">
                      <a 
                        href={formData.sourceUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur hover:bg-osmanthus-600 text-white rounded-lg text-xs font-medium transition-all border border-white/10"
                      >
                         <Icons.ExternalLink className="w-3 h-3" /> Open Source
                      </a>
                    </div>
                 )}
               </div>
               
               {isEditing && (
                 <div className="space-y-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700 flex-shrink-0">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase flex items-center gap-2">
                        <Icons.Link className="w-3.5 h-3.5" /> Cover Image URL
                      </label>
                      <input 
                          type="text" 
                          value={formData.coverUrl}
                          onChange={(e) => handleChange('coverUrl', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-osmanthus-500 outline-none transition-colors font-sans"
                          placeholder="http://... or upload above"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase flex items-center gap-2">
                        <Icons.ExternalLink className="w-3.5 h-3.5" /> Tracking / Source URL
                      </label>
                      <input 
                          type="text" 
                          placeholder="https://..."
                          value={formData.sourceUrl || ''}
                          onChange={(e) => handleChange('sourceUrl', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-osmanthus-500 outline-none transition-colors font-sans"
                      />
                   </div>
                 </div>
               )}

               {!isEditing && (
                 <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                       <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Format</span>
                       <span className="text-sm font-medium text-white">{formData.type}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-800">
                       <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Added</span>
                       <span className="text-sm text-slate-300 font-mono">{new Date(formData.addedAt).toLocaleDateString()}</span>
                    </div>
                 </div>
               )}
             </div>

             {/* Right Column: Details */}
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
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 select-none">
                        <Icons.StickyNote className="w-3 h-3" /> Synopsis
                      </h3>
                      <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap text-lg shadow-inner select-text">
                         {formData.description || <span className="text-slate-600 italic">No description provided.</span>}
                      </div>
                    </div>

                    {formData.tags && formData.tags.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 select-none">
                          <Icons.Hash className="w-3 h-3" /> Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full border border-slate-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 space-y-6">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                           <div className="flex-1 min-w-[200px]">
                               <div className="flex justify-between items-end mb-2">
                                   <span className="text-xs font-bold text-slate-500 uppercase select-none">Progress</span>
                                   <span className="text-sm font-mono text-white font-bold">
                                     {formData.progress} <span className="text-slate-600">/ {formData.total || '?'}</span>
                                   </span>
                                </div>
                                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-osmanthus-500 shadow-[0_0_10px_rgba(78,153,86,0.5)]"
                                    style={{ width: `${formData.total ? Math.min((formData.progress / formData.total) * 100, 100) : 0}%` }}
                                  />
                                </div>
                           </div>
                           
                           <div className="h-8 w-px bg-slate-700 hidden sm:block"></div>

                           <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase select-none">User Rating</span>
                                <span className="text-xs text-slate-600 select-none">out of 10</span>
                              </div>
                              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                                 <Icons.Star className={`w-5 h-5 ${formData.rating > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                                 <span className={`text-lg font-bold ${formData.rating > 0 ? 'text-white' : 'text-slate-600'}`}>
                                   {formData.rating > 0 ? formData.rating : '-'}
                                 </span>
                              </div>
                           </div>
                        </div>
                        
                        {formData.notes && (
                          <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2 select-none">
                              <Icons.Edit className="w-3 h-3" /> Notes
                            </h3>
                            <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-amber-200/80 text-lg whitespace-pre-wrap select-text">
                               {formData.notes}
                            </div>
                          </div>
                        )}
                    </div>
                 </div>
               ) : (
                 <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in duration-300 h-full">
                       <div className="flex-shrink-0">
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Title</label>
                          <input 
                            className="w-full bg-transparent border-b-2 border-slate-700 px-0 py-2 text-white text-xl font-bold focus:border-osmanthus-500 outline-none transition-colors placeholder:text-slate-700 font-sans"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Enter title..."
                          />
                       </div>

                       <div className="flex-shrink-0 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Author / Artist</label>
                            <input 
                              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-osmanthus-500 outline-none transition-colors font-sans"
                              value={formData.author || ''}
                              onChange={(e) => handleChange('author', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Original Title</label>
                            <input 
                              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-osmanthus-500 outline-none transition-colors font-sans"
                              value={formData.originalTitle || ''}
                              onChange={(e) => handleChange('originalTitle', e.target.value)}
                            />
                          </div>
                       </div>

                       <div className="flex-shrink-0">
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Synopsis</label>
                          <AutoResizeTextarea 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-base focus:border-osmanthus-500 outline-none leading-relaxed font-sans"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Synopsis..."
                            minHeight="80px"
                          />
                       </div>

                       <div className="flex-shrink-0">
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Tags</label>
                          <input 
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-osmanthus-500 outline-none font-sans"
                            value={formData.tags.join(', ')}
                            onChange={(e) => handleTagsChange(e.target.value)}
                            placeholder="Fantasy, Action..."
                          />
                       </div>

                       <div className="flex-shrink-0 grid grid-cols-4 gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">Type</label>
                            <select 
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm focus:border-osmanthus-500 outline-none appearance-none font-sans"
                              value={formData.type}
                              onChange={(e) => handleChange('type', e.target.value)}
                            >
                              <option value="">-</option>
                              {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">Status</label>
                            <select 
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm focus:border-osmanthus-500 outline-none appearance-none font-sans"
                              value={formData.status}
                              onChange={(e) => handleChange('status', e.target.value)}
                            >
                              <option value="">-</option>
                              {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">Progress</label>
                            <div className="flex items-center gap-1">
                               <input 
                                type="number"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm focus:border-osmanthus-500 outline-none font-sans"
                                value={formData.progress}
                                onChange={(e) => handleChange('progress', parseInt(e.target.value) || 0)}
                              />
                              <span className="text-slate-500 select-none">/</span>
                              <input 
                                type="number"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm focus:border-osmanthus-500 outline-none font-sans"
                                value={formData.total || ''}
                                placeholder="?"
                                onChange={(e) => handleChange('total', e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1 select-none">Rating <Icons.Star className="w-3 h-3 text-yellow-500" /></label>
                            <input 
                              type="number"
                              min="0" max="10" step="0.1"
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm font-bold focus:border-osmanthus-500 outline-none font-sans"
                              value={formData.rating}
                              onChange={(e) => handleChange('rating', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                       </div>

                       <div className="flex-shrink-0">
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">Notes</label>
                          <AutoResizeTextarea 
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-base focus:border-osmanthus-500 outline-none font-sans"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Private notes..."
                            minHeight="40px"
                          />
                       </div>

                       <div className="mt-auto flex-shrink-0 pt-4 border-t border-slate-800 flex items-center justify-between select-none">
                          {!isNewEntry ? (
                            <button 
                                type="button"
                                onClick={handleDeleteClick}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                                confirmDelete 
                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                                    : 'bg-transparent text-red-400 border-red-900/50 hover:bg-red-900/20'
                                }`}
                            >
                                <Icons.Trash className="w-4 h-4" />
                                {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                            </button>
                          ) : (
                              <div></div> 
                          )}

                          <button 
                            type="submit"
                            className="flex items-center gap-2 px-8 py-2.5 bg-osmanthus-600 hover:bg-osmanthus-500 text-white rounded-lg font-bold shadow-lg shadow-osmanthus-900/20 transition-all"
                          >
                            <Icons.Save className="w-4 h-4" />
                            Save Changes
                          </button>
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
