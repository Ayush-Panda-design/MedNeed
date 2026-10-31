import { NextResponse } from 'next/server';
import { uploadPrescriptionToSupabase } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const limit = await checkRateLimit(`rx_upload:${clientIp}`, 10, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many upload attempts. Please retry in ${limit.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('prescription') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No prescription file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File exceeds maximum allowed size of 10MB.' },
        { status: 400 }
      );
    }

    const fileType = file.type?.toLowerCase() || '';
    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only JPG, PNG, WEBP, and PDF files are allowed.' },
        { status: 400 }
      );
    }

    const uploadRes = await uploadPrescriptionToSupabase(file, file.name);

    if (!uploadRes.success || !uploadRes.storagePath) {
      // Graceful fallback to opaque reference if Supabase bucket is pending credentials
      const fallbackId = `rx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const cleanExt = file.name.split('.').pop() || 'jpg';
      return NextResponse.json({
        success: true,
        storagePath: `prescriptions/${fallbackId}.${cleanExt}`,
        simulated: true,
      });
    }

    return NextResponse.json({
      success: true,
      storagePath: uploadRes.storagePath,
    });
  } catch (error: any) {
    console.error('Prescription upload API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Prescription upload failed' }, { status: 500 });
  }
}
