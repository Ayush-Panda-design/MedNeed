'use client';

import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'mint' | 'white' | 'cream' | 'dark';
  withPattern?: boolean;
}

export function Section({
  children,
  variant = 'white',
  withPattern = false,
  className = '',
  ...props
}: SectionProps) {
  const variantStyles = {
    white: 'bg-white text-slate-900 border-b border-slate-100',
    mint: 'bg-gradient-to-b from-emerald-50/70 via-mint-50/40 to-white text-slate-900 border-b border-emerald-100/60',
    cream: 'bg-[#faf8f5] text-slate-900 border-b border-amber-100/40',
    dark: 'bg-gradient-to-br from-[#0B1F17] via-[#0F5132] to-[#062015] text-white',
  };

  const patternStyle = withPattern ? 'bg-pattern-cross' : '';

  return (
    <section
      className={`w-full py-12 sm:py-16 ${variantStyles[variant]} ${patternStyle} ${className}`}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
