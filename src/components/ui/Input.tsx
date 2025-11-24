import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', label, icon, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-slate-900 border border-slate-700 rounded-lg 
            text-white text-sm placeholder:text-slate-600
            focus:border-osmanthus-500 focus:ring-1 focus:ring-osmanthus-500/50 focus:outline-none 
            transition-all font-sans
            ${icon ? 'pl-10 pr-4 py-2.5' : 'px-3 py-2'} 
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
});