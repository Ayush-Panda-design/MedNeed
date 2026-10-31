'use client';

import React from 'react';

export default function MedicineCardSkeleton() {
  return (
    <div
      className="bg-white rounded-[16px] p-4 border border-slate-200/80 shadow-soft-sm flex flex-col justify-between h-full animate-pulse select-none"
      aria-hidden="true"
    >
      <div>
        {/* Image Box */}
        <div className="w-full h-32 sm:h-36 rounded-xl bg-slate-100 mb-3" />

        {/* Title Lines */}
        <div className="space-y-1.5 mb-2">
          <div className="h-4 bg-slate-200 rounded-md w-4/5" />
          <div className="h-4 bg-slate-100 rounded-md w-3/5" />
        </div>

        {/* Composition Line */}
        <div className="h-3.5 bg-slate-100 rounded-md w-2/3 mb-1.5" />

        {/* Pack Size / Brand Line */}
        <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-3" />

        {/* Delivery Chip */}
        <div className="h-5 bg-slate-100 rounded-md w-24" />
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="h-6 bg-slate-200 rounded-md w-20" />
        <div className="h-9 bg-slate-200 rounded-full w-20" />
      </div>
    </div>
  );
}

export function MedicineCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
      {Array.from({ length: count }).map((_, i) => (
        <MedicineCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}
