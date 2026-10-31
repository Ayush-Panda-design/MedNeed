'use client';

import React, { useEffect, useState } from 'react';

export default function ScrollParallax3D() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* 3D Floating Item 1: Top-Right Glass Molecule Sphere */}
      <div
        className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-blue-400/15 via-teal-300/20 to-transparent blur-sm border border-blue-300/20 shadow-[0_8px_32px_rgba(37,99,235,0.12)] transition-transform duration-75 will-change-transform"
        style={{
          top: '18%',
          right: '4%',
          transform: `translate3d(0, ${-scrollY * 0.12}px, 0) rotate(${scrollY * 0.08}deg)`,
        }}
      >
        <div className="absolute inset-2 rounded-full border border-white/40 animate-pulse" />
      </div>

      {/* 3D Floating Item 2: Mid-Left Translucent Hexagon */}
      <div
        className="absolute w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-teal-400/15 blur-[2px] border border-teal-200/30 transition-transform duration-75 will-change-transform"
        style={{
          top: '48%',
          left: '2%',
          transform: `translate3d(0, ${-scrollY * 0.08}px, 0) rotate(${scrollY * -0.06}deg)`,
        }}
      />

      {/* 3D Floating Item 3: Deep Right DNA Node Ring */}
      <div
        className="absolute w-32 h-32 rounded-full border-2 border-dashed border-blue-400/20 transition-transform duration-75 will-change-transform"
        style={{
          top: '72%',
          right: '3%',
          transform: `translate3d(0, ${-scrollY * 0.15}px, 0) rotate(${scrollY * 0.05}deg)`,
        }}
      />

      {/* 3D Floating Item 4: Ambient Bio-Glow Pill */}
      <div
        className="absolute w-16 h-32 rounded-full bg-gradient-to-b from-blue-500/10 to-teal-400/10 blur-md border border-white/30 transition-transform duration-75 will-change-transform"
        style={{
          top: '85%',
          left: '4%',
          transform: `translate3d(0, ${-scrollY * 0.1}px, 0) rotate(-25deg)`,
        }}
      />
    </div>
  );
}
