import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed. Signout is only allowed via POST.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
