-- ====================================================================
-- MedNeed - Cart, Address, Order, and Payment Row-Level Security (RLS)
-- Enables strict per-user isolation, zero-trust server validation,
-- and locks down anonymous access.
-- ====================================================================

-- 1. Enable RLS on all relevant tables
ALTER TABLE IF EXISTS "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "OrderItem" ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting legacy policies if they exist
DROP POLICY IF EXISTS "Users can read own cart items" ON "CartItem";
DROP POLICY IF EXISTS "Users can insert own cart items" ON "CartItem";
DROP POLICY IF EXISTS "Users can update own cart items" ON "CartItem";
DROP POLICY IF EXISTS "Users can delete own cart items" ON "CartItem";

DROP POLICY IF EXISTS "Users can read own addresses" ON "Address";
DROP POLICY IF EXISTS "Users can insert own addresses" ON "Address";
DROP POLICY IF EXISTS "Users can update own addresses" ON "Address";
DROP POLICY IF EXISTS "Users can delete own addresses" ON "Address";

DROP POLICY IF EXISTS "Users can read own orders" ON "Order";
DROP POLICY IF EXISTS "Users can read own order items" ON "OrderItem";

-- 3. CartItem RLS Policies (Per-user cross-device sync)
CREATE POLICY "Users can read own cart items" ON "CartItem"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own cart items" ON "CartItem"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own cart items" ON "CartItem"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own cart items" ON "CartItem"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = "userId");

-- 4. Address RLS Policies (Per-user saved addresses)
CREATE POLICY "Users can read own addresses" ON "Address"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own addresses" ON "Address"
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own addresses" ON "Address"
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own addresses" ON "Address"
  FOR DELETE TO authenticated
  USING (auth.uid()::text = "userId");

-- 5. Order RLS Policies (Customers can ONLY read their own orders; mutations strictly server-side)
CREATE POLICY "Users can read own orders" ON "Order"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can read own order items" ON "OrderItem"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order"."id" = "OrderItem"."orderId"
        AND "Order"."userId" = auth.uid()::text
    )
  );

-- 6. Lock down anonymous/public access from all sensitive transactional tables
REVOKE ALL ON "CartItem" FROM anon;
REVOKE ALL ON "Address" FROM anon;
REVOKE ALL ON "Order" FROM anon;
REVOKE ALL ON "OrderItem" FROM anon;
