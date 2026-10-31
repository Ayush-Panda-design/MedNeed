'use client';

import React from 'react';
import {
  Clock,
  FileText,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

interface StatusConfig {
  label: string;
  badgeClasses: string;
  dotClasses: string;
  icon: LucideIcon;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  PLACED: {
    label: 'Order Placed',
    badgeClasses: 'bg-blue-50 text-blue-800 border-blue-200/70',
    dotClasses: 'bg-blue-500',
    icon: Clock,
  },
  RX_VERIFICATION: {
    label: 'Verifying prescription',
    badgeClasses: 'bg-amber-50 text-amber-900 border-amber-200/80',
    dotClasses: 'bg-amber-500',
    icon: FileText,
  },
  PACKED: {
    label: 'Packed · ready for pickup',
    badgeClasses: 'bg-sky-50 text-sky-900 border-sky-200/70',
    dotClasses: 'bg-sky-500',
    icon: Package,
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for delivery',
    badgeClasses: 'bg-indigo-50 text-indigo-900 border-indigo-200/70',
    dotClasses: 'bg-indigo-500',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Delivered',
    badgeClasses: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    dotClasses: 'bg-emerald-600',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClasses: 'bg-rose-50 text-rose-900 border-rose-200/80',
    dotClasses: 'bg-rose-500',
    icon: XCircle,
  },
};

function formatFallbackStatus(raw: string): string {
  if (!raw) return 'Processing';
  return raw
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const normalizedStatus = (status || '').toUpperCase();
  const config = STATUS_CONFIG_MAP[normalizedStatus] || {
    label: formatFallbackStatus(status),
    badgeClasses: 'bg-slate-100 text-slate-800 border-slate-200',
    dotClasses: 'bg-slate-400',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1.5'
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs select-none transition-colors ${sizeClasses} ${config.badgeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        {normalizedStatus === 'RX_VERIFICATION' || normalizedStatus === 'OUT_FOR_DELIVERY' ? (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dotClasses}`} />
        ) : null}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dotClasses}`} />
      </span>
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
      <span className="font-semibold">{config.label}</span>
    </span>
  );
}

export default StatusBadge;
