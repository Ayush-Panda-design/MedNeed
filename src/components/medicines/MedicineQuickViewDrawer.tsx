'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X,
  AlertCircle,
  Plus,
  Check,
  FileText,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Package,
  Calendar,
  Building2,
  Lock,
  ArrowLeftRight,
} from 'lucide-react';
import { Medicine } from '@/types';
import { DosageFormIcon } from '@/components/ui/Illustrations';

interface QuickViewDrawerProps {
  isOpen: boolean;
  medicine: Medicine | null;
  catalogMedicines: Medicine[];
  initialTab?: 'details' | 'substitutes';
  onClose: () => void;
  onAdd: (med: Medicine) => void;
  onUploadRx: () => void;
  isAdded: boolean;
}

export default function MedicineQuickViewDrawer({
  isOpen,
  medicine,
  catalogMedicines,
  initialTab = 'details',
  onClose,
  onAdd,
  onUploadRx,
  isAdded,
}: QuickViewDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const [activeTab, setActiveTab] = useState<'details' | 'substitutes'>(initialTab);
  const [subAddedIds, setSubAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, medicine]);

  // Accessibility: Focus trap & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    // Save triggering element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus close button initially
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  // Compute Top 3 Substitutes (same salt or matching category)
  const topSubstitutes = useMemo(() => {
    if (!medicine) return [];

    const primarySalt = medicine.salt
      .split('+')[0]
      .trim()
      .replace(/\(.*\)/, '')
      .toLowerCase();

    // 1. Direct salt match
    const saltMatches = catalogMedicines.filter((m) => {
      if (m.id === medicine.id) return false;
      return m.salt.toLowerCase().includes(primarySalt);
    });

    if (saltMatches.length >= 3) {
      return saltMatches.slice(0, 3);
    }

    // 2. Fallback to same therapeutic category or subCategory
    const categoryMatches = catalogMedicines.filter((m) => {
      if (m.id === medicine.id) return false;
      if (saltMatches.some((s) => s.id === m.id)) return false;
      return (
        m.therapeuticCategory === medicine.therapeuticCategory ||
        m.category === medicine.category
      );
    });

    return [...saltMatches, ...categoryMatches].slice(0, 3);
  }, [medicine, catalogMedicines]);

  if (!isOpen || !medicine) return null;

  const savings = medicine.mrp - medicine.sellingPrice;
  const isScheduleX = medicine.schedule === 'SCHEDULE_X';

  const handleSubAdd = (sub: Medicine) => {
    onAdd(sub);
    setSubAddedIds((prev) => ({ ...prev, [sub.id]: true }));
    setTimeout(() => {
      setSubAddedIds((prev) => ({ ...prev, [sub.id]: false }));
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="quick-view-heading">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer: Right Slide-Over on desktop, Bottom Sheet on mobile */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full sm:w-[480px] md:w-[520px] bg-white h-[92vh] sm:h-full mt-auto sm:mt-0 rounded-t-[28px] sm:rounded-t-none sm:rounded-l-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-300"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <h2 id="quick-view-heading" className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Quick Medicine Details
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none cursor-pointer"
            aria-label="Close Quick View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Details vs Substitutes */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'details'
                ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Product Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('substitutes')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'substitutes'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Top Substitutes ({topSubstitutes.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {activeTab === 'details' ? (
            <>
              {/* Large Product Visual Card */}
              <div className="bg-gradient-to-b from-brand-50/80 via-slate-50 to-white rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center relative">
                {medicine.requiresPrescription && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Rx Required</span>
                  </span>
                )}

                {medicine.discountPercentage > 0 && (
                  <span className="absolute top-3 right-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-2xs">
                    {medicine.discountPercentage}% OFF
                  </span>
                )}

                <div className="w-24 h-24 rounded-3xl bg-white shadow-soft border border-slate-100 flex items-center justify-center text-brand-600 mb-3 mt-4">
                  <DosageFormIcon form={medicine.dosageForm} className="w-12 h-12" />
                </div>

                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {medicine.dosageForm} Formulation
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {medicine.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Manufactured by <strong className="text-slate-700">{medicine.brand}</strong></span>
                </p>
              </div>

              {/* Pack, Expiry & Delivery Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Packaging</span>
                  <span className="font-semibold text-slate-800 truncate block">{medicine.packaging}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expiry Date</span>
                  <span className="font-semibold text-slate-800 truncate block">{medicine.expiryDate}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" /> Express 45m
                  </span>
                </div>
              </div>

              {/* Full Composition */}
              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-1.5">
                <span className="text-xs font-extrabold text-emerald-950 block">Active Salt Composition:</span>
                <p className="text-sm font-sans font-medium text-slate-800 leading-relaxed">
                  {medicine.salt}
                </p>
                {medicine.therapeuticCategory && (
                  <div className="pt-1.5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      {medicine.therapeuticCategory}
                    </span>
                    {medicine.category && (
                      <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {medicine.category}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 2-Line "Used For" Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
                  Indication &amp; Therapeutic Use:
                </span>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  {medicine.description || `Therapeutic treatment formulation for ${medicine.category} indications, verified under Indian Pharmacopoeia standards.`}
                </p>
              </div>

              {/* Full Rx / Schedule H/H1 Warning & Upload CTA */}
              {isScheduleX ? (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-rose-950">Schedule X Controlled Substance</h4>
                      <p className="text-[11px] text-rose-800 leading-relaxed mt-0.5">
                        Under Drugs &amp; Cosmetics Rules 65 &amp; 97, Schedule X medications cannot be sold online. Available only via physical retail counter with duplicate prescription.
                      </p>
                    </div>
                  </div>
                </div>
              ) : medicine.requiresPrescription ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-amber-950">Schedule H / H1 Prescription Medication</h4>
                      <p className="text-xs text-amber-900/90 leading-relaxed mt-0.5">
                        A valid doctor&apos;s prescription is mandatory under Indian law. Registered pharmacist verifies every order within 10–15 mins.
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onUploadRx();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-700 hover:text-brand-900 bg-white hover:bg-brand-50 px-3.5 py-1.5 rounded-full border border-brand-200 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Upload Prescription Now →</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {/* View Full Details External Link Action */}
              <div className="pt-1 text-center">
                <a
                  href={`/medicines?q=${encodeURIComponent(medicine.name)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600 hover:underline"
                >
                  <span>View full details &amp; batch certificate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            /* Substitutes Tab Content */
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Affordable Generic &amp; Brand Substitutes
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Same active therapeutic composition (<strong className="text-slate-700">{medicine.salt}</strong>), verified bioequivalent by DCGI standards.
                </p>
              </div>

              {topSubstitutes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">No other exact salt substitutes currently in stock.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topSubstitutes.map((sub) => {
                    const isSubAdded = !!subAddedIds[sub.id];
                    const priceDiff = medicine.sellingPrice - sub.sellingPrice;

                    return (
                      <div
                        key={sub.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm text-slate-900 truncate">{sub.name}</h5>
                            <p className="text-xs text-slate-500">{sub.packaging} • {sub.brand}</p>
                          </div>
                          {priceDiff > 0 && (
                            <span className="shrink-0 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Save ₹{priceDiff.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 font-sans truncate bg-slate-50 p-2 rounded-lg">
                          <span className="font-bold text-slate-700">Salt:</span> {sub.salt}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-base font-bold text-slate-900">₹{sub.sellingPrice.toFixed(2)}</span>
                            {sub.mrp > sub.sellingPrice && (
                              <span className="text-xs text-slate-400 line-through ml-1.5">₹{sub.mrp.toFixed(2)}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSubAdd(sub)}
                            className={`font-bold text-xs px-3.5 py-1.5 rounded-full transition flex items-center gap-1 cursor-pointer ${
                              isSubAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isSubAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Substitute</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer: Price & Add to Cart Action */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 shadow-soft">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                ₹{medicine.sellingPrice.toFixed(2)}
              </span>
              {savings > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{medicine.mrp.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Standard local delivery: Express 45 mins
            </div>
          </div>

          {isScheduleX ? (
            <button
              type="button"
              disabled
              className="font-bold text-xs px-5 py-3 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1.5 cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>In-Store Purchase Only</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(medicine)}
              className={`font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-soft transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white scale-102'
                  : 'btn-primary-gradient text-white hover:scale-102'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
