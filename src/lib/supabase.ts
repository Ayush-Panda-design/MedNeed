import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Client for browser / public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side privileged client for private bucket access & signed URLs
export const supabaseStorageAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const PRESCRIPTION_BUCKET = 'prescriptions';

/**
 * Uploads prescription to a strictly PRIVATE bucket.
 * Generates an opaque random UUID filename. NEVER embeds patient phone numbers or names.
 * Does NOT call getPublicUrl.
 */
export async function uploadPrescriptionToSupabase(
  file: File | Blob,
  originalFileName = 'rx.jpg'
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    const rawExt = originalFileName.split('.').pop() || 'jpg';
    const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rx-${Date.now()}`;
    const storagePath = `${uniqueId}.${cleanExt}`;

    const { error: uploadError } = await supabaseStorageAdmin.storage
      .from(PRESCRIPTION_BUCKET)
      .upload(storagePath, file, {
        contentType: (file as any).type || (cleanExt === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        upsert: false,
      });

    if (uploadError) {
      console.warn('Prescription storage upload issue:', uploadError.message);
      return { success: false, error: uploadError.message };
    }

    return { success: true, storagePath };
  } catch (err: any) {
    console.error('Error uploading prescription to private storage:', err);
    return { success: false, error: err.message || 'Storage upload failed' };
  }
}

/**
 * Creates a short-lived signed URL (default 300 seconds / 5 minutes) for authorized viewing.
 * Prescriptions contain Protected Health Information (PHI) and must never have public URLs.
 */
export async function createPrescriptionSignedUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string | null> {
  try {
    const cleanPath = storagePath.replace(/^prescriptions\//, '');
    const { data, error } = await supabaseStorageAdmin.storage
      .from(PRESCRIPTION_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn('Failed to generate prescription signed URL:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Exception generating signed prescription URL:', err);
    return null;
  }
}
