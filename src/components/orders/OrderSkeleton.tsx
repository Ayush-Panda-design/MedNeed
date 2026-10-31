'use client';

import React from 'react';

export function OrderSkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl sm:rounded-[20px] border border-slate-100 p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-5 animate-pulse"
      aria-hidden="true"
    >
      {/* Header row skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-28 h-6 bg-slate-200 rounded-full" />
          <div className="w-16 h-5 bg-slate-100 rounded-full" />
        </div>
        <div className="w-36 h-4 bg-slate-200 rounded" />
      </div>

      {/* Hero product row skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          {/* 64px thumbnail */}
          <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
          <div className="space-y-2 flex-1 max-w-sm">
            <div className="w-3/4 h-5 bg-slate-200 rounded" />
            <div className="w-1/2 h-3.5 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Price skeleton */}
        <div className="text-right shrink-0 space-y-1">
          <div className="w-10 h-3 bg-slate-100 rounded ml-auto" />
          <div className="w-20 h-6 bg-slate-200 rounded ml-auto" />
        </div>
      </div>

      {/* Stepper skeleton */}
      <div className="py-2 px-1">
        <div className="relative">
          <div className="h-0.5 bg-slate-100 w-full" />
          <div className="flex justify-between -mt-3 sm:-mt-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-1.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-200" />
                <div className="w-12 h-3 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row skeleton */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-48 h-4 bg-slate-200 rounded" />
        <div className="flex items-center gap-2.5">
          <div className="w-24 h-10 bg-slate-100 rounded-xl" />
          <div className="w-32 h-10 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading orders...">
      {Array.from({ length: count }).map((_, i) => (
        <OrderSkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading orders, please wait...</span>
    </div>
  );
}

export default OrderSkeletonList;
