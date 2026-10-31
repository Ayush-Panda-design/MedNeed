import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { signJwtToken, setAuthCookie } from '@/lib/auth';
import { resolveRoleFromEmail } from '@/lib/adminAuth';

/**
 * Validates and sanitizes a redirect path to ensure it is strictly a same-origin relative path.
 * Disallows protocol-relative URLs (//), Windows backslash schemes (/\\), and external schemes.
 */
function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) return '/';
  const trimmed = path.trim();

  // Strictly disallow external URLs, protocol-relative '//', or Windows path traversal '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return '/';
  }

  // Reject CR, LF, or null bytes (header injection prevention)
  if (/[\r\n\0]/.test(trimmed)) {
    return '/';
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    // Ensure origin didn't mutate (e.g. via javascript: or data: schemes)
    if (parsed.origin !== 'http://localhost') {
      return '/';
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return '/';
  }
}

/**
 * Parses state parameter which may be a raw relative path or JSON encoded payload.
 */
function parseStateRedirect(stateParam: string | null): string {
  if (!stateParam) return '/';
  try {
    const parsed = JSON.parse(stateParam);
    if (parsed && typeof parsed === 'object' && typeof parsed.next === 'string') {
      return sanitizeRedirectPath(parsed.next);
    }
  } catch {
    // Treat as raw string path
  }
  return sanitizeRedirectPath(stateParam);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const rawNext = searchParams.get('next');
  const errorParam = searchParams.get('error');

  const safeRedirectPath = rawNext ? sanitizeRedirectPath(rawNext) : parseStateRedirect(stateParam);

  if (errorParam) {
    console.error('Google OAuth error callback:', errorParam);
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(errorParam)}`, origin));
  }

  if (code) {
    let targetEmail = '';
    let targetName = '';
    let targetAvatar = '👤';

    // 1. Primary: Direct Google OAuth token exchange using credentials from .env
    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (googleClientId && googleClientSecret) {
      try {
        const originClean = origin.replace(/\/+$/, '');
        const callbackRedirectUri = `${originClean}/auth/callback`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: callbackRedirectUri,
            grant_type: 'authorization_code',
          }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          // Cryptographically verify ID Token returned by Google
          if (tokenData.id_token) {
            const client = new OAuth2Client(googleClientId);
            const ticket = await client.verifyIdToken({
              idToken: tokenData.id_token,
              audience: googleClientId,
            });
            const idPayload = ticket.getPayload();
            const isVerified = idPayload?.email_verified === true || (idPayload?.email_verified as any) === 'true';
            if (idPayload && idPayload.email && isVerified) {
              targetEmail = idPayload.email.toLowerCase().trim();
              targetName = idPayload.name || targetEmail.split('@')[0];
              targetAvatar = idPayload.picture || '👤';
            }
          }
        } else {
          const errBody = await tokenRes.text();
          console.warn('Direct Google token exchange non-ok:', errBody);
        }
      } catch (err) {
        console.warn('Direct Google exchange exception:', err);
      }
    }

    // 2. Secondary fallback: Supabase Auth session exchange if configured
    if (!targetEmail) {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session?.user) {
          const sbUser = data.session.user;
          targetEmail = (sbUser.email || '').toLowerCase().trim();
          targetName =
            sbUser.user_metadata?.full_name ||
            sbUser.user_metadata?.name ||
            targetEmail.split('@')[0];
          targetAvatar = sbUser.user_metadata?.avatar_url || '👤';
        }
      } catch (err) {
        console.warn('Supabase exchange exception:', err);
      }
    }

    // 3. If user email was successfully retrieved from Google
    if (targetEmail) {
      const roleInfo = await resolveRoleFromEmail(targetEmail);
      let targetRole = roleInfo.role;
      let finalName = targetName || roleInfo.name || targetEmail.split('@')[0];
      let finalAvatar = targetAvatar || roleInfo.avatar || (targetRole === 'CUSTOMER' ? '👤' : '👨‍💼');

      let userId = `usr-g-${Date.now()}`;

      if (process.env.DATABASE_URL) {
        try {
          // Check if this user exists in AdminUser first
          const existingAdmin = await prisma.adminUser.findUnique({ where: { email: targetEmail } });
          if (existingAdmin) {
            targetRole = existingAdmin.role;
            finalName = existingAdmin.name || finalName;
            finalAvatar = existingAdmin.avatar || finalAvatar;
            userId = existingAdmin.id;
            await prisma.adminUser.update({
              where: { id: existingAdmin.id },
              data: { name: finalName, provider: 'google', avatar: finalAvatar },
            });
          } else if (targetRole === 'CUSTOMER') {
            const customer = await prisma.customerUser.upsert({
              where: { email: targetEmail },
              update: { name: finalName, provider: 'google' },
              create: { email: targetEmail, name: finalName, provider: 'google' },
            });
            userId = customer.id;
          } else {
            const admin = await prisma.adminUser.upsert({
              where: { email: targetEmail },
              update: { name: finalName, provider: 'google', role: targetRole, avatar: finalAvatar },
              create: { email: targetEmail, name: finalName, role: targetRole, provider: 'google', avatar: finalAvatar },
            });
            userId = admin.id;
          }

          await prisma.auditLog.create({
            data: {
              actorName: finalName,
              actorRole: targetRole as any,
              actionType: targetRole === 'CUSTOMER' ? 'USER_LOGIN' : 'STAFF_LOGIN',
              details: `Google OAuth login verified for ${finalName} (${targetEmail}) as ${targetRole}.`,
            },
          });
        } catch (dbErr) {
          console.error('Database user upsert error in callback:', dbErr);
        }
      }

      // Sign JWT and set secure cookie
      const token = signJwtToken({
        userId,
        email: targetEmail,
        name: finalName,
        role: targetRole,
        provider: 'google',
      });
      await setAuthCookie(token);

      const redirectDestination = targetRole === 'CUSTOMER' ? safeRedirectPath : '/admin';
      return NextResponse.redirect(new URL(redirectDestination, origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', origin));
}
