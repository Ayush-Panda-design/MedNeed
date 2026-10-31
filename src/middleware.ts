import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.');
}

async function verifyEdgeToken(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert base64url signature to Uint8Array
    const sigBase64 = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (sigBase64.length % 4)) % 4;
    const paddedSig = sigBase64 + '='.repeat(padLen);
    const sigBinary = atob(paddedSig);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, dataToVerify);
    if (!isValid) return null;

    // Decode payload
    const payloadBase64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payloadBase64 + '='.repeat((4 - (payloadBase64.length % 4)) % 4);
    const jsonStr = decodeURIComponent(
      atob(paddedPayload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonStr);

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiAdmin = pathname.startsWith('/api/admin');
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage || isApiAdmin) {
    const token = request.cookies.get('medneed_token')?.value;

    if (!token) {
      if (isApiAdmin) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Staff credentials required' },
          { status: 401 }
        );
      }
      const signinUrl = new URL('/auth/signin', request.url);
      signinUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signinUrl);
    }

    const payload = await verifyEdgeToken(token);
    const staffRoles = ['SUPER_ADMIN', 'STORE_MANAGER', 'PHARMACIST', 'AUDIT_OFFICER'];

    if (!payload || !staffRoles.includes(payload.role)) {
      if (isApiAdmin) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Insufficient staff permissions' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/?error=forbidden_admin_access', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
