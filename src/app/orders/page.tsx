'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  ShoppingBag,
  RotateCcw,
  AlertCircle,
  Lock,
} from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import OrderCard from '@/components/orders/OrderCard';
import OrderFilters, { FilterType } from '@/components/orders/OrderFilters';
import OrderSkeletonList from '@/components/orders/OrderSkeleton';
import OrderEmptyState from '@/components/orders/OrderEmptyState';

const ACTIVE_STATUSES = ['PLACED', 'RX_VERIFICATION', 'PACKED', 'OUT_FOR_DELIVERY'];

const DEMO_ORDERS = [
  {
    id: 'MN-2025-5434',
    customerName: 'Ayush Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Avenue, Model Town',
    pincode: '110009',
    distanceKm: 3.2,
    orderStatus: 'RX_VERIFICATION',
    paymentStatus: 'PAID',
    paymentMethod: 'RAZORPAY_UPI',
    deliveryOtp: '6536',
    finalTotal: 51.25,
    subtotal: 51.25,
    discountTotal: 0,
    deliveryFee: 0,
    createdAt: new Date().toISOString(),
    prescriptionStatus: 'PENDING_REVIEW',
    items: [
      {
        id: 'med-1',
        title: 'Dolo 650mg Tablet',
        type: 'MEDICINE',
        quantity: 1,
        mrp: 34.0,
        unitPrice: 30.6,
        packaging: 'Strip of 15 Tablets',
      },
      {
        id: 'med-9',
        title: 'Cetirizine 10mg Tablet',
        type: 'MEDICINE',
        quantity: 1,
        mrp: 23.0,
        unitPrice: 20.65,
        packaging: 'Strip of 10 Tablets',
      },
    ],
  },
  {
    id: 'MN-2025-5412',
    customerName: 'Ayush Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Sector 14, Hiran Magri, Udaipur',
    pincode: '313002',
    distanceKm: 4.1,
    orderStatus: 'PACKED',
    paymentStatus: 'PAID',
    paymentMethod: 'RAZORPAY_CARD',
    deliveryOtp: '8841',
    finalTotal: 338.3,
    subtotal: 398.0,
    discountTotal: 59.7,
    deliveryFee: 0,
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    items: [
      {
        id: 'med-2',
        title: 'Pan-D Capsule',
        type: 'MEDICINE',
        quantity: 2,
        mrp: 199.0,
        unitPrice: 169.15,
        packaging: 'Strip of 15 Capsules',
      },
    ],
  },
  {
    id: 'MN-2025-5389',
    customerName: 'Ayush Sharma',
    customerPhone: '+91 98765 43210',
    address: 'B-12, Park Street, New Delhi',
    pincode: '110001',
    distanceKm: 2.5,
    orderStatus: 'OUT_FOR_DELIVERY',
    paymentStatus: 'PAID',
    paymentMethod: 'RAZORPAY_UPI',
    deliveryOtp: '4219',
    finalTotal: 879.0,
    subtotal: 2198.0,
    discountTotal: 1319.0,
    deliveryFee: 0,
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(), // Yesterday
    items: [
      {
        id: 'diag-3',
        title: 'MedNeed Full Body Checkup - Basic (52 Tests)',
        type: 'DIAGNOSTIC_TEST',
        quantity: 1,
        mrp: 2198.0,
        unitPrice: 879.0,
      },
    ],
  },
  {
    id: 'MN-2025-5201',
    customerName: 'Ayush Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Avenue, Model Town',
    pincode: '110009',
    distanceKm: 3.2,
    orderStatus: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'COD',
    deliveryOtp: '1902',
    finalTotal: 125.0,
    subtotal: 140.0,
    discountTotal: 15.0,
    deliveryFee: 0,
    createdAt: new Date(Date.now() - 86400 * 1000 * 4).toISOString(), // 4 days ago
    items: [
      {
        id: 'med-15',
        title: 'Benadryl Cough Syrup 100ml',
        type: 'MEDICINE',
        quantity: 1,
        mrp: 140.0,
        unitPrice: 125.0,
        packaging: '100ml Bottle',
      },
    ],
  },
  {
    id: 'MN-2025-5110',
    customerName: 'Ayush Sharma',
    customerPhone: '+91 98765 43210',
    address: 'Flat 402, Green Avenue, Model Town',
    pincode: '110009',
    distanceKm: 3.2,
    orderStatus: 'CANCELLED',
    paymentStatus: 'REFUNDED',
    paymentMethod: 'RAZORPAY_UPI',
    deliveryOtp: '7721',
    finalTotal: 199.0,
    subtotal: 220.0,
    discountTotal: 21.0,
    deliveryFee: 0,
    createdAt: new Date(Date.now() - 86400 * 1000 * 7).toISOString(), // 7 days ago
    items: [
      {
        id: 'med-22',
        title: 'Volini Pain Relief Gel 30g',
        type: 'MEDICINE',
        quantity: 1,
        mrp: 220.0,
        unitPrice: 199.0,
        packaging: '30g Tube',
      },
    ],
  },
];

