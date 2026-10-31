'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'glass' | 'tinted' | 'dark';
  hoverEffect?: boolean;
}

export function Card({
  children,
  variant = 'white',
  hoverEffect = true,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition duration-200';

  const variantStyles = {
    white: 'bg-white border border-slate-200/90 shadow-soft',
    glass: 'glass-card',
    tinted: 'bg-emerald-50/60 border border-emerald-200/70 shadow-soft-sm',
    dark: 'glass-card-dark text-white',
  };

  const hoverStyle = hoverEffect ? 'card-hover-lift' : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
