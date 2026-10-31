'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import Lenis from 'lenis';
import {
  FileText,
  Truck,
  MapPin,
  Clock,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  ShoppingCart,
  Activity,
  Pill,
  Sparkles,
  Search,
  Thermometer,
} from 'lucide-react';
import PrescriptionUploadModal from '@/components/PrescriptionUploadModal';
import PincodeModal from '@/components/PincodeModal';

/**
 * Calculates time string from 02:14 AM to 08:00 AM based on scroll progress p in [0, 1]
 */
function getScrollTime(p: number): string {
  const startMins = 134; // 02:14 AM
  const endMins = 480;   // 08:00 AM
  const currentMins = Math.round(startMins + Math.max(0, Math.min(1, p)) * (endMins - startMins));
  const hours = Math.floor(currentMins / 60);
  const minutes = currentMins % 60;
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm} AM`;
}

/**
 * Standard cubic ease in-out
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Linear interpolation
 */
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

interface SceneRange {
  start: number;
  fadeInEnd: number;
  fadeOutStart: number;
  end: number;
}

/**
 * Overlapping scene slices:
 * Every scene overlaps with the next so there is NEVER a blank frame.
 * Scene 7 holds at 1.0 through 1.00 so the end connects directly to the light section.
 */
const SCENE_RANGES: SceneRange[] = [
  // Scene 1: 02:14 AM – 03:00 AM
  { start: 0.00, fadeInEnd: 0.00, fadeOutStart: 0.11, end: 0.17 },
  // Scene 2: 02:55 AM – 03:50 AM
  { start: 0.13, fadeInEnd: 0.17, fadeOutStart: 0.25, end: 0.31 },
  // Scene 3: 03:45 AM – 04:45 AM
  { start: 0.27, fadeInEnd: 0.31, fadeOutStart: 0.39, end: 0.45 },
  // Scene 4: 04:40 AM – 05:40 AM
  { start: 0.41, fadeInEnd: 0.45, fadeOutStart: 0.53, end: 0.59 },
  // Scene 5: 05:35 AM – 06:35 AM
  { start: 0.55, fadeInEnd: 0.59, fadeOutStart: 0.67, end: 0.73 },
  // Scene 6: 06:30 AM – 07:25 AM
  { start: 0.69, fadeInEnd: 0.73, fadeOutStart: 0.81, end: 0.87 },
  // Scene 7: 07:20 AM – 08:00 AM (Holds through 1.00)
  { start: 0.83, fadeInEnd: 0.87, fadeOutStart: 1.00, end: 1.00 },
];

/**
 * Text scene styling with opposite depth scaling:
 * As the background zooms in, text scales slightly in the OPPOSITE direction (1.06 -> 1.00 as it fades in)
 * creating a floating foreground parallax depth layer.
 */
function getSceneStyle(p: number, range: SceneRange, reducedMotion: boolean) {
  const { start, fadeInEnd, fadeOutStart, end } = range;

  if (p < start || (fadeOutStart !== end && p > end)) {
    return {
      opacity: 0,
      transform: reducedMotion ? 'none' : 'translate3d(0, 20px, 0) scale(0.96)',
      pointerEvents: 'none' as const,
      visibility: 'hidden' as const,
    };
  }

  let opacity = 1;
  let translateY = 0;
  let scale = 1;

  if (p < fadeInEnd && fadeInEnd > start) {
    const t = Math.max(0, Math.min(1, (p - start) / (fadeInEnd - start)));
    opacity = t;
    translateY = 20 * (1 - t);
    // Scales 1.06 -> 1.00 as it fades in
    scale = reducedMotion ? 1 : 1.06 - 0.06 * t;
  } else if (p > fadeOutStart) {
    if (fadeOutStart === end) {
      opacity = 1;
      translateY = 0;
      scale = 1;
    } else {
      const t = Math.max(0, Math.min(1, (p - fadeOutStart) / (end - fadeOutStart)));
      opacity = 1 - t;
      translateY = -20 * t;
      // Fades out from 1.00 -> 0.96
      scale = reducedMotion ? 1 : 1.00 - 0.04 * t;
    }
  }

  return {
    opacity,
    transform: reducedMotion ? 'none' : `translate3d(0, ${translateY}px, 0) scale(${scale})`,
    pointerEvents: opacity > 0.35 ? ('auto' as const) : ('none' as const),
    visibility: opacity > 0.005 ? ('visible' as const) : ('hidden' as const),
  };
}

/**
 * Calculates target camera scale based on progress p and mobile breakpoint:
 * - p 0.00 to 0.20: scale 1.00 -> 1.15 (slow push in on the shop)
 * - p 0.20 to 0.55: scale 1.15 -> 1.45 (deep zoom toward counter and window)
 * - p 0.55 to 0.78: scale 1.45 -> 1.60 (peak zoom, hold, slight drift)
 * - p 0.78 to 1.00: scale 1.60 -> 1.00 (smooth zoom OUT revealing sunrise)
 */
function getTargetCameraScale(p: number, isMobile: boolean): number {
  const maxScale = isMobile ? 1.35 : 1.60;
  const midScale1 = isMobile ? 1.08 : 1.15;
  const midScale2 = isMobile ? 1.25 : 1.45;

  if (p <= 0.20) {
    const t = easeInOutCubic(p / 0.20);
    return 1.00 + (midScale1 - 1.00) * t;
  } else if (p <= 0.55) {
    const t = easeInOutCubic((p - 0.20) / (0.55 - 0.20));
    return midScale1 + (midScale2 - midScale1) * t;
  } else if (p <= 0.78) {
    const t = easeInOutCubic((p - 0.55) / (0.78 - 0.55));
    return midScale2 + (maxScale - midScale2) * t;
  } else {
    const t = easeInOutCubic((p - 0.78) / (1.00 - 0.78));
    return maxScale + (1.00 - maxScale) * t;
  }
}

/**
 * Calculates transform-origin based on progress p:
 * - start at 50% 60% (counter area)
 * - mid at 62% 48% (toward the window and street)
 * - end at 50% 50%
 */
function getTargetCameraOrigin(p: number): { ox: number; oy: number } {
  if (p <= 0.55) {
    const t = easeInOutCubic(p / 0.55);
    return {
      ox: 50 + (62 - 50) * t,
      oy: 60 + (48 - 60) * t,
    };
  } else {
    const t = easeInOutCubic((p - 0.55) / (1.00 - 0.55));
    return {
      ox: 62 + (50 - 62) * t,
      oy: 48 + (50 - 48) * t,
    };
  }
}

/**
 * Calculates subtle parallax translation:
 * translateY: 0% to -3% across the scroll
 * translateX: tiny horizontal drift 0% to 1.5% for a handheld dolly feel
 */
function getTargetParallax(p: number): { tx: number; ty: number } {
  return {
    tx: 1.5 * Math.sin(p * Math.PI), // gentle 0 -> 1.5% -> 0% drift
    ty: -3.0 * p,                    // 0 to -3% vertical drift
  };
}

export default function LandingCinematic() {
  const { cartCount, userPincode } = useApp();

  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [vignetteOpacity, setVignetteOpacity] = useState(0.20);
  const [pinState, setPinState] = useState<'top' | 'fixed' | 'bottom'>('fixed');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Smooth lerp state refs for 60fps camera motion
  const currentScaleRef = useRef(1.0);
  const currentOxRef = useRef(50);
  const currentOyRef = useRef(60);
  const currentTxRef = useRef(0);
  const currentTyRef = useRef(0);
  const targetPRef = useRef(0);

  // Check prefers-reduced-motion and screen width
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onMotionChange);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      mq.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Ensure parent main element doesn't disable sticky / pinning
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.overflow = 'visible';
    }
    const htmlEl = document.documentElement;
    const prevHtmlOverflow = htmlEl.style.overflowX;
    htmlEl.style.overflowX = 'visible';

    return () => {
      if (mainEl) mainEl.style.overflow = '';
      htmlEl.style.overflowX = prevHtmlOverflow;
    };
  }, []);

  // Initialize Lenis smooth scroll & 60fps camera zoom lerp ticker
  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    let animationFrameId: number;

    const updateScrollProgress = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const totalScrollable = wrapperRef.current.scrollHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
      targetPRef.current = progress;
      setScrollProgress(progress);

      // Pinning state
      if (rect.top > 0) {
        setPinState('top');
      } else if (rect.bottom <= window.innerHeight) {
        setPinState('bottom');
      } else {
        setPinState('fixed');
      }
    };

    // 60fps Animation Loop with Lerp smoothing (factor ~0.08)
    const animateCamera = (time: number) => {
      lenis.raf(time);

      const targetP = targetPRef.current;
      const targetScale = getTargetCameraScale(targetP, isMobile);
      const { ox: targetOx, oy: targetOy } = getTargetCameraOrigin(targetP);
      const { tx: targetTx, ty: targetTy } = getTargetParallax(targetP);

      const factor = 0.08;
      currentScaleRef.current = lerp(currentScaleRef.current, targetScale, factor);
      currentOxRef.current = lerp(currentOxRef.current, targetOx, factor);
      currentOyRef.current = lerp(currentOyRef.current, targetOy, factor);
      currentTxRef.current = lerp(currentTxRef.current, targetTx, factor);
      currentTyRef.current = lerp(currentTyRef.current, targetTy, factor);

      // Apply directly to camera container for 60fps GPU acceleration
      if (cameraRef.current) {
        cameraRef.current.style.transformOrigin = `${currentOxRef.current.toFixed(2)}% ${currentOyRef.current.toFixed(2)}%`;
        cameraRef.current.style.transform = `translate3d(${currentTxRef.current.toFixed(3)}%, ${currentTyRef.current.toFixed(3)}%, 0) scale(${currentScaleRef.current.toFixed(4)})`;
      }

      // Update vignette opacity based on zoom depth (opacity 0.20 to 0.55)
      const maxS = isMobile ? 1.35 : 1.60;
      const zoomRatio = Math.max(0, Math.min(1, (currentScaleRef.current - 1.00) / (maxS - 1.00)));
      setVignetteOpacity(0.20 + 0.35 * zoomRatio);

      animationFrameId = requestAnimationFrame(animateCamera);
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    animationFrameId = requestAnimationFrame(animateCamera);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', updateScrollProgress);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion, isMobile]);

  const p = scrollProgress;

  // Background layers cross-fading based on p:
  // 1. hero-night: 1.0 at start, smoothly crossfades out as dim-night enters
  const heroOpacity = p <= 0.14 ? 1 : Math.max(0.15, 1 - (p - 0.14) / (0.28 - 0.14));

  // 2. dim-night: crossfades in from 0.14 to 0.28, holds through 0.74, crossfades out to sunrise by 0.90
  let dimOpacity = 0;
  if (p < 0.14) {
    dimOpacity = 0;
  } else if (p < 0.28) {
    dimOpacity = (p - 0.14) / (0.28 - 0.14);
  } else if (p <= 0.74) {
    dimOpacity = 1;
  } else if (p <= 0.90) {
    dimOpacity = Math.max(0, 1 - (p - 0.74) / (0.90 - 0.74));
  } else {
    dimOpacity = 0;
  }

  // 3. sunrise: crossfades in from 0.74 to 0.90 and holds through 1.0
  const sunriseOpacity = p < 0.74 ? 0 : Math.min(1, (p - 0.74) / (0.90 - 0.74));

  // Balanced black overlay: ranges gently from 0.22 to 0.38 so pharmacy background remains clearly visible
  const overlayOpacity = 0.22 + 0.16 * Math.sin(p * Math.PI);

  // Formatted clock time
  const clockTime = getScrollTime(p);

  // Stage CSS pinning styles (immune to parent overflow issues)
  const stageStyle: React.CSSProperties = reducedMotion
    ? {}
    : {
        position: pinState === 'fixed' ? 'fixed' : 'absolute',
        top: pinState === 'bottom' ? 'auto' : 0,
        bottom: pinState === 'bottom' ? 0 : 'auto',
        left: 0,
        right: 0,
        width: '100%',
        height: '100vh',
        zIndex: 10,
        overflow: 'hidden',
      };

  return (
    <div className="relative w-full bg-[#030712] text-white selection:bg-[#14B8A6] selection:text-white">
      {/* Preload hero-night.webp */}
      <link rel="preload" href="/landing/hero-night.webp" as="image" type="image/webp" />

      {/* =========================================================================
          STICKY TOP NAVIGATION: MedNeed logo, links, Order Now button, Brand Greens
          ========================================================================= */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 transition-all duration-300 pointer-events-auto"
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-full px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between gap-4">
            {/* MedNeed Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-full">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="MedNeed Logo"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain filter hue-rotate-[65deg] brightness-110 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="leading-tight">
                <div className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center">
                  Med<span className="text-[#38BDF8]">Need</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] ml-1 inline-block" />
                </div>
                <div className="text-[8px] sm:text-[9px] font-semibold text-slate-400 tracking-tight hidden xs:block">
                  — For every need, for every life —
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              <Link
                href="/medicines"
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Buy Medicines
              </Link>
              <Link
                href="/blood-tests"
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Diagnostic Lab Tests
              </Link>
              <Link
                href="/track-delivery"
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Track Order
              </Link>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Delivery Pincode Selector */}
              <button
                type="button"
                onClick={() => setIsPincodeModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition"
                title="Change Delivery Location"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-300 font-bold">PIN {userPincode}</span>
              </button>

              {/* Upload Prescription Button */}
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white transition focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                <span>Upload Rx</span>
              </button>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-full transition focus-visible:ring-2 focus-visible:ring-teal-400"
                aria-label="View Cart"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Primary "Order Now" Button with MedNeed brand greens */}
              <Link
                href="/medicines"
                className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#2DD4BF] hover:to-[#14B8A6] text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_0_24px_rgba(20,184,166,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Order now →
              </Link>

              {/* Mobile Hamburger Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-72 max-w-[80vw] bg-slate-950 border-l border-white/10 p-6 flex flex-col justify-between z-50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="MedNeed Logo"
                    className="w-7 h-7 object-contain filter hue-rotate-[65deg]"
                  />
                  <span className="font-black text-white text-lg">
                    Med<span className="text-[#38BDF8]">Need</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions in Drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPincodeModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-teal-300"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Deliver to: PIN {userPincode}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="space-y-2">
                <Link
                  href="/medicines"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
                >
                  <Pill className="w-4 h-4 text-teal-400" />
                  <span>Buy Medicines</span>
                </Link>
                <Link
                  href="/blood-tests"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Diagnostic Lab Tests</span>
                </Link>
                <Link
                  href="/track-delivery"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
                >
                  <Truck className="w-4 h-4 text-teal-400" />
                  <span>Track Order</span>
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
                >
                  <ShoppingCart className="w-4 h-4 text-teal-400" />
                  <span>Shopping Cart ({cartCount})</span>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsRxModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white p-3 rounded-xl text-xs font-black shadow-lg transition"
              >
                <FileText className="w-4 h-4" />
                <span>Upload Prescription</span>
              </button>
            </div>

            <div className="pt-6 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
              <div>24x7 Emergency Line: 1800-633-6333</div>
              <div className="text-teal-400">45-60 min express pharmacy delivery</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCROLL-DRIVEN STORYTELLING STAGE:
          700vh tall wrapper on desktop, 500vh on mobile.
          Contains ONE sticky/fixed 100vh pinned stage.
          ========================================================================= */}
      {reducedMotion ? (
        /* Reduced Motion Fallback: normal stacked page without pinning */
        <div className="pt-24 pb-16 space-y-24 max-w-5xl mx-auto px-4 sm:px-6">
          {/* Static Scene 1 */}
          <section className="text-center py-16 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-950/60 border border-teal-500/30 px-3.5 py-1 rounded-full">
              Out of medicine at 2 AM?
            </span>
            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight">
              We&apos;re <span className="text-teal-400">up.</span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium">
              Your neighborhood digital pharmacy, delivered in minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/medicines"
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-6 py-3.5 rounded-full text-sm shadow-lg transition"
              >
                Order now
              </Link>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-full text-sm transition"
              >
                Upload prescription
              </button>
            </div>
          </section>

          {/* Static Scene 2 */}
          <section className="text-center py-16 space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Medicines don&apos;t keep office hours. <span className="text-teal-400">Neither</span> do we.
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto">
              24/7 delivery across your city — late nights, early mornings, and public holidays.
            </p>
          </section>

          {/* Static Scene 3 */}
          <section className="text-center py-16 space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              No queues. No <span className="text-teal-400">guesswork.</span>
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto">
              Search by medicine name or generic salt. Transparent pricing and real-time inventory.
            </p>
          </section>

          {/* Static Scene 4 */}
          <section className="text-center py-16 space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Verified, <span className="text-teal-400">genuine</span> stock.
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto">
              Pharmacist-verified prescriptions, stored under 25°C.
            </p>
          </section>

          {/* Static Scene 5 */}
          <section className="text-center py-16 space-y-6">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Four steps. <span className="text-teal-400">Zero</span> stress.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <span className="text-teal-400 font-mono text-xs font-bold">01</span>
                <p className="text-sm font-bold text-white mt-2">Search or upload prescription</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <span className="text-teal-400 font-mono text-xs font-bold">02</span>
                <p className="text-sm font-bold text-white mt-2">We match nearby stock</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <span className="text-teal-400 font-mono text-xs font-bold">03</span>
                <p className="text-sm font-bold text-white mt-2">A pharmacist verifies</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <span className="text-teal-400 font-mono text-xs font-bold">04</span>
                <p className="text-sm font-bold text-white mt-2">Delivered with secure OTP handover</p>
              </div>
            </div>
          </section>

          {/* Static Scene 6 */}
          <section className="text-center py-16 space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Blood tests at your <span className="text-teal-400">doorstep.</span>
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto">
              NABL-accredited labs, home sample collection with certified phlebotomists.
            </p>
          </section>

          {/* Static Scene 7 */}
          <section className="text-center py-16 space-y-6">
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              Morning is <span className="text-teal-400">here.</span>
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto">
              Ready when you wake up. Fresh stock, express dispatch, full peace of mind.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/medicines"
                className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-black px-6 py-3.5 rounded-full text-sm shadow-lg transition"
              >
                Buy Medicines
              </Link>
              <Link
                href="/blood-tests"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-full text-sm transition"
              >
                Book a Lab Test
              </Link>
              <Link
                href="/track-delivery"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-full text-sm transition"
              >
                Track Order
              </Link>
            </div>
          </section>
        </div>
      ) : (
        /* Full Scroll-Driven Storytelling Mode */
        <div
          ref={wrapperRef}
          className="relative w-full h-[500vh] md:h-[700vh]"
          style={{ willChange: 'contents' }}
        >
          {/* THE PINNED 100VH STAGE: Stays pinned while wrapper scrolls */}
          <div
            style={stageStyle}
            className="flex flex-col justify-center items-center pointer-events-none"
          >
            {/* =========================================================================
                THE CAMERA CONTAINER:
                Oversized to 110% x 110% (-5% inset bleed) so parallax translations
                and dynamic scale never show black edges at any scroll position.
                ========================================================================= */}
            <div
              ref={cameraRef}
              className="absolute -top-[5%] -left-[5%] w-[110%] h-[110%] pointer-events-none"
              style={{
                willChange: 'transform',
                transformOrigin: '50% 60%',
              }}
            >
              {/* Layer 1: hero-night.webp (night, rain, scooter outside) */}
              <img
                src="/landing/hero-night.webp"
                alt="MedNeed 24/7 Pharmacy Night Hero"
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-150 ease-out"
                style={{
                  opacity: heroOpacity,
                  willChange: 'opacity',
                }}
              />

              {/* Layer 2: dim-night.webp (dark nighttime version) */}
              <img
                src="/landing/dim-night.webp"
                alt="MedNeed Pharmacy Midnight Hours"
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-150 ease-out"
                style={{
                  opacity: dimOpacity,
                  willChange: 'opacity',
                }}
              />

              {/* Layer 3: sunrise.webp (golden sunrise version) */}
              <img
                src="/landing/sunrise.webp"
                alt="MedNeed Pharmacy Golden Morning Sunrise"
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-150 ease-out"
                style={{
                  opacity: sunriseOpacity,
                  willChange: 'opacity',
                }}
              />
            </div>

            {/* Black Overlay Scrim: Keeps text readable while keeping pharmacy background clearly visible */}
            <div
              className="absolute inset-0 w-full h-full bg-slate-950 pointer-events-none transition-opacity duration-100 ease-out"
              style={{
                opacity: overlayOpacity,
                willChange: 'opacity',
              }}
            />

            {/* Dynamic Vignette: strengthens as camera zooms in (opacity 0.20 to 0.55), clears when zooming out */}
            <div
              className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_32%,rgba(2,6,23,0.92)_100%)] pointer-events-none transition-opacity duration-100 ease-out"
              style={{
                opacity: vignetteOpacity,
                willChange: 'opacity',
              }}
            />

            {/* Soft Top & Bottom Vignette Gradient */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/50 pointer-events-none" />

            {/* Monospace Clock in Bottom-Right Corner (Tied to scroll progress: 02:14 AM -> 08:00 AM) */}
            <div className="fixed bottom-6 right-6 z-40 pointer-events-auto">
              <div
                className="bg-slate-950/80 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-mono tracking-wider transition hover:border-teal-400/50"
                title="Scroll Progress / Simulated Time"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse inline-block shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                  <Clock className="w-3.5 h-3.5 text-teal-300" />
                </div>
                <span className="font-extrabold text-teal-200">{clockTime}</span>
              </div>
            </div>

            {/* Scroll Indicator Pill at Bottom-Center (Visible only at the beginning) */}
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-300 pointer-events-none flex flex-col items-center gap-1.5"
              style={{
                opacity: p < 0.08 ? 1 - p / 0.08 : 0,
              }}
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300/90 bg-black/50 backdrop-blur-xs px-3.5 py-1 rounded-full border border-white/15">
                Scroll to explore our story
              </span>
              <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
                <div className="w-1.5 h-2 bg-teal-400 rounded-full animate-bounce" />
              </div>
            </div>

            {/* =========================================================================
                THE 7 STACKED SCENES:
                Takes 100% of stage height and width with smooth crossfades and opposite depth scaling.
                ========================================================================= */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-20 flex items-center justify-center">
              {/* -----------------------------------------------------------------------
                  SCENE 1: "Out of medicine at 2 AM? We're up."
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[0], reducedMotion)}
              >
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pointer-events-auto">
                  <div className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-teal-400/40 text-teal-300 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase shadow-lg">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Out of medicine at 2 AM?</span>
                  </div>

                  <h1 className="text-[clamp(44px,7.5vw,115px)] font-black text-[#FFFDF8] tracking-tight leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                    We&apos;re <span className="text-teal-400 underline decoration-teal-500/50 decoration-4 underline-offset-8">up.</span>
                  </h1>

                  <p className="text-base sm:text-xl md:text-2xl text-slate-100 font-medium max-w-xl mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                    Your neighborhood digital pharmacy, delivered in minutes.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3">
                    <Link
                      href="/medicines"
                      className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-[0_0_30px_rgba(45,212,191,0.5)] transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Order now →
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsRxModalOpen(true)}
                      className="bg-slate-900/80 hover:bg-slate-900/90 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full transition hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white shadow-lg"
                    >
                      Upload prescription
                    </button>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------------------------------------
                  SCENE 2: "Medicines don't keep office hours. Neither do we."
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[1], reducedMotion)}
              >
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pointer-events-auto">
                  <h2 className="text-[clamp(38px,6.5vw,100px)] font-black text-[#FFFDF8] tracking-tight leading-[0.98] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                    Medicines don&apos;t keep office hours.{' '}
                    <span className="text-teal-400">Neither</span> do we.
                  </h2>
                  <p className="text-base sm:text-xl md:text-2xl text-slate-100 font-medium max-w-xl mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                    24/7 express delivery across your city — late nights, early mornings, and public holidays.
                  </p>
                </div>
              </div>

              {/* -----------------------------------------------------------------------
                  SCENE 3: "No queues. No guesswork."
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[2], reducedMotion)}
              >
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pointer-events-auto">
                  <h2 className="text-[clamp(40px,7vw,110px)] font-black text-[#FFFDF8] tracking-tight leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                    No queues. No <span className="text-teal-400">guesswork.</span>
                  </h2>
                  <p className="text-base sm:text-xl md:text-2xl text-slate-100 font-medium max-w-xl mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                    Search by medicine name or generic salt. Transparent pricing and real-time inventory.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/medicines"
                      className="inline-flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900/90 backdrop-blur-md border border-teal-400/40 text-teal-300 font-bold px-6 py-3 rounded-full text-xs sm:text-sm transition hover:scale-105 shadow-xl"
                    >
                      <Search className="w-4 h-4 text-teal-400" />
                      <span>Search 1,200+ Genuine Medicines</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------------------------------------
                  SCENE 4: "Verified, genuine stock."
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[3], reducedMotion)}
              >
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pointer-events-auto">
                  <h2 className="text-[clamp(40px,7vw,110px)] font-black text-[#FFFDF8] tracking-tight leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                    Verified, <span className="text-teal-400">genuine</span> stock.
                  </h2>
                  <p className="text-base sm:text-xl md:text-2xl text-slate-100 font-medium max-w-xl mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                    Pharmacist-verified prescriptions, stored under 25°C.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-200 shadow-xl">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>100% Authentic Pharma Lines</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-200 shadow-xl">
                      <Thermometer className="w-4 h-4 text-teal-400" />
                      <span>Cold Chain &lt; 25°C Controlled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------------------------------------
                  SCENE 5: "Four steps. Zero stress."
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[4], reducedMotion)}
              >
                <div className="max-w-5xl mx-auto space-y-6 pointer-events-auto">
                  <h2 className="text-[clamp(36px,6.5vw,95px)] font-black text-[#FFFDF8] tracking-tight leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                    Four steps. <span className="text-teal-400">Zero</span> stress.
                  </h2>

                  {/* 4 Steps Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
                    <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl shadow-xl">
                      <div className="text-teal-400 font-mono text-xs sm:text-sm font-black">01</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-1.5">Search or upload prescription</div>
                      <div className="text-[11px] text-slate-300 mt-1">Quick camera scan or catalog search</div>
                    </div>

                    <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl shadow-xl">
                      <div className="text-teal-400 font-mono text-xs sm:text-sm font-black">02</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-1.5">We match nearby stock</div>
                      <div className="text-[11px] text-slate-300 mt-1">Hyperlocal licensed hub dispatch</div>
                    </div>

                    <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl shadow-xl">
                      <div className="text-teal-400 font-mono text-xs sm:text-sm font-black">03</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-1.5">A pharmacist verifies</div>
                      <div className="text-[11px] text-slate-300 mt-1">Double check dosage and legitimacy</div>
                    </div>

                    <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 p-4 sm:p-5 rounded-2xl shadow-xl">
                      <div className="text-teal-400 font-mono text-xs sm:text-sm font-black">04</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-1.5">Secure OTP handover</div>
                      <div className="text-[11px] text-slate-300 mt-1">Delivered in 45-60 min to your door</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------------------------------------
                  SCENE 6: "Blood tests at your doorstep."
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[5], reducedMotion)}
              >
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pointer-events-auto">
                  <h2 className="text-[clamp(38px,6.5vw,100px)] font-black text-[#FFFDF8] tracking-tight leading-[0.98] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                    Blood tests at your <span className="text-teal-400">doorstep.</span>
                  </h2>
                  <p className="text-base sm:text-xl md:text-2xl text-slate-100 font-medium max-w-xl mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                    NABL-accredited labs, home sample collection with certified phlebotomists.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/blood-tests"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-black px-7 py-3.5 rounded-full text-xs sm:text-sm shadow-[0_0_24px_rgba(45,212,191,0.5)] transition hover:scale-105"
                    >
                      <Activity className="w-4 h-4 text-slate-950" />
                      <span>Explore 20+ Lab Tests &amp; Profiles →</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------------------------------------
                  SCENE 7: "Morning is here." (Holds cleanly at the bottom without disappearing)
                  ----------------------------------------------------------------------- */}
              <div
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center"
                style={getSceneStyle(p, SCENE_RANGES[6], reducedMotion)}
              >
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 pointer-events-auto">
                  <h2 className="text-[clamp(44px,7.5vw,115px)] font-black text-[#FFFDF8] tracking-tight leading-[0.95] drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                    Morning is <span className="text-teal-400">here.</span>
                  </h2>

                  <p className="text-base sm:text-xl md:text-2xl text-slate-100 font-medium max-w-lg mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                    Ready when you wake up. Fresh stock, express dispatch, full peace of mind.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
                    <Link
                      href="/medicines"
                      className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-[0_0_30px_rgba(45,212,191,0.5)] transition hover:scale-105 active:scale-95"
                    >
                      Buy Medicines
                    </Link>
                    <Link
                      href="/blood-tests"
                      className="bg-slate-900/80 hover:bg-slate-900/90 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full transition hover:scale-105 active:scale-95 shadow-xl"
                    >
                      Book a Lab Test
                    </Link>
                    <Link
                      href="/track-delivery"
                      className="bg-slate-900/80 hover:bg-slate-900/90 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full transition hover:scale-105 active:scale-95 shadow-xl"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          POST-STAGE LIGHT SECTIONS:
          After the 100vh stage ends, clean modern sections follow:
          1. 24x7 Pharmacist Helpline
          2. Store Locations and Express Coverage
          Then the existing footer component renders automatically from RootLayout.
          ========================================================================= */}
      <div className="relative z-20 bg-[#F5F9FF] text-slate-900 border-t border-slate-200">
        {/* Section 1: 24x7 Pharmacist Helpline */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Ambient accent blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
                  <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                  <span>Always On Duty • 24 Hours A Day</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Have a question about your medication? <br className="hidden sm:inline" />
                  Speak to our <span className="text-teal-400">Chief Pharmacist</span>.
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Need dosage clarification, drug interaction checks, or help finding an alternative salt? Our licensed registered pharmacists are standing by 24 hours a day, 365 days a year.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-teal-300 font-bold pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Zero Consultation Fee
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Licensed Govt. Registered Pharmacists
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Emergency Night Support
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
                <a
                  href="tel:18006336333"
                  className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-black px-8 py-4 rounded-full text-sm shadow-[0_0_24px_rgba(45,212,191,0.4)] transition hover:scale-105"
                >
                  <PhoneCall className="w-4 h-4 text-slate-950" />
                  <span>Call Toll-Free: 1800-MED-NEED</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsRxModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-full text-xs transition"
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Upload Prescription for Review</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Store Locations & Express Coverage */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Hyperlocal Network</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Express Delivery Within 5–10 km in 45–60 Minutes
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our temperature-controlled dark pharmacies and fulfillment hubs ensure round-the-clock dispatch with end-to-end cold chain integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hub 1: Head Central Hub */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-soft-lg transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-teal-50 text-teal-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-teal-200">
                    CENTRAL DISPENSARY
                  </span>
                  <span className="text-[11px] text-teal-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    Open 24/7
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900">Pahal &amp; Balianta Hub</h4>
                <p className="text-xs text-slate-500">
                  NH-16 Twin City Corridor, Bhubaneswar 751035. Full temperature-controlled warehouse (&lt;25°C) &amp; biological cold storage (2–8°C).
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Coverage: 5–10 km</span>
                <span className="font-extrabold text-[#2563EB]">45 Min Avg Delivery</span>
              </div>
            </div>

            {/* Hub 2: North Zone */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-soft-lg transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-200">
                    NORTH EXPRESS DISPENSARY
                  </span>
                  <span className="text-[11px] text-teal-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    Open 24/7
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900">Patia &amp; Infocity Hub</h4>
                <p className="text-xs text-slate-500">
                  KIIT Square - Infocity Road, Bhubaneswar 751024. Express delivery to Patia, Chandrasekharpur, Sailashree Vihar, and Niladri Vihar.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Coverage: 5–8 km</span>
                <span className="font-extrabold text-[#2563EB]">40 Min Avg Delivery</span>
              </div>
            </div>

            {/* Hub 3: South & Twin City Link */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4 hover:shadow-soft-lg transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200">
                    SOUTH &amp; CUTTACK EXPRESS
                  </span>
                  <span className="text-[11px] text-teal-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    Open 24/7
                  </span>
                </div>
                <h4 className="text-lg font-black text-slate-900">Old Town &amp; Cuttack Link</h4>
                <p className="text-xs text-slate-500">
                  Station Square / Badambadi Link, 751001 &amp; 753001. High-frequency express runners with live OTP handovers.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Coverage: 6–10 km</span>
                <span className="font-extrabold text-[#2563EB]">50 Min Avg Delivery</span>
              </div>
            </div>
          </div>

          {/* Location eligibility bar */}
          <div className="mt-8 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900">Check Your Pin Code Delivery Speed</div>
                <div className="text-[11px] text-slate-500">Current active delivery area: PIN {userPincode}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPincodeModalOpen(true)}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs px-6 py-2.5 rounded-full transition shadow-soft-sm"
            >
              Verify Your Pincode →
            </button>
          </div>
        </section>
      </div>

      {/* Modals: Upload Prescription & Pincode Selection */}
      <PrescriptionUploadModal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} />
      <PincodeModal isOpen={isPincodeModalOpen} onClose={() => setIsPincodeModalOpen(false)} />
    </div>
  );
}
