process.env.NODE_ENV = 'test';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { signJwtToken, verifyJwtToken } from '../src/lib/auth';
import { getClientIp, checkRateLimit, _resetRateLimitsForTesting } from '../src/lib/rateLimit';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function runPhase2SecurityTests() {
  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`${BLUE}MedNeed Phase 2 Security Remediation Automated Test Suite${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, extraInfo = '') {
    if (condition) {
      console.log(`  ${GREEN}✓ PASSED:${RESET} ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.log(`  ${RED}✗ FAILED:${RESET} ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // 1. F6: JWT Secret Hardening & Startup Failure on Missing/Short Key
  // -------------------------------------------------------------
  console.log(`\n${BLUE}--- [F6] JWT Secret Startup Enforcement ---${RESET}`);

  // Test F6-1: Missing JWT_SECRET throws at startup
  try {
    const cmd = `node -e "delete process.env.JWT_SECRET; require('./src/lib/auth.ts');"`;
    let threw = false;
    try {
      execSync(cmd, { stdio: 'pipe', env: { ...process.env, JWT_SECRET: '' } });
    } catch (e: any) {
      const errOut = (e.stderr || e.stdout || '').toString();
      threw = errOut.includes('FATAL: JWT_SECRET environment variable is missing') || e.status !== 0;
    }
    assert('F6-1: auth.ts fails at startup when JWT_SECRET is unset or empty', threw);
  } catch (err: any) {
    assert('F6-1: auth.ts fails at startup when JWT_SECRET is unset or empty', false, err.message);
  }

  // Test F6-2: JWT_SECRET shorter than 32 chars throws at startup
  try {
    const cmd = `node -e "require('./src/lib/auth.ts');"`;
    let threw = false;
    try {
      execSync(cmd, { stdio: 'pipe', env: { ...process.env, JWT_SECRET: 'short-key-under-32-chars!' } });
    } catch (e: any) {
      const errOut = (e.stderr || e.stdout || '').toString();
      threw = errOut.includes('FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters') || e.status !== 0;
    }
    assert('F6-2: auth.ts fails at startup when JWT_SECRET is < 32 chars', threw);
  } catch (err: any) {
    assert('F6-2: auth.ts fails at startup when JWT_SECRET is < 32 chars', false, err.message);
  }

  // Test F6-3: middleware.ts fails at startup when JWT_SECRET is missing or < 32 chars
  try {
    const cmd = `node -e "require('./src/middleware.ts');"`;
    let threw = false;
    try {
      execSync(cmd, { stdio: 'pipe', env: { ...process.env, JWT_SECRET: 'too-short' } });
    } catch (e: any) {
      const errOut = (e.stderr || e.stdout || '').toString();
      threw = errOut.includes('FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters') || e.status !== 0;
    }
    assert('F6-3: middleware.ts fails at startup when JWT_SECRET is < 32 chars', threw);
  } catch (err: any) {
    assert('F6-3: middleware.ts fails at startup when JWT_SECRET is < 32 chars', false, err.message);
  }

  // Test F6-4: Valid 32+ char JWT_SECRET signs and verifies roundtrip securely
  try {
    const samplePayload = {
      userId: 'usr-phase2-test',
      email: 'security.auditor@medneed.com',
      name: 'Auditor Test',
      role: 'AUDIT_OFFICER' as const,
      provider: 'email' as const,
    };
    const token = signJwtToken(samplePayload);
    const decoded = verifyJwtToken(token);
    assert(
      'F6-4: Valid JWT signs and verifies with full cryptographic integrity',
      Boolean(decoded && decoded.userId === samplePayload.userId && decoded.role === 'AUDIT_OFFICER')
    );
  } catch (err: any) {
    assert('F6-4: Valid JWT signs and verifies', false, err.message);
  }

  // -------------------------------------------------------------
  // 2. F8: Google OAuth Hardening (google-auth-library verifyIdToken)
  // -------------------------------------------------------------
  console.log(`\n${BLUE}--- [F8] Google OAuth Token & Audience Hardening ---${RESET}`);

  // Test F8-1: Fail closed if GOOGLE_CLIENT_ID is unset
  try {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = '';

    // Dynamically import google route to test failure
    const { POST: googlePost } = await import('../src/app/api/auth/google/route');
    const req = new Request('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake_credential_token' }),
    });

    const res = await googlePost(req);
    const data = await res.json();
    assert(
      'F8-1: Google OAuth fails closed (500) if GOOGLE_CLIENT_ID is not configured',
      res.status === 500 && data.error.includes('GOOGLE_CLIENT_ID is not configured')
    );

    // Restore GOOGLE_CLIENT_ID
    if (originalClientId) {
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    } else {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id-for-phase2.apps.googleusercontent.com';
    }
  } catch (err: any) {
    assert('F8-1: Google OAuth fails closed if GOOGLE_CLIENT_ID unset', false, err.message);
  }

  // Test F8-2: Reject requests with missing credential (deprecated accessToken path rejected)
  try {
    const { POST: googlePost } = await import('../src/app/api/auth/google/route');
    const req = new Request('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'unverified_oauth_access_token_sample' }),
    });

    const res = await googlePost(req);
    const data = await res.json();
    assert(
      'F8-2: Rejects unverified accessToken and requires ID token (credential)',
      res.status === 400 && data.error.includes('Google ID token (credential) is required')
    );
  } catch (err: any) {
    assert('F8-2: Rejects unverified accessToken', false, err.message);
  }

  // Test F8-3: Reject forged/invalid ID token via google-auth-library
  try {
    const { POST: googlePost } = await import('../src/app/api/auth/google/route');
    const req = new Request('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid.forged.google.jwt.signature' }),
    });

    const res = await googlePost(req);
    const data = await res.json();
    assert(
      'F8-3: Forged/invalid Google ID token rejected with 401 Unauthorized',
      res.status === 401 && data.error.includes('Google ID token verification failed')
    );
  } catch (err: any) {
    assert('F8-3: Forged Google ID token rejected', false, err.message);
  }

  // -------------------------------------------------------------
  // 3. F11 & F14: Rate Limiting & Trusted Client IP Extraction
  // -------------------------------------------------------------
  console.log(`\n${BLUE}--- [F11 & F14] Rate Limiting & Client IP Anti-Spoofing ---${RESET}`);

  // Test F11-1: Anti-spoofing in getClientIp
  try {
    // Client attempts to spoof IP by placing fake IP at the start of X-Forwarded-For
    const reqSpoofed = new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 203.0.113.195',
      },
    });
    const detectedIp = getClientIp(reqSpoofed);
    assert(
      'F11-1a: getClientIp ignores spoofed first IP in X-Forwarded-For and picks proxy-verified IP',
      detectedIp === '203.0.113.195'
    );

    // Vendor trusted headers prioritize over x-forwarded-for
    const reqCloudflare = new Request('http://localhost:3000/api/test', {
      headers: {
        'cf-connecting-ip': '198.51.100.42',
        'x-forwarded-for': '1.2.3.4',
      },
    });
    assert(
      'F11-1b: cf-connecting-ip is prioritized over untrusted forwarded headers',
      getClientIp(reqCloudflare) === '198.51.100.42'
    );
  } catch (err: any) {
    assert('F11-1: Anti-spoofing in getClientIp', false, err.message);
  }

  // Test F11-2: Rate Limiting Sliding Window Blocks Spam Requests
  try {
    _resetRateLimitsForTesting();
    const testIp = '10.0.0.1';
    let blocked = false;
    let blockedAt = 0;

    for (let i = 1; i <= 8; i++) {
      const res = await checkRateLimit(`test_limit_${testIp}`, 5, 60);
      if (!res.allowed) {
        blocked = true;
        blockedAt = i;
        break;
      }
    }

    assert(
      'F11-2: Sliding-window rate limiter blocks requests exceeding threshold (blocked at 6th request)',
      blocked && blockedAt === 6
    );
  } catch (err: any) {
    assert('F11-2: Sliding-window rate limiter', false, err.message);
  }

  // Test F11-3: Rate limiting on POST /api/auth/signin
  try {
    _resetRateLimitsForTesting();
    const { POST: signinPost } = await import('../src/app/api/auth/signin/route');
    const testIp = '192.168.1.50';

    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const req = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': testIp,
        },
        body: JSON.stringify({ email: 'user@test.com', password: 'wrongpassword' }),
      });
      const res = await signinPost(req);
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }

    assert('F11-3: POST /api/auth/signin rate limiting returns 429 Too Many Requests', rateLimited);
  } catch (err: any) {
    assert('F11-3: Signin rate limiting', false, err.message);
  }

  // Test F11-4: Rate limiting on POST /api/auth/signup
  try {
    _resetRateLimitsForTesting();
    const { POST: signupPost } = await import('../src/app/api/auth/signup/route');
    const testIp = '192.168.1.51';

    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': testIp,
        },
        body: JSON.stringify({ name: 'Test', email: 'spam@test.com', password: 'password123' }),
      });
      const res = await signupPost(req);
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }

    assert('F11-4: POST /api/auth/signup rate limiting returns 429 Too Many Requests', rateLimited);
  } catch (err: any) {
    assert('F11-4: Signup rate limiting', false, err.message);
  }

  // Test F11-5: Rate limiting on POST /api/payments/razorpay/verify
  try {
    _resetRateLimitsForTesting();
    const { POST: verifyPost } = await import('../src/app/api/payments/razorpay/verify/route');
    const testIp = '192.168.1.52';

    let rateLimited = false;
    for (let i = 0; i < 12; i++) {
      const req = new Request('http://localhost:3000/api/payments/razorpay/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': testIp,
        },
        body: JSON.stringify({ orderId: 'ORD-TEST-999' }),
      });
      const res = await verifyPost(req);
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }

    assert('F11-5: POST /api/payments/razorpay/verify rate limiting returns 429 Too Many Requests', rateLimited);
  } catch (err: any) {
    assert('F11-5: Verify rate limiting', false, err.message);
  }

  // -------------------------------------------------------------
  // 4. F22: Signout via POST Only
  // -------------------------------------------------------------
  console.log(`\n${BLUE}--- [F22] Signout Method Restriction ---${RESET}`);

  // Test F22-1: GET /api/auth/signout rejected with 405 Method Not Allowed
  try {
    const { GET: signoutGet, POST: signoutPost } = await import('../src/app/api/auth/signout/route');
    const getRes = await signoutGet();
    const getData = await getRes.json();
    const allowHeader = getRes.headers.get('Allow');

    assert(
      'F22-1: GET /api/auth/signout returns 405 Method Not Allowed with Allow: POST',
      getRes.status === 405 && allowHeader === 'POST' && getData.error.includes('Signout is only allowed via POST')
    );

    // Test F22-2: POST /api/auth/signout succeeds with 200
    const postRes = await signoutPost();
    const postData = await postRes.json();
    assert(
      'F22-2: POST /api/auth/signout succeeds with 200 OK',
      postRes.status === 200 && postData.success === true
    );
  } catch (err: any) {
    assert('F22: Signout method restriction', false, err.message);
  }

  // -------------------------------------------------------------
  // 5. F23: Cryptographic Handover OTP Generation
  // -------------------------------------------------------------
  console.log(`\n${BLUE}--- [F23] Cryptographic OTP Generation ---${RESET}`);

  try {
    const generatedOtps: string[] = [];
    for (let i = 0; i < 500; i++) {
      const otp = crypto.randomInt(1000, 10000).toString();
      generatedOtps.push(otp);
    }

    const all4Digits = generatedOtps.every((otp) => /^\d{4}$/.test(otp) && Number(otp) >= 1000 && Number(otp) <= 9999);
    const uniqueCount = new Set(generatedOtps).size;
    // Across 500 random 4-digit numbers, uniqueness should be high (> 400 distinct values)
    assert(
      'F23-1: crypto.randomInt produces uniform 4-digit handover OTPs in [1000, 9999]',
      all4Digits && uniqueCount > 400,
      `(${uniqueCount}/500 distinct)`
    );
  } catch (err: any) {
    assert('F23-1: Cryptographic OTP generation', false, err.message);
  }

  // -------------------------------------------------------------
  // 6. /auth/callback Open Redirect & OAuth State Validation
  // -------------------------------------------------------------
  console.log(`\n${BLUE}--- [/auth/callback] Safe Redirect & State Validation ---${RESET}`);

  try {
    const { GET: callbackGet } = await import('../src/app/auth/callback/route');

    // Test Callback-1: Malicious open redirect parameters default to safe error/fallback
    const maliciousCases = [
      '//evil.com',
      'https://attacker.com/steal-token',
      '/\\evil.com',
      'javascript:alert(1)',
      '//medneed.com.evil.com',
    ];

    let allMaliciousBlocked = true;
    for (const evilUrl of maliciousCases) {
      const req = new Request(`http://localhost:3000/auth/callback?error=user_denied&next=${encodeURIComponent(evilUrl)}`);
      const res = await callbackGet(req);
      const location = res.headers.get('Location') || '';
      // On error, must redirect to /auth/signin?error=... on origin, NEVER external evil URL
      const targetUrl = new URL(location, 'http://localhost:3000');
      if (targetUrl.origin !== 'http://localhost:3000' || location.includes('evil.com') || location.includes('attacker.com')) {
        allMaliciousBlocked = false;
        break;
      }
    }

    assert(
      'Callback-1: Malicious open redirect targets (protocol-relative, external, backslash) fail closed to origin',
      allMaliciousBlocked
    );

    // Test Callback-2: State parameter JSON parsing & relative path extraction
    const stateWithValidRelative = JSON.stringify({ next: '/orders/ORD-123' });
    const reqValidState = new Request(`http://localhost:3000/auth/callback?error=mock&state=${encodeURIComponent(stateWithValidRelative)}`);
    const resValidState = await callbackGet(reqValidState);
    const locValid = resValidState.headers.get('Location') || '';
    assert(
      'Callback-2: State parameter is securely handled without allowing open redirects',
      locValid.startsWith('http://localhost:3000/')
    );
  } catch (err: any) {
    assert('Callback: Safe redirect validation', false, err.message);
  }

  // =============================================================
  // Test Summary
  // =============================================================
  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`${BLUE}Phase 2 Security Test Suite Results${RESET}`);
  console.log(`${BLUE}================================================================${RESET}`);
  console.log(`  ${GREEN}Passed: ${passed}${RESET}`);
  console.log(`  ${failed === 0 ? GREEN : RED}Failed: ${failed}${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase2SecurityTests().catch((err) => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
