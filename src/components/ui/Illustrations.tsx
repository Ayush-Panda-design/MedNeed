'use client';

import React from 'react';

// 1. Floating Pills & Capsules Scene (for Hero and Banners)
export function FloatingPillsHero({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id="pillGrad1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0F5132" />
        </linearGradient>
        <linearGradient id="pillGrad2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8585" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>
        <linearGradient id="pillGrad3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="whiteCapsule" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0F5132" floodOpacity="0.22" />
        </filter>
        <filter id="coralGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#FF6B6B" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Background ambient circular gradients */}
      <circle cx="160" cy="110" r="90" fill="url(#pillGrad1)" opacity="0.08" />
      <circle cx="240" cy="60" r="40" fill="url(#pillGrad2)" opacity="0.06" />

      {/* Main Emerald Capsule (angled) */}
      <g className="animate-float-bob" filter="url(#softGlow)" transform="translate(110, 60) rotate(-28)">
        <rect x="0" y="0" width="100" height="42" rx="21" fill="url(#pillGrad1)" />
        {/* Half split */}
        <path d="M 50 0 H 79 A 21 21 0 0 1 100 21 A 21 21 0 0 1 79 42 H 50 Z" fill="url(#whiteCapsule)" />
        {/* Center divider line */}
        <line x1="50" y1="1" x2="50" y2="41" stroke="#CBD5E1" strokeWidth="1.5" />
        {/* Capsule shine highlight */}
        <rect x="8" y="7" width="84" height="6" rx="3" fill="#FFFFFF" opacity="0.45" />
        {/* Subtle cross watermark on capsule */}
        <path d="M 24 16 H 30 M 27 13 V 19" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Small Coral Floating Pill */}
      <g className="animate-float-bob-rev" filter="url(#coralGlow)" transform="translate(40, 120) rotate(18)">
        <rect x="0" y="0" width="70" height="30" rx="15" fill="url(#pillGrad2)" />
        <path d="M 35 0 H 55 A 15 15 0 0 1 70 15 A 15 15 0 0 1 55 30 H 35 Z" fill="#FFF5F5" />
        <line x1="35" y1="1" x2="35" y2="29" stroke="#FED7D7" strokeWidth="1" />
        <rect x="6" y="5" width="58" height="4" rx="2" fill="#FFFFFF" opacity="0.5" />
      </g>

      {/* Round Tablet with score line */}
      <g className="animate-float-bob" transform="translate(230, 115)">
        <circle cx="26" cy="26" r="24" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="26" cy="26" r="22" fill="#F8FAFC" />
        {/* Bevel highlight */}
        <path d="M 8 20 A 20 20 0 0 1 44 20" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        {/* Break line */}
        <line x1="14" y1="26" x2="38" y2="26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Amber Vitamin Bubble */}
      <g className="animate-float-bob-rev" transform="translate(245, 35)">
        <circle cx="16" cy="16" r="14" fill="url(#pillGrad3)" opacity="0.9" />
        <circle cx="12" cy="12" r="4" fill="#FFFFFF" opacity="0.6" />
      </g>

      {/* Sparkles */}
      <path d="M 70 45 L 72 38 L 74 45 L 81 47 L 74 49 L 72 56 L 70 49 L 63 47 Z" fill="#F59E0B" opacity="0.75" />
      <path d="M 210 180 L 211 175 L 212 180 L 217 181 L 212 182 L 211 187 L 210 182 L 205 181 Z" fill="#10B981" opacity="0.75" />
    </svg>
  );
}

