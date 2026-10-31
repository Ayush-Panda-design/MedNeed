'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Clock,
  AlertCircle,
  MapPin,
  FileText,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Pill,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import OtpChip from './OtpChip';
import OrderStepper from './OrderStepper';

interface OrderItem {
  id?: string;
  title: string;
  quantity: number;
  unitPrice: number | string;
  mrp?: number | string;
  batchNumber?: string;
  type?: string;
  packaging?: string;
}

interface OrderData {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt?: string;
  finalTotal: number | string;
  deliveryOtp?: string | number;
  address?: string;
  pincode?: string;
  prescriptionStatus?: string;
  items?: OrderItem[];
  delivery?: {
    deliveryOtp?: string | number;
    riderName?: string;
    estimatedMinutes?: number;
  };
}

interface OrderCardProps {
  order: OrderData;
  animationDelayMs?: number;
}

function formatPaymentMethod(method?: string): string {
  if (!method) return 'Online';
  if (method === 'RAZORPAY_UPI') return 'UPI';
  if (method === 'RAZORPAY_CARD') return 'Card';
  if (method === 'COD') return 'Cash on Delivery';
  return method.replace(/_/g, ' ');
}

function getItemPackInfo(item: OrderItem): string {
  if (item.packaging) {
    return `${item.packaging} · Qty ${item.quantity || 1}`;
  }
  const title = (item.title || '').toLowerCase();
  if (title.includes('tablet')) {
    return `Strip of 10 Tablets · Qty ${item.quantity || 1}`;
  }
  if (title.includes('capsule')) {
    return `Strip of 15 Capsules · Qty ${item.quantity || 1}`;
  }
  if (title.includes('syrup') || title.includes('suspension')) {
    return `100ml Bottle · Qty ${item.quantity || 1}`;
  }
  if (title.includes('drop') || title.includes('dropper')) {
    return `10ml Dropper · Qty ${item.quantity || 1}`;
  }
  if (title.includes('gel') || title.includes('ointment')) {
    return `30g Tube · Qty ${item.quantity || 1}`;
  }
  if (title.includes('test') || title.includes('checkup') || title.includes('profile')) {
    return `Diagnostic Test · Qty ${item.quantity || 1}`;
  }
  return `Pack of 1 · Qty ${item.quantity || 1}`;
}

function getShortAddress(address?: string): string {
  if (!address) return 'Home';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    return parts[0].length > 28 ? `${parts[0].slice(0, 26)}...` : parts[0];
  }
  return 'Home';
}

