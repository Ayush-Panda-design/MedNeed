'use client';

import React from 'react';
import Link from 'next/link';
import { PackageOpen, ArrowRight, RotateCcw } from 'lucide-react';
import { FilterType } from './OrderFilters';

interface OrderEmptyStateProps {
  currentFilter?: FilterType;
  onResetFilter?: () => void;
  className?: string;
}

export function OrderEmptyState({
  currentFilter = 'all',
  onResetFilter,
  className = '',
}: OrderEmptyStateProps) {
  const isFiltered = currentFilter !== 'all';

  if (isFiltered) {
    const filterTitle =
      currentFilter === 'active'
        ? 'No Active Orders'
        : currentFilter === 'delivered'
        ? 'No Delivered Orders Yet'
        : 'No Cancelled Orders';

    const filterSubtitle =
      currentFilter === 'active'
        ? 'You have no orders currently in progress or out for delivery.'
        : currentFilter === 'delivered'
        ? 'You have not completed any deliveries in your order history yet.'
        : 'You have zero cancelled orders in your history.';

    return (
      <div
        className={`bg-white rounded-2xl sm:rounded-[20px] p-8 sm:p-12 border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.06)] text-center space-y-5 max-w-lg mx-auto ${className}`}
      >
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-50 rounded-2xl rotate-6" />
          <div className="relative w-14 h-14 bg-gradient-to-br from-brand-100 to-blue-50 text-brand-600 rounded-2xl flex items-center justify-center shadow-xs">
            <PackageOpen className="w-7 h-7" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-bold text-lg text-slate-900 tracking-tight">{filterTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {filterSubtitle}
          </p>
        </div>

        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Show All Orders</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl sm:rounded-[20px] p-8 sm:p-12 border border-slate-100 shadow-[0_4px_20px_rgba(15,23,42,0.06)] text-center space-y-6 max-w-md mx-auto ${className}`}
    >
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-blue-100/60 rounded-3xl -rotate-6" />
        <div className="absolute inset-0 bg-brand-50 rounded-3xl rotate-3" />
        <div className="relative w-16 h-16 bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-brand-500/25">
          <PackageOpen className="w-8 h-8" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-xl text-slate-900 tracking-tight">No Orders Placed Yet</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Your orders will appear here with live tracking, handover OTPs, and downloadable tax invoices once placed.
        </p>
      </div>

      <Link
        href="/medicines"
        className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm shadow-brand-600/25 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <span>Browse Medicines</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default OrderEmptyState;
