'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  ShieldCheck,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  UploadCloud,
  Stethoscope,
  Calendar,
  Clock,
  User,
  Check,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Pill,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { EmptyCartIllustration, DosageFormIcon } from '@/components/ui/Illustrations';
import { sanitizePaymentError } from '@/lib/errorUtils';

type CheckoutStep = 'ADDRESS' | 'SUMMARY' | 'PAYMENT' | 'CONFIRMATION';

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface ServerOrderSummary {
  items: any[];
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  finalTotal: number;
  distanceKm: number;
  requiresPrescription: boolean;
  hasDiagnostics: boolean;
  hasScheduleX?: boolean;
  scheduleXItems?: string[];
  hasChanged: boolean;
  changeMessages: string[];
  allStockAvailable: boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStepParam = (searchParams.get('step')?.toUpperCase() as CheckoutStep) || 'ADDRESS';
  const rxUploadedFromParam = searchParams.get('rx_uploaded') === 'true';

  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartSubtotal,
    cartDiscount,
    deliveryFee,
    cartFinalTotal,
    userPincode,
    deliveryDistanceKm,
    deliveryEstimateText,
    verifyDeliveryPincode,
    currentUser,
    createRazorpayOrder,
    verifyRazorpayPayment,
  } = useApp();

  // Multi-step Checkout State (Flipkart Flow)
  const [activeStep, setActiveStep] = useState<CheckoutStep>(initialStepParam);
  const [completedSteps, setCompletedSteps] = useState<Record<CheckoutStep, boolean>>({
    ADDRESS: false,
    SUMMARY: false,
    PAYMENT: false,
    CONFIRMATION: false,
  });

  // Addresses State
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Address Form Inputs
  const [fullName, setFullName] = useState(currentUser?.name || 'Rahul Mehra');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98765 12345');
  const [streetAddress, setStreetAddress] = useState('House 84, Silver Oak Enclave, Balianta Road');
  const [landmark, setLandmark] = useState('Near Rudhrapur Market');
  const [pincode, setPincode] = useState(userPincode || '751035');

  // Server-side Recalculated Order Summary
  const [summaryData, setSummaryData] = useState<ServerOrderSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Prescription & Diagnostics
  const [hasUploadedRx, setHasUploadedRx] = useState(rxUploadedFromParam);
  const [rxOption, setRxOption] = useState<'UPLOAD' | 'CONSULT'>(rxUploadedFromParam ? 'UPLOAD' : 'CONSULT');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const [patientName, setPatientName] = useState(currentUser?.name || fullName);
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientRelation, setPatientRelation] = useState<'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other'>('Self');
  const [collectionDate, setCollectionDate] = useState('Tomorrow (Recommended)');
  const [collectionSlot, setCollectionSlot] = useState('06:30 AM – 07:30 AM (Fasting Preferred)');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'COD'>('RAZORPAY_UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pendingServerOrderId, setPendingServerOrderId] = useState<string | null>(null);
  const [activeRazorpayDetails, setActiveRazorpayDetails] = useState<any>(null);
  const [lastPaymentResponse, setLastPaymentResponse] = useState<any>(null);

  // Confirmed Order
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // 1. Fetch saved addresses on mount if user is logged in
  useEffect(() => {
    if (currentUser) {
      setIsLoadingAddresses(true);
      fetch('/api/user/addresses')
        .then((r) => r.json())
        .then((data) => {
          setIsLoadingAddresses(false);
          if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault) || data.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setFullName(defaultAddr.fullName);
            setPhone(defaultAddr.phone);
            setStreetAddress(defaultAddr.streetAddress);
            setLandmark(defaultAddr.landmark || '');
            setPincode(defaultAddr.pincode);
          } else {
            setShowNewAddressForm(true);
          }
        })
        .catch(() => setIsLoadingAddresses(false));
    }
  }, [currentUser]);

  // Read Rx session storage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRx = sessionStorage.getItem('medneed_rx_url');
      if (storedRx) {
        setUploadedFileUrl(storedRx);
        setHasUploadedRx(true);
        setRxOption('UPLOAD');
      }
    }
  }, []);

  // 2. Fetch trusted server order summary whenever moving to SUMMARY or cart changes
  const fetchServerSummary = async () => {
    if (cart.length === 0) return;
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch('/api/checkout/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            id: c.id,
            type: c.type,
            quantity: c.quantity,
            sellingPrice: c.sellingPrice,
            mrp: c.mrp,
            title: c.title,
            requiresPrescription: c.requiresPrescription,
          })),
          pincode,
          distanceKm: deliveryDistanceKm,
        }),
      });

      const data = await res.json();
      setIsSummaryLoading(false);
      if (data.success && data.summary) {
        setSummaryData(data.summary);
      } else {
        setSummaryError(data.error || 'Failed to verify live cart summary');
      }
    } catch {
      setIsSummaryLoading(false);
      setSummaryError('Network connection issue verifying cart summary.');
    }
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setStreetAddress(addr.streetAddress);
    setLandmark(addr.landmark || '');
    setPincode(addr.pincode);
    verifyDeliveryPincode(addr.pincode);
    setShowNewAddressForm(false);
  };

  const handleSaveAndProceedAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !streetAddress.trim() || !pincode.trim()) {
      alert('Please complete all delivery address fields.');
      return;
    }

    const pinCheck = verifyDeliveryPincode(pincode);
    if (!pinCheck.serviceable) {
      alert(pinCheck.message);
      return;
    }

    // Save address to user DB if new
    if (showNewAddressForm && currentUser) {
      try {
        const res = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            phone,
            streetAddress,
            landmark,
            pincode,
            city: 'Bhubaneswar',
            state: 'Odisha',
            isDefault: savedAddresses.length === 0,
          }),
        });
        const d = await res.json();
        if (d.success && d.address) {
          setSavedAddresses((prev) => [d.address, ...prev]);
          setSelectedAddressId(d.address.id);
        }
      } catch (err) {
        console.warn('Address save error:', err);
      }
    }

    setCompletedSteps((prev) => ({ ...prev, ADDRESS: true }));
    setActiveStep('SUMMARY');
    fetchServerSummary();
  };

  const handleProceedToPayment = () => {
    // Regulatory check: Schedule X medicines cannot be purchased online under Indian Pharmacy law
    if (summaryData?.hasScheduleX || cart.some((c) => c.schedule === 'SCHEDULE_X')) {
      alert(
        'Schedule X Restricted Items Detected: Under Indian Pharmacy Regulations (Drugs and Cosmetics Act, Rules 65 & 97), Schedule X narcotics and psychotropics cannot be sold online. Please remove all Schedule X medications from your cart to proceed.'
      );
      return;
    }

    if (summaryData?.requiresPrescription && rxOption === 'UPLOAD' && !hasUploadedRx) {
      alert('A valid prescription is required for prescription items in your cart. Please upload your Rx or select "Request Free Doctor Call".');
      return;
    }

    setCompletedSteps((prev) => ({ ...prev, SUMMARY: true }));
    setActiveStep('PAYMENT');
  };

  // Initiate Razorpay Order on Server
  const handleInitiatePayment = async () => {
    // Regulatory safeguard
    if (summaryData?.hasScheduleX || cart.some((c) => c.schedule === 'SCHEDULE_X')) {
      setPaymentError(
        'Regulatory Compliance Error: Order contains Schedule X restricted controlled substances. Indian law prohibits online sale of Schedule X drugs.'
      );
      return;
    }

    setPaymentError(null);
    setIsProcessingPayment(true);

    try {
      const orderPayload = {
        customerName: fullName,
        customerPhone: phone,
        customerEmail: currentUser?.email || 'customer@medneed.com',
        address: `${streetAddress}${landmark ? `, ${landmark}` : ''}`,
        pincode,
        distanceKm: summaryData?.distanceKm || deliveryDistanceKm,
        items: (summaryData?.items || cart).map((c: any) => ({
          id: c.id,
          type: c.type,
          quantity: c.quantity,
          title: c.title,
        })),
        existingOrderId: pendingServerOrderId, // Idempotent: reuses order ID on retry!
        paymentMethod,
        prescriptionUrl: (summaryData?.requiresPrescription && rxOption === 'UPLOAD' && hasUploadedRx)
          ? (uploadedFileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60')
          : undefined,
        doctorConsultRequired: summaryData?.requiresPrescription && rxOption === 'CONSULT',
        diagnosticAppointment: summaryData?.hasDiagnostics
          ? {
              patientName,
              patientAge: parseInt(patientAge) || 30,
              patientGender,
              patientRelation,
              collectionDate,
              collectionSlot,
            }
          : undefined,
      };

      const orderRes = await createRazorpayOrder(orderPayload);
      setPendingServerOrderId(orderRes.orderId);
      setActiveRazorpayDetails(orderRes);

      if (paymentMethod === 'COD') {
        // COD order: verify immediately on server
        await handleExecuteVerification(orderRes.orderId, null, null, null);
      } else {
        // Real Razorpay Checkout integration
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !(window as any).Razorpay) {
          setIsProcessingPayment(false);
          setPaymentError('Razorpay Checkout SDK failed to load. Please check your network connection and retry.');
          return;
        }

        const options = {
          key: orderRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderRes.amount,
          currency: orderRes.currency || 'INR',
          name: 'MedNeed Pharmacy',
          description: `Order #${orderRes.orderId}`,
          order_id: orderRes.razorpayOrderId,
          prefill: {
            name: fullName,
            email: currentUser?.email || 'customer@medneed.com',
            contact: phone,
          },
          theme: {
            color: '#059669',
          },
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            setLastPaymentResponse(response);
            await handleExecuteVerification(
              orderRes.orderId,
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
              setPaymentError('Payment window was closed. Your cart has been preserved so you can retry checkout.');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessingPayment(false);
          setPaymentError(
            resp.error?.description || 'Payment was declined by bank or gateway. Your cart is preserved.'
          );
        });
        rzp.open();
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentError(sanitizePaymentError(err?.message || err, 'Could not place order. Please review your details and retry.'));
    }
  };

  // Backend Cryptographic Verification
  const handleExecuteVerification = async (
    orderId: string,
    razorpayPaymentId: string | null,
    razorpayOrderId: string | null,
    razorpaySignature: string | null
  ) => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      const verifyRes = await verifyRazorpayPayment({
        orderId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      });

      setIsProcessingPayment(false);
      setConfirmedOrder(verifyRes.order);
      setCompletedSteps((prev) => ({ ...prev, PAYMENT: true, CONFIRMATION: true }));
      setActiveStep('CONFIRMATION');
    } catch (err: any) {
      setIsProcessingPayment(false);
      // TARGET REQUIREMENT 10: Cart is NOT cleared if payment fails, user can retry safely
      setPaymentError(
        sanitizePaymentError(
          err?.message || err,
          'Payment verification experienced a delay. If your account was charged, your order is safe and will confirm shortly.'
        )
      );
    }
  };

  // Empty cart view with charming SVG illustration and quick links
  if (cart.length === 0 && activeStep !== 'CONFIRMATION') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-gradient-to-b from-[#ECFDF5]/60 via-[#FAF8F5] to-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="w-56 h-44 mx-auto animate-float-bob">
            <EmptyCartIllustration />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Looks like you haven&apos;t added any medicines or lab tests yet. Explore our verified catalog of 30,800+ genuine medicines delivered in 45–60 mins.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/medicines"
              className="btn-primary-gradient inline-flex items-center gap-2 font-extrabold text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-soft hover:scale-105 transition duration-200"
            >
              <span>Browse Pharmacy Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick-links row */}
          <div className="pt-6 border-t border-emerald-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Healthcare Shortcuts:
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <Link
                href="/medicines"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-full border border-slate-200 shadow-soft-sm font-semibold transition"
              >
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <span>Popular Medicines</span>
              </Link>
              <Link
                href="/blood-tests"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-full border border-slate-200 shadow-soft-sm font-semibold transition"
              >
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span>Diagnostic Lab Tests</span>
              </Link>
              <Link
                href="/#medicine-catalog-section"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 rounded-full border border-slate-200 shadow-soft-sm font-semibold transition"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Prescription</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TARGET REQUIREMENT 3: If not signed in, prompt existing login without losing cart
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center mx-auto font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Complete Checkout
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Flipkart-style instant checkout: your <strong>{cartCount} item(s)</strong> are saved securely in your browser and will automatically merge into your account on sign in.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Cart Intact Guarantee:</strong> Zero items lost. Seamless return directly to this checkout step after Google or Email authentication.
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <GoogleSignInButton
              redirectUrl="/checkout?step=address"
              buttonText="Continue with Google & Checkout"
            />

            <div className="relative my-3 text-center">
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Or with Email / Password
              </span>
            </div>

            <Link
              href="/auth/signin?redirect=/checkout?step=address"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
            >
              <span>Sign In with Existing Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/signup?redirect=/checkout?step=address"
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 text-center"
            >
              <span>Create New MedNeed Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveSubtotal = summaryData ? summaryData.subtotal : cartSubtotal;
  const effectiveDiscount = summaryData ? summaryData.discountTotal : cartDiscount;
  const effectiveDeliveryFee = summaryData ? summaryData.deliveryFee : deliveryFee;
  const effectiveFinalTotal = summaryData ? summaryData.finalTotal : cartFinalTotal;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Flipkart Multi-Step Progress Tracker */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between text-xs font-bold text-slate-600 overflow-x-auto">
        <div className={`flex items-center gap-2 shrink-0 ${activeStep === 'ADDRESS' ? 'text-brand-600' : (completedSteps.ADDRESS ? 'text-emerald-600' : '')}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${completedSteps.ADDRESS ? 'bg-emerald-500 text-white' : (activeStep === 'ADDRESS' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}`}>
            {completedSteps.ADDRESS ? '✓' : '1'}
          </span>
          <span>Delivery Address</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-2" />

        <div className={`flex items-center gap-2 shrink-0 ${activeStep === 'SUMMARY' ? 'text-brand-600' : (completedSteps.SUMMARY ? 'text-emerald-600' : '')}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${completedSteps.SUMMARY ? 'bg-emerald-500 text-white' : (activeStep === 'SUMMARY' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}`}>
            {completedSteps.SUMMARY ? '✓' : '2'}
          </span>
          <span>Order Summary</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-2" />

        <div className={`flex items-center gap-2 shrink-0 ${activeStep === 'PAYMENT' ? 'text-brand-600' : (completedSteps.PAYMENT ? 'text-emerald-600' : '')}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${completedSteps.PAYMENT ? 'bg-emerald-500 text-white' : (activeStep === 'PAYMENT' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}`}>
            {completedSteps.PAYMENT ? '✓' : '3'}
          </span>
          <span>Payment</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-2" />

        <div className={`flex items-center gap-2 shrink-0 ${activeStep === 'CONFIRMATION' ? 'text-emerald-600 font-extrabold' : ''}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${completedSteps.CONFIRMATION ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
            4
          </span>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Main Grid: Left Steps + Right Pricing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Accordion Steps */}
        <div className="lg:col-span-8 space-y-4">
          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition">
            <div
              onClick={() => activeStep !== 'CONFIRMATION' && setActiveStep('ADDRESS')}
              className={`p-5 flex items-center justify-between cursor-pointer border-b ${
                activeStep === 'ADDRESS' ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                  completedSteps.ADDRESS ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white'
                }`}>
                  {completedSteps.ADDRESS ? '✓' : '1'}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">DELIVERY ADDRESS</h3>
                  {completedSteps.ADDRESS && activeStep !== 'ADDRESS' && (
                    <p className="text-xs text-slate-500 truncate max-w-md">
                      {fullName} ({phone}) — {streetAddress}, {pincode}
                    </p>
                  )}
                </div>
              </div>
              {completedSteps.ADDRESS && activeStep !== 'ADDRESS' && (
                <button
                  type="button"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50"
                >
                  CHANGE
                </button>
              )}
            </div>

            {activeStep === 'ADDRESS' && (
              <div className="p-6 space-y-5 animate-in fade-in">
                {/* Saved Addresses List */}
                {savedAddresses.length > 0 && !showNewAddressForm && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Saved Address
                    </div>
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressRadio"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleSelectSavedAddress(addr)}
                          className="mt-1 text-brand-600 focus:ring-brand-500"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{addr.fullName}</span>
                            <span className="text-slate-500">({addr.phone})</span>
                            {addr.isDefault && (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {addr.streetAddress}{addr.landmark ? `, Landmark: ${addr.landmark}` : ''}, {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                          </p>
                        </div>
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1.5 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add a New Delivery Address</span>
                    </button>
                  </div>
                )}

                {/* New Address Form */}
                {showNewAddressForm && (
                  <form onSubmit={handleSaveAndProceedAddress} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Add New Delivery Address (Bhubaneswar Hubs)
                      </span>
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Mehra"
                          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Mobile Number (For Delivery OTP)</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 12345"
                          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="font-semibold text-slate-700 block mb-1">Street Address, House No., Apartment</label>
                      <textarea
                        required
                        rows={2}
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="House 84, Silver Oak Enclave, Balianta Road"
                        className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Landmark (Optional)</label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Rudhrapur Market"
                          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">Pincode (6-Digits)</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pincode}
                          onChange={(e) => {
                            setPincode(e.target.value);
                            if (e.target.value.length === 6) verifyDeliveryPincode(e.target.value);
                          }}
                          placeholder="751035"
                          className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                      📍 <strong>Service Radius:</strong> Express Doorstep delivery within 5–10 km of Bhubaneswar Hubs (Rudhrapur / Nakhara / Balianta).
                    </div>
                  </form>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAndProceedAddress}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md shadow-brand-500/20 transition flex items-center gap-2"
                  >
                    <span>DELIVER HERE &amp; CONTINUE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: ORDER SUMMARY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition">
            <div
              onClick={() => completedSteps.ADDRESS && activeStep !== 'CONFIRMATION' && setActiveStep('SUMMARY')}
              className={`p-5 flex items-center justify-between border-b ${
                activeStep === 'SUMMARY' ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-transparent'
              } ${!completedSteps.ADDRESS ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                  completedSteps.SUMMARY ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white'
                }`}>
                  {completedSteps.SUMMARY ? '✓' : '2'}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">ORDER SUMMARY</h3>
                  {completedSteps.SUMMARY && activeStep !== 'SUMMARY' && (
                    <p className="text-xs text-slate-500">
                      {cartCount} item(s) verified by server • ₹{effectiveFinalTotal.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              {completedSteps.SUMMARY && activeStep !== 'SUMMARY' && (
                <button
                  type="button"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50"
                >
                  REVIEW
                </button>
              )}
            </div>

            {activeStep === 'SUMMARY' && (
              <div className="p-6 space-y-5 animate-in fade-in">
                {isSummaryLoading && (
                  <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-800 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Recalculating trusted catalog prices and verifying batch inventory stock...</span>
                  </div>
                )}

                {/* Regulatory Safeguard: Schedule X Controlled Substance Alert */}
                {(summaryData?.hasScheduleX || cart.some((c) => c.schedule === 'SCHEDULE_X')) && (
                  <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-xs text-rose-900 space-y-2 animate-in fade-in">
                    <div className="font-extrabold flex items-center gap-1.5 text-rose-800 text-sm">
                      <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                      <span>Regulatory Lock: Schedule X Restricted Medication Detected</span>
                    </div>
                    <p className="leading-relaxed">
                      Under Indian Pharmacy Regulations (Drugs &amp; Cosmetics Rules 1945, Rules 65 &amp; 97), Schedule X narcotics and psychotropics cannot be sold or delivered online. They are strictly available in person at licensed pharmacies with physical duplicate prescriptions.
                    </p>
                    {summaryData?.scheduleXItems && summaryData.scheduleXItems.length > 0 && (
                      <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200">
                        <span className="font-bold block text-[11px] text-rose-900 mb-1">Restricted Items in Cart:</span>
                        <ul className="list-disc pl-5 font-semibold text-rose-800 space-y-0.5">
                          {summaryData.scheduleXItems.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-[11px] font-bold text-rose-700">
                      Please remove Schedule X item(s) from your cart to enable online checkout.
                    </p>
                  </div>
                )}

                {/* TARGET REQUIREMENT 7: Alert user if price or stock changed */}
                {summaryData?.hasChanged && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-1 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Live Catalog Price / Stock Update Notification:</span>
                    </div>
                    {summaryData.changeMessages.map((msg, idx) => (
                      <p key={idx} className="text-[11px] text-amber-800 pl-5">• {msg}</p>
                    ))}
                  </div>
                )}

                {summaryError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{summaryError}</span>
                  </div>
                )}

                {/* Items List */}
                <div className="divide-y divide-slate-100 border border-slate-200/90 rounded-2xl overflow-hidden shadow-soft-sm">
                  {(summaryData?.items || cart).map((item: any) => {
                    const itemSavings = (item.mrp - item.sellingPrice) * item.quantity;
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/60 transition">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                            {item.type === 'MEDICINE' ? (
                              <DosageFormIcon form={item.dosageForm || 'tablet'} className="w-5 h-5" />
                            ) : (
                              <Activity className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">{item.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">₹{item.sellingPrice.toFixed(2)} each</span>
                              {item.mrp > item.sellingPrice && (
                                <span className="line-through text-slate-400">₹{item.mrp.toFixed(2)}</span>
                              )}
                              {item.requiresPrescription && (
                                <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200 text-[10px]">
                                  Rx Required
                                </span>
                              )}
                              {itemSavings > 0 && (
                                <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.2 rounded-full">
                                  Save ₹{itemSavings.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 shadow-soft-sm">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-emerald-700 stepper-btn rounded-full cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-black text-slate-900 text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-emerald-700 stepper-btn rounded-full cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-black text-xs sm:text-sm text-slate-900 w-18 text-right">
                            ₹{(item.sellingPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Prescription Step (Schedule H Drugs) */}
                {summaryData?.requiresPrescription && (
                  <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Prescription Required (Schedule H/H1 Regulatory Compliance)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setRxOption('UPLOAD')}
                        className={`p-3 rounded-xl border text-left transition ${
                          rxOption === 'UPLOAD'
                            ? 'border-brand-600 bg-white ring-1 ring-brand-600 text-brand-900'
                            : 'border-amber-200 bg-white/70 text-slate-600'
                        }`}
                      >
                        <div className="font-bold">📎 Upload My Rx</div>
                        <div className="text-[10px] text-slate-500">Attach photo / PDF document</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRxOption('CONSULT')}
                        className={`p-3 rounded-xl border text-left transition ${
                          rxOption === 'CONSULT'
                            ? 'border-brand-600 bg-white ring-1 ring-brand-600 text-brand-900'
                            : 'border-amber-200 bg-white/70 text-slate-600'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                          <span>Free Doctor Call</span>
                        </div>
                        <div className="text-[10px] text-slate-500">MBBS practitioner calls in 10 mins</div>
                      </button>
                    </div>

                    {rxOption === 'UPLOAD' && (
                      <div className="p-3 bg-white rounded-xl border border-dashed border-amber-300 text-center text-xs">
                        {hasUploadedRx ? (
                          <div className="flex items-center justify-between text-emerald-700">
                            <span className="flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Prescription Document Attached
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setHasUploadedRx(false);
                                setUploadedFileUrl(null);
                              }}
                              className="text-slate-400 hover:text-rose-600 text-[11px]"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setHasUploadedRx(true);
                              setUploadedFileUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=60');
                            }}
                            className="text-brand-700 hover:underline font-bold"
                          >
                            + Click to Attach Prescription File
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={Boolean(summaryData?.hasScheduleX || cart.some((c) => c.schedule === 'SCHEDULE_X'))}
                    className={`font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 ${
                      summaryData?.hasScheduleX || cart.some((c) => c.schedule === 'SCHEDULE_X')
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                    }`}
                  >
                    <span>{summaryData?.hasScheduleX || cart.some((c) => c.schedule === 'SCHEDULE_X') ? 'BLOCKED BY REGULATION' : 'CONTINUE TO PAYMENT'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: PAYMENT */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition">
            <div
              onClick={() => completedSteps.SUMMARY && activeStep !== 'CONFIRMATION' && setActiveStep('PAYMENT')}
              className={`p-5 flex items-center justify-between border-b ${
                activeStep === 'PAYMENT' ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-transparent'
              } ${!completedSteps.SUMMARY ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                  completedSteps.PAYMENT ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white'
                }`}>
                  {completedSteps.PAYMENT ? '✓' : '3'}
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">PAYMENT OPTIONS</h3>
                  {completedSteps.PAYMENT && (
                    <p className="text-xs text-slate-500">Verified &amp; confirmed via backend</p>
                  )}
                </div>
              </div>
            </div>

            {activeStep === 'PAYMENT' && (
              <div className="p-6 space-y-5 animate-in fade-in">
                {paymentError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="font-bold text-sm text-rose-800 flex items-center justify-between flex-wrap gap-2">
                          <span>Payment Notice</span>
                          {lastPaymentResponse?.razorpay_payment_id && (
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              Ref: {lastPaymentResponse.razorpay_payment_id}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-700 leading-relaxed">
                          {sanitizePaymentError(paymentError)}
                        </p>
                      </div>
                    </div>

                    {lastPaymentResponse && pendingServerOrderId && (
                      <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessingPayment}
                          onClick={() =>
                            handleExecuteVerification(
                              pendingServerOrderId,
                              lastPaymentResponse.razorpay_payment_id,
                              lastPaymentResponse.razorpay_order_id,
                              lastPaymentResponse.razorpay_signature
                            )
                          }
                          className="px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isProcessingPayment ? 'animate-spin' : ''}`} />
                          <span>{isProcessingPayment ? 'Checking Status...' : 'Re-verify Payment'}</span>
                        </button>
                        <a
                          href="tel:+919833011223"
                          className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold transition"
                        >
                          Call Helpline (+91 98330 11223)
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Razorpay UPI */}
                  <label
                    onClick={() => setPaymentMethod('RAZORPAY_UPI')}
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === 'RAZORPAY_UPI'
                        ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'RAZORPAY_UPI'}
                        onChange={() => setPaymentMethod('RAZORPAY_UPI')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span>Razorpay UPI (Google Pay, PhonePe, Paytm, BHIM)</span>
                          <span className="bg-emerald-100 text-brand-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Instant zero-fee payment with automatic instant refund protection.
                        </p>
                      </div>
                    </div>
                    <span className="text-xl">⚡</span>
                  </label>

                  {/* Razorpay Cards */}
                  <label
                    onClick={() => setPaymentMethod('RAZORPAY_CARD')}
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === 'RAZORPAY_CARD'
                        ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'RAZORPAY_CARD'}
                        onChange={() => setPaymentMethod('RAZORPAY_CARD')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          Credit / Debit Card / NetBanking (Razorpay)
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Visa, Mastercard, RuPay, SBI, HDFC, ICICI, Axis.
                        </p>
                      </div>
                    </div>
                    <span className="text-xl">💳</span>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === 'COD'
                        ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          Cash on Delivery (COD)
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pay cash or UPI directly to our delivery executive upon arrival with 4-digit OTP.
                        </p>
                      </div>
                    </div>
                    <span className="text-xl">💵</span>
                  </label>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleInitiatePayment}
                    className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-xl shadow-lg shadow-brand-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Razorpay Server Order...</span>
                      </>
                    ) : (
                      <>
                        <span>PAY ₹{effectiveFinalTotal.toFixed(2)} &amp; CONFIRM ORDER</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: ORDER CONFIRMATION */}
          {activeStep === 'CONFIRMATION' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-xl space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Order Confirmed Successfully!
                </h2>
                <p className="text-xs text-slate-500">
                  Payment verified cryptographically via Razorpay gateway. Packed and assigned to express courier.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-bold text-brand-900">{confirmedOrder?.id || pendingServerOrderId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Delivery Handover OTP:</span>
                  <span className="font-bold text-emerald-700 text-sm">{confirmedOrder?.deliveryOtp || activeRazorpayDetails?.handoverOtp || '7842'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payable Amount:</span>
                  <span className="font-bold text-slate-900">₹{effectiveFinalTotal.toFixed(2)} ({paymentMethod})</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={`/track-delivery?orderId=${confirmedOrder?.id || pendingServerOrderId}`}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl text-center shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>Track Live Delivery &amp; OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/orders"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl text-center shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>View in My Orders</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Receipt-style Price Breakdown Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-soft space-y-4 sticky top-24">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-dashed border-slate-200 pb-3 flex items-center justify-between">
              <span>Price Details ({cartCount} Items)</span>
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
            </h3>

            {/* Free Delivery Visual Progress Bar */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-900">
                  {effectiveSubtotal >= 200
                    ? '🎉 FREE Delivery Unlocked!'
                    : `Add ₹${(200 - effectiveSubtotal).toFixed(0)} more for FREE delivery`}
                </span>
                <span className="text-emerald-700">₹200 Goal</span>
              </div>
              <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (effectiveSubtotal / 200) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Item MRP</span>
                <span>₹{effectiveSubtotal.toFixed(2)}</span>
              </div>

              {effectiveDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Savings</span>
                  <span>-₹{effectiveDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges (5–10km)</span>
                <span>
                  {effectiveDeliveryFee === 0 ? (
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      FREE
                    </span>
                  ) : (
                    `₹${effectiveDeliveryFee}`
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span>₹{effectiveFinalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/80 rounded-2xl text-[11px] text-emerald-900 font-medium border border-emerald-200/60">
              🎉 You save ₹{effectiveDiscount.toFixed(2)} on this order with direct manufacturer &amp; bulk discounts.
            </div>
          </div>

          <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200/60 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe &amp; Encrypted Checkout</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Every order is cryptographically verified on our backend servers. 100% Genuine batch traceability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
