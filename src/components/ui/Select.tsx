import React, { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: string[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className = '', label, options, placeholder, children, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 select-none">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 
            text-white text-sm appearance-none cursor-pointer
            focus:border-osmanthus-500 focus:outline-none transition-colors
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          {children}
        </select>
        {/* Custom Arrow Indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0L5 6L10 0H0Z" /></svg>
        </div>
      </div>
    </div>
  );
});