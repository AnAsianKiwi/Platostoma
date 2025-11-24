import React, { useRef, useLayoutEffect } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  minHeight?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ value, onChange, className = '', label, minHeight = "80px", ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, parseInt(minHeight))}px`;
    }
  }, [value, minHeight]);

  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-500 mb-1 uppercase select-none">{label}</label>}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        style={{ minHeight }}
        className={`
          w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 
          text-white text-base leading-relaxed placeholder:text-slate-600
          focus:border-osmanthus-500 focus:outline-none resize-none overflow-hidden
          transition-colors font-sans
          ${className}
        `}
        {...props}
      />
    </div>
  );
};