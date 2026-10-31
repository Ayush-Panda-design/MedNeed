import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
// Service role key for server-side admin operations only (never leaked to client)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface VerifiedAuthResult {
  userId: string;
  email: string;
  name?: string;
  role?: string;
  isStaff: boolean;
  supabaseUser?: any;
}

/**
 * Server-side zero-trust token verification.
 * Strictly verifies the access token via Supabase Auth (supabase.auth.getUser(token)).
 * Checks Authorization Bearer header, Supabase cookie tokens, and signed medneed_token.
 * NEVER trusts a user ID sent in the request body.
 */
export async function verifyServerSession(request: Request): Promise<{
  success: boolean;
  auth?: VerifiedAuthResult;
  error?: string;
  statusCode?: number;
}> {
  try {
    let token: string | null = null;

    // 1. Check Authorization header (Bearer <token>)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check cookies if not provided in header
    if (!token) {
      const cookieStore = await cookies();
      
      // Look for standard Supabase auth cookie (sb-*-auth-token)
      for (const cookie of cookieStore.getAll()) {
        if (cookie.name.includes('-auth-token') || cookie.name === 'sb-access-token') {
          try {
            // Some Supabase cookies store [access_token, refresh_token] JSON array or base64
            if (cookie.value.startsWith('base64-')) {
              const decoded = Buffer.from(cookie.value.substring(7), 'base64').toString('utf8');
              const parsed = JSON.parse(decoded);
              token = parsed.access_token || parsed[0];
            } else if (cookie.value.startsWith('[')) {
              const parsed = JSON.parse(cookie.value);
              token = parsed[0];
            } else {
              token = cookie.value;
            }
          } catch {
            token = cookie.value;
          }
          if (token) break;
        }
      }

      // Check application cookie
      if (!token) {
        const appToken = cookieStore.get('medneed_token')?.value;
        if (appToken) token = appToken;
      }
    }

    if (!token) {
      return {
        success: false,
        error: 'Unauthorized: Missing Supabase authentication token. Please sign in to proceed.',
        statusCode: 401,
      };
    }

    // 3. Verify token with Supabase Auth server
    let sbUser: any = null;
    try {
      const { data, error: sbError } = await supabaseServer.auth.getUser(token);
      if (!sbError && data?.user) {
        sbUser = data.user;
      }
    } catch (e) {
      // Supabase direct check failed or token might be local JWT
    }

    if (sbUser) {
      const email = (sbUser.email || '').toLowerCase().trim();
      const staffEmails = ['owner@medneed.com', 'pharmacist@medneed.com', 'manager@medneed.com', 'audit@medneed.com'];
      const isStaff = staffEmails.includes(email);
      const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];

      return {
        success: true,
        auth: {
          userId: sbUser.id,
          email,
          name,
          role: isStaff ? 'STORE_MANAGER' : 'CUSTOMER',
          isStaff,
          supabaseUser: sbUser,
        },
      };
    }

    // 4. Fallback check for synchronized JWT token signed with server secret
    const localPayload = verifyJwtToken(token);
    if (localPayload && localPayload.userId) {
      const staffRoles = ['SUPER_ADMIN', 'STORE_MANAGER', 'PHARMACIST', 'AUDIT_OFFICER'];
      const isStaff = staffRoles.includes(localPayload.role);

      return {
        success: true,
        auth: {
          userId: localPayload.userId,
          email: localPayload.email,
          name: localPayload.name,
          role: localPayload.role,
          isStaff,
        },
      };
    }

    return {
      success: false,
      error: 'Unauthorized: Invalid or expired Supabase authentication token.',
      statusCode: 401,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Authentication error',
      statusCode: 401,
    };
  }
}
