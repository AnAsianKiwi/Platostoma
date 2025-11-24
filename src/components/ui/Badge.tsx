import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', className = '' }) => {
  const getColor = (text: string) => {
    switch(text) {
      case 'In Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Planning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Dropped': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Paused': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      // Types
      case 'Anime': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'Manga': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      default: return 'text-osmanthus-400 bg-osmanthus-400/10 border-osmanthus-400/20';
    }
  };

  const colors = getColor(label);

  return (
    <span className={`
      px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
      ${variant === 'outline' ? 'bg-transparent border-slate-600 text-slate-400' : colors}
      ${className}
    `}>
      {label}
    </span>
  );
};