'use client';

import React, { useState } from 'react';
import { X, MapPin, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PincodeModal({ isOpen, onClose }: Props) {
  const { userPincode, verifyDeliveryPincode } = useApp();
  const [inputPin, setInputPin] = useState(userPincode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tested: boolean;
    serviceable: boolean;
    distance: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const quickPincodes = [
    { pin: '751035', area: 'Pahal / Balianta (Head Hub)' },
    { pin: '751024', area: 'Patia / KIIT' },
    { pin: '751001', area: 'Old Town / Station' },
    { pin: '752101', area: 'Nakhara / DPS Road' },
    { pin: '753001', area: 'Cuttack City' },
  ];

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = inputPin.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setErrorMessage('Please enter a complete 6-digit postal pincode.');
      setFeedback(null);
      return;
    }

    setErrorMessage(null);
    const res = verifyDeliveryPincode(cleanPin);
    setFeedback({
      tested: true,
      serviceable: res.serviceable,
      distance: res.distance,
      message: res.message,
    });
    if (res.serviceable) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleSelectQuickPin = (pin: string) => {
    setInputPin(pin);
    setErrorMessage(null);
    const res = verifyDeliveryPincode(pin);
    setFeedback({
      tested: true,
      serviceable: res.serviceable,
      distance: res.distance,
      message: res.message,
    });
    if (res.serviceable) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 p-6 space-y-4 text-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Check Delivery Radius</h3>
              <p className="text-xs text-slate-500">Hyper-local 5-10 km Express Dispatch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheck} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700">Enter Your 6-Digit Pincode</label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={inputPin}
              onChange={(e) => {
                setInputPin(e.target.value.replace(/\D/g, ''));
                setErrorMessage(null);
              }}
              placeholder="e.g. 751035"
              className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563EB] outline-none font-medium font-mono"
            />
            <button
              type="submit"
              className="btn-primary-gradient text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              Verify <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Quick Location Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Select Area:</span>
          <div className="flex flex-wrap gap-1.5">
            {quickPincodes.map((item) => (
              <button
                key={item.pin}
                type="button"
                onClick={() => handleSelectQuickPin(item.pin)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                  inputPin === item.pin
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.pin} ({item.area.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Input Validation Error */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Verification Result Feedback */}
        {feedback?.tested && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              feedback.serviceable
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {feedback.serviceable ? (
              <CheckCircle2 className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{feedback.message}</p>
              {feedback.serviceable ? (
                <p className="text-[11px] text-[#2563EB] mt-0.5 font-medium">
                  ✓ Location saved! Window will auto-close in a moment.
                </p>
              ) : (
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Try another address or contact our pharmacist helpline at{' '}
                  <a href="tel:+919437545411" className="font-bold underline">
                    +91 94375 45411
                  </a>{' '}
                  for special courier arrangements.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-800">Dispatch Coverage Zones:</div>
          <div>• Express Zone (&le; 5.0 km): 45–60 min rapid delivery</div>
          <div>• Standard Corridor (5.0 – 10.0 km): Guaranteed same-day doorstep delivery</div>
        </div>
      </div>
    </div>
  );
}
