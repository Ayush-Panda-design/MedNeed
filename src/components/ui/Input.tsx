'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export function Input({
  leftIcon,
  rightIcon,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none shrink-0">
            {leftIcon}
          </div>
        )}
        <input
          className={`w-full py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition duration-150 ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'} ${
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-rose-600 text-[11px] mt-1 pl-1">{error}</p>}
    </div>
  );
}