// 2. Delivery Scooter with Route & Express Speed Trails
export function DeliveryScooterScene({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
    >
      <defs>
        <linearGradient id="scooterBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0F5132" />
        </linearGradient>
        <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0F5132" />
          <stop offset="100%" stopColor="#062015" />
        </linearGradient>
      </defs>

      {/* Ground Dotted Route Path */}
      <path
        d="M 10 135 C 70 135 110 135 230 135"
        stroke="#10B981"
        strokeWidth="3"
        strokeDasharray="6 6"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Speed Trails */}
      <line x1="20" y1="95" x2="55" y2="95" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <line x1="35" y1="110" x2="65" y2="110" stroke="#10B981" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="15" y1="120" x2="45" y2="120" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

      {/* Scooter Chassis & Body */}
      <g transform="translate(65, 30)">
        {/* Delivery Box at Rear */}
        <rect x="10" y="32" width="34" height="34" rx="6" fill="url(#boxGrad)" />
        {/* MedNeed cross on delivery box */}
        <path d="M 27 42 V 56 M 20 49 H 34" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />

        {/* Scooter Main Frame */}
        <path
          d="M 40 66 L 56 66 L 72 45 L 86 45"
          stroke="#0F5132"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Front Apron & Shield */}
        <path
          d="M 80 40 L 92 68 C 93 72 90 76 85 76 L 72 76"
          fill="url(#scooterBody)"
        />

        {/* Handlebars */}
        <path d="M 82 36 L 90 34 M 84 34 L 88 28" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
        {/* Headlight with glow */}
        <circle cx="94" cy="46" r="4.5" fill="#FBBF24" />
        <path d="M 98 44 L 115 38 L 115 54 Z" fill="#FBBF24" opacity="0.25" />

        {/* Seat */}
        <rect x="36" y="50" width="26" height="8" rx="4" fill="#1E293B" />

        {/* Rear Wheel */}
        <circle cx="28" cy="85" r="16" fill="#1E293B" />
        <circle cx="28" cy="85" r="10" fill="#E2E8F0" />
        <circle cx="28" cy="85" r="4" fill="#0F5132" />

        {/* Front Wheel */}
        <circle cx="92" cy="85" r="16" fill="#1E293B" />
        <circle cx="92" cy="85" r="10" fill="#E2E8F0" />
        <circle cx="92" cy="85" r="4" fill="#0F5132" />

        {/* Mudguards */}
        <path d="M 12 80 A 18 18 0 0 1 44 80" stroke="#0F5132" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M 76 80 A 18 18 0 0 1 108 80" stroke="#0F5132" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

// 3. Diagnostic Blood Test Tubes with Vacutainers & Meniscus
export function LabTubesIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
    >
      <defs>
        <linearGradient id="glassTube" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#E0F2FE" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="bloodRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
        <linearGradient id="serumGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>

      {/* Tube 1: Lavender Cap (EDTA - CBC) */}
      <g transform="translate(45, 20)">
        {/* Tube Cap */}
        <rect x="0" y="0" width="26" height="20" rx="4" fill="#8B5CF6" />
        <rect x="2" y="16" width="22" height="4" fill="#7C3AED" />
        {/* Glass Body */}
        <rect x="2" y="20" width="22" height="90" fill="url(#glassTube)" stroke="#94A3B8" strokeWidth="1" />
        <path d="M 2 110 C 2 122 24 122 24 110 Z" fill="url(#glassTube)" stroke="#94A3B8" strokeWidth="1" />
        {/* Fluid level */}
        <path d="M 3 65 H 23 V 110 C 23 121 3 121 3 110 Z" fill="url(#bloodRed)" />
        {/* Barcode label */}
        <rect x="4" y="32" width="18" height="24" rx="2" fill="#FFFFFF" />
        <line x1="7" y1="36" x2="7" y2="52" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="11" y1="36" x2="11" y2="52" stroke="#1E293B" strokeWidth="1" />
        <line x1="14" y1="36" x2="14" y2="52" stroke="#1E293B" strokeWidth="2" />
        <line x1="18" y1="36" x2="18" y2="52" stroke="#1E293B" strokeWidth="1" />
      </g>

      {/* Tube 2: Red Cap (Clot Activator) */}
      <g transform="translate(85, 35)">
        <rect x="0" y="0" width="26" height="20" rx="4" fill="#EF4444" />
        <rect x="2" y="16" width="22" height="4" fill="#DC2626" />
        <rect x="2" y="20" width="22" height="85" fill="url(#glassTube)" stroke="#94A3B8" strokeWidth="1" />
        <path d="M 2 105 C 2 117 24 117 24 105 Z" fill="url(#glassTube)" stroke="#94A3B8" strokeWidth="1" />
        <path d="M 3 55 H 23 V 105 C 23 116 3 116 3 105 Z" fill="url(#bloodRed)" />
        {/* Barcode */}
        <rect x="4" y="30" width="18" height="20" rx="2" fill="#FFFFFF" />
        <line x1="7" y1="34" x2="7" y2="46" stroke="#1E293B" strokeWidth="1" />
        <line x1="10" y1="34" x2="10" y2="46" stroke="#1E293B" strokeWidth="2" />
        <line x1="14" y1="34" x2="14" y2="46" stroke="#1E293B" strokeWidth="1" />
        <line x1="18" y1="34" x2="18" y2="46" stroke="#1E293B" strokeWidth="1.5" />
      </g>

      {/* Tube 3: Gold Cap (SST - Serum Gel) */}
      <g transform="translate(125, 15)">
        <rect x="0" y="0" width="26" height="20" rx="4" fill="#F59E0B" />
        <rect x="2" y="16" width="22" height="4" fill="#D97706" />
        <rect x="2" y="20" width="22" height="95" fill="url(#glassTube)" stroke="#94A3B8" strokeWidth="1" />
        <path d="M 2 115 C 2 127 24 127 24 115 Z" fill="url(#glassTube)" stroke="#94A3B8" strokeWidth="1" />
        <path d="M 3 70 H 23 V 115 C 23 126 3 126 3 115 Z" fill="url(#serumGold)" />
        <rect x="4" y="32" width="18" height="24" rx="2" fill="#FFFFFF" />
        <line x1="7" y1="36" x2="7" y2="52" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="12" y1="36" x2="12" y2="52" stroke="#1E293B" strokeWidth="1" />
        <line x1="16" y1="36" x2="16" y2="52" stroke="#1E293B" strokeWidth="2" />
      </g>

      {/* Floating Sparkles & Sterile Tag */}
      <g className="animate-float-bob" transform="translate(160, 50)">
        <rect x="0" y="0" width="48" height="22" rx="11" fill="#10B981" />
        <text x="24" y="15" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
          NABL
        </text>
      </g>
    </svg>
  );
}

