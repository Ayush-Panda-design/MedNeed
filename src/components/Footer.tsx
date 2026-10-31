'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  FileText,
  X,
  CheckCircle2,
  Lock,
  Scale,
  ArrowUp,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WaveDivider } from './ui/Illustrations';
import FooterCategoryDirectory from './FooterCategoryDirectory';

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState<'PRIVACY' | 'TERMS' | 'CONDUCT' | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Decorative Wave Divider on top */}
      <div className="w-full overflow-hidden leading-none text-[#0f172a] -mb-1 select-none">
        <WaveDivider className="w-full h-8 sm:h-12 text-[#0f172a]" />
      </div>

      <footer className="bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617] text-slate-300 pt-12 pb-10 border-t border-slate-800 text-xs w-full overflow-hidden relative">
        {/* Subtle background ambient pattern */}
        <div className="absolute inset-0 bg-pattern-cross opacity-10 pointer-events-none" />
        <div className="absolute -top-24 left-1/3 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10">
            {/* Column 1: Brand & Quality Trust */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-teal-500 p-0.5 shadow-soft">
                  <div className="w-full h-full bg-[#0f172a] rounded-[14px] flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="MedNeed Logo"
                      className="w-8 h-8 object-contain filter hue-rotate-[65deg]"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black text-white tracking-tight">
                    Med<span className="text-[#38bdf8]">Need</span>
                  </span>
                  <div className="text-[10px] text-blue-200/80 font-medium">
                    — For every need , for every life —
                  </div>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed text-[11px] sm:text-xs">
                Your neighborhood digital pharmacy and diagnostic hub, with verified medicine batches, FEFO cold-chain storage under 25°C, and express 45–60 min doorstep delivery across Bhubaneswar &amp; Cuttack.
              </p>

              <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-700/40 text-blue-200 px-3 py-1.5 rounded-full text-[11px] font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>100% Genuine Stored Under 25°C</span>
              </div>
            </div>

            {/* Column 2: Healthcare Quick Links */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Healthcare Services</span>
              </h4>
              <ul className="space-y-2.5 text-slate-400 text-xs">
                <li>
                  <Link href="/medicines" className="hover:text-blue-300 transition duration-150 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                    <span>Search All Medicines</span>
                  </Link>
                </li>
                <li>
                  <Link href="/blood-tests" className="hover:text-teal-300 transition duration-150 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 group-hover:scale-150 transition-transform" />
                    <span>Book Diagnostic Blood Tests</span>
                  </Link>
                </li>
                <li>
                  <Link href="/track-delivery" className="hover:text-blue-300 transition duration-150 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                    <span>Live Delivery &amp; OTP Tracker</span>
                  </Link>
                </li>
                <li>
                  <Link href="/franchise" className="hover:text-amber-300 transition duration-150 flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-150 transition-transform" />
                    <span>Franchise &amp; Partner With Us</span>
                  </Link>
                </li>
                <li className="pt-2">
                  <Link
                    href="/admin"
                    className="text-slate-300 hover:text-white transition text-[11px] flex items-center gap-2 bg-blue-950/60 hover:bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-800/50 w-fit"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pharmacy Staff &amp; ERP Login</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Store Locations & Hubs as Frosted Panels */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Store Locations &amp; Radius</span>
              </h4>
              <div className="bg-slate-900/60 rounded-2xl p-3.5 border border-slate-700/60 space-y-3 text-[11px] backdrop-blur-xs">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug">
                    <strong className="text-white block text-[11px] font-bold">Main Dispensary:</strong>
                    842/1275, Puri Canal Road, Rudhrapur, Pahal / Balianta, Bhubaneswar, Odisha 751035
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-slate-300 pt-2.5 border-t border-slate-800">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug">
                    <strong className="text-white block text-[11px] font-bold">Distribution Hub:</strong>
                    Plot No. 1629, Nakhara, DPS Road, Bhubaneswar, Odisha
                  </div>
                </div>
                <div className="text-[10px] text-teal-300/90 pt-1.5 border-t border-slate-800 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  <span>Free delivery on medicine orders ₹200+ within 5–10 km</span>
                </div>
              </div>
            </div>

            {/* Column 4: 24x7 Helpline */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs tracking-wider uppercase flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Pharmacist Helpline</span>
              </h4>
              <div className="space-y-2.5 text-slate-300">
                <a
                  href="tel:+919437545411"
                  className="flex items-center gap-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-xl transition text-white group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-blue-300 uppercase font-bold">24×7 Direct Line</div>
                    <span className="font-bold text-xs sm:text-sm font-mono">+91 94375 45411</span>
                  </div>
                </a>

                <a
                  href="mailto:medneed.service@gmail.com"
                  className="flex items-center gap-2.5 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-xl transition text-white group"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[9px] text-teal-300 uppercase font-bold">Email Support</div>
                    <span className="font-semibold text-xs truncate block max-w-[180px]">medneed.service@gmail.com</span>
                  </div>
                </a>

                <div className="pt-1 text-slate-400 text-[11px] leading-relaxed">
                  Serving: Bhubaneswar, Pahal, Balianta, Nakhara, Hanspal &amp; Cuttack
                </div>
              </div>
            </div>
          </div>

          {/* MedNeed Comprehensive Industry Category Directory (General Store, Pharmacy Therapeutics, Diagnostics, Symptoms) */}
          <FooterCategoryDirectory />

          {/* Statutory Regulatory Licenses & Trust Strip */}
          <div className="bg-gradient-to-r from-slate-900/90 via-[#1e293b]/90 to-slate-900/90 rounded-2xl p-5 sm:p-6 border border-slate-700/70 space-y-4 text-[11px] text-slate-300 shadow-soft">
            <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3 text-white font-bold text-xs uppercase tracking-wide">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Government Registered &amp; Statutory Pharmacy Certifications</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-2">
              <div className="bg-black/20 p-3 rounded-xl border border-slate-700/50">
                <span className="text-blue-300/80 block text-[10px] uppercase font-bold tracking-wider">Retail Drug Licenses:</span>
                <span className="font-bold text-white text-xs">Form 20: OD-20B-784920</span><br />
                <span className="font-bold text-white text-xs">Form 21: OD-21B-784921</span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-slate-700/50">
                <span className="text-blue-300/80 block text-[10px] uppercase font-bold tracking-wider">Supervising Pharmacist:</span>
                <span className="font-bold text-white text-xs">Registered Pharmacist</span><br />
                <span className="text-slate-400 text-[10px]">Reg. #OD-89421 (OSPC)</span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-slate-700/50">
                <span className="text-blue-300/80 block text-[10px] uppercase font-bold tracking-wider">FSSAI License:</span>
                <span className="font-mono text-white text-xs font-bold">10020011004523</span><br />
                <span className="text-slate-400 text-[10px]">Nutraceuticals &amp; Supplements</span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-slate-700/50">
                <span className="text-blue-300/80 block text-[10px] uppercase font-bold tracking-wider">GSTIN &amp; CIN:</span>
                <span className="font-mono text-white text-xs font-bold">21AABCM8921K1ZK</span><br />
                <span className="text-slate-400 text-[10px]">MedNeed Healthcare Pvt. Ltd.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-amber-300/90 bg-amber-950/30 p-3 rounded-xl border border-amber-800/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
              <p className="leading-relaxed text-slate-300 text-[10px]">
                <strong className="text-amber-300">Drugs and Cosmetics Act, 1940 Compliance:</strong> Schedule H, H1, and X medications cannot be dispensed without a valid registered medical practitioner&apos;s prescription. All prescriptions are verified by licensed pharmacists before packing. Emergency doctor consultation calls are facilitated via verified MBBS practitioners.
              </p>
            </div>
          </div>

          {/* Dynamic Legal Copyright and Policy Modal Triggers */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-3">
            <div>
              © 2024–{new Date().getFullYear()} MedNeed Healthcare Technologies Pvt. Ltd. (CIN: U85110OD2024PTC045892). All rights reserved.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePolicy('PRIVACY')}
                className="hover:text-blue-300 cursor-pointer transition text-slate-300 font-medium"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActivePolicy('TERMS')}
                className="hover:text-blue-300 cursor-pointer transition text-slate-300 font-medium"
              >
                Terms of Dispensing
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActivePolicy('CONDUCT')}
                className="hover:text-blue-300 cursor-pointer transition text-slate-300 font-medium"
              >
                Pharmacist Code of Conduct
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-40 bg-white/90 hover:bg-white text-blue-800 p-3 rounded-full shadow-soft-xl border border-blue-200 backdrop-blur-md transition-all hover:scale-110 active:scale-95 group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4 text-blue-600 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Interactive Compliance & Policy Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto border border-slate-200 shadow-2xl relative text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-soft-sm">
                  <Scale className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {activePolicy === 'PRIVACY' && 'Patient Privacy & Health Data Policy'}
                    {activePolicy === 'TERMS' && 'Terms of Pharmaceutical Dispensing'}
                    {activePolicy === 'CONDUCT' && 'Pharmacist Ethical Code of Conduct'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    MedNeed Healthcare Technologies Pvt. Ltd. • Regulatory Disclosure
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-xs text-slate-600 space-y-4 leading-relaxed">
              {activePolicy === 'PRIVACY' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 font-medium">
                    Compliant with the Information Technology Act, 2000 &amp; Digital Personal Data Protection (DPDP) Act, 2023.
                  </div>
                  <p>
                    <strong>1. Health Data Protection:</strong> All uploaded prescription documents, diagnostic blood test results, and patient medical histories are encrypted at rest using AES-256 and transmitted exclusively over HTTPS.
                  </p>
                  <p>
                    <strong>2. Confidentiality:</strong> Your diagnostic reports are shared only with the ordering patient and authorized licensed phlebotomists/pathologists. MedNeed never sells health data to third-party advertisers.
                  </p>
                  <p>
                    <strong>3. Data Retention:</strong> Prescription files are archived for 2 years strictly as mandated by the Drugs and Cosmetics Rules, 1945 for drug dispensary audit verification.
                  </p>
                </>
              )}

              {activePolicy === 'TERMS' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 font-medium">
                    Governed by the Pharmacy Act 1948 and Drugs &amp; Cosmetics Rules (Forms 20 &amp; 21).
                  </div>
                  <p>
                    <strong>1. Mandatory Prescription Rule:</strong> Schedule H, H1, and Schedule X medicines cannot be dispatched without verified sign-off from a registered pharmacist against a valid doctor prescription.
                  </p>
                  <p>
                    <strong>2. FEFO Quality Assurance:</strong> MedNeed strictly operates First-Expiry, First-Out (FEFO) automated warehouse control. No medication within 6 months of expiry is dispensed.
                  </p>
                  <p>
                    <strong>3. Doorstep Handover OTP:</strong> Handover is completed only upon the customer verifying the physical package and providing the unique 4-digit OTP to our delivery rider.
                  </p>
                </>
              )}

              {activePolicy === 'CONDUCT' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 font-medium">
                    Prescribed under the Pharmacy Council of India (PCI) Professional Conduct Regulations.
                  </div>
                  <p>
                    <strong>1. Independent Pharmacist Sign-Off:</strong> Every medication order is reviewed by a degree-holding Registered Pharmacist licensed by the State Pharmacy Council.
                  </p>
                  <p>
                    <strong>2. Patient Counseling &amp; Safety:</strong> Our pharmacists are accessible 24×7 via our helpline (+91 94375 45411) for dosage advisory, side effect queries, and drug interaction guidance.
                  </p>
                  <p>
                    <strong>3. Tamper-Evident Packaging:</strong> Medications and diagnostic sample tubes are sealed in sterile tamper-proof containers to safeguard clinical efficacy during transit.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Registered in Odisha, India</span>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="btn-primary-gradient text-white font-bold px-5 py-2.5 rounded-xl transition"
              >
                I Understand &amp; Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
