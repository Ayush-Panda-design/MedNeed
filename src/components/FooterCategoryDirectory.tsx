'use client';

import React from 'react';
import Link from 'next/link';
import {
  GENERAL_STORE_SECTIONS,
  PHARMACY_THERAPEUTIC_CATEGORIES,
  DIAGNOSTICS_TAXONOMY,
  DOCTOR_CONSULTATION_TAXONOMY,
  ALPHABET_DIRECTORY,
} from '@/data/categoriesData';
import {
  Sparkles,
  ShoppingBag,
  Pill,
  Activity,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Building,
} from 'lucide-react';

export default function FooterCategoryDirectory() {
  return (
    <div className="border-t border-slate-800/80 pt-10 pb-6 text-slate-400 text-xs">
      <div className="space-y-12">
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-white font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>MedNeed Comprehensive Healthcare &amp; Provision Directory</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Explore thousands of verified pharmaceuticals, generic compositions, daily wellness essentials, and clinical diagnostics.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-3 py-1 rounded-full font-semibold">
              FEFO Batch Tracked • 100% Genuine
            </span>
          </div>
        </div>

        {/* 4-Section Hierarchical Grid matching the industry reference layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-12">
          {/* COLUMN 1: GENERAL STORE */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span className="text-base text-white">General Store &amp; Daily Provisions</span>
            </div>

            <div className="space-y-4 text-[11px] leading-relaxed">
              {GENERAL_STORE_SECTIONS.map((sec) => (
                <div key={sec.name} className="space-y-1">
                  <span className="font-bold text-slate-200 block text-xs">
                    {sec.name}:
                  </span>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-400">
                    {sec.items.map((item, idx) => (
                      <React.Fragment key={item.name}>
                        <Link
                          href={`/medicines?category=${encodeURIComponent(sec.name)}&subCategory=${encodeURIComponent(item.name)}`}
                          className="hover:text-emerald-300 hover:underline transition-colors"
                        >
                          {item.name}
                        </Link>
                        {idx < sec.items.length - 1 && (
                          <span className="text-slate-600 select-none">\</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: PHARMACY, DIAGNOSTICS & DOCTOR CONSULTATION */}
          <div className="space-y-10">
            {/* Pharmacy Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                <Pill className="w-4 h-4 text-emerald-400" />
                <span className="text-base text-white">Pharmacy &amp; Prescription Formulations</span>
              </div>

              {/* Quick Pharmacy Links */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-300 font-medium text-[11px]">
                <Link href="/medicines" className="hover:text-emerald-300 hover:underline">
                  Medicine Information
                </Link>
                <span className="text-slate-600">\</span>
                <Link href="/orders" className="hover:text-emerald-300 hover:underline">
                  Health Records &amp; Orders
                </Link>
                <span className="text-slate-600">\</span>
                <Link href="/medicines?rx=true" className="hover:text-emerald-300 hover:underline">
                  Prescription Drugs (Schedule H/H1)
                </Link>
                <span className="text-slate-600">\</span>
                <Link href="/track-delivery" className="hover:text-emerald-300 hover:underline">
                  Delivery &amp; Store Locator
                </Link>
              </div>

              {/* Alphabet-Wise Directory (0-9, A, B, C... Z) */}
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-slate-200 block text-xs">
                  Alphabet-Wise Medicine Index (A–Z):
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {ALPHABET_DIRECTORY.map((letter) => (
                    <Link
                      key={letter}
                      href={`/medicines?letter=${letter}`}
                      className="px-2 py-0.5 rounded bg-slate-850 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700/60 text-[10px] font-bold font-mono transition-colors"
                    >
                      {letter}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Browse drugs by Therapeutic Category */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-200 block text-xs">
                  Browse Drugs by Therapeutic Category:
                </span>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-400 leading-relaxed">
                  {PHARMACY_THERAPEUTIC_CATEGORIES.map((cat, idx) => (
                    <React.Fragment key={cat.name}>
                      <Link
                        href={`/medicines?therapeutic=${encodeURIComponent(cat.name)}`}
                        className="hover:text-emerald-300 hover:underline transition-colors"
                      >
                        {cat.name}
                      </Link>
                      {idx < PHARMACY_THERAPEUTIC_CATEGORIES.length - 1 && (
                        <span className="text-slate-600 select-none">\</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Diagnostics Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-base text-white">Diagnostics &amp; Laboratory Path Tests</span>
              </div>

              <div className="space-y-3 text-[11px] leading-relaxed">
                {DIAGNOSTICS_TAXONOMY.map((group) => (
                  <div key={group.groupName} className="space-y-1">
                    <span className="font-bold text-slate-200 block text-xs">
                      {group.groupName}:
                    </span>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-400">
                      {group.tests.map((t, idx) => (
                        <React.Fragment key={t.name}>
                          <Link
                            href={`/blood-tests?category=${encodeURIComponent(t.name)}`}
                            className="hover:text-cyan-300 hover:underline transition-colors"
                          >
                            {t.name}
                          </Link>
                          {idx < group.tests.length - 1 && (
                            <span className="text-slate-600 select-none">\</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Consultation Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                <Stethoscope className="w-4 h-4 text-rose-400" />
                <span className="text-base text-white">Doctor Consultation &amp; Symptom Guide</span>
              </div>

              <div className="space-y-3 text-[11px] leading-relaxed">
                {DOCTOR_CONSULTATION_TAXONOMY.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <span className="font-bold text-slate-200 block text-xs">
                      {group.title}:
                    </span>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-400">
                      {group.items.map((item, idx) => (
                        <React.Fragment key={item.name}>
                          <Link
                            href={
                              group.title.includes('Symptoms')
                                ? `/medicines?symptom=${encodeURIComponent(item.name)}`
                                : `/medicines?specialization=${encodeURIComponent(item.name)}`
                            }
                            className="hover:text-rose-300 hover:underline transition-colors"
                          >
                            {item.name}
                          </Link>
                          {idx < group.items.length - 1 && (
                            <span className="text-slate-600 select-none">\</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* About MedNeed & 6 Core Quality Commitments Strip */}
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 text-[11px] text-slate-300 shadow-soft">
          <div className="space-y-2">
            <h4 className="text-sm font-extrabold text-white tracking-wide">
              About MedNeed: The Gateway to Genuine Medicines &amp; Healthcare Provisions
            </h4>
            <p className="text-slate-400 leading-relaxed text-xs">
              With a mission to eliminate spurious medications and ensure 100% verified cold-chain compliance across Odisha and eastern India, MedNeed operates integrated neighborhood digital dispensaries and automated distribution hubs. Every formulation is dispensed under registered pharmacist supervision following DPCO regulatory guidelines and Drugs &amp; Cosmetics Act standards.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="font-extrabold text-white text-xs block mb-3 uppercase tracking-wider text-emerald-400">
              6 Reasons to Trust Your Health with MedNeed:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Authentic Medicines:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  100% assured genuine pharmaceuticals sourced directly from certified manufacturers, stored under strict 25°C temperature controls.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  Monthly Provisions:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  One-stop hub for both daily maintenance medicines and essential monthly personal, dietary, and nutritional care items.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  Express Doorstep Delivery:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Rapid 45–60 minute delivery across local pin codes in tamper-evident sealed packaging with OTP verification.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Affordable &amp; Pocket-Friendly:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Transparent DPCO pricing, bulk volume discounts, and flat savings on monthly prescription refills.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  Customer-First Rx Ordering:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Simple one-click prescription upload with licensed pharmacist review and free doctor consultation callbacks.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-white block font-bold text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Track &amp; One-Click Re-Order:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Access your full digital health records, batch numbers, and re-order previous prescriptions with a single click.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