// 4. Pharmacy Storefront Illustration (for Franchise & Banners)
export function StorefrontIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
    >
      <defs>
        <linearGradient id="awningGreen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0F5132" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="glassReflection" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ECFDF5" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Base Building Structure */}
      <rect x="30" y="55" width="220" height="135" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />

      {/* Store Signboard Banner */}
      <rect x="25" y="25" width="230" height="36" rx="6" fill="#0F5132" />
      {/* Illuminated MedNeed Cross */}
      <rect x="38" y="33" width="20" height="20" rx="4" fill="#10B981" />
      <path d="M 48 37 V 49 M 42 43 H 54" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <text x="68" y="48" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="sans-serif">
        Med<tspan fill="#34D399">Need</tspan>
      </text>
      <text x="160" y="46" fill="#A7F3D0" fontSize="9" fontWeight="bold" letterSpacing="0.05em">
        PHARMACY & LAB
      </text>

      {/* Striped Awning */}
      <path d="M 20 61 L 30 78 H 250 L 260 61 Z" fill="url(#awningGreen)" />
      {/* Stripes */}
      <polygon points="50,61 58,78 74,78 66,61" fill="#FFFFFF" opacity="0.3" />
      <polygon points="100,61 108,78 124,78 116,61" fill="#FFFFFF" opacity="0.3" />
      <polygon points="150,61 158,78 174,78 166,61" fill="#FFFFFF" opacity="0.3" />
      <polygon points="200,61 208,78 224,78 216,61" fill="#FFFFFF" opacity="0.3" />

      {/* Large Glass Window (Left) */}
      <rect x="44" y="90" width="105" height="85" rx="4" fill="url(#glassReflection)" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Shelves inside display window */}
      <line x1="48" y1="115" x2="145" y2="115" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="48" y1="140" x2="145" y2="140" stroke="#CBD5E1" strokeWidth="2" />
      {/* Medicine boxes on shelf */}
      <rect x="55" y="103" width="14" height="12" rx="2" fill="#10B981" />
      <rect x="73" y="100" width="10" height="15" rx="1.5" fill="#FF6B6B" />
      <rect x="87" y="105" width="18" height="10" rx="2" fill="#3B82F6" />
      <rect x="115" y="102" width="12" height="13" rx="2" fill="#F59E0B" />

      {/* Glass Reflection Streak */}
      <polygon points="60,91 75,91 48,174 44,174" fill="#FFFFFF" opacity="0.5" />

      {/* Glass Entry Door (Right) */}
      <rect x="165" y="90" width="70" height="100" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
      <rect x="172" y="96" width="56" height="52" rx="2" fill="url(#glassReflection)" />
      {/* Door handle */}
      <rect x="174" y="138" width="4" height="16" rx="2" fill="#334155" />
      {/* 24x7 Express badge on door */}
      <circle cx="200" cy="120" r="14" fill="#0F5132" />
      <text x="200" y="123" fill="#34D399" fontSize="8" fontWeight="bold" textAnchor="middle">
        24×7
      </text>

      {/* Floor Pavers */}
      <line x1="10" y1="192" x2="270" y2="192" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// 5. Empty Cart Basket with Floating Bobbing Pills
