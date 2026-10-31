'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  ShieldCheck,
  Search,
  Package,
  MapPin,
  Lock,
  ArrowRight,
  AlertCircle,
  Calendar,
  User,
  Stethoscope,
  FileText,
  Navigation,
  Sparkles,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/types';
import { DeliveryScooterScene } from '@/components/ui/Illustrations';

function TrackDeliveryContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const { currentUser } = useApp();

  const [inputOrderId, setInputOrderId] = useState(urlOrderId || '');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const lookupOrder = async (orderIdToFind: string) => {
    const cleanId = orderIdToFind.trim().toUpperCase();
    if (!cleanId) return;

    setIsLoading(true);
    setSearchError(null);

    // Verify ownership and fetch from backend database with server-side auth
    try {
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(cleanId)}`);
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setSelectedOrder(data.data);
      } else {
        setSelectedOrder(null);
        setSearchError(
          data.error || `Order "${cleanId}" not found or requires sign-in to view.`
        );
      }
    } catch {
      setSelectedOrder(null);
      setSearchError('Network error while looking up order. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (urlOrderId && urlOrderId.trim() !== '') {
      setInputOrderId(urlOrderId);
      lookupOrder(urlOrderId);
    }
  }, [urlOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputOrderId.trim()) return;
    lookupOrder(inputOrderId);
  };

  // Extract individual OTP digits for glowing digit tiles
  const otpString = String(selectedOrder?.delivery?.deliveryOtp || '4819');
  const otpDigits = otpString.split('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5]/60 via-[#FAF8F5] to-white py-8 px-4 sm:px-6 lg:px-8 space-y-8 w-full max-w-full overflow-x-hidden bg-pattern-grid">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header and Lookup Bar Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-soft-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-800 text-white flex items-center justify-center font-bold shadow-soft">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Live Delivery &amp; OTP Tracker
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time GPS updates within our 5–10 km express delivery zone
                </p>
              </div>
            </div>

            {/* Secure Handover Verification Pill */}
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-700">Encrypted OTP Handover</span>
            </div>
          </div>

          {/* Search input form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="Enter your Order ID (e.g. ORD-8921)..."
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value.toUpperCase())}
                className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none uppercase font-mono transition shadow-soft-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-6 py-3 rounded-full font-extrabold text-xs sm:text-sm transition duration-150 flex items-center justify-center gap-2 shadow-soft hover:shadow-soft-lg cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-extrabold text-slate-800">Looking up Order #{inputOrderId}...</h3>
            <p className="text-xs text-slate-400">Querying live dispensary dispatch database...</p>
          </div>
        ) : !selectedOrder ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft space-y-2">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="font-extrabold text-slate-800 text-base">
              {searchError ? 'Order Not Found' : 'No Order Selected'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchError || 'Please enter an order ID to view real-time delivery status and OTP.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Status & Stepper */}
            <div className="lg:col-span-7 space-y-6">
              {/* HERO OTP CARD: Glowing Amber Digit Tiles & Doorstep Verification */}
              <div className="bg-gradient-to-br from-[#0B1F17] via-[#0F5132] to-[#062015] text-white rounded-3xl p-6 sm:p-7 shadow-soft-xl space-y-5 border border-emerald-800/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
                  <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Secure Delivery Handover Verification</span>
                  </span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full shadow-2xs animate-pulse-glow">
                    SHARE AT DOORSTEP ONLY
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4 relative z-10">
                  <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
                    Your Delivery Handover OTP:
                  </div>

                  {/* 4 Separate Glowing Digit Tiles */}
                  <div className="flex items-center gap-3">
                    {otpDigits.map((digit, idx) => (
                      <div
                        key={idx}
                        className="w-12 sm:w-14 h-14 sm:h-16 rounded-2xl bg-[#0B1F17]/90 border-2 border-amber-400/80 shadow-glow-amber flex items-center justify-center font-mono text-3xl sm:text-4xl font-black text-amber-300"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>

                  {/* ETA & Distance Row with Icons */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>
                        Est. Arrival:{' '}
                        <strong className="text-white font-extrabold">
                          {selectedOrder.delivery.estimatedMinutes || 20} mins
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>
                        Distance:{' '}
                        <strong className="text-white font-extrabold">{selectedOrder.distanceKm} km</strong> from dispensary
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-100/80 leading-relaxed relative z-10">
                  Do not share this OTP over phone calls or messages. Provide it to our delivery rider only after inspecting your tamper-evident medicine package at your door.
                </p>
              </div>

              {/* Rider Information Card with Route Scooter Illustration */}
              {selectedOrder.delivery.riderName && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl shrink-0 border border-emerald-200">
                      🛵
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Delivery Rider</div>
                      <h4 className="font-extrabold text-slate-900 text-base">{selectedOrder.delivery.riderName}</h4>
                      <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Rider</span> • <span>Thermal Insulated Pouch</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${selectedOrder.delivery.riderPhone}`}
                    className="btn-primary-gradient text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition shadow-soft-sm shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>Call Rider</span>
                  </a>
                </div>
              )}

              {/* Scheduled Phlebotomist Home Visit (if applicable) */}
              {selectedOrder.diagnosticAppointment && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-soft text-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="font-extrabold flex items-center gap-2 text-slate-900 text-sm">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Scheduled Phlebotomist Home Visit</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-emerald-200">
                      NABL Cold-Chain Kit
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Patient</span>
                      <strong className="text-slate-900 text-xs font-bold">
                        {selectedOrder.diagnosticAppointment.patientName} ({selectedOrder.diagnosticAppointment.patientAge}y, {selectedOrder.diagnosticAppointment.patientGender})
                      </strong>
                      <div className="text-[11px] text-slate-500">Relation: {selectedOrder.diagnosticAppointment.patientRelation}</div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Collection Slot</span>
                      <strong className="text-slate-900 text-xs font-bold">
                        {selectedOrder.diagnosticAppointment.collectionDate}
                      </strong>
                      <div className="text-[11px] text-emerald-700 font-semibold">{selectedOrder.diagnosticAppointment.collectionSlot}</div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center gap-2 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Certified vaccinated phlebotomist will arrive with barcoded sterile vacutainers.</span>
                  </div>
                </div>
              )}

              {/* Order-Progress Timeline */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-soft space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Delivery Progress History</span>
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono font-bold">
                    Order #{selectedOrder.id}
                  </span>
                </div>

                <div className="relative pl-7 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:to-slate-200">
                  {(selectedOrder.trackingHistory || []).map((step, idx) => {
                    return (
                      <div key={idx} className="relative group">
                        {/* Step Circle with Glowing Ripple */}
                        <div
                          className={`absolute -left-7 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-soft-sm ${
                            step.completed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : step.current
                              ? 'bg-amber-400 border-amber-400 text-slate-950 animate-pulse'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {step.completed ? '✓' : idx + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-sm font-extrabold ${
                                step.current
                                  ? 'text-emerald-800'
                                  : step.completed
                                  ? 'text-slate-900'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.title}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              {step.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Real-time live status synced with store dispatch ERP</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 pulsing-dot" />
                    <span>Live GPS Signal</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Receipt Style Order Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-soft space-y-5">
                <div className="border-b border-dashed border-slate-200 pb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Order Placed on {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mt-0.5">
                      Order Invoice Receipt
                    </h3>
                  </div>

                  <a
                    href={`/api/orders/${encodeURIComponent(selectedOrder.id)}/invoice?format=html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition shadow-soft-sm shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Print GST Invoice</span>
                  </a>
                </div>

                {/* Items List */}
                <div className="space-y-3.5 divide-y divide-dashed divide-slate-100">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between text-xs gap-3">
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-900">
                          {item.title} <span className="text-slate-400 font-normal">× {item.quantity}</span>
                        </div>
                        {item.batchNumber && (
                          <div className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit">
                            Batch: {item.batchNumber}
                          </div>
                        )}
                        {item.requiresPrescription && (
                          <span className="inline-block bg-rose-50 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                            Rx Verified
                          </span>
                        )}
                      </div>
                      <div className="font-black text-slate-900">
                        ₹{(Number(item.unitPrice || 0) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Receipt Breakdown */}
                <div className="pt-4 border-t border-dashed border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Item Total (MRP)</span>
                    <span>₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedOrder.discountTotal || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount Savings</span>
                      <span>-₹{Number(selectedOrder.discountTotal || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge (5–10km)</span>
                    <span>
                      {Number(selectedOrder.deliveryFee || 0) === 0 ? (
                        <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          FREE
                        </span>
                      ) : (
                        `₹${Number(selectedOrder.deliveryFee).toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-dashed border-slate-200">
                    <span>Total Amount</span>
                    <span>₹{Number(selectedOrder.finalTotal || 0).toFixed(2)}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                    <span>Payment Mode:</span>
                    <strong className="text-slate-800 font-bold">
                      {selectedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid (Razorpay)'}
                    </strong>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="pt-4 border-t border-dashed border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivery Destination:</span>
                  </div>
                  <div className="text-slate-600 pl-5 leading-relaxed">
                    <div className="font-semibold text-slate-900">{selectedOrder.customerName} ({selectedOrder.customerPhone})</div>
                    <div>{selectedOrder.address}</div>
                    <div>PIN: {selectedOrder.pincode}</div>
                  </div>
                </div>
              </div>

              {/* Assistance Card */}
              <div className="bg-emerald-50/70 rounded-3xl p-4 sm:p-5 border border-emerald-200 text-xs text-slate-700 flex items-start gap-3 shadow-soft-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-950 block text-xs mb-0.5">Need help with this order?</strong>
                  Reach our supervising pharmacist 24/7 at{' '}
                  <a href="tel:+919437545411" className="font-bold text-emerald-800 hover:underline">
                    +91 94375 45411
                  </a>{' '}
                  or{' '}
                  <a href="mailto:medneed.service@gmail.com" className="font-bold text-emerald-800 hover:underline">
                    medneed.service@gmail.com
                  </a>.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackDeliveryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading order tracker...</div>}>
      <TrackDeliveryContent />
    </Suspense>
  );
}
