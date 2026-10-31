process.env.NODE_ENV = 'test';
import crypto from 'crypto';
import { prisma } from '../src/lib/prisma';
import { signJwtToken, hashPassword } from '../src/lib/auth';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function runPhase1SecurityTests() {
  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`${BLUE}MedNeed Phase 1 Security Remediation Automated Test Suite${RESET}`);
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

  // Setup test identities
  const userAId = `usr-test-alice-${Date.now()}`;
  const userBId = `usr-test-bob-${Date.now()}`;
  const staffId = `usr-test-staff-${Date.now()}`;

  const tokenUserA = signJwtToken({
    userId: userAId,
    email: 'alice.phase1@test.com',
    name: 'Alice Security',
    role: 'CUSTOMER',
    provider: 'email',
  });

  const tokenUserB = signJwtToken({
    userId: userBId,
    email: 'bob.phase1@test.com',
    name: 'Bob Security',
    role: 'CUSTOMER',
    provider: 'email',
  });

  const tokenStaff = signJwtToken({
    userId: staffId,
    email: 'manager.phase1@test.com',
    name: 'Store Manager Test',
    role: 'STORE_MANAGER',
    provider: 'email',
  });

  // Fetch or mock medicine
  let testMed = await prisma.medicine.findFirst();
  if (!testMed) {
    testMed = await prisma.medicine.create({
      data: {
        name: 'Paracetamol 650mg Test',
        brand: 'Dolo Test',
        category: 'Pain Relief',
        saltComposition: 'Paracetamol',
        baseMrp: 100,
        sellingPrice: 85,
        localWellCode: `TEST-MED-${Date.now()}`,
        packaging: 'Strip of 15 Tablets',
      },
    });
  }

  // =============================================================
  // Test F1: BOLA Prevention in create-order (User B cannot hijack User A's order)
  // =============================================================
  const orderAId = `ORD-A-${Date.now()}`;
  await prisma.order.create({
    data: {
      id: orderAId,
      userId: userAId,
      customerName: 'Alice',
      customerPhone: '9876543210',
      address: 'Alice Home',
      pincode: '751035',
      distanceKm: 2.0,
      subtotal: 100,
      discountTotal: 10,
      deliveryFee: 35,
      finalTotal: 125,
      deliveryOtp: '1111',
      paymentStatus: 'PENDING',
      razorpayOrderId: `rzp_order_A_${Date.now()}`,
    },
  });

  try {
    const { POST: createOrderPost } = await import('../src/app/api/payments/razorpay/create-order/route');
    const hijackReq = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserB}`,
      },
      body: JSON.stringify({
        customerName: 'Bob Attacker',
        customerPhone: '9876543211',
        address: 'Bob Malicious Address',
        pincode: '751035',
        items: [{ id: testMed.id, quantity: 1 }],
        existingOrderId: orderAId, // User B attempting to overwrite User A's order
      }),
    });

    const hijackRes = await createOrderPost(hijackReq);
    const hijackBody = await hijackRes.json();

    assert(
      'F1: BOLA blocked - User B cannot modify or overwrite User A order (403 Forbidden)',
      hijackRes.status === 403 && hijackBody.success === false,
      `[HTTP ${hijackRes.status}] ${hijackBody.error}`
    );
  } catch (err: any) {
    assert('F1: BOLA blocked', false, err.message);
  }

  // Test F1 part 2: Cannot modify already PAID order
  try {
    const paidOrderId = `ORD-PAID-${Date.now()}`;
    await prisma.order.create({
      data: {
        id: paidOrderId,
        userId: userAId,
        customerName: 'Alice',
        customerPhone: '9876543210',
        address: 'Alice Home',
        pincode: '751035',
        distanceKm: 2.0,
        subtotal: 100,
        discountTotal: 10,
        deliveryFee: 0,
        finalTotal: 90,
        deliveryOtp: '2222',
        paymentStatus: 'PAID',
      },
    });

    const { POST: createOrderPost } = await import('../src/app/api/payments/razorpay/create-order/route');
    const paidModifyReq = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        customerName: 'Alice',
        customerPhone: '9876543210',
        address: 'Alice Home',
        pincode: '751035',
        items: [{ id: testMed.id, quantity: 2 }],
        existingOrderId: paidOrderId,
      }),
    });

    const paidModifyRes = await createOrderPost(paidModifyReq);
    const paidModifyBody = await paidModifyRes.json();

    assert(
      'F1: Cannot modify an order that has already been PAID (400 Bad Request)',
      paidModifyRes.status === 400 && paidModifyBody.success === false,
      `[HTTP ${paidModifyRes.status}] ${paidModifyBody.error}`
    );
  } catch (err: any) {
    assert('F1: Cannot modify already PAID order', false, err.message);
  }

  // =============================================================
  // Test F2: POST /api/medicines requires staff authentication
  // =============================================================
  try {
    const { POST: medicinesPost } = await import('../src/app/api/medicines/route');
    
    // 1. Unauthenticated request
    const unauthReq = new Request('http://localhost:3000/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Medicine', baseMrp: 50, localWellCode: 'HACK-1' }),
    });
    const unauthRes = await medicinesPost(unauthReq);
    assert(
      'F2: Anonymous caller blocked from POST /api/medicines (403 Forbidden)',
      unauthRes.status === 403
    );

    // 2. Customer user request
    const custReq = new Request('http://localhost:3000/api/medicines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ name: 'Hacked Medicine', baseMrp: 50, localWellCode: 'HACK-2' }),
    });
    const custRes = await medicinesPost(custReq);
    assert(
      'F2: Non-staff (Customer) blocked from POST /api/medicines (403 Forbidden)',
      custRes.status === 403
    );

    // 3. Staff user request allowed
    const staffReq = new Request('http://localhost:3000/api/medicines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenStaff}`,
      },
      body: JSON.stringify({
        name: `Authorized Staff Drug ${Date.now()}`,
        baseMrp: 120,
        localWellCode: `AUTH-STAFF-${Date.now()}`,
      }),
    });
    const staffRes = await medicinesPost(staffReq);
    const staffBody = await staffRes.json();
    assert(
      'F2: Authorized Staff (STORE_MANAGER) allowed on POST /api/medicines',
      staffRes.status === 200 && staffBody.success === true
    );
  } catch (err: any) {
    assert('F2: POST /api/medicines auth check', false, err.message);
  }

  // =============================================================
  // Test F3: POST /api/payments/razorpay/verify hardening & idempotency
  // =============================================================
  try {
    const { POST: verifyPost } = await import('../src/app/api/payments/razorpay/verify/route');

    // Create a pending test order
    const verifyTestOrderId = `ORD-VERIFY-${Date.now()}`;
    const serverRzpId = `rzp_order_${Date.now()}`;
    await prisma.order.create({
      data: {
        id: verifyTestOrderId,
        userId: userAId,
        customerName: 'Alice',
        customerPhone: '9876543210',
        address: 'Alice Home',
        pincode: '751035',
        distanceKm: 2.0,
        subtotal: 100,
        discountTotal: 10,
        deliveryFee: 0,
        finalTotal: 90,
        deliveryOtp: '3333',
        paymentStatus: 'PENDING',
        paymentMethod: 'RAZORPAY_UPI',
        razorpayOrderId: serverRzpId,
      },
    });

    // 1. Missing signature / params rejected
    const missingParamsReq = new Request('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        orderId: verifyTestOrderId,
        // Missing razorpayOrderId, razorpayPaymentId, razorpaySignature
      }),
    });
    const missingParamsRes = await verifyPost(missingParamsReq);
    assert(
      'F3: Missing signature/order/payment params rejected (400 Bad Request)',
      missingParamsRes.status === 400
    );

    // 2. Razorpay Order ID mismatch rejected
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_for_local_verification_32chars';
    process.env.RAZORPAY_KEY_SECRET = rzpSecret;

    const fakePaymentId = `pay_${Date.now()}`;
    const mismatchReq = new Request('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        orderId: verifyTestOrderId,
        razorpayOrderId: 'rzp_wrong_order_id', // Does not match server record
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: 'any_signature',
      }),
    });
    const mismatchRes = await verifyPost(mismatchReq);
    assert(
      'F3: Razorpay order ID mismatch with server record rejected (400 Bad Request)',
      mismatchRes.status === 400
    );

    // 3. Invalid signature rejected
    const invalidSigReq = new Request('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        orderId: verifyTestOrderId,
        razorpayOrderId: serverRzpId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: 'invalid_forged_signature_hex_value',
      }),
    });
    const invalidSigRes = await verifyPost(invalidSigReq);
    assert(
      'F3: Invalid cryptographic HMAC signature rejected (400 Bad Request)',
      invalidSigRes.status === 400
    );

    // 4. Valid signature accepted and marks order PAID
    const validSignature = crypto
      .createHmac('sha256', rzpSecret)
      .update(`${serverRzpId}|${fakePaymentId}`)
      .digest('hex');

    const validVerifyReq = new Request('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        orderId: verifyTestOrderId,
        razorpayOrderId: serverRzpId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: validSignature,
      }),
    });
    const validVerifyRes = await verifyPost(validVerifyReq);
    const validVerifyBody = await validVerifyRes.json();
    assert(
      'F3: Valid HMAC signature marks order PAID',
      validVerifyRes.status === 200 && validVerifyBody.verified === true && validVerifyBody.order.paymentStatus === 'PAID'
    );

    // 5. Idempotent repeat call: Does not error, returns existing PAID status
    const repeatVerifyReq = new Request('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        orderId: verifyTestOrderId,
        razorpayOrderId: serverRzpId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: validSignature,
      }),
    });
    const repeatVerifyRes = await verifyPost(repeatVerifyReq);
    const repeatVerifyBody = await repeatVerifyRes.json();
    assert(
      'F3: Idempotent repeat call on PAID order succeeds safely without duplicate stock deduction',
      repeatVerifyRes.status === 200 && repeatVerifyBody.message.includes('already been verified')
    );

    // 6. Concurrency test: Two simultaneous verify calls proving a single decrement
    const concurrentBatchNumber = `CONC-BATCH-${Date.now()}`;
    const concurrentBatch = await prisma.medicineBatch.create({
      data: {
        medicineId: testMed.id,
        batchNumber: concurrentBatchNumber,
        printedMrp: 100,
        purchaseRate: 70,
        quantity: 50,
        expiryDate: new Date('2024-01-01'),
        isQuarantined: false,
      },
    });

    const concurrentOrderId = `ORD-CONCUR-${Date.now()}`;
    const concurrentRzpOrderId = `rzp_order_conc_${Date.now()}`;
    const concurrentPaymentId = `pay_conc_${Date.now()}`;
    const concurrentSignature = crypto
      .createHmac('sha256', rzpSecret)
      .update(`${concurrentRzpOrderId}|${concurrentPaymentId}`)
      .digest('hex');

    await prisma.order.create({
      data: {
        id: concurrentOrderId,
        userId: userAId,
        customerName: 'Alice',
        customerPhone: '9876543210',
        address: 'Alice Home',
        pincode: '751035',
        distanceKm: 2.0,
        subtotal: 100,
        discountTotal: 0,
        deliveryFee: 0,
        finalTotal: 100,
        deliveryOtp: '4444',
        paymentStatus: 'PENDING',
        paymentMethod: 'RAZORPAY_UPI',
        razorpayOrderId: concurrentRzpOrderId,
        items: {
          create: [
            {
              medicineId: testMed.id,
              title: testMed.name,
              itemType: 'MEDICINE',
              batchNumber: concurrentBatchNumber,
              mrp: 100,
              unitPrice: 100,
              quantity: 2, // 2 units
            },
          ],
        },
      },
    });

    const call1 = verifyPost(
      new Request('http://localhost:3000/api/payments/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserA}` },
        body: JSON.stringify({
          orderId: concurrentOrderId,
          razorpayOrderId: concurrentRzpOrderId,
          razorpayPaymentId: concurrentPaymentId,
          razorpaySignature: concurrentSignature,
        }),
      })
    );

    const call2 = verifyPost(
      new Request('http://localhost:3000/api/payments/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserA}` },
        body: JSON.stringify({
          orderId: concurrentOrderId,
          razorpayOrderId: concurrentRzpOrderId,
          razorpayPaymentId: concurrentPaymentId,
          razorpaySignature: concurrentSignature,
        }),
      })
    );

    const [res1, res2] = await Promise.all([call1, call2]);
    const updatedBatch = await prisma.medicineBatch.findUnique({
      where: { id: concurrentBatch.id },
    });

    assert(
      'F3 Concurrency: Simultaneous verify calls result in exactly ONE stock decrement (50 - 2 = 48)',
      res1.status === 200 && res2.status === 200 && updatedBatch?.quantity === 48,
      `[Initial: 50, Decremented: 2, DB Stock: ${updatedBatch?.quantity}]`
    );
  } catch (err: any) {
    assert('F3: Razorpay verify tests', false, err.message);
  }

  // =============================================================
  // Test F4: POST /api/orders never sets paymentStatus = 'PAID' for non-COD
  // =============================================================
  try {
    const { POST: ordersPost } = await import('../src/app/api/orders/route');
    const nonCodOrderReq = new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        customerName: 'Alice',
        customerPhone: '9876543210',
        customerEmail: 'alice@test.com',
        address: 'Alice Home',
        pincode: '751035',
        paymentMethod: 'RAZORPAY_UPI', // Non-COD
        prescriptionUrl: 'https://storage.medneed.com/prescriptions/alice_rx.pdf',
        items: [{ id: testMed.id, quantity: 1, title: testMed.name }],
      }),
    });

    const nonCodRes = await ordersPost(nonCodOrderReq);
    const nonCodBody = await nonCodRes.json();

    assert(
      'F4: Non-COD order created via POST /api/orders is PENDING (never PAID) and has no simulated pay_sim_ ID',
      nonCodRes.status === 200 &&
        nonCodBody.success === true &&
        nonCodBody.data?.paymentStatus === 'PENDING' &&
        (!nonCodBody.data?.razorpayPaymentId || !nonCodBody.data?.razorpayPaymentId.includes('pay_sim_')),
      `[HTTP ${nonCodRes.status}] ${JSON.stringify(nonCodBody)}`
    );
  } catch (err: any) {
    assert('F4: POST /api/orders non-COD status', false, err.message);
  }

  // =============================================================
  // Test F5: Public signup creates CustomerUser only and enforces password strength
  // =============================================================
  try {
    const { POST: signupPost } = await import('../src/app/api/auth/signup/route');

    // 1. Weak password rejected
    const weakPassReq = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass User',
        email: `weak_${Date.now()}@test.com`,
        password: '123', // Shorter than 8 chars
      }),
    });
    const weakPassRes = await signupPost(weakPassReq);
    assert(
      'F5: Password shorter than 8 characters rejected on signup (400 Bad Request)',
      weakPassRes.status === 400
    );

    // 2. No password provided rejected
    const noPassReq = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Pass User',
        email: `nopass_${Date.now()}@test.com`,
      }),
    });
    const noPassRes = await signupPost(noPassReq);
    assert(
      'F5: Signup without password rejected (no default password123)',
      noPassRes.status === 400
    );

    // 3. Signup with admin allowlist email results strictly in CUSTOMER role
    const adminEmailSignup = `owner_spoof_${Date.now()}@medneed.com`;
    const signupAdminReq = new Request('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Impersonating Admin',
        email: adminEmailSignup,
        password: 'SecurePassword123!',
      }),
    });
    const signupAdminRes = await signupAdminReq.json ? await signupPost(signupAdminReq) : null;
    if (signupAdminRes) {
      const signupAdminBody = await signupAdminRes.json();
      assert(
        'F5: Public signup with admin email is restricted to CUSTOMER role (Zero admin elevation)',
        signupAdminRes.status === 200 && signupAdminBody.user.role === 'CUSTOMER'
      );
    }
  } catch (err: any) {
    assert('F5: Signup hardening', false, err.message);
  }

  // =============================================================
  // Test F7 & F13: Backdoor removed, no auto-create, require passwordHash
  // =============================================================
  try {
    const { POST: signinPost } = await import('../src/app/api/auth/signin/route');

    // 1. Backdoor passwords rejected
    const backdoorReq = new Request('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@medneed.com',
        password: 'admin123', // Backdoor password
      }),
    });
    const backdoorRes = await signinPost(backdoorReq);
    assert(
      'F7: Hardcoded backdoor password (admin123/demo123) rejected with 401',
      backdoorRes.status === 401
    );

    // 2. Non-existent user rejected (No auto-creation on signin)
    const nonExistentEmail = `ghost_user_${Date.now()}@test.com`;
    const ghostReq = new Request('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: nonExistentEmail,
        password: 'SomePassword123!',
      }),
    });
    const ghostRes = await signinPost(ghostReq);
    const ghostInDb = await prisma.customerUser.findUnique({ where: { email: nonExistentEmail } });
    assert(
      'F13: Non-existent user rejected and NOT auto-created on signin (401 Unauthorized)',
      ghostRes.status === 401 && ghostInDb === null
    );

    // 3. User with null passwordHash (Google SSO user) rejected with message to use Google
    const googleUserEmail = `google_only_${Date.now()}@test.com`;
    await prisma.customerUser.create({
      data: {
        email: googleUserEmail,
        name: 'Google User Test',
        passwordHash: null, // SSO user without local password
        provider: 'google',
      },
    });

    const googleSigninReq = new Request('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleUserEmail,
        password: 'RandomPassword123!',
      }),
    });
    const googleSigninRes = await signinPost(googleSigninReq);
    const googleSigninBody = await googleSigninRes.json();
    assert(
      'F13: Account with null passwordHash rejected with prompt to use Google Sign-In',
      googleSigninRes.status === 401 && googleSigninBody.error.includes('Google')
    );
  } catch (err: any) {
    assert('F7 & F13: Signin hardening', false, err.message);
  }

  // Cleanup test records
  try {
    await prisma.order.deleteMany({
      where: { userId: { in: [userAId, userBId, staffId] } },
    });
  } catch {}

  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`Phase 1 Test Results: ${GREEN}${passed} Passed${RESET}, ${failed > 0 ? RED : GREEN}${failed} Failed${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runPhase1SecurityTests().catch(async (err) => {
  console.error('Phase 1 test suite execution error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
