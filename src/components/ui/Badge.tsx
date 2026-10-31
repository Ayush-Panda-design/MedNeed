'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'rx' | 'otc' | 'discount' | 'express' | 'nabl' | 'neutral' | 'amber';
  size?: 'sm' | 'md';
  pulsing?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  pulsing = false,
  className = '',
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[9px] px-2 py-0.5 rounded-full',
    md: 'text-[11px] px-2.5 py-1 rounded-full',
  };

  const variantStyles = {
    rx: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
    otc: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
    discount: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold shadow-soft-sm',
    express: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold',
    nabl: 'bg-teal-50 text-teal-800 border border-teal-200 font-bold',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {pulsing && <span className="w-2 h-2 rounded-full bg-emerald-500 pulsing-dot shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
