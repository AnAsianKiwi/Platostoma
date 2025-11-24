import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

// Simple SVG Spinner
const Spinner = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children, 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";
  
  const variants = {
    primary: "bg-osmanthus-600 hover:bg-osmanthus-500 text-white shadow-lg shadow-osmanthus-900/20 border border-transparent",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-sm",
    danger: "bg-red-600 hover:bg-red-500 text-white border border-transparent shadow-sm",
    outline: "bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-3 gap-2",
    icon: "p-2"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner className="w-4 h-4 mr-2" /> : null}
      {children}
    </button>
  );
};