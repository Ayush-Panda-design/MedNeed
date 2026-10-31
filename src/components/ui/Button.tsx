'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'coral' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-xs sm:text-sm px-4 sm:px-5 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 min-h-[48px]',
  };

  const variantStyles = {
    primary: 'btn-primary-gradient text-white shadow-soft',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white shadow-soft hover:shadow-soft-lg',
    coral: 'btn-coral-gradient text-white shadow-soft',
    outline: 'bg-white hover:bg-emerald-50/50 text-brand-800 border border-brand-200 hover:border-brand-500 shadow-soft-sm',
    ghost: 'bg-transparent hover:bg-emerald-50 text-brand-800',
    glass: 'glass-panel hover:bg-white text-slate-900 border border-white/60 shadow-soft-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
