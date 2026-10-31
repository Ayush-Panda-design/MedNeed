import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  return NextResponse.json({
    success: true,
    clientId,
    isConfigured: Boolean(clientId && clientId.trim() !== ''),
  });
}