export function OrderCard({ order, animationDelayMs = 0 }: OrderCardProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const [showAddressDetails, setShowAddressDetails] = useState(false);

  const isPaid = order.paymentStatus === 'PAID';
  const isPending = order.paymentStatus === 'PENDING';
  const isFailed = order.paymentStatus === 'FAILED';

  const items = order.items || [];
  const primaryItem = items[0] || {
    title: 'Standard Pharmacy Order',
    quantity: 1,
    unitPrice: order.finalTotal,
  };
  const extraItemsCount = Math.max(0, items.length - 1);

  const otp = order.deliveryOtp || order.delivery?.deliveryOtp;
  const isRx =
    order.prescriptionStatus === 'PENDING_REVIEW' ||
    order.orderStatus === 'RX_VERIFICATION';

  const placedDateFormatted = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isDiagnostic =
    primaryItem.type === 'DIAGNOSTIC_TEST' ||
    (primaryItem.title || '').toLowerCase().includes('test') ||
    (primaryItem.title || '').toLowerCase().includes('checkup');

  return (
    <article
      className="bg-white rounded-2xl sm:rounded-[20px] p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)] border border-slate-100 hover:border-slate-200/90 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)] transition-all duration-200 ease-out space-y-5 animate-order-fade-up"
      style={{ animationDelay: `${animationDelayMs}ms` }}
      aria-label={`Order ${order.id}`}
    >
      {/* 1. Header Bar: Status Badge + Paid state + Order ID & Placed Date */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100/90">
        <div className="flex items-center flex-wrap gap-2.5">
          <StatusBadge status={order.orderStatus} />

          {/* Clean, subtle Paid state */}
          {isPaid && (
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-100/80 px-2 py-0.5 rounded-full select-none"
              title={`Payment completed via ${formatPaymentMethod(order.paymentMethod)}`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" aria-hidden="true" />
              <span>Paid {order.paymentMethod ? `· ${formatPaymentMethod(order.paymentMethod)}` : ''}</span>
            </span>
          )}

          {isPending && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-full select-none">
              <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>Payment Pending</span>
            </span>
          )}

          {isFailed && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50/70 border border-rose-200/60 px-2 py-0.5 rounded-full select-none">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
              <span>Payment Failed</span>
            </span>
          )}
        </div>

        {/* Right side: Muted Order ID & Date */}
        <div className="text-right text-xs text-slate-500 font-sans flex items-center gap-2">
          <span className="font-medium text-slate-600">#{order.id}</span>
          <span className="text-slate-300" aria-hidden="true">•</span>
          <time dateTime={order.createdAt || ''} className="text-slate-500">
            {placedDateFormatted}
          </time>
        </div>
      </div>

      {/* 2. Product Hero Row + Handover OTP + Total Price */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Product Hero Info */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* 64px rounded-xl product thumbnail */}
          <div
            className={`w-16 h-16 rounded-xl shrink-0 flex items-center justify-center transition-colors ${
              isDiagnostic
                ? 'bg-teal-50 border border-teal-100/80 text-teal-600'
                : 'bg-brand-50 border border-brand-100/80 text-brand-600'
            }`}
            aria-hidden="true"
          >
            {isDiagnostic ? (
              <FlaskConical className="w-8 h-8" />
            ) : (
              <Pill className="w-8 h-8 -rotate-45" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className="text-base sm:text-[17px] font-semibold text-slate-900 tracking-tight leading-snug truncate"
              title={primaryItem.title}
            >
              {primaryItem.title}
            </h3>

            <p className="text-xs sm:text-[13px] text-slate-500 font-medium">
              {getItemPackInfo(primaryItem)}
            </p>

            {extraItemsCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllItems(!showAllItems)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors pt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded"
              >
                <span>
                  {showAllItems ? 'Hide extra items' : `+${extraItemsCount} more item${extraItemsCount > 1 ? 's' : ''}`}
                </span>
                {showAllItems ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Handover OTP Chip & Price on right */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
          {/* Handover OTP Chip */}
          {otp && order.orderStatus !== 'CANCELLED' && (
            <OtpChip otp={otp} />
          )}

          {/* Clean Price Display */}
          <div className="text-right">
            <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 font-sans tabular-nums tracking-tight">
              ₹{Number(order.finalTotal).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Multi-item List (if order has > 1 item) */}
      {showAllItems && items.length > 1 && (
        <div className="bg-slate-50/80 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs animate-in fade-in duration-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200/60">
            All Items in this Order ({items.length})
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center py-1 text-xs">
              <div className="text-slate-700 min-w-0 pr-3">
                <span className="font-semibold text-slate-900">{it.title}</span>{' '}
                <span className="text-slate-500">× {it.quantity}</span>
                <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">
                  ({getItemPackInfo(it)})
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums shrink-0 font-sans">
                ₹{(Number(it.unitPrice) * it.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. 4-Step Progress Stepper */}
      <div className="pt-2">
        <OrderStepper status={order.orderStatus} isRx={isRx} />
      </div>

      {/* 4. Delivery Address & Action Buttons */}
      <div className="pt-3 border-t border-slate-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Address summary */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setShowAddressDetails(!showAddressDetails)}
            className="flex items-center gap-1.5 text-left text-slate-600 hover:text-slate-900 transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 rounded py-0.5"
            aria-expanded={showAddressDetails}
            aria-label="Toggle full delivery address details"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0" aria-hidden="true" />
            <span className="text-xs text-slate-600">
              Delivering to{' '}
              <strong className="font-semibold text-slate-800">
                {getShortAddress(order.address)}
              </strong>
              {order.pincode ? ` (${order.pincode})` : ''}
            </span>
          </button>

          {showAddressDetails && order.address && (
            <div className="mt-1.5 ml-5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {order.address}{order.pincode ? `, PIN: ${order.pincode}` : ''}
            </div>
          )}
        </div>

        {/* Action Buttons: Invoice (Secondary) & Track Order (Primary) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 shrink-0">
          {/* Secondary outlined button: Invoice */}
          <a
            href={`/api/orders/${encodeURIComponent(order.id)}/invoice?format=html`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={`View tax invoice for order ${order.id}`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Tax Invoice</span>
          </a>

          {/* Primary filled button: Track Order */}
          <Link
            href={`/track-delivery?orderId=${encodeURIComponent(order.id)}`}
            className="min-h-[40px] px-4 sm:px-5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-brand-600/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            aria-label={`Live tracking and OTP for order ${order.id}`}
          >
            <span>Track Order</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default OrderCard;
