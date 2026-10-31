'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface SectionBookmark {
  id: string;
  label: string;
  index: string;
}

const SECTIONS: SectionBookmark[] = [
  { id: 'hero-section', label: 'Top / Pharmacy', index: '01' },
  { id: 'quick-services-section', label: 'Quick Services', index: '02' },
  { id: 'how-it-works-section', label: 'How It Works', index: '03' },
  { id: 'categories-3d-section', label: 'Categories', index: '04' },
  { id: 'catalog-section', label: 'Medicine Catalog', index: '05' },
  { id: 'diagnostics-section', label: 'Diagnostic Tests', index: '06' },
  { id: 'franchise-section', label: 'Franchise Drive', index: '07' },
];

export default function ScrollProgress3D() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero-section');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      setScrollProgress(progress);
      setIsVisible(window.scrollY > 200);

      // Determine which section is currently active in the viewport
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Page scroll navigation"
      className="hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col items-center select-none animate-in fade-in slide-in-from-right duration-300"
    >
      {/* 3D Capsule HUD Frame */}
      <div className="relative bg-white/85 backdrop-blur-md border border-white/80 p-3 rounded-full shadow-[0_16px_36px_rgba(37,99,235,0.16)] flex flex-col items-center gap-3">
        
        {/* Top 3D Progress Percentage Indicator */}
        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center font-mono font-black text-[10px] shadow-soft-sm">
          <span>{Math.round(scrollProgress)}%</span>
          {/* Circular SVG ring around badge */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray={94.2}
              strokeDashoffset={94.2 - (94.2 * scrollProgress) / 100}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
        </div>

        {/* Vertical Track with Glowing Lifeline */}
        <div className="relative flex flex-col items-center gap-2.5 py-1">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className="relative group p-1 flex items-center justify-center cursor-pointer"
                title={sec.label}
              >
                {/* 3D Node Dot */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-3.5 h-3.5 bg-gradient-to-r from-blue-600 to-teal-400 ring-4 ring-blue-500/25 shadow-soft-sm scale-110'
                      : 'w-2 h-2 bg-slate-300 hover:bg-blue-400'
                  }`}
                />

                {/* Hover Tooltip Card flying out to the left */}
                <div className="absolute right-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-soft-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 z-50">
                  <span className="font-mono text-[10px] text-teal-400 font-extrabold">{sec.index}</span>
                  <span>{sec.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Back to Top 3D Button */}
        <button
          onClick={scrollToTop}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition flex items-center justify-center shadow-soft-sm cursor-pointer group"
          title="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
        </button>

      </div>
    </aside>
  );
}
