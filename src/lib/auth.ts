import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserRole, AuthUser } from '@/types';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.');
}
const JWT_SECRET: string = rawSecret;
const COOKIE_NAME = 'medneed_token';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  provider: 'email' | 'google';
}

// 1. Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2. JWT Signing & Verification
export function signJwtToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

// 3. HTTP-only Cookie Helpers
export async function setAuthCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });
  } catch (err: any) {
    if (process.env.NODE_ENV === 'test') {
      // In standalone test scripts, Next.js request async storage is unmounted
      return;
    }
    console.error('setAuthCookie failure:', err);
    throw err;
  }
}

export async function clearAuthCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete({
      name: COOKIE_NAME,
      path: '/',
    });
  } catch (err: any) {
    if (process.env.NODE_ENV === 'test') {
      // In standalone test scripts, Next.js request async storage is unmounted
      return;
    }
    console.error('clearAuthCookie failure:', err);
    throw err;
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwtToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      provider: payload.provider,
      avatar: payload.role === 'CUSTOMER' ? '👤' : '👨‍⚕️',
    };
  } catch (err) {
    return null;
  }
}

export async function requireStaffSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwtToken(token);
    if (!payload) return null;

    const staffRoles = ['SUPER_ADMIN', 'STORE_MANAGER', 'PHARMACIST', 'AUDIT_OFFICER'];
    if (!staffRoles.includes(payload.role)) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

