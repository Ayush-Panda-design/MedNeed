'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Key, ExternalLink, X, Loader2, Copy, Check, HelpCircle } from 'lucide-react';

interface Props {
  redirectUrl?: string;
  buttonText?: string;
}

export default function GoogleSignInButton({ redirectUrl, buttonText = 'Continue with Google' }: Props) {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  );

  // Fetch real client ID dynamically from server to guarantee freshest value even without server restart
  useEffect(() => {
    fetch('/api/auth/google/client-id')
      .then((r) => r.json())
      .then((data) => {
        if (data?.clientId) {
          setClientId(data.clientId);
        }
      })
      .catch((e) => console.warn('Could not fetch Google client ID:', e));
  }, []);

  // Google Identity Services (One Tap & popup fallback)
  useEffect(() => {
    if (typeof window === 'undefined' || !clientId) return;

    const handleCredentialResponse = async (response: any) => {
      if (!response?.credential) return;
      setGoogleLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (data.success) {
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            window.location.reload();
          }
        } else {
          setErrorMessage(data.error || 'Google login failed');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Network error during Google authentication');
      } finally {
        setGoogleLoading(false);
      }
    };

    const initGsi = () => {
      const g = (window as any).google;
      if (g?.accounts?.id && clientId) {
        try {
          g.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          // Attempt non-intrusive One Tap
          g.accounts.id.prompt();
        } catch (e) {
          console.warn('GSI init warning:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGsi();
      document.body.appendChild(script);
    }
  }, [clientId, redirectUrl, router]);

  // Direct Google OAuth Redirect with prompt=select_account
  const handleGoogleRedirectLogin = async () => {
    setErrorMessage(null);

    let activeClientId = clientId;

    // If client ID hasn't loaded yet into state, fetch it on-demand before aborting
    if (!activeClientId || activeClientId.trim() === '') {
      try {
        setGoogleLoading(true);
        const res = await fetch('/api/auth/google/client-id');
        if (res.ok) {
          const data = await res.json();
          if (data?.clientId) {
            activeClientId = data.clientId;
            setClientId(data.clientId);
          }
        }
      } catch (err) {
        console.warn('Could not fetch Google client ID on-demand:', err);
      } finally {
        setGoogleLoading(false);
      }
    }

    if (!activeClientId || activeClientId.trim() === '') {
      setShowConfigModal(true);
      return;
    }

    setGoogleLoading(true);

    const origin = window.location.origin.replace(/\/+$/, '');
    const redirectUri = `${origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: activeClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account', // Forces Google to show "Choose an account"
      access_type: 'online',
    });

    if (redirectUrl) {
      params.set('state', redirectUrl);
    }

    // Direct browser navigation to Google's official account chooser
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedUri(text);
      setTimeout(() => setCopiedUri(null), 2500);
    }
  };

  const currentRedirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:3000/auth/callback';

  return (
    <>
      <div className="space-y-2">
        {/* Main Google Button with Explicit Account Chooser */}
        <button
          onClick={handleGoogleRedirectLogin}
          disabled={googleLoading}
          type="button"
          className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl border border-slate-300 shadow-xs transition flex items-center justify-center gap-3 hover:border-slate-400 group relative cursor-pointer disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
          ) : (
            /* Google SVG Icon */
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? 'Connecting to Google...' : buttonText}</span>
        </button>

        {/* Quick redirect_uri setup assistance */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="text-[11px] text-slate-400 hover:text-brand-700 flex items-center gap-1 transition cursor-pointer"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Getting &ldquo;redirect_uri_mismatch&rdquo;? View Authorized URIs</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Helpful Configuration Modal for Authorized redirect URIs */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Key className="w-4 h-4 text-brand-600" />
                Google OAuth: Fixing redirect_uri_mismatch
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3.5 leading-relaxed">
              <p>
                Google blocks sign-in with <strong>Error 400: redirect_uri_mismatch</strong> whenever the exact URL
                requesting sign-in is not whitelisted in your Google Cloud Console project.
              </p>

              <div className="space-y-2 bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-amber-950">
                <div className="font-bold text-[12px] text-amber-900 flex items-center justify-between">
                  <span>Your Current Exact Redirect URI:</span>
                  <span className="text-[10px] text-amber-700 uppercase tracking-wider font-semibold">Active Now</span>
                </div>
                <div className="flex items-center gap-2 bg-white border border-amber-300/80 p-2 rounded-xl">
                  <code className="font-mono text-[11px] text-slate-800 flex-1 truncate select-all font-semibold">
                    {currentRedirectUri}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentRedirectUri)}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
                  >
                    {copiedUri === currentRedirectUri ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-[11px]">
                  Steps to fix in Google Cloud Console (takes 60 seconds):
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 text-[11px]">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 font-semibold underline inline-flex items-center gap-0.5"
                    >
                      Google Cloud Credentials <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>
                    Under <strong>OAuth 2.0 Client IDs</strong>, click your client:
                    <div className="font-mono text-[10px] bg-slate-100 text-slate-700 p-1.5 rounded-lg mt-0.5 select-all break-all">
                      {clientId || '88368021252-akbpa532s7m5397mfcbh1u4pnutctven.apps.googleusercontent.com'}
                    </div>
                  </li>
                  <li>
                    Scroll to <strong>Authorized redirect URIs</strong>, click <strong>+ ADD URI</strong>, and add:
                    <div className="space-y-1 mt-1">
                      {[
                        currentRedirectUri,
                        'http://localhost:3000/auth/callback',
                        'http://localhost:3001/auth/callback',
                        'http://127.0.0.1:3000/auth/callback',
                      ]
                        .filter((val, idx, arr) => arr.indexOf(val) === idx)
                        .map((uri) => (
                          <div
                            key={uri}
                            className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
                          >
                            <span className="font-mono text-[10px] text-slate-700 select-all">{uri}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(uri)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy URI"
                            >
                              {copiedUri === uri ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ))}
                    </div>
                  </li>
                  <li>
                    Under <strong>Authorized JavaScript origins</strong>, add:
                    <div className="font-mono text-[10px] bg-slate-50 border border-slate-200 p-1.5 rounded-lg mt-0.5 text-slate-700">
                      http://localhost:3000, http://localhost:3001, http://127.0.0.1:3000
                    </div>
                  </li>
                  <li>
                    Click <strong>SAVE</strong>. (Google can take 1&ndash;2 minutes to update its edge servers).
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-100">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-700 hover:underline flex items-center gap-1 font-semibold"
              >
                Go to Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowConfigModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
