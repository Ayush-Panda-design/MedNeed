'use client';

import React from 'react';

export type FilterType = 'all' | 'active' | 'delivered' | 'cancelled';

interface FilterCounts {
  all: number;
  active: number;
  delivered: number;
  cancelled: number;
}

interface OrderFiltersProps {
  currentFilter: FilterType;
  counts: FilterCounts;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

interface FilterTabOption {
  key: FilterType;
  label: string;
}

const FILTER_TABS: FilterTabOption[] = [
  { key: 'all', label: 'All Orders' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function OrderFilters({
  currentFilter,
  counts,
  onFilterChange,
  className = '',
}: OrderFiltersProps) {
  return (
    <nav
      role="tablist"
      aria-label="Order filters"
      className={`flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar scroll-smooth ${className}`}
    >
      {FILTER_TABS.map((tab) => {
        const isSelected = currentFilter === tab.key;
        const count = counts[tab.key] ?? 0;

        return (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={isSelected}
            aria-controls={`orders-panel-${tab.key}`}
            onClick={() => onFilterChange(tab.key)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              isSelected
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full transition-colors tabular-nums ${
                isSelected
                  ? 'bg-brand-50 text-brand-700'
                  : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default OrderFilters;
