'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileText,
  Trash2,
  Sparkles,
  User,
  Phone,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Compresses large camera photos client-side to < 1.5MB for fast, reliable upload.
 */
async function compressImageFile(file: File): Promise<File | Blob> {
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1600;
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export default function PrescriptionUploadModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDemoRx, setIsDemoRx] = useState(false);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File size exceeds the 10MB limit. Please upload a smaller image or compressed PDF.');
      return;
    }

    const type = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES.includes(type)) {
      setUploadError('Invalid format. Please upload JPG, PNG, WEBP, or PDF files only.');
      return;
    }

    setUploadError(null);
    setIsDemoRx(false);
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleUseDemoRx = () => {
    setUploadError(null);
    setIsDemoRx(true);
    const simulatedFile = new File(['sample-rx-placeholder'], 'Sample_Doctor_Prescription.jpg', {
      type: 'image/jpeg',
    });
    setSelectedFile(simulatedFile);
    if (!patientName) setPatientName('Ramesh Patel');
    if (!patientPhone) setPatientPhone('9876543210');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !isDemoRx) {
      setUploadError('Please select or drop a prescription image/PDF file before continuing.');
      return;
    }

    const cleanPhone = patientPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setUploadError('Please enter a valid 10-digit mobile number for pharmacist consultation.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      let storageReference = 'prescriptions/sample-rx-verified.jpg';

      if (!isDemoRx && selectedFile) {
        // Client-side compression
        const readyFile = await compressImageFile(selectedFile);

        const formData = new FormData();
        formData.append('prescription', readyFile, selectedFile.name);

        const res = await fetch('/api/prescriptions/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to securely upload prescription.');
        }

        storageReference = data.storagePath;
      }

      // Store ONLY the opaque storage path reference string, NEVER Base64 blobs
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('medneed_rx_url', storageReference);
        sessionStorage.setItem('medneed_rx_ref', storageReference);
        sessionStorage.setItem('medneed_patient_name', patientName || 'Verified Patient');
      }

      setFileUploaded(true);
      setTimeout(() => {
        onClose();
        router.push('/checkout?rx_uploaded=true');
      }, 1000);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Error uploading prescription. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full overflow-hidden shadow-soft-xl border border-slate-100 animate-in zoom-in-95 max-sm:slide-in-from-bottom max-h-[92vh] flex flex-col">
        {/* Header with Blue Gradient & Glass Icon */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#0A2540] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-soft-sm">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">Upload Doctor Prescription</h3>
              <p className="text-xs text-blue-100/90 mt-0.5">Verified by Registered Pharmacist in 10–15 mins</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-transform duration-200 hover:rotate-90 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {fileUploaded ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 text-[#2563EB] rounded-full flex items-center justify-center mx-auto shadow-soft animate-bounce">
                <CheckCircle2 className="w-9 h-9 text-[#2563EB]" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Prescription Attached Successfully!</h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                Redirecting you to checkout to finalize your express doorstep delivery...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Dropzone with Marching Ants / Animated Dashed Border */}
              {selectedFile ? (
                <div className="bg-blue-50/80 border border-blue-300 rounded-2xl p-4 flex items-center justify-between shadow-soft-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate max-w-xs">{selectedFile.name}</div>
                      <div className="text-[10px] text-blue-800 font-semibold">
                        {isDemoRx ? 'Sample Doctor Rx' : `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to Upload`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setIsDemoRx(false);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-gradient-to-b from-blue-50/50 to-teal-50/30 hover:bg-blue-50/90 transition duration-200 cursor-pointer group space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-soft-sm flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-[#2563EB] animate-float-bob" />
                    </div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      Click to choose file or drag &amp; drop prescription
                    </div>
                    {/* File-type chips */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">PNG</span>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">JPG</span>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">PDF</span>
                      <span className="text-[10px] text-slate-400 font-medium">(Max 10MB)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-slate-400 text-[11px]">Don&apos;t have a file ready right now?</span>
                    <button
                      type="button"
                      onClick={handleUseDemoRx}
                      className="text-[#2563EB] hover:text-blue-900 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Use Sample Doctor Rx</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message Box */}
              {uploadError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Schedule H/H1 Notice */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Schedule H / H1 Regulatory Rule:</strong> Please ensure the prescription clearly displays the{' '}
                  <strong className="text-amber-950">Doctor&apos;s Name, Clinic Stamp, Patient Name, and Date</strong>.
                </div>
              </div>

              {/* Patient details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Patient Name *</label>
                  <div className="relative group">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#2563EB]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/15 outline-none transition shadow-soft-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                  <div className="relative group">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#2563EB]" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/15 outline-none transition shadow-soft-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">
                  Specific dosage notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please dispense 15 days supply instead of 30 days..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/15 outline-none transition shadow-soft-sm"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                  <span>100% Confidential &amp; Encrypted Private Storage</span>
                </span>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full sm:w-auto btn-primary-gradient font-bold text-xs px-6 py-3 rounded-full shadow-soft transition cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Encrypting &amp; Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>Attach &amp; Continue</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
