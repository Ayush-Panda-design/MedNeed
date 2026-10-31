import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { signJwtToken, setAuthCookie } from '@/lib/auth';
import { resolveRoleFromEmail } from '@/lib/adminAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting on Google OAuth Authentication
    const clientIp = getClientIp(request);
    const limit = await checkRateLimit(`google:${clientIp}`, 10, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many authentication attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    // 2. Fail closed if GOOGLE_CLIENT_ID is unset
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google authentication is misconfigured: GOOGLE_CLIENT_ID is not configured on the server.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { credential } = body;

    // 3. Require genuine Google ID Token (credential)
    if (!credential) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google ID token (credential) is required. Access token verification has been deprecated for security.',
        },
        { status: 400 }
      );
    }

    // 4. Verify Google JWT ID Token via google-auth-library with required audience
    const client = new OAuth2Client(googleClientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (verifyErr: any) {
      return NextResponse.json(
        {
          success: false,
          error: `Google ID token verification failed: ${verifyErr?.message || 'Invalid or expired token'}`,
        },
        { status: 401 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Google ID token payload is empty or invalid.' },
        { status: 401 }
      );
    }

    // 5. Require email_verified = true
    const isEmailVerified = payload.email_verified === true || (payload.email_verified as any) === 'true';
    if (!payload.email || !isEmailVerified) {
      return NextResponse.json(
        { success: false, error: 'Google account email is missing or not verified.' },
        { status: 400 }
      );
    }

    const targetEmail = payload.email.toLowerCase().trim();
    const targetName = payload.name || payload.given_name || targetEmail.split('@')[0];
    const targetAvatar = payload.picture || '';

    // 6. Server-side role resolution & DB Upsert via AdminUser table
    const roleInfo = await resolveRoleFromEmail(targetEmail);
    let targetRole = roleInfo.role;
    let finalName = targetName || roleInfo.name || targetEmail.split('@')[0];
    let finalAvatar = targetAvatar || roleInfo.avatar || (targetRole === 'CUSTOMER' ? '👤' : '👨‍💼');

    let userId = `usr-g-${Date.now()}`;

    if (process.env.DATABASE_URL) {
      // Check if this user exists as staff in AdminUser
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
          create: {
            email: targetEmail,
            name: finalName,
            provider: 'google',
          },
        });
        userId = customer.id;
      } else {
        const admin = await prisma.adminUser.upsert({
          where: { email: targetEmail },
          update: { name: finalName, provider: 'google', role: targetRole, avatar: finalAvatar },
          create: {
            email: targetEmail,
            name: finalName,
            role: targetRole,
            provider: 'google',
            avatar: finalAvatar,
          },
        });
        userId = admin.id;
      }

      try {
        await prisma.auditLog.create({
          data: {
            actorName: finalName,
            actorRole: targetRole as any,
            actionType: targetRole === 'CUSTOMER' ? 'USER_LOGIN' : 'STAFF_LOGIN',
            details: `Google OAuth login verified for ${finalName} (${targetEmail}) as ${targetRole}. JWT issued.`,
          },
        });
      } catch (auditErr) {
        console.warn('Non-fatal google auth audit log error:', auditErr);
      }
    }

    // 7. Sign real JWT Token
    const token = signJwtToken({
      userId,
      email: targetEmail,
      name: finalName,
      role: targetRole,
      provider: 'google',
    });

    // 8. Set secure HTTP-only cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        name: finalName,
        email: targetEmail,
        role: targetRole,
        avatar: finalAvatar,
        provider: 'google',
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    const rawMsg = error?.message || '';
    const isTechnicalDbError = /prisma|connectorerror|postgreserror|queryerror|syntaxerror|adminrole|22p02|p[0-9]{4}/i.test(rawMsg);
    const userMessage = isTechnicalDbError
      ? 'Google Sign-in service is experiencing a momentary delay. Please try again.'
      : (rawMsg || 'Failed to authenticate with Google.');
    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}
