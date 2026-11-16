-- ==============================================================================
-- EMPRESS DELICACIES: PHASE 6 ADMIN ORDER MANAGEMENT & FULFILMENT SCHEMA
-- ==============================================================================

-- 1. EXTEND ORDERS TABLE WITH ADMINISTRATIVE & CANCELLATION FIELDS
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- Update status check constraint to include all documented workflow stages
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'received',
    'awaiting_payment',
    'confirmed',
    'preparing',
    'ready',
    'ready_for_pickup',
    'ready_for_dispatch',
    'out_for_delivery',
    'dispatched',
    'delivered',
    'collected',
    'cancelled'
  )
);

-- 2. ORDER STATUS AUDIT TIMELINE TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by_user_id UUID,
  changed_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON order_status_history (order_id);
CREATE INDEX IF NOT EXISTS order_status_history_order_ref_idx ON order_status_history (order_reference);

-- 3. CUSTOMER NOTIFICATIONS LOG TABLE (AUDIT & DEDUP)
CREATE TABLE IF NOT EXISTS customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  notification_type TEXT NOT NULL,
  dedup_key TEXT NOT NULL UNIQUE, -- e.g. "ord_EMP-20261118-9128_confirmed" prevents duplicate dispatches
  status TEXT NOT NULL DEFAULT 'simulated' CHECK (status IN ('simulated', 'sent', 'failed', 'skipped')),
  provider TEXT,
  subject TEXT,
  body_preview TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_notifications_order_ref_idx ON customer_notifications (order_reference);

-- 4. ROW LEVEL SECURITY
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

-- Customers can view their own order status audit timeline
CREATE POLICY "Customers view own order history"
  ON order_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Staff and administrators can view and manage all history
CREATE POLICY "Staff view all order history"
  ON order_status_history FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_profiles
      WHERE customer_profiles.id = auth.uid()
        AND customer_profiles.role IN ('admin', 'staff')
    )
  );

-- Staff can view all notifications
CREATE POLICY "Staff view all notifications"
  ON customer_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_profiles
      WHERE customer_profiles.id = auth.uid()
        AND customer_profiles.role IN ('admin', 'staff')
    )
  );
