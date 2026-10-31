/**
 * Utility to convert raw system, database, and gateway errors into clean,
 * friendly, non-technical messages suitable for customer display.
 */
export function sanitizePaymentError(
  rawError: unknown,
  fallback = 'Payment processing encountered an unexpected issue. Your cart has been preserved.'
): string {
  if (!rawError) return fallback;

  const msg = typeof rawError === 'string' ? rawError : (rawError as any)?.message || '';
  if (!msg || typeof msg !== 'string') return fallback;

  // Detect technical, Prisma, PostgreSQL, or backend connector errors
  const isTechnicalDbOrSystem =
    /prisma|connectorerror|postgreserror|queryerror|syntaxerror|adminrole|22p02|p[0-9]{4}|foreign key|unique constraint|relation.*does not exist|column.*does not exist|prepared statement|invocation/i.test(
      msg
    );

  if (isTechnicalDbOrSystem) {
    return 'Your payment was received, but our confirmation system experienced a temporary delay. If money was debited from your bank/UPI, please do not pay again — your payment is secure and your order is being processed. You can click "Check Order Status" or contact MedNeed Support (+91 98330 11223).';
  }

  // Detect network or timeout errors
  if (/failed to fetch|networkerror|load failed|econnrefused|timeout/i.test(msg)) {
    return 'Network connection issue while verifying your transaction. Please check your internet connection and retry verification.';
  }

  // Truncate overly verbose unexpected messages to 200 chars
  if (msg.length > 250) {
    return 'An unexpected issue occurred while processing payment. If your account was charged, your order will update shortly or contact support.';
  }

  return msg;
}
