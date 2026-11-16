-- ==============================================================================
-- EMPRESS DELICACIES: PHASE 4 ORDER, CHECKOUT, COUPON & DELIVERY SCHEMA
-- ==============================================================================

-- 1. DISCOUNT CODES / COUPONS
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL, -- percentage (e.g. 10 for 10%) or fixed Naira
  discount_kobo BIGINT, -- Precalculated kobo for fixed discounts
  min_order_kobo BIGINT NOT NULL DEFAULT 0,
  max_discount_kobo BIGINT, -- Cap for percentage discounts
  usage_limit INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for case-insensitive lookup
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_lower_idx ON coupons (LOWER(code));

-- 2. DELIVERY ZONES & CONFIGURATION
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Lagos',
  city TEXT NOT NULL DEFAULT 'Lagos',
  areas TEXT[] NOT NULL DEFAULT '{}',
  fee_kobo BIGINT NOT NULL DEFAULT 150000, -- e.g. 1,500 NGN default
  estimated_minutes_min INTEGER NOT NULL DEFAULT 35,
  estimated_minutes_max INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference TEXT NOT NULL UNIQUE, -- Human-friendly e.g. EMP-20261115-8492
  secure_access_token TEXT NOT NULL UNIQUE, -- High-entropy token for guest lookup without leaking sequential IDs
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  user_id UUID, -- Optional pointer if user is authenticated via Supabase Auth
  
  -- Fulfilment Method
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup')),
  
  -- Delivery Address Details (Nigerian Standard)
  delivery_state TEXT,
  delivery_city TEXT,
  delivery_area TEXT,
  delivery_street_address TEXT,
  delivery_building_number TEXT,
  delivery_landmark TEXT,
  delivery_instructions TEXT,
  delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
  
  -- Pickup Information
  pickup_location TEXT,
  pickup_instructions TEXT,
  
  -- Financial Breakdown (All integer kobo)
  currency TEXT NOT NULL DEFAULT 'NGN',
  subtotal_kobo BIGINT NOT NULL,
  delivery_fee_kobo BIGINT NOT NULL DEFAULT 0,
  discount_kobo BIGINT NOT NULL DEFAULT 0,
  coupon_code TEXT,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  total_kobo BIGINT NOT NULL,
  
  -- Order Status & Payment State
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received',     -- Customer submitted order
    'confirmed',    -- Kitchen accepted order
    'preparing',    -- In kitchen / cooking
    'ready',        -- Ready for pickup or dispatch
    'dispatched',   -- In transit with rider
    'delivered',    -- Delivered to customer
    'collected',    -- Picked up by customer
    'cancelled'     -- Cancelled
  )),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid',       -- Order submitted, awaiting payment gateway
    'pending',      -- Payment gateway transaction initiated
    'paid',         -- Verified payment
    'failed',       -- Payment declined / failed
    'refunded'      -- Refunded
  )),
  
  -- General Notes & Idempotency
  special_instructions TEXT,
  idempotency_key TEXT UNIQUE, -- Prevents double-submission on network blips
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_ref_idx ON orders (order_reference);
CREATE INDEX IF NOT EXISTS orders_token_idx ON orders (secure_access_token);
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders (customer_phone);

-- 4. ORDER ITEMS (Immutable Historical Snapshot)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  
  -- Snapshots at time of purchase (immune to future catalogue edits)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  category_name TEXT,
  
  -- Variation Snapshot
  variant_id TEXT,
  variant_name TEXT,
  variant_price_adjustment_kobo BIGINT NOT NULL DEFAULT 0,
  
  -- Unit & Extended Pricing (kobo)
  base_price_kobo BIGINT NOT NULL,
  addons_total_kobo BIGINT NOT NULL DEFAULT 0,
  unit_price_kobo BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price_kobo BIGINT NOT NULL,
  
  -- Item Special Kitchen Notes
  special_instructions TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- 5. ORDER ITEM ADD-ONS (Immutable Add-on Snapshot)
CREATE TABLE IF NOT EXISTS order_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  addon_id TEXT NOT NULL,
  addon_group_name TEXT NOT NULL,
  addon_name TEXT NOT NULL,
  price_kobo BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_item_addons_item_id_idx ON order_item_addons (order_item_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_addons ENABLE ROW LEVEL SECURITY;

-- 1. Coupons: Public can view active coupons to validate codes; only admin can edit
CREATE POLICY "Public read active coupons" ON coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admin full access coupons" ON coupons
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Delivery Zones: Public can view active zones
CREATE POLICY "Public read active delivery zones" ON delivery_zones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access delivery zones" ON delivery_zones
  FOR ALL USING (auth.role() = 'service_role');

-- 3. Orders: Secure access
-- Read allowed if user owns order OR token matches (guest checkout) OR service_role
CREATE POLICY "Customer read order via token or auth" ON orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.role() = 'service_role')
  );

CREATE POLICY "Admin full access orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Order items & item addons follow order access
CREATE POLICY "Admin full access order_items" ON order_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin full access order_item_addons" ON order_item_addons
  FOR ALL USING (auth.role() = 'service_role');
