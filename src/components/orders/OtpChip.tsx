'use client';

import React, { useState } from 'react';
import { Lock, Check, Copy } from 'lucide-react';

interface OtpChipProps {
  otp?: string | number | null;
  className?: string;
}

export function OtpChip({ otp, className = '' }: OtpChipProps) {
  const [copied, setCopied] = useState(false);

  if (!otp) return null;

  const otpString = String(otp);

  const handleCopy = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(otpString);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCopy(e);
        }
      }}
      aria-label={`Delivery Handover OTP is ${otpString}. Click to copy.`}
      className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 hover:bg-amber-100/90 hover:border-amber-300 transition-all cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 select-none ${className}`}
      title="Click to copy delivery OTP"
    >
      <div className="flex items-center justify-center w-5 h-5 rounded-lg bg-amber-100 text-amber-700 shrink-0 group-hover:bg-amber-200/80 transition-colors">
        <Lock className="w-3 h-3" aria-hidden="true" />
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800/90 font-sans">
          OTP
        </span>
        <span className="text-base sm:text-lg font-bold font-sans tracking-[0.22em] text-amber-950 tabular-nums">
          {otpString}
        </span>
      </div>

      <div className="ml-0.5 text-amber-700/80 group-hover:text-amber-900 transition-colors flex items-center">
        {copied ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Copied</span>
          </span>
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
        )}
      </div>

      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
          Copied to clipboard!
        </span>
      )}
    </div>
  );
}

export default OtpChip;
