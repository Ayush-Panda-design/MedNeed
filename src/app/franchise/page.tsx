'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Coins,
  ArrowRight,
  Calculator,
  Activity,
  FileCheck,
  AlertCircle,
  Sparkles,
  Award,
  Layers,
  MapPin,
  Store,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { FranchiseInquiry } from '@/types';
import { StorefrontIllustration } from '@/components/ui/Illustrations';

export default function FranchisePage() {
  const { submitFranchiseInquiry } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [proposedArea, setProposedArea] = useState('');
  const [commercialSpaceSqFt, setCommercialSpaceSqFt] = useState(300);
  const [ownershipType, setOwnershipType] = useState<'OWNED' | 'RENTED'>('OWNED');
  const [investmentBudget, setInvestmentBudget] = useState<FranchiseInquiry['investmentBudget']>('10_TO_20_LAKHS');
  const [hasPharmaExperience, setHasPharmaExperience] = useState(true);

  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please provide a valid 10-digit mobile number for business onboarding.');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedId = await submitFranchiseInquiry({
        fullName,
        phone,
        email,
        city,
        proposedArea,
        commercialSpaceSqFt: Number(commercialSpaceSqFt),
        ownershipType,
        investmentBudget,
        hasPharmaExperience,
        notes: `Applied for ${commercialSpaceSqFt} sq ft (${ownershipType}) in ${city}. Budget: ${investmentBudget}.`,
      });
      setSubmittedId(generatedId);
    } catch (err: any) {
      setFormError(err.message || 'Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Interactive ROI Calculator estimate
  const estimatedMonthlyTurnover = commercialSpaceSqFt * 1200; // e.g. 300 * 1200 = ₹3,60,000
  const estimatedGrossProfit = Math.round(estimatedMonthlyTurnover * 0.28); // 28% blended margin across Rx + OTC + Diagnostics
  const estimatedPaybackMonths = investmentBudget === '5_TO_10_LAKHS' ? '12 - 14' : investmentBudget === '10_TO_20_LAKHS' ? '14 - 18' : '18 - 22';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5]/50 via-[#FAF8F5] to-white py-8 px-4 sm:px-6 lg:px-8 space-y-12 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Dramatic Hero Banner: Bronze -> Navy -> Deep Forest Green with Storefront SVG */}
        <div className="relative bg-gradient-to-br from-[#78350F] via-[#0B1F17] to-[#042F1A] text-white rounded-3xl p-6 sm:p-12 shadow-soft-xl overflow-hidden border border-amber-500/30">
          <div className="absolute inset-0 bg-pattern-cross opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                <span>Franchise &amp; Partner Expansion Program</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Partner With{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
                  MedNeed
                </span>
              </h1>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Launch a high-margin, recession-proof Pharmacy &amp; Diagnostic Sample Hub. We provide full MedNeed ERP integration, medicine supply lines, brand marketing, and clinical compliance.
              </p>

              {/* KPI Chips as Glass Cards */}
              <div className="pt-2 flex flex-wrap gap-3.5 text-xs">
                <div className="glass-card-dark px-4 py-3 rounded-2xl border border-white/15 shadow-soft-sm hover:-translate-y-1 transition duration-200">
                  <div className="text-amber-400 font-black text-lg">25% – 32%</div>
                  <div className="text-slate-300 text-[11px] font-semibold">Blended Gross Margin</div>
                </div>
                <div className="glass-card-dark px-4 py-3 rounded-2xl border border-white/15 shadow-soft-sm hover:-translate-y-1 transition duration-200">
                  <div className="text-emerald-400 font-black text-lg">14 – 18 Months</div>
                  <div className="text-slate-300 text-[11px] font-semibold">Target Capital Payback</div>
                </div>
                <div className="glass-card-dark px-4 py-3 rounded-2xl border border-white/15 shadow-soft-sm hover:-translate-y-1 transition duration-200">
                  <div className="text-amber-300 font-black text-lg">2-in-1 Revenue</div>
                  <div className="text-slate-300 text-[11px] font-semibold">Medicines + Lab Tests</div>
                </div>
              </div>
            </div>

            {/* Storefront Illustration on the right */}
            <div className="lg:col-span-4 hidden lg:block opacity-95 animate-float-bob">
              <StorefrontIllustration />
            </div>
          </div>
        </div>

        {/* "How It Works" 4-Step Journey */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-soft space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider">
              Onboarding Roadmap
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              From Inquiry to Grand Opening in 4 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-base shadow-soft-sm">
                1
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Submit Proposal</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fill the onboarding form with property dimensions, location, and investment range.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-black text-base shadow-soft-sm">
                2
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Site Feasibility Audit</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our expansion committee evaluates footfall, prescriber density, and delivery radius.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black text-base shadow-soft-sm">
                3
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Fitout &amp; ERP Setup</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Turnkey store interior, FEFO barcode racks, drug license sign-off, and cloud ERP terminal.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-brand-800 text-white flex items-center justify-center font-black text-base shadow-soft-sm">
                4
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Launch &amp; Live Orders</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grand opening marketing, local doctor outreach, and instant online delivery routing.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid: Application Form & Interactive ROI Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Application Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-soft-lg space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Confidential Inquiry</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Franchise Onboarding Application
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit your commercial property and investment details for our expansion committee review.
                </p>
              </div>

              {submittedId ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4 animate-in fade-in">
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-soft">
                    ✓
                  </div>
                  <h3 className="font-black text-slate-900 text-xl">
                    Application Received! Ref: #{submittedId}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{fullName}</strong>. Your franchise inquiry has been logged into our expansion CRM. Our business expansion director will contact you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmittedId(null)}
                    className="btn-primary-gradient text-white text-xs font-bold px-6 py-3 rounded-full shadow-soft"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {formError && (
                    <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anand Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. anand@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Target City / District *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bhubaneswar, Cuttack, Puri"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Proposed Area / Locality Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Market, Opposite District Hospital"
                      value={proposedArea}
                      onChange={(e) => setProposedArea(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Commercial Space (Carpet Sq. Ft.) *
                      </label>
                      <input
                        type="number"
                        required
                        min={150}
                        max={2000}
                        value={commercialSpaceSqFt}
                        onChange={(e) => setCommercialSpaceSqFt(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Property Ownership *</label>
                      <select
                        value={ownershipType}
                        onChange={(e) => setOwnershipType(e.target.value as 'OWNED' | 'RENTED')}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm cursor-pointer"
                      >
                        <option value="OWNED">Self-Owned Property</option>
                        <option value="RENTED">Rented / Leased Commercial Shop</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Investment Capacity *</label>
                      <select
                        value={investmentBudget}
                        onChange={(e) => setInvestmentBudget(e.target.value as FranchiseInquiry['investmentBudget'])}
                        className="w-full px-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition shadow-soft-sm cursor-pointer"
                      >
                        <option value="5_TO_10_LAKHS">₹5 to ₹10 Lakhs (Compact Pharmacy)</option>
                        <option value="10_TO_20_LAKHS">₹10 to ₹20 Lakhs (Standard Pharmacy + Lab)</option>
                        <option value="20_LAKHS_PLUS">₹20 Lakhs+ (Super Flagship Center)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Prior Pharma / Retail Experience?</label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="experience"
                            checked={hasPharmaExperience}
                            onChange={() => setHasPharmaExperience(true)}
                            className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>Yes (Chemist/D.Pharm)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="experience"
                            checked={!hasPharmaExperience}
                            onChange={() => setHasPharmaExperience(false)}
                            className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>No (Investor)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#0B1F17] hover:bg-[#062015] disabled:opacity-50 text-white font-black py-4 rounded-full text-xs sm:text-sm transition flex items-center justify-center gap-2 mt-4 shadow-soft-lg hover:shadow-soft-xl cursor-pointer group"
                  >
                    <span>{isSubmitting ? 'Submitting Application...' : 'Submit Franchise Proposal'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: Premium Dark Glass Dashboard ROI Estimator */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-[#0B1F17] via-[#0F5132] to-[#062015] text-white rounded-3xl p-6 sm:p-7 shadow-soft-xl space-y-5 border border-emerald-800/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  <span>Dynamic ROI &amp; Profit Estimator</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                  Live Calculator
                </span>
              </div>

              <div className="space-y-3.5">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
                  <div className="text-xs text-slate-300 font-medium">Selected Space Size:</div>
                  <div className="text-2xl font-black text-white">{commercialSpaceSqFt} Sq. Ft.</div>
                  {/* Visual Range Slider */}
                  <input
                    type="range"
                    min={150}
                    max={2000}
                    step={50}
                    value={commercialSpaceSqFt}
                    onChange={(e) => setCommercialSpaceSqFt(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer mt-2"
                  />
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
                  <div className="text-xs text-slate-300 font-medium">Est. Monthly Pharmacy + Lab Turnover:</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                    ₹{estimatedMonthlyTurnover.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1">
                  <div className="text-xs text-slate-300 font-medium">Est. Monthly Gross Margin (~28%):</div>
                  <div className="text-2xl font-black text-amber-300">
                    ₹{estimatedGrossProfit.toLocaleString('en-IN')} <span className="text-xs text-amber-200/80 font-normal">/ month</span>
                  </div>
                </div>

                <div className="bg-black/20 rounded-2xl p-4 border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Target Payback Period:</span>
                  <span className="font-extrabold text-white bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-600/40">
                    {estimatedPaybackMonths} Months
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/10 pt-3">
                *Estimates based on typical retail pharmacy footfall and 5–10 km online delivery dispatch. Actual revenues vary based on locality prescribers and catchment density.
              </p>
            </div>

            {/* Operational Support Checklist */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-soft space-y-4 text-xs">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>What MedNeed Provides to Franchise Partners:</span>
              </h3>

              <div className="space-y-3 text-slate-600">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>MedNeed ERP Terminal:</strong> Ready barcode billing, automated FEFO expiry alerts &amp; GST returns.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Diagnostic Tie-ups:</strong> Ready phlebotomy collection kits &amp; temperature-controlled transit courier.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Drug License Guidance:</strong> Assistance with Form 20/21 pharmacist registration &amp; PCI approvals.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Direct Online Orders:</strong> All orders placed in your 5–10km radius route automatically to your dispensary counter!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
