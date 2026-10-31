'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Activity,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Droplets,
  Award,
  Zap,
  FileText,
  ThermometerSnowflake,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { LabTubesIllustration, HeartbeatLine } from '@/components/ui/Illustrations';

export default function BloodTestsPage() {
  const { diagnostics, addToCart } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const categories = [
    { name: 'All', icon: '✚' },
    { name: 'Full Body', icon: '🩺' },
    { name: 'Diabetes', icon: '⌁' },
    { name: 'Thyroid', icon: '✦' },
    { name: 'Heart', icon: '♡' },
    { name: 'Liver & Kidney', icon: '◌' },
    { name: 'CBC / Fever', icon: '⚡' },
    { name: 'Vitamins', icon: '☀️' },
  ];

  const filteredTests = diagnostics.filter((test) => {
    const matchesCategory = selectedFilter === 'All' || test.category === selectedFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      test.name.toLowerCase().includes(q) ||
      test.category.toLowerCase().includes(q) ||
      test.includes.some((param) => param.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleBook = (test: typeof diagnostics[0]) => {
    addToCart({
      id: test.id,
      title: test.name,
      type: 'DIAGNOSTIC_TEST',
      mrp: test.mrp,
      sellingPrice: test.discountedPrice,
      quantity: 1,
    });
    setToastMsg(`${test.name} booked! Added to cart.`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5]/50 via-[#FAF8F5] to-white py-8 px-4 sm:px-6 lg:px-8 space-y-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0B1F17] text-white px-5 py-3 rounded-full shadow-soft-xl flex items-center gap-2.5 border border-emerald-500/40 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
        )}

        {/* Hero Banner: Deep Teal -> Navy Gradient with Animated Illustration & ECG line */}
        <div className="relative bg-gradient-to-r from-teal-950 via-slate-900 to-navy-900 text-white rounded-3xl p-6 sm:p-10 shadow-soft-xl overflow-hidden border border-teal-800/60">
          {/* Animated ECG Line */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none opacity-40">
            <HeartbeatLine />
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                <span>NABL &amp; CAP-Grade Certified Diagnostic Lab Tie-ups</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Diagnostic Blood Tests &amp; Full Body Profiles
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Standardized pathology and preventive health checkups powered by NABL-accredited diagnostic protocols. Doorstep sample collection by certified phlebotomists within 45–60 mins.
              </p>
            </div>

            {/* Illustrated Blood Tubes Scene */}
            <div className="w-48 h-36 hidden sm:block shrink-0 animate-float-bob opacity-90">
              <LabTubesIllustration />
            </div>

            {/* Doorstep Collection Slots Frosted Glass Box */}
            <div className="glass-card-dark rounded-2xl p-5 border border-white/20 text-xs space-y-3 shrink-0 w-full sm:w-auto min-w-[270px]">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-300 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Doorstep Collection Slots:</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulsing-dot" />
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl text-slate-200 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Tomorrow: 6:30 AM – 11:30 AM</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>100% sterile barcoded vacutainer tubes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Fasting advisories sent via SMS &amp; WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Category Filter Controls */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-xl group">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests e.g. CBC, HbA1c, Thyroid, Lipid Profile, Vitamin D..."
              className="w-full pl-12 pr-12 py-3.5 bg-white rounded-full border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-soft-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition duration-150"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Category Chips with Distinct Icons & Gradient Fill on Active */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            {categories.map((c) => {
              const isSelected = selectedFilter === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedFilter(c.name)}
                  className={`px-4 py-2.5 rounded-full font-extrabold whitespace-nowrap transition cursor-pointer shadow-soft-sm ${
                    isSelected
                      ? 'btn-primary-gradient text-white scale-105 shadow-soft ring-2 ring-emerald-400/40'
                      : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200'
                  }`}
                >
                  <span className="mr-1.5">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count Header */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-extrabold text-slate-900">{filteredTests.length}</span> diagnostic packages
            {selectedFilter !== 'All' && <span> in <span className="font-bold text-emerald-800">{selectedFilter}</span></span>}
            {searchQuery && <span> matching &ldquo;<span className="font-bold text-slate-900">{searchQuery}</span>&rdquo;</span>}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>NABL-accredited lab standards • Free digital smart report</span>
          </div>
        </div>

        {/* Empty Search State */}
        {filteredTests.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft space-y-4">
            <Droplets className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-800">No matching lab tests found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn&apos;t find any tests matching &ldquo;{searchQuery}&rdquo;. Try searching for general terms like &ldquo;Sugar&rdquo;, &ldquo;Thyroid&rdquo;, &ldquo;CBC&rdquo;, or &ldquo;Full Body&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('All');
              }}
              className="btn-primary-gradient text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-soft"
            >
              Reset filters &amp; view all tests
            </button>
          </div>
        )}

        {/* Test Cards Grid: Premium Look with Gradient Header Band per Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            const savings = test.mrp - test.discountedPrice;
            const discountPct = Math.round((savings / test.mrp) * 100);

            return (
              <div
                key={test.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-emerald-400 hover:shadow-soft-xl transition-all duration-200 flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3.5">
                  {/* Category Header Strip & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {test.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {test.popular && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          Popular
                        </span>
                      )}
                      <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs">
                        {discountPct}% OFF
                      </span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-emerald-700 transition">
                    {test.name}
                  </h3>

                  {/* Turnaround & Sample Meta */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Report in <strong>{test.turnaroundHours}h</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Droplets className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Sample: <strong>{test.sampleType}</strong></span>
                    </div>
                    <div className="col-span-2 text-[11px] pt-1 border-t border-slate-200/60 font-semibold">
                      {test.fastingHours > 0 ? (
                        <span className="text-amber-800 flex items-center gap-1">
                          ⚠️ Requires {test.fastingHours} hrs Overnight Fasting
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1">
                          ✓ No Fasting Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Parameters preview & toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                        Includes {test.testCount} Parameters
                      </span>
                      <button
                        onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                        className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? 'Hide Parameters' : 'View all'}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <ul className="text-xs text-slate-600 space-y-1.5">
                      {(isExpanded ? test.includes : test.includes.slice(0, 3)).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900">
                        ₹{test.discountedPrice}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{test.mrp}
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      Save ₹{savings} (Incl. Home Sample Kit)
                    </div>
                  </div>

                  <button
                    onClick={() => handleBook(test)}
                    className="btn-primary-gradient text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-soft transition cursor-pointer hover:scale-105"
                  >
                    Book Home Visit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative "Why Book With MedNeed" Trust Strip */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-soft-sm grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-soft-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">Vaccinated Phlebotomists</div>
              <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                Samples collected in disposable sterile vacutainers with barcode tagging.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-soft-sm">
              <ThermometerSnowflake className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">Cold Chain Transit</div>
              <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                Blood samples transported in temperature-monitored gel pack insulated iceboxes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-soft-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">Smart WhatsApp Reports</div>
              <p className="mt-0.5 text-slate-600 text-[11px] leading-relaxed">
                Doctor-verified PDF report delivered directly to your registered WhatsApp in 12–24h.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
