-- ==============================================================================
-- EMPRESS DELICACIES: PHASE 5 BACHS PAYMENT INTEGRATION SCHEMA
-- ==============================================================================

-- 1. EXTEND ORDERS TABLE WITH BACHS FIELDS & NEW STATUS CHECKS
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS bachs_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS bachs_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS bachs_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Create index for quick Bachs checkout session and payment ID lookups
CREATE INDEX IF NOT EXISTS orders_bachs_checkout_id_idx ON orders (bachs_checkout_id);
CREATE INDEX IF NOT EXISTS orders_bachs_payment_id_idx ON orders (bachs_payment_id);

-- Update payment_status check constraint to include expired, underpaid, refund_pending
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (
  payment_status IN (
    'unpaid',
    'pending',
    'paid',
    'failed',
    'expired',
    'underpaid',
    'refund_pending',
    'refunded'
  )
);

-- 2. PAYMENTS TABLE (AUDITABLE PAYMENT TRANSACTIONS)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'bachs',
  bachs_checkout_id TEXT NOT NULL,
  bachs_payment_id TEXT,
  amount_kobo BIGINT NOT NULL,
  amount_paid_kobo BIGINT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'unpaid',
      'pending',
      'paid',
      'failed',
      'expired',
      'underpaid',
      'refund_pending',
      'refunded'
    )
  ),
  payment_method TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_order_reference_idx ON payments (order_reference);
CREATE INDEX IF NOT EXISTS payments_bachs_checkout_id_idx ON payments (bachs_checkout_id);
CREATE INDEX IF NOT EXISTS payments_bachs_payment_id_idx ON payments (bachs_payment_id);

-- 3. PROCESSED WEBHOOK EVENTS TABLE (DEDUP & AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  order_reference TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  bachs_checkout_id TEXT,
  bachs_payment_id TEXT,
  status TEXT,
  amount TEXT,
  currency TEXT,
  payload_summary JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_order_ref_idx ON payment_webhook_events (order_reference);
CREATE INDEX IF NOT EXISTS payment_webhook_events_event_type_idx ON payment_webhook_events (event_type);

-- 4. RLS POLICIES
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payment records matching orders
CREATE POLICY "Users view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Admins and staff can view all payments
CREATE POLICY "Staff view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_profiles
      WHERE customer_profiles.id = auth.uid()
        AND customer_profiles.role IN ('admin', 'staff')
    )
  );

-- Admins and staff can view payment webhook audit logs
CREATE POLICY "Staff view webhook logs"
  ON payment_webhook_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_profiles
      WHERE customer_profiles.id = auth.uid()
        AND customer_profiles.role IN ('admin', 'staff')
    )
  );