export function EmptyCartIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none ${className}`}
    >
      <defs>
        <linearGradient id="basketGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0F5132" />
        </linearGradient>
      </defs>

      {/* Soft shadow */}
      <ellipse cx="120" cy="155" rx="65" ry="10" fill="#0F5132" opacity="0.1" />

      {/* Basket Body */}
      <g transform="translate(60, 60)">
        {/* Handles */}
        <path
          d="M 25 35 C 25 5 95 5 95 35"
          stroke="#0F5132"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Wire mesh basket container */}
        <path
          d="M 12 35 L 26 85 C 27 88 30 90 34 90 H 86 C 90 90 93 88 94 85 L 108 35 Z"
          fill="#ECFDF5"
          stroke="url(#basketGrad)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Basket Rim */}
        <rect x="8" y="32" width="104" height="7" rx="3.5" fill="url(#basketGrad)" />

        {/* Mesh grid lines */}
        <line x1="32" y1="38" x2="42" y2="88" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="60" y1="38" x2="60" y2="88" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="88" y1="38" x2="78" y2="88" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="20" y1="58" x2="100" y2="58" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
        <line x1="24" y1="74" x2="96" y2="74" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
      </g>

      {/* Floating Bobbing Capsule above basket */}
      <g className="animate-float-bob" transform="translate(100, 25) rotate(-22)">
        <rect x="0" y="0" width="46" height="20" rx="10" fill="#10B981" />
        <path d="M 23 0 H 36 A 10 10 0 0 1 46 10 A 10 10 0 0 1 36 20 H 23 Z" fill="#FFFFFF" />
        <line x1="23" y1="0" x2="23" y2="20" stroke="#CBD5E1" strokeWidth="1" />
      </g>

      {/* Floating Coral Bubble */}
      <circle cx="65" cy="50" r="10" fill="#FF6B6B" opacity="0.85" className="animate-float-bob-rev" />

      {/* Sparkles */}
      <path d="M 170 45 L 172 38 L 174 45 L 181 47 L 174 49 L 172 56 L 170 49 L 163 47 Z" fill="#F59E0B" />
    </svg>
  );
}

// 6. Dosage Form SVG Icons
export function DosageFormIcon({
  form,
  className = 'w-5 h-5',
}: {
  form: string;
  className?: string;
}) {
  const f = form.toLowerCase();

  if (f.includes('syrup') || f.includes('liquid') || f.includes('suspension')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M8 2h8v3H8z" />
        <path d="M9 5v3a3 3 0 0 1-3 3v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9a3 3 0 0 1-3-3V5" />
        <line x1="10" y1="15" x2="14" y2="15" />
      </svg>
    );
  }

  if (f.includes('inj') || f.includes('vial') || f.includes('injection')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-.4.4-1 .6-1.6.6H3v-4.1c0-.6.2-1.2.6-1.6L13.9 4" />
        <path d="m14 5 5 5" />
        <path d="m5 19-3 3" />
      </svg>
    );
  }

  if (f.includes('gel') || f.includes('cream') || f.includes('ointment')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 21h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
        <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        <path d="M10 13c1-2 3-2 4 0" />
      </svg>
    );
  }

  if (f.includes('drop') || f.includes('eye') || f.includes('nasal')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-6-2.2-2.3-4-9-4-9s-1.8 6.7-4 9c-2 2.1-3 4-3 6a7 7 0 0 0 7 7z" />
      </svg>
    );
  }

  if (f.includes('capsule')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-30 12 12)" />
        <line x1="12" y1="7" x2="12" y2="17" transform="rotate(-30 12 12)" />
      </svg>
    );
  }

  // Default: Tablet
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

// 7. ECG Heartbeat Line Animated SVG
export function HeartbeatLine({ className = 'w-full h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M 0 25 L 140 25 L 155 10 L 165 42 L 180 5 L 195 38 L 205 25 L 350 25 L 365 10 L 375 42 L 390 5 L 405 38 L 415 25 L 600 25"
        stroke="#10B981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
    </svg>
  );
}

// 8. Wave Curve Divider for Footer
export function WaveDivider({ className = 'w-full h-8 text-slate-900' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M 0 30 Q 360 60 720 30 T 1440 30 V 60 H 0 Z"
        fill="currentColor"
      />
    </svg>
  );
}
