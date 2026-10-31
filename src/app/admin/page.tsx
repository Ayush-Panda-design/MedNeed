'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AdminRole, OrderStatus } from '@/types';
import {
  ShieldCheck,
  Package,
  FileText,
  BadgePercent,
  RefreshCw,
  Activity,
  Building2,
  ListCheck,
  TrendingUp,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  UserCheck,
  Sliders,
  DollarSign,
  Plus,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    medicines,
    orders,
    franchiseInquiries,
    discountRules,
    applyBulkDiscount,
    toggleDiscountRule,
    syncLocalWellStock,
    updateMedicineMRP,
    currentAdmin,
    currentUser,
    updateOrderStatus,
    verifyPrescription,
    updateFranchiseStatus,
    auditLogs,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'ORDERS' | 'PRESCRIPTIONS' | 'DISCOUNTS' | 'LOCALWELL' | 'LAB_TESTS' | 'FRANCHISE' | 'AUDIT'
  >('OVERVIEW');

  // Bulk Discount Form State
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [discountScope, setDiscountScope] = useState<'ALL_MEDICINES' | 'CATEGORY'>('ALL_MEDICINES');
  const [targetCategory, setTargetCategory] = useState<string>('Diabetes');
  const [discountFeedback, setDiscountFeedback] = useState<string | null>(null);

  // LocalWell Price inflation adjuster state
  const [selectedMedForHike, setSelectedMedForHike] = useState<string>(medicines[0]?.id || '');
  const [newHikedMRP, setNewHikedMRP] = useState<number>(40);
  const [hikeReason, setHikeReason] = useState<string>('Manufacturer revised MRP under DPCO annual notification');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setAdminNotice({ type, message });
    setTimeout(() => setAdminNotice(null), 4500);
  };

  // Rider Assignment State
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [riderName, setRiderName] = useState('Sunil Kumar');
  const [riderPhone, setRiderPhone] = useState('+91 98112 34567');
  const [riderEtaMins, setRiderEtaMins] = useState(25);

  // Stats calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.finalTotal : 0), 0);
  const pendingRxOrders = orders.filter((o) => o.orderStatus === 'RX_VERIFICATION');
  const activeDiscountsCount = discountRules.filter((r) => r.isActive).length;

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    applyBulkDiscount(discountScope, Number(discountPercent), targetCategory);
    setDiscountFeedback(`Successfully applied ${discountPercent}% discount on ${discountScope === 'ALL_MEDICINES' ? 'ALL MEDICINES' : targetCategory}!`);
    showNotice('success', `Bulk discount of ${discountPercent}% applied across catalog.`);
    setTimeout(() => setDiscountFeedback(null), 3500);
  };

  const handleSyncLocalWell = () => {
    const res = syncLocalWellStock('LocalWell_Export_Oct22.xlsx');
    setSyncFeedback(res.message);
    showNotice('success', res.message);
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleSaveMRPHike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForHike || newHikedMRP <= 0) return;
    updateMedicineMRP(selectedMedForHike, Number(newHikedMRP), hikeReason);
    showNotice('success', `MRP updated to ₹${newHikedMRP}. Selling price recalculated and logged to Audit Trail.`);
  };

  const handleAssignRiderSubmit = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'OUT_FOR_DELIVERY', {
        riderName,
        riderPhone,
        estimatedMinutes: Number(riderEtaMins),
      });
      setAssigningOrderId(null);
      showNotice('success', `Rider ${riderName} assigned to Order #${orderId} (ETA: ${riderEtaMins} mins).`);
    } catch (err: any) {
      showNotice('error', `Dispatch error: ${err.message || 'Failed to assign rider'}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Toast Feedback */}
      {adminNotice && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom ${
            adminNotice.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500'
              : 'bg-rose-900 text-white border-rose-500'
          }`}
        >
          {adminNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{adminNotice.message}</span>
        </div>
      )}

      {/* Top Admin Identity Header (Server-Enforced Verified Session) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 text-3xl flex items-center justify-center">
              {currentUser?.avatar || currentAdmin.avatar || '👨‍💼'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {currentUser?.name || currentAdmin.name}
                </h1>
                <span className="bg-amber-400 text-navy-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {(currentUser?.role || currentAdmin.role).replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <strong>{currentUser?.email || currentAdmin.email}</strong> • Verified Staff Management Console
              </p>
            </div>
          </div>

          {/* Secure Session Verified Status Badge (Replaces Client-Side Role Switcher) */}
          <div className="bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="font-bold text-white text-[11px]">Server Verified Session</span>
              <span className="text-[10px] text-slate-400">Zero-Trust Staff RBAC Enforced</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Overview & Stats
          </button>

          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ORDERS' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            Orders & Rider Dispatch ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('PRESCRIPTIONS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PRESCRIPTIONS' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Prescriptions Queue
            {pendingRxOrders.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingRxOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('DISCOUNTS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'DISCOUNTS' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BadgePercent className="w-4 h-4" />
            Bulk Discount Engine ({activeDiscountsCount})
          </button>

          <button
            onClick={() => setActiveTab('LOCALWELL')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'LOCALWELL' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            MedNeed ERP & Pricing
          </button>

          <button
            onClick={() => setActiveTab('FRANCHISE')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'FRANCHISE' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Franchise CRM ({franchiseInquiries.length})
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'AUDIT' ? 'bg-white text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListCheck className="w-4 h-4 text-amber-400" />
            Immutable Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">Collected Online Revenue</span>
              <div className="text-2xl font-black text-slate-900">₹{totalRevenue.toFixed(2)}</div>
              <div className="text-[11px] text-emerald-600 font-semibold">Settled via Razorpay Gateway</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">Total Customer Orders</span>
              <div className="text-2xl font-black text-slate-900">{orders.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Within 5-10 km radius</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">Pending Rx Verifications</span>
              <div className="text-2xl font-black text-amber-600">{pendingRxOrders.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Awaiting Pharmacist Sign-off</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500">MedNeed Synced SKUs</span>
              <div className="text-2xl font-black text-brand-700">{medicines.length} Medicines</div>
              <div className="text-[11px] text-emerald-600 font-semibold">FEFO Batch Control Active</div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 space-y-2">
              <div className="font-bold text-sm text-brand-900">Need to launch a 5% or 10% discount?</div>
              <p className="text-xs text-brand-700">
                Update storewide or category discounts in 1 click. Prices will reflect immediately across all customer views.
              </p>
              <button
                onClick={() => setActiveTab('DISCOUNTS')}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2 transition"
              >
                Open Discount Engine →
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
              <div className="font-bold text-sm text-amber-900">MedNeed Stock Reorder</div>
              <p className="text-xs text-amber-700">
                1-click synchronize digital catalog with physical warehouse inventory to update shelf batches and quantities.
              </p>
              <button
                onClick={() => setActiveTab('LOCALWELL')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2 transition"
              >
                Sync MedNeed ERP →
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
              <div className="font-bold text-sm text-slate-900">Audit & Regulatory Compliance</div>
              <p className="text-xs text-slate-600">
                Every action by the 4 admin roles is permanently logged with IP fingerprinting and state change diffs.
              </p>
              <button
                onClick={() => setActiveTab('AUDIT')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2 transition"
              >
                Inspect Audit Logs →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS & RIDER DISPATCH */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Orders & Hyper-Local Delivery Dispatch</h2>
              <p className="text-xs text-slate-500">
                Assign delivery riders, inspect handover OTPs, and update live tracking timelines
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {orders.length} Total Orders
            </span>
          </div>

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      #{order.id}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-800">{order.customerName} ({order.customerPhone})</div>
                      <div className="text-[11px] text-slate-500">
                        {order.address} • Pincode: <strong>{order.pincode}</strong> ({order.distanceKm} km away)
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.orderStatus === 'OUT_FOR_DELIVERY'
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : order.orderStatus === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>

                    {/* Delivery OTP */}
                    <div className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold">
                      <Lock className="w-3 h-3 text-amber-400" />
                      OTP: {order.delivery.deliveryOtp}
                    </div>
                  </div>
                </div>

                {/* Items & Payment row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-6 space-y-1">
                    <div className="font-semibold text-slate-600">Ordered Items:</div>
                    {order.items.map((it) => (
                      <div key={it.id} className="text-slate-800 flex justify-between pr-4">
                        <span>• {it.title} (x{it.quantity})</span>
                        <span className="font-mono text-slate-500">{it.batchNumber}</span>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <div className="font-semibold text-slate-600">Financials:</div>
                    <div>Total: <strong className="text-slate-900">₹{order.finalTotal.toFixed(2)}</strong></div>
                    <div>Method: <strong className="text-slate-700">{order.paymentMethod}</strong></div>
                    <div>Status: <span className={order.paymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{order.paymentStatus}</span></div>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <div className="font-semibold text-slate-600">Rider & Transit:</div>
                    {order.delivery.riderName ? (
                      <>
                        <div className="font-bold text-slate-800">🛵 {order.delivery.riderName}</div>
                        <div className="text-slate-500">{order.delivery.riderPhone}</div>
                        <div className="text-slate-500">ETA: {order.delivery.estimatedMinutes} mins</div>
                      </>
                    ) : (
                      <div className="text-slate-400 italic">No rider assigned yet</div>
                    )}
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Advance delivery lifecycle to update the customer&apos;s live tracking screen:
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.orderStatus === 'RX_VERIFICATION' && (
                      <button
                        onClick={async () => {
                          try {
                            await verifyPrescription(order.id, true);
                            showNotice('success', `Prescription for Order #${order.id} verified and approved!`);
                          } catch (err: any) {
                            showNotice('error', `Approval failed: ${err.message || 'Error'}`);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        ✓ Pharmacist Approve Rx
                      </button>
                    )}

                    {order.orderStatus === 'PACKED' && (
                      <button
                        onClick={() => setAssigningOrderId(order.id)}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Assign Rider & Dispatch
                      </button>
                    )}

                    {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={async () => {
                          const enteredOtp = prompt(`Enter customer handover 4-digit OTP for Order #${order.id}:`);
                          if (!enteredOtp) return;
                          try {
                            await updateOrderStatus(order.id, 'DELIVERED', { deliveryOtp: enteredOtp.trim() });
                            showNotice('success', `Order #${order.id} delivered and verified with OTP!`);
                          } catch (err: any) {
                            showNotice('error', `Handover failed: ${err.message || 'Invalid delivery OTP'}`);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm OTP & Mark Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* Assign Rider Sub-form */}
                {assigningOrderId === order.id && (
                  <div className="bg-white rounded-xl p-4 border border-brand-300 mt-2 space-y-3">
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-brand-600" />
                      Dispatch Rider for Order #{order.id}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Rider Name</label>
                        <input
                          type="text"
                          value={riderName}
                          onChange={(e) => setRiderName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Rider Phone</label>
                        <input
                          type="text"
                          value={riderPhone}
                          onChange={(e) => setRiderPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-600 font-semibold block mb-0.5">Estimated Arrival (Mins)</label>
                        <input
                          type="number"
                          value={riderEtaMins}
                          onChange={(e) => setRiderEtaMins(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setAssigningOrderId(null)}
                        className="px-3 py-1 text-slate-500 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAssignRiderSubmit(order.id)}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg"
                      >
                        Confirm Dispatch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRESCRIPTIONS QUEUE */}
      {activeTab === 'PRESCRIPTIONS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">
              Pharmacist Prescription Verification Queue
            </h2>
            <p className="text-xs text-slate-500">
              Regulatory compliance under Pharmacy Act Form 20/21. Required for Schedule H & H1 medications.
            </p>
          </div>

          {pendingRxOrders.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-700 text-sm">All Prescriptions Clear!</div>
              <p className="text-xs">No pending orders waiting for doctor prescription review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRxOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-amber-300">
                        Order #{order.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">
                        Patient: {order.customerName} ({order.customerPhone})
                      </h4>
                    </div>
                    <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase">
                      Action Required: Pharmacist Stamp
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-slate-700">Prescription Drugs in this order:</div>
                    {order.items
                      .filter((i) => i.requiresPrescription)
                      .map((i) => (
                        <div key={i.id} className="text-slate-800 pl-2">
                          • {i.title} (Qty: {i.quantity})
                        </div>
                      ))}
                  </div>

                  {order.prescriptionUrl && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-600" />
                        <span>Prescription Document (Uploaded by Customer)</span>
                      </div>
                      <a
                        href={order.prescriptionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 font-bold hover:underline"
                      >
                        Open Full Scan ↗
                      </a>
                    </div>
                  )}

                  <div className="pt-2 border-t border-amber-200/70 flex justify-end gap-2">
                    <button
                      onClick={async () => {
                        const reason = prompt('Please enter rejection reason (e.g. Doctor stamp missing or expired):');
                        if (reason) {
                          try {
                            await verifyPrescription(order.id, false, reason);
                            showNotice('error', `Prescription for Order #${order.id} rejected.`);
                          } catch (err: any) {
                            showNotice('error', `Rejection error: ${err.message || 'Failed to reject'}`);
                          }
                        }
                      }}
                      className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Reject Prescription
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await verifyPrescription(order.id, true);
                          showNotice('success', `Prescription for Order #${order.id} approved! Order moved to PACKED.`);
                        } catch (err: any) {
                          showNotice('error', `Verification error: ${err.message || 'Failed to verify'}`);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      ✓ Approve & Allocate MedNeed Batch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BULK DISCOUNT ENGINE */}
      {activeTab === 'DISCOUNTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Discount Creator */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="inline-flex items-center gap-1.5 text-brand-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <BadgePercent className="w-4 h-4" />
                  Realtime Pricing Control
                </div>
                <h3 className="font-black text-lg text-slate-900">
                  Bulk Discount Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Apply discounts storewide or on selected therapeutic categories. MRP is preserved and discounted prices update immediately.
                </p>
              </div>

              {discountFeedback && (
                <div className="bg-emerald-50 border border-emerald-200 text-brand-900 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span>{discountFeedback}</span>
                </div>
              )}

              <form onSubmit={handleApplyDiscount} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Discount Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      required
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-bold text-slate-900 text-base"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Apply Discount To: *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDiscountScope('ALL_MEDICINES')}
                      className={`py-2 px-3 rounded-xl font-bold transition text-xs ${
                        discountScope === 'ALL_MEDICINES'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Medicines (Storewide)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountScope('CATEGORY')}
                      className={`py-2 px-3 rounded-xl font-bold transition text-xs ${
                        discountScope === 'CATEGORY'
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Selected Category
                    </button>
                  </div>
                </div>

                {discountScope === 'CATEGORY' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Select Target Category *</label>
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 bg-white"
                    >
                      <option value="Diabetes">Diabetes</option>
                      <option value="Cardiac">Cardiac</option>
                      <option value="Pain Relief">Pain Relief</option>
                      <option value="Digestion">Digestion</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Vitamins">Vitamins</option>
                      <option value="First Aid">First Aid</option>
                    </select>
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700">DPCO Margin Safety Guard:</div>
                  <div>
                    • System automatically verifies that selling price does not fall below wholesale purchase rate.
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md shadow-brand-500/20"
                >
                  ⚡ Apply {discountPercent}% Discount Now
                </button>
              </form>
            </div>
          </div>

          {/* Active Rules & Price Preview */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Active Discount Rules</h3>
              <div className="space-y-3">
                {discountRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs gap-3 bg-slate-50/50"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{rule.title}</span>
                        <span className="bg-amber-100 text-navy-900 font-extrabold text-[10px] px-2 py-0.5 rounded">
                          {rule.discountPercentage}% OFF
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Scope: {rule.scope} {rule.targetCategory ? `(${rule.targetCategory})` : ''} • Updated by {rule.updatedBy} ({rule.updatedAt})
                      </div>
                    </div>

                    <button
                      onClick={() => toggleDiscountRule(rule.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                        rule.isActive
                          ? 'bg-emerald-100 text-brand-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Sample Medicine Price Preview */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                Live Customer Price Preview (Sample MedNeed Stock)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {medicines.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-slate-500 text-[11px]">{m.category}</div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-black text-slate-900">₹{m.sellingPrice.toFixed(2)}</span>
                      <span className="text-slate-400 line-through text-[11px]">₹{m.mrp.toFixed(2)}</span>
                      <span className="bg-amber-400 text-navy-900 text-[10px] font-black px-1.5 rounded">
                        {m.discountPercentage}% OFF
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LOCALWELL ERP & INFLATION */}
      {activeTab === 'LOCALWELL' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-brand-700 font-bold text-xs uppercase tracking-wider mb-1">
                  <RefreshCw className="w-4 h-4" />
                  MedNeed Pharmacy ERP Sync
                </div>
                <h3 className="font-black text-xl text-slate-900">
                  Inventory Synchronization & Cost Inflation Management
                </h3>
                <p className="text-xs text-slate-500">
                  Direct compatibility with MedNeed billing files, batch barcodes, and DPCO statutory price adjustments.
                </p>
              </div>

              <button
                onClick={handleSyncLocalWell}
                className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md shadow-brand-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                1-Click Sync MedNeed Inventory
              </button>
            </div>

            {syncFeedback && (
              <div className="bg-emerald-50 border border-emerald-200 text-brand-900 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Cost Inflation Adjuster Form */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Statutory MRP Adjustment (Cost Inflation)
                </h4>
                <p className="text-xs text-slate-500">
                  When a manufacturer issues a revised price batch, update the printed MRP here. All activity is logged in the Audit Trail.
                </p>
              </div>

              <form onSubmit={handleSaveMRPHike} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Select Medicine SKU</label>
                  <select
                    value={selectedMedForHike}
                    onChange={(e) => {
                      setSelectedMedForHike(e.target.value);
                      const m = medicines.find((x) => x.id === e.target.value);
                      if (m) setNewHikedMRP(m.mrp);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Current MRP: ₹{m.mrp})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">New Batch Printed MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newHikedMRP}
                    onChange={(e) => setNewHikedMRP(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mandatory Audit Justification</label>
                  <input
                    type="text"
                    required
                    value={hikeReason}
                    onChange={(e) => setHikeReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Save Price & Record Audit Log
                  </button>
                </div>
              </form>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">MedNeed Code</th>
                    <th className="p-3">Medicine & Brand</th>
                    <th className="p-3">Batch #</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3">Stock Qty</th>
                    <th className="p-3">Wholesale Rate</th>
                    <th className="p-3">Batch MRP</th>
                    <th className="p-3">Selling Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {medicines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-brand-700">{m.localWellCode}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-500">{m.brand}</div>
                      </td>
                      <td className="p-3 font-mono">{m.batchNumber}</td>
                      <td className="p-3 font-mono">{m.expiryDate}</td>
                      <td className="p-3 font-bold text-slate-900">{m.stockQty}</td>
                      <td className="p-3 font-mono text-slate-500">₹{m.costPrice.toFixed(2)}</td>
                      <td className="p-3 font-mono font-bold">₹{m.mrp.toFixed(2)}</td>
                      <td className="p-3 font-mono font-black text-brand-700">₹{m.sellingPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FRANCHISE CRM */}
      {activeTab === 'FRANCHISE' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">
              Franchise Investor Applications & Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Manage prospective franchise leads, commercial properties, and expansion approvals
            </p>
          </div>

          <div className="space-y-4">
            {franchiseInquiries.map((lead) => (
              <div
                key={lead.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border">
                      #{lead.id}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{lead.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {lead.city} • Proposed: <strong>{lead.proposedArea}</strong>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                      lead.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lead.status === 'SITE_VISIT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Stage: {lead.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div>Contact: <strong className="text-slate-800">{lead.phone}</strong></div>
                  <div>Space: <strong className="text-slate-800">{lead.commercialSpaceSqFt} Sq Ft ({lead.ownershipType})</strong></div>
                  <div>Investment: <strong className="text-slate-800">{lead.investmentBudget.replace(/_/g, ' ')}</strong></div>
                  <div>Pharma Background: <strong className="text-slate-800">{lead.hasPharmaExperience ? 'Yes' : 'No'}</strong></div>
                </div>

                {lead.notes && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Notes:</span> {lead.notes}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400">Received on: {lead.createdAt}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFranchiseStatus(lead.id, 'CONTACTED')}
                      className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                    >
                      Mark Contacted
                    </button>
                    <button
                      onClick={() => updateFranchiseStatus(lead.id, 'SITE_VISIT')}
                      className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100"
                    >
                      Schedule Site Visit
                    </button>
                    <button
                      onClick={() => updateFranchiseStatus(lead.id, 'APPROVED')}
                      className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Approve Franchise
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: COMPLETE AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
                <ListCheck className="w-4 h-4" />
                Complete Activity Tracking
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Immutable Regulatory Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Full chronological ledger of every change made by the 4 admin roles: Super Admin, Store Manager, Pharmacist, and Auditor.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Audit Details</th>
                  <th className="p-3">Old State → New State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.actorName}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-brand-700 whitespace-nowrap">
                      {log.actionType}
                    </td>
                    <td className="p-3 text-slate-600 max-w-sm">
                      {log.details}
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {log.oldValue && log.newValue ? (
                        <span className="text-slate-600">
                          <span className="line-through text-slate-400">{log.oldValue}</span> →{' '}
                          <span className="text-emerald-700 font-bold">{log.newValue}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
