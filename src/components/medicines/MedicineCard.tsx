'use client';

import React from 'react';
import { AlertCircle, Plus, Check, Eye, ArrowLeftRight, Lock } from 'lucide-react';
import { Medicine } from '@/types';
import { DosageFormIcon } from '@/components/ui/Illustrations';

interface MedicineCardProps {
  medicine: Medicine;
  isAdded: boolean;
  onAdd: (med: Medicine) => void;
  onQuickView: (med: Medicine, initialTab?: 'details' | 'substitutes') => void;
}

export default function MedicineCard({
  medicine,
  isAdded,
  onAdd,
  onQuickView,
}: MedicineCardProps) {
  const savings = medicine.mrp - medicine.sellingPrice;
  const isScheduleX = medicine.schedule === 'SCHEDULE_X';

  return (
    <article
      className="bg-white rounded-[16px] p-4 border border-slate-200/90 shadow-soft-sm hover:-translate-y-[2px] transition-all duration-200 hover:shadow-soft hover:border-brand-200 flex flex-col justify-between h-full group relative focus-within:ring-2 focus-within:ring-brand-500/30"
      aria-labelledby={`med-title-${medicine.id}`}
    >
      <div>
        {/* TOP VISUAL: Product image / Type icon on tinted background with Badges */}
        <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-gradient-to-b from-brand-50/70 via-slate-50/60 to-slate-100/50 flex items-center justify-center mb-3 border border-slate-100/80">
          {/* Tinted Center Visual */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-soft-sm border border-slate-100 flex items-center justify-center text-brand-600 transition-transform duration-200 group-hover:scale-105 select-none">
            <DosageFormIcon form={medicine.dosageForm} className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          {/* OVERLAY BADGES: Max 2 badges */}
          {/* Top-left: Rx badge (only if prescription required) */}
          {medicine.requiresPrescription && (
            <span
              className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs select-none"
              aria-label="Prescription Required"
            >
              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" aria-hidden="true" />
              <span>Rx</span>
            </span>
          )}

          {/* Top-right: Discount badge */}
          {medicine.discountPercentage > 0 && (
            <span
              className="absolute top-2.5 right-2.5 z-10 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-2xs select-none"
              aria-label={`${medicine.discountPercentage} percent off`}
            >
              {medicine.discountPercentage}% OFF
            </span>
          )}

          {/* HOVER (desktop) / ALWAYS VISIBLE (mobile) ICON BUTTONS */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 z-10">
            <button
              type="button"
              onClick={() => onQuickView(medicine, 'details')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-brand-600 shadow-soft-sm border border-slate-200/90 flex items-center justify-center transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none cursor-pointer"
              aria-label={`Quick view details for ${medicine.name}`}
              title="Quick view"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onQuickView(medicine, 'substitutes')}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-600 shadow-soft-sm border border-slate-200/90 flex items-center justify-center transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
              aria-label={`Find substitutes for ${medicine.name}`}
              title="Find substitutes"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* NAME: 16-17px semibold, 2-line clamp */}
        <h3
          id={`med-title-${medicine.id}`}
          onClick={() => onQuickView(medicine, 'details')}
          className="font-semibold text-[16px] sm:text-[17px] text-slate-900 leading-snug line-clamp-2 min-h-[2.4rem] sm:min-h-[2.6rem] group-hover:text-brand-600 transition-colors cursor-pointer"
          title={medicine.name}
        >
          {medicine.name}
        </h3>

        {/* COMPOSITION: one line, 13-14px, truncated with full-text tooltip, normal UI font (not monospace) */}
        <p
          className="text-[13px] sm:text-[14px] font-sans font-medium text-slate-600 truncate block mt-1"
          title={medicine.salt}
        >
          {medicine.salt}
        </p>

        {/* PACK SIZE AND MANUFACTURER: one muted 12-13px line */}
        <p
          className="text-[12px] sm:text-[13px] font-sans text-slate-500 truncate block mt-0.5"
          title={`${medicine.packaging} • ${medicine.brand}`}
        >
          {medicine.packaging} • {medicine.brand}
        </p>

        {/* ONE DELIVERY CHIP & STOCK EXCEPTION ONLY */}
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>Express 45m</span>
          </span>

          {/* Show stock status only for exceptions (low stock / out of stock / schedule X) */}
          {medicine.stockQty === 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Out of stock
            </span>
          ) : medicine.stockQty <= 10 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Only {medicine.stockQty} left
            </span>
          ) : isScheduleX ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
              In-Store Only
            </span>
          ) : null}
        </div>
      </div>

      {/* FOOTER: Price (20px bold) with MRP struck through, and fixed-size Add button that never wraps */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-bold text-slate-900 tracking-tight leading-none">
              ₹{medicine.sellingPrice.toFixed(2)}
            </span>
            {savings > 0 && (
              <span className="text-[12px] text-slate-400 line-through font-normal leading-none">
                ₹{medicine.mrp.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {isScheduleX ? (
          <button
            type="button"
            onClick={() => onAdd(medicine)}
            className="shrink-0 min-w-[84px] h-[36px] px-3 rounded-full font-bold text-[11px] bg-slate-100 text-slate-500 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none cursor-pointer"
            aria-label={`Schedule X restricted substance ${medicine.name} in-store only`}
          >
            <Lock className="w-3 h-3" aria-hidden="true" />
            <span>In-Store</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(medicine)}
            className={`shrink-0 min-w-[84px] h-[36px] px-3.5 rounded-full font-bold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none cursor-pointer ${
              isAdded
                ? 'bg-emerald-600 text-white scale-102 shadow-soft-sm'
                : 'btn-primary-gradient text-white hover:scale-102 shadow-soft-sm'
            }`}
            aria-label={isAdded ? `${medicine.name} added to cart` : `Add ${medicine.name} to cart`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Added</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
