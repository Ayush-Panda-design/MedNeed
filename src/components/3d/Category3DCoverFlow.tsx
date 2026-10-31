'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

interface CategoryItem {
  name: string;
  icon: string;
  label: string;
  desc?: string;
  count?: number;
  gradient?: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    name: 'All',
    icon: '✚',
    label: 'All Medicines',
    desc: '30,800+ Verified Stock',
    count: 30807,
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    name: 'Cardiovascular & Hematopoietic system',
    icon: '♡',
    label: 'Cardiac & Blood Care',
    desc: 'Hypertension, Statins, Blood thinners',
    count: 2420,
    gradient: 'from-rose-500 to-red-600',
  },
  {
    name: 'Gastrointestinal & Hepatobiliary System',
    icon: '◌',
    label: 'Digestion & Liver Care',
    desc: 'Antacids, PPIs, Probiotics',
    count: 3150,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Endocrine & Metabolic System',
    icon: '⌁',
    label: 'Diabetes & Thyroid',
    desc: 'Metformin, Insulin, Glimepiride',
    count: 2890,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Respiratory System',
    icon: '☁',
    label: 'Respiratory & Cough',
    desc: 'Inhalers, Bronchodilators, Anti-allergy',
    count: 1980,
    gradient: 'from-sky-500 to-cyan-600',
  },
  {
    name: 'Central Nervous System',
    icon: '⚡',
    label: 'Pain & CNS Support',
    desc: 'Analgesics, Migraine, Neuropathy',
    count: 2640,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Infectious Disease Drugs',
    icon: '◇',
    label: 'Antibiotics & Antivirals',
    desc: 'Broad-spectrum, Antifungals',
    count: 2110,
    gradient: 'from-blue-500 to-teal-600',
  },
  {
    name: 'Vitamins-n-Supplements',
    icon: '✦',
    label: 'Vitamins & Minerals',
    desc: 'Multivitamins, Calcium D3, Zinc',
    count: 3450,
    gradient: 'from-yellow-500 to-amber-600',
  },
  {
    name: 'Personal-Care',
    icon: '✨',
    label: 'Personal & Skin Health',
    desc: 'Dermatology, Sunscreens, Cleansers',
    count: 1720,
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    name: 'Baby-Needs',
    icon: '👶',
    label: 'Baby & Maternal Care',
    desc: 'Infant formulas, Gripe water, Lotions',
    count: 890,
    gradient: 'from-teal-400 to-cyan-600',
  },
  {
    name: 'Ayurvedic',
    icon: '🌿',
    label: 'Ayurvedic & Herbal',
    desc: 'Chyawanprash, Ashwagandha, Tulsi',
    count: 1540,
    gradient: 'from-emerald-600 to-green-700',
  },
];

interface Category3DCoverFlowProps {
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export default function Category3DCoverFlow({
  selectedCategory,
  onSelectCategory,
}: Category3DCoverFlowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Sync activeIndex with selectedCategory
  useEffect(() => {
    const idx = CATEGORY_ITEMS.findIndex((c) => c.name === selectedCategory);
    if (idx !== -1) {
      setActiveIndex(idx);
    }
  }, [selectedCategory]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % CATEGORY_ITEMS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + CATEGORY_ITEMS.length) % CATEGORY_ITEMS.length);
  }, []);

  // Auto rotate every 4.5 seconds if not paused
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlay, handleNext]);

  const handleCardClick = (idx: number, catName: string) => {
    setActiveIndex(idx);
    onSelectCategory(catName);
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="py-12 sm:py-16 bg-gradient-to-b from-white via-[#F5F9FF] to-white relative overflow-hidden"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Therapeutic Divisions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Explore Health Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Browse clinical specialties and essential healthcare categories with verified stocks
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-soft hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 transition flex items-center justify-center cursor-pointer"
              title="Previous Category"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-soft hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 transition flex items-center justify-center cursor-pointer"
              title="Next Category"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Stage Viewport */}
        <div
          className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center select-none"
          style={{ perspective: '1200px' }}
        >
          {CATEGORY_ITEMS.map((cat, idx) => {
            const count = CATEGORY_ITEMS.length;
            // Calculate circular offset relative to activeIndex
            let offset = (idx - activeIndex) % count;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;

            // Only render cards within visibility range (-3 to +3)
            if (Math.abs(offset) > 3) return null;

            const isCenter = offset === 0;
            const translateX = offset * 180; // horizontal spacing in px
            const translateZ = -Math.abs(offset) * 120; // depth offset
            const rotateY = offset * -28; // 3D rotation in degrees
            const opacity = Math.max(0.2, 1 - Math.abs(offset) * 0.28);
            const scale = Math.max(0.7, 1 - Math.abs(offset) * 0.12);

            return (
              <div
                key={cat.name}
                onClick={() => handleCardClick(idx, cat.name)}
                style={{
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: 20 - Math.abs(offset),
                  transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className={`absolute w-[240px] sm:w-[270px] h-[220px] sm:h-[240px] rounded-3xl p-5 cursor-pointer backdrop-blur-md flex flex-col justify-between transition-all group ${
                  isCenter
                    ? 'bg-white shadow-[0_25px_50px_rgba(37,99,235,0.22)] border-2 border-blue-500 ring-4 ring-blue-500/10'
                    : 'bg-white/80 shadow-soft border border-slate-200 hover:bg-white hover:opacity-95'
                }`}
              >
                {/* Top strip with Icon and Count */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                      cat.gradient || 'from-blue-500 to-indigo-600'
                    } text-white flex items-center justify-center text-xl font-bold shadow-soft-sm group-hover:scale-110 transition-transform`}
                  >
                    {cat.icon}
                  </div>

                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                    {cat.count ? cat.count.toLocaleString('en-IN') : '1,000+'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-base group-hover:text-[#2563EB] transition leading-snug line-clamp-1">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.desc || 'Certified pharmaceuticals with DPCO savings'}
                  </p>
                </div>

                {/* Bottom CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#2563EB] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Browse Medicines</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  {isCenter && (
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {CATEGORY_ITEMS.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIndex === idx
                  ? 'w-7 bg-[#2563EB]'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              title={cat.label}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
