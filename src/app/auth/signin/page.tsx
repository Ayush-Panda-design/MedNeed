'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';
  const errorParam = searchParams.get('error');

  const { signIn } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (errorParam) {
      if (errorParam === 'redirect_uri_mismatch') {
        setErrorMessage(
          'Google OAuth Error: redirect_uri_mismatch. Add http://localhost:3000/auth/callback to Authorized redirect URIs in Google Cloud Console.'
        );
      } else if (errorParam === 'access_denied') {
        setErrorMessage('Google Sign-in was cancelled.');
      } else if (errorParam === 'auth_failed') {
        setErrorMessage('Google authentication could not be completed. Please check server credentials and try again.');
      } else {
        setErrorMessage(`Sign-in error: ${errorParam}`);
      }
    }
  }, [errorParam]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await signIn(email, password);
      setIsLoading(false);
      setSuccessMessage('Signed in successfully! Redirecting...');

      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (user.role === 'CUSTOMER') {
          router.push('/');
        } else {
          router.push('/admin');
        }
      }, 700);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Sign in failed. Please check your credentials.');
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setErrorMessage(null);
    const demoPassword = demoEmail.includes('@medneed.com') ? 'admin123' : 'password123';
    setEmail(demoEmail);
    setPassword('••••••••');
    signIn(demoEmail, demoPassword).then((user) => {
      setSuccessMessage(`Signed in as ${user.name}! Redirecting...`);
      setTimeout(() => {
        if (user.role === 'CUSTOMER') {
          router.push(redirectUrl || '/');
        } else {
          router.push('/admin');
        }
      }, 700);
    }).catch((err) => {
      setErrorMessage(err.message || 'Sign in failed');
    });
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Card Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <img
              src="/logo.png"
              alt="MedNeed Logo"
              className="w-14 h-14 rounded-full object-contain mx-auto shadow-md shadow-brand-600/20"
            />
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to Med<span className="text-brand-600">Need</span>
          </h1>
          <p className="text-xs text-brand-700 font-medium">
            — For every need , for every life —
          </p>
        </div>

        {/* Main Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* Google Sign In Component */}
          <div>
            <GoogleSignInButton redirectUrl={redirectUrl} buttonText="Continue with Google" />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold">Or with Email</span>
              </div>
            </div>
          </div>

          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Unified Email / Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-brand-700 hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-brand-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Role Resolution Note */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            💡 <strong>Smart Role Routing:</strong> Authorized staff emails (Owner, Pharmacist, Store Manager) are automatically authenticated and redirected to the <strong>Admin Suite</strong>. Customer accounts are routed directly to the pharmacy catalog.
          </div>

          {/* Quick Demo Logins */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              1-Click Demo Accounts:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemo('owner@medneed.com')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-brand-900">👨‍💼 Owner (Super Admin)</div>
                <div className="text-[10px] text-slate-500 truncate">owner@medneed.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('pharmacist@medneed.com')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-brand-900">👨‍⚕️ Vikram (Pharmacist)</div>
                <div className="text-[10px] text-slate-500 truncate">pharmacist@medneed.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('manager@medneed.com')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-brand-900">👩‍💼 Pooja (Store Mgr)</div>
                <div className="text-[10px] text-slate-500 truncate">manager@medneed.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('rahul.mehra@example.com')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
              >
                <div className="font-bold text-slate-800">👤 Customer Account</div>
                <div className="text-[10px] text-slate-500 truncate">rahul.mehra@example.com</div>
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-xs text-slate-600 pt-1">
            New to MedNeed?{' '}
            <Link href="/auth/signup" className="font-bold text-brand-700 hover:underline">
              Create an Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading sign in...</div>}>
      <SignInContent />
    </Suspense>
  );
}
