import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signJwtToken, setAuthCookie } from '@/lib/auth';
import { resolveRoleFromEmail } from '@/lib/adminAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limit = await checkRateLimit(`signin:${clientIp}`, 5, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many sign-in attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Server-side role resolution via database AdminUser table (Zero-Trust RBAC)
    const roleInfo = await resolveRoleFromEmail(normalizedEmail);
    const targetRole = roleInfo.role;

    let userId = `usr-${Date.now()}`;
    let userName = roleInfo.name || normalizedEmail.split('@')[0];
    let userAvatar = roleInfo.avatar || (targetRole === 'CUSTOMER' ? '👤' : '👨‍💼');

    if (process.env.DATABASE_URL) {
      if (targetRole === 'CUSTOMER') {
        const customer = await prisma.customerUser.findUnique({ where: { email: normalizedEmail } });
        if (!customer) {
          return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
        }
        if (!customer.passwordHash) {
          return NextResponse.json(
            { success: false, error: 'This account was registered using Google Sign-In. Please sign in with Google.' },
            { status: 401 }
          );
        }
        const valid = await comparePassword(password, customer.passwordHash);
        if (!valid) {
          return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
        }
        userId = customer.id;
        userName = customer.name;
        userAvatar = customer.avatar || '👤';
      } else {
        // Authorized Admin / Staff user
        const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
        if (!admin) {
          return NextResponse.json({ success: false, error: 'Staff account not found. Please contact an administrator.' }, { status: 401 });
        }
        if (!admin.passwordHash) {
          return NextResponse.json(
            { success: false, error: 'This staff account does not have a local password configured. Please use Google Sign-In.' },
            { status: 401 }
          );
        }
        const valid = await comparePassword(password, admin.passwordHash);
        if (!valid) {
          return NextResponse.json({ success: false, error: 'Invalid staff password credentials.' }, { status: 401 });
        }
        userId = admin.id;
        userName = admin.name;
        userAvatar = admin.avatar || '👨‍💼';
      }

      // Record audit log with verified role (CUSTOMER or Staff)
      try {
        await prisma.auditLog.create({
          data: {
            actorName: userName,
            actorRole: targetRole as any,
            actionType: targetRole === 'CUSTOMER' ? 'USER_LOGIN' : 'STAFF_LOGIN',
            details: `Authenticated user ${userName} (${normalizedEmail}) as ${targetRole}.`,
          },
        });
      } catch (auditErr) {
        console.warn('Non-fatal signin audit log error:', auditErr);
      }
    }

    // Sign JWT Token with server-resolved role
    const token = signJwtToken({
      userId,
      email: normalizedEmail,
      name: userName,
      role: targetRole,
      provider: 'email',
    });

    // Set secure HTTP-only cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        name: userName,
        email: normalizedEmail,
        role: targetRole,
        avatar: userAvatar,
        provider: 'email',
      },
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    const rawMsg = error?.message || '';
    const isTechnicalDbError = /prisma|connectorerror|postgreserror|queryerror|syntaxerror|adminrole|22p02|p[0-9]{4}/i.test(rawMsg);
    const userMessage = isTechnicalDbError
      ? 'Sign-in service is experiencing a temporary delay. Please try again shortly.'
      : (rawMsg || 'Failed to sign in.');
    return NextResponse.json({ success: false, error: userMessage }, { status: 500 });
  }
}
