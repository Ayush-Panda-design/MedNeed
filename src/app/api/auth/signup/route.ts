import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwtToken, setAuthCookie } from '@/lib/auth';
import { UserRole } from '@/types';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limit = await checkRateLimit(`signup:${clientIp}`, 5, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many sign-up attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const { name, email, phone, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // Public signup is strictly restricted to CUSTOMER accounts
    const targetRole: UserRole = 'CUSTOMER';
    const targetAvatar = '👤';

    const hashedPassword = await hashPassword(password);
    let userId = `usr-${Date.now()}`;

    if (process.env.DATABASE_URL) {
      const existing = await prisma.customerUser.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 400 });
      }

      const customer = await prisma.customerUser.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          passwordHash: hashedPassword,
          provider: 'email',
          avatar: targetAvatar,
        },
      });
      userId = customer.id;

      try {
        await prisma.auditLog.create({
          data: {
            actorName: name.trim(),
            actorRole: 'CUSTOMER',
            actionType: 'ACCOUNT_CREATED',
            details: `Registered customer account for ${name.trim()} (${normalizedEmail}).`,
          },
        });
      } catch (auditErr) {
        console.warn('Non-fatal: Failed to write audit log for signup:', auditErr);
      }
    }

    // Sign JWT Token
    const token = signJwtToken({
      userId,
      email: normalizedEmail,
      name,
      role: targetRole,
      provider: 'email',
    });

    // Set secure HTTP-only Cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        name,
        email: normalizedEmail,
        phone,
        role: targetRole,
        avatar: targetAvatar,
        provider: 'email',
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    const rawMsg = error?.message || '';
    const isTechnicalDbError = /prisma|connectorerror|postgreserror|queryerror|syntaxerror|adminrole|22p02|p[0-9]{4}/i.test(rawMsg);
    const userMessage = isTechnicalDbError
      ? 'Registration service is temporarily delayed. Please try again shortly.'
      : (rawMsg || 'Failed to create account.');
    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}
