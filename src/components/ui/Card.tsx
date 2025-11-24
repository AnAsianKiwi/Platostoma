import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  noPadding = false,
  ...props 
}) => {
  return (
    <div 
      className={`
        bg-slate-800 rounded-xl border border-slate-700 shadow-sm
        ${noPadding ? '' : 'p-4'}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};