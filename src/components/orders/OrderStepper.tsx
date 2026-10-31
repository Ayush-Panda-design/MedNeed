'use client';

import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface OrderStepperProps {
  status: string;
  isRx?: boolean;
  className?: string;
}

interface StepItem {
  key: string;
  label: string;
  activeLabel?: string;
}

export function OrderStepper({ status, isRx = false, className = '' }: OrderStepperProps) {
  const normalizedStatus = (status || '').toUpperCase();

  // If order is cancelled, show an informative alert state
  if (normalizedStatus === 'CANCELLED') {
    return (
      <div className={`p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 ${className}`}>
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
        <p className="font-medium">
          Order cancelled. Any payment debited has been initiated for automated reversal.
        </p>
      </div>
    );
  }

  const steps: StepItem[] = [
    { key: 'PLACED', label: 'Placed' },
    { key: 'VERIFIED', label: isRx ? 'Rx Verified' : 'Verified' },
    { key: 'PACKED', label: 'Packed' },
    { key: 'DELIVERED', label: 'Delivered', activeLabel: 'On The Way' },
  ];

  // Determine current active step index (0-3) and percentage fill
  let activeIndex = 0;
  let progressPercent = 0;
  let isStepDelivered = false;

  switch (normalizedStatus) {
    case 'PLACED':
      activeIndex = 0;
      progressPercent = 0;
      break;
    case 'RX_VERIFICATION':
      activeIndex = 1;
      progressPercent = 33.33;
      break;
    case 'PACKED':
      activeIndex = 2;
      progressPercent = 66.66;
      break;
    case 'OUT_FOR_DELIVERY':
      activeIndex = 3;
      progressPercent = 85;
      break;
    case 'DELIVERED':
      activeIndex = 3;
      progressPercent = 100;
      isStepDelivered = true;
      break;
    default:
      activeIndex = 1;
      progressPercent = 33.33;
  }

  return (
    <div className={`w-full py-1 ${className}`} aria-label="Order progress stepper">
      <div className="relative">
        {/* Background track line */}
        <div
          className="absolute top-3.5 sm:top-4 left-4 right-4 sm:left-6 sm:right-6 h-0.5 bg-slate-100 -translate-y-1/2 z-0"
          aria-hidden="true"
        >
          {/* Animated fill line */}
          <div
            className={`h-full transition-all duration-700 ease-out ${
              isStepDelivered ? 'bg-emerald-500' : 'bg-brand-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Nodes */}
        <div className="relative z-10 flex justify-between items-start">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIndex || (idx === 3 && isStepDelivered);
            const isCurrent = idx === activeIndex && !isStepDelivered;
            const isPending = idx > activeIndex;

            const displayLabel = isCurrent && step.activeLabel ? step.activeLabel : step.label;

            return (
              <div
                key={step.key}
                className="flex flex-col items-center group text-center min-w-[58px] sm:min-w-[72px]"
              >
                {/* Circle Indicator */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : isCurrent
                      ? 'bg-white border-2 border-brand-600 text-brand-600 ring-4 ring-brand-100 shadow-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-300'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" aria-hidden="true" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  )}
                </div>

                {/* Step Text */}
                <span
                  className={`mt-1.5 text-[11px] sm:text-xs tracking-tight transition-colors ${
                    isCompleted
                      ? 'font-semibold text-slate-800'
                      : isCurrent
                      ? 'font-bold text-brand-700'
                      : 'font-medium text-slate-400'
                  }`}
                >
                  {displayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderStepper;
