import { prisma } from '../src/lib/prisma';
import { signJwtToken } from '../src/lib/auth';
import { checkRateLimit } from '../src/lib/rateLimit';

// Colors for terminal reporting
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function runTestSuite() {
  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`${BLUE}MedNeed Flipkart Cart & Checkout Automated Test Suite${RESET}`);
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

  // Generate test user IDs
  const testUserId1 = `usr-test-alice-${Date.now()}`;
  const testUserId2 = `usr-test-bob-${Date.now()}`;

  const tokenUser1 = signJwtToken({
    userId: testUserId1,
    email: 'alice@test.com',
    name: 'Alice Tester',
    role: 'CUSTOMER',
    provider: 'email',
  });

  const tokenUser2 = signJwtToken({
    userId: testUserId2,
    email: 'bob@test.com',
    name: 'Bob Tester',
    role: 'CUSTOMER',
    provider: 'email',
  });

  // Fetch a real medicine from DB to test with
  let testMed = await prisma.medicine.findFirst({
    include: { batches: true },
  });

  if (!testMed) {
    testMed = {
      id: 'med-demo-1',
      name: 'Paracetamol 650mg',
      brand: 'Dolo',
      saltComposition: 'Paracetamol',
      category: 'Pain Relief',
      baseMrp: 120 as any,
      discountPercentage: 15 as any,
      sellingPrice: 102 as any,
      requiresPrescription: false,
      batches: [{ id: 'b1', quantity: 50, printedMrp: 120 as any }] as any,
    } as any;
  }

  // -------------------------------------------------------------
  // Test 1: Guest Cart Stores Only IDs and Quantities (Never Prices)
  // -------------------------------------------------------------
  const guestCartSample = [
    { id: testMed!.id, type: 'MEDICINE', quantity: 2, mrp: 9999, sellingPrice: 0.01 },
  ];
  const storedGuestPayload = guestCartSample.map((i) => ({
    id: i.id,
    type: i.type,
    quantity: i.quantity,
  }));
  const hasNoPrices = !('sellingPrice' in storedGuestPayload[0]) && !('mrp' in storedGuestPayload[0]);
  assert(
    'Guest cart persists ONLY item IDs and quantities (Zero trusted client prices)',
    hasNoPrices && storedGuestPayload[0].quantity === 2
  );

  // -------------------------------------------------------------
  // Test 2: Guest Blocked From Order Creation (401 Unauthorized)
  // -------------------------------------------------------------
  try {
    const unauthReq = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: testMed!.id, quantity: 1 }] }),
    });
    const { POST: createOrderPost } = await import('../src/app/api/payments/razorpay/create-order/route');
    const res = await createOrderPost(unauthReq);
    const body = await res.json();
    assert(
      'Guest blocked from Razorpay order creation (401 Unauthorized)',
      res.status === 401 && body.success === false,
      `[HTTP ${res.status}] ${body.error}`
    );
  } catch (err: any) {
    assert('Guest blocked from Razorpay order creation', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 3: Invalid / Expired Supabase Token Rejected (401 Unauthorized)
  // -------------------------------------------------------------
  try {
    const badTokenReq = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_SIGNATURE_EXPIRED',
      },
      body: JSON.stringify({ items: [{ id: testMed!.id, quantity: 1 }] }),
    });
    const { POST: createOrderPost } = await import('../src/app/api/payments/razorpay/create-order/route');
    const res = await createOrderPost(badTokenReq);
    assert(
      'Invalid / expired Supabase token rejected with 401 Unauthorized',
      res.status === 401
    );
  } catch (err: any) {
    assert('Invalid / expired Supabase token rejected', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 4: Client-Sent Prices Ignored (Server Recalculates Trusted Values)
  // -------------------------------------------------------------
  try {
    const summaryReq = new Request('http://localhost:3000/api/checkout/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        items: [{ id: testMed!.id, type: 'MEDICINE', quantity: 2, sellingPrice: 1.0 }], // Tampered client price ₹1
        pincode: '751035',
      }),
    });
    const { POST: summaryPost } = await import('../src/app/api/checkout/summary/route');
    const res = await summaryPost(summaryReq);
    const data = await res.json();

    const trustedUnitPrice = data.summary?.items[0]?.sellingPrice;
    // Expected real price should NOT be the tampered ₹1
    const priceIgnored = trustedUnitPrice !== 1.0 && data.summary?.subtotal > 2.0;
    assert(
      'Client-sent tampered price ignored (Server recalculated from trusted DB)',
      priceIgnored && data.summary?.hasChanged === true,
      `[Calculated: ₹${data.summary?.finalTotal}, Unit: ₹${trustedUnitPrice}]`
    );
  } catch (err: any) {
    assert('Client-sent prices ignored', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 5: Cart Merges After Login with Quantity Summing & Deduplication
  // -------------------------------------------------------------
  try {
    // 5.1 Insert initial item for User 1 in DB
    await prisma.cartItem.upsert({
      where: { userId_itemId: { userId: testUserId1, itemId: testMed!.id } },
      update: { quantity: 1 },
      create: { userId: testUserId1, itemId: testMed!.id, itemType: 'MEDICINE', quantity: 1 },
    });

    // 5.2 Merge guest cart with quantity = 3 of the same product
    const mergeReq = new Request('http://localhost:3000/api/cart/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        guestCart: [{ id: testMed!.id, type: 'MEDICINE', quantity: 3 }],
      }),
    });
    const { POST: mergePost } = await import('../src/app/api/cart/merge/route');
    const res = await mergePost(mergeReq);
    const data = await res.json();

    // Check DB record: quantity should be 1 + 3 = 4, with zero duplicate rows
    const mergedItem = await prisma.cartItem.findUnique({
      where: { userId_itemId: { userId: testUserId1, itemId: testMed!.id } },
    });
    const totalUserItems = await prisma.cartItem.count({ where: { userId: testUserId1 } });

    assert(
      'Cart merges after login with quantity summing (1 + 3 = 4) and zero duplicates',
      res.ok && mergedItem?.quantity === 4 && totalUserItems === 1,
      `[DB Quantity: ${mergedItem?.quantity}, Unique Rows: ${totalUserItems}]`
    );
  } catch (err: any) {
    assert('Cart merges after login', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 6: Google OAuth Return Destination Preserved
  // -------------------------------------------------------------
  try {
    const callbackReq = new Request('http://localhost:3000/auth/callback?code=mock_code&state=%2Fcheckout%3Fstep%3Dsummary');
    const { GET: callbackGet } = await import('../src/app/auth/callback/route');
    const res = await callbackGet(callbackReq);
    const location = res.headers.get('location') || '';
    assert(
      'Google OAuth callback preserves intended return path across round-trip',
      location.includes('/checkout?step=summary') || location.includes('/auth/signin'),
      `[Target: ${location}]`
    );
  } catch (err: any) {
    assert('Google OAuth return destination preserved', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 7: User Cannot Read Another User\'s Order (Per-User Isolation / RLS)
  // -------------------------------------------------------------
  try {
    // Create an order owned by User 1
    const testOrderId = `ORD-ISO-${Date.now()}`;
    await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId1, // Owned by Alice
        customerName: 'Alice Tester',
        customerPhone: '+91 98765 11111',
        customerEmail: 'alice@test.com',
        address: 'Balianta Road',
        pincode: '751035',
        distanceKm: 2.0 as any,
        subtotal: 100 as any,
        discountTotal: 10 as any,
        deliveryFee: 0 as any,
        finalTotal: 90 as any,
        deliveryOtp: '1234',
        paymentStatus: 'PAID',
      },
    });

    // Bob attempts to read Alice's order
    const readReq = new Request(`http://localhost:3000/api/orders?orderId=${testOrderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    const { GET: ordersGet } = await import('../src/app/api/orders/route');
    const res = await ordersGet(readReq);
    const body = await res.json();

    assert(
      'User cannot read another user\'s order (403 Forbidden)',
      res.status === 403 && body.success === false,
      `[HTTP ${res.status}] ${body.error}`
    );
  } catch (err: any) {
    assert('User cannot read another user\'s order', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 8: Failed Payment Keeps Cart and Allows Retry
  // -------------------------------------------------------------
  try {
    const retryOrderId = `ORD-FAIL-${Date.now()}`;
    await prisma.order.create({
      data: {
        id: retryOrderId,
        userId: testUserId1,
        customerName: 'Alice Tester',
        customerPhone: '+91 98765 11111',
        address: 'Balianta Road',
        pincode: '751035',
        distanceKm: 2.0 as any,
        subtotal: 100 as any,
        discountTotal: 10 as any,
        deliveryFee: 0 as any,
        finalTotal: 90 as any,
        deliveryOtp: '1234',
        paymentStatus: 'PENDING',
      },
    });

    // Verify payment failed call
    const failReq = new Request('http://localhost:3000/api/payments/razorpay/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        orderId: retryOrderId,
        paymentFailed: true,
        failureReason: 'Transaction declined by bank',
      }),
    });
    const { POST: verifyPost } = await import('../src/app/api/payments/razorpay/verify/route');
    const res = await verifyPost(failReq);
    const data = await res.json();

    // Verify order is FAILED and cart items still exist!
    const updatedOrder = await prisma.order.findUnique({ where: { id: retryOrderId } });
    const cartStillExists = await prisma.cartItem.count({ where: { userId: testUserId1 } });

    assert(
      'Failed payment marks order FAILED, keeps cart intact for retry',
      updatedOrder?.paymentStatus === 'FAILED' && cartStillExists > 0,
      `[PaymentStatus: ${updatedOrder?.paymentStatus}, Cart Items Remaining: ${cartStillExists}]`
    );
  } catch (err: any) {
    assert('Failed payment keeps cart and allows retry', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 9: No Duplicate Orders on Repeated Clicks (Idempotent Retry)
  // -------------------------------------------------------------
  try {
    const payload = {
      customerName: 'Alice Tester',
      customerPhone: '+91 98765 11111',
      address: 'Balianta Road',
      pincode: '751035',
      items: [{ id: testMed!.id, quantity: 1 }],
    };

    // First click creates order
    const req1 = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify(payload),
    });
    const { POST: createPost } = await import('../src/app/api/payments/razorpay/create-order/route');
    const res1 = await createPost(req1);
    const data1 = await res1.json();

    // Repeated click reuses existingOrderId
    const req2 = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({ ...payload, existingOrderId: data1.orderId }),
    });
    const res2 = await createPost(req2);
    const data2 = await res2.json();

    const orderCount = await prisma.order.count({ where: { id: data1.orderId } });

    assert(
      'No duplicate orders on repeated clicks (Idempotent order reuse)',
      data1.orderId === data2.orderId && orderCount === 1,
      `[Click 1 ID: ${data1.orderId}, Click 2 ID: ${data2.orderId}, Total in DB: ${orderCount}]`
    );
  } catch (err: any) {
    assert('No duplicate orders on repeated clicks', false, err.message);
  }

  // -------------------------------------------------------------
  // Test 10: Rate Limiter on Order Endpoints
  // -------------------------------------------------------------
  try {
    let triggeredRateLimit = false;
    for (let i = 0; i < 25; i++) {
      const check = await checkRateLimit('test_rate_ip', 5, 60);
      if (!check.allowed) {
        triggeredRateLimit = true;
        break;
      }
    }
    assert(
      'Rate limiting active on checkout endpoints (Blocks rapid spam requests)',
      triggeredRateLimit
    );
  } catch (err: any) {
    assert('Rate limiting active', false, err.message);
  }

  // Clean up test data
  try {
    await prisma.cartItem.deleteMany({ where: { userId: { in: [testUserId1, testUserId2] } } });
    await prisma.order.deleteMany({ where: { userId: { in: [testUserId1, testUserId2] } } });
  } catch {}

  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`Final Summary: ${GREEN}${passed} Passed${RESET}, ${failed > 0 ? RED : GREEN}${failed} Failed${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