function formatDateGroup(dateString?: string): string {
  if (!dateString) return 'Earlier Orders';
  const orderDate = new Date(dateString);
  if (isNaN(orderDate.getTime())) return 'Earlier Orders';

  const now = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(orderDate, now)) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(orderDate, yesterday)) {
    return 'Yesterday';
  }

  return orderDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: orderDate.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

function OrdersContent() {
  const { currentUser } = useApp();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true' || searchParams.get('demo') === 'true';

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setIsLoading(false);
      if (res.ok && data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else if (res.status === 401) {
        setOrders([]);
      } else {
        setError(data.error || 'Failed to load orders.');
      }
    } catch {
      setIsLoading(false);
      setError('Network connection error loading orders.');
    }
  };

  useEffect(() => {
    if (isPreview) {
      setOrders(DEMO_ORDERS);
      setIsLoading(false);
      return;
    }

    if (currentUser) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, isPreview]);

  // Client-side filter counts
  const filterCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter((o) =>
        ACTIVE_STATUSES.includes((o.orderStatus || '').toUpperCase())
      ).length,
      delivered: orders.filter(
        (o) => (o.orderStatus || '').toUpperCase() === 'DELIVERED'
      ).length,
      cancelled: orders.filter(
        (o) => (o.orderStatus || '').toUpperCase() === 'CANCELLED'
      ).length,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (currentFilter === 'active') {
      return orders.filter((o) =>
        ACTIVE_STATUSES.includes((o.orderStatus || '').toUpperCase())
      );
    }
    if (currentFilter === 'delivered') {
      return orders.filter(
        (o) => (o.orderStatus || '').toUpperCase() === 'DELIVERED'
      );
    }
    if (currentFilter === 'cancelled') {
      return orders.filter(
        (o) => (o.orderStatus || '').toUpperCase() === 'CANCELLED'
      );
    }
    return orders;
  }, [orders, currentFilter]);

  // Group filtered orders by date heading (Today, Yesterday, or formatted date)
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: any[] } = {};

    // Sort descending by date
    const sorted = [...filteredOrders].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    sorted.forEach((order) => {
      const groupKey = formatDateGroup(order.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(order);
    });

    return groups;
  }, [filteredOrders]);

  if (!currentUser && !isPreview) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-brand-50 border border-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to View Orders</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Sign in to access your complete purchase history, delivery OTPs, and tax invoices.
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <GoogleSignInButton redirectUrl="/orders" buttonText="Sign In with Google" />
          <Link
            href="/auth/signin?redirect=/orders"
            className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Sign In with Password
          </Link>
        </div>
      </div>
    );
  }

  const groupKeys = Object.keys(groupedOrders);
  let globalCardIndex = 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-brand-50 border border-brand-100/80 text-brand-600 shadow-xs">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
              </span>
              <span>My Orders</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Track live deliveries, view tax invoices, and access handover OTPs.
            </p>
          </div>

          {/* Refresh button: Ghost icon button */}
          <button
            type="button"
            onClick={fetchOrders}
            disabled={isLoading}
            aria-label="Refresh orders list"
            title="Refresh orders"
            className="p-2.5 sm:px-3 sm:py-2 text-slate-600 hover:text-brand-600 border border-slate-200/90 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <RotateCcw
              className={`w-4 h-4 transition-transform ${isLoading ? 'animate-spin text-brand-600' : ''}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* 2. Filter Tabs */}
        {!isLoading && orders.length > 0 && (
          <OrderFilters
            currentFilter={currentFilter}
            counts={filterCounts}
            onFilterChange={setCurrentFilter}
          />
        )}
      </header>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state: Skeleton Cards */}
      {isLoading && <OrderSkeletonList count={3} />}

      {/* Empty State: Overall No Orders */}
      {!isLoading && !error && orders.length === 0 && (
        <OrderEmptyState />
      )}

      {/* Empty State: Filter returns 0 results */}
      {!isLoading && !error && orders.length > 0 && filteredOrders.length === 0 && (
        <OrderEmptyState
          currentFilter={currentFilter}
          onResetFilter={() => setCurrentFilter('all')}
        />
      )}

      {/* 3. Orders List grouped by Date */}
      {!isLoading && !error && filteredOrders.length > 0 && (
        <main className="space-y-8" id={`orders-panel-${currentFilter}`}>
          {groupKeys.map((dateHeading) => {
            const groupOrders = groupedOrders[dateHeading];

            return (
              <section key={dateHeading} className="space-y-4" aria-label={`Orders from ${dateHeading}`}>
                {/* Date Group Heading */}
                <div className="flex items-center gap-3 pt-1">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {dateHeading}
                  </h2>
                  <div className="h-px flex-1 bg-slate-200/70" aria-hidden="true" />
                  <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                    {groupOrders.length} {groupOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>

                {/* Cards in this Date Group */}
                <div className="space-y-4">
                  {groupOrders.map((order) => {
                    const delay = Math.min(globalCardIndex * 40, 240);
                    globalCardIndex += 1;

                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        animationDelayMs={delay}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrderSkeletonList count={2} />}>
      <OrdersContent />
    </Suspense>
  );
}
