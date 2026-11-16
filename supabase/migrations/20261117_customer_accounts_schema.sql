-- ==============================================================================
-- EMPRESS DELICACIES: PHASE 5 CUSTOMER AUTH, PROFILES & SAVED ADDRESSES SCHEMA
-- ==============================================================================

-- 1. CUSTOMER PROFILES
-- Linked 1:1 with auth.users
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_profiles_email_idx ON customer_profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS customer_profiles_phone_idx ON customer_profiles (phone);

-- 2. SAVED CUSTOMER DELIVERY ADDRESSES
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home', -- e.g. Home, Office, Beach House
  state TEXT NOT NULL DEFAULT 'Lagos',
  city TEXT NOT NULL DEFAULT 'Lagos',
  area TEXT NOT NULL,
  street_address TEXT NOT NULL,
  building_number TEXT,
  landmark TEXT,
  delivery_instructions TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_id_idx ON customer_addresses (customer_id);

-- 3. LINKING ORDERS TO CUSTOMERS
-- Orders already has user_id UUID references auth.users(id).
-- Add index on user_id if not present
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Customer Profiles RLS:
-- Customer can read and update only their own profile
CREATE POLICY "Customers read own profile" ON customer_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Customers update own profile" ON customer_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Role cannot be escalated by customer update
    role = (SELECT role FROM customer_profiles WHERE id = auth.uid())
  );

-- Service role has full administrative access
CREATE POLICY "Admin full access customer_profiles" ON customer_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Customer Addresses RLS:
-- Customer can manage only their own addresses
CREATE POLICY "Customers view own addresses" ON customer_addresses
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers insert own addresses" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers update own addresses" ON customer_addresses
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Customers delete own addresses" ON customer_addresses
  FOR DELETE USING (auth.uid() = customer_id);

CREATE POLICY "Admin full access customer_addresses" ON customer_addresses
  FOR ALL USING (auth.role() = 'service_role');

-- Ensure orders policy allows authenticated customers to view their own orders:
DROP POLICY IF EXISTS "Customer read own orders" ON orders;
CREATE POLICY "Customer read own orders" ON orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.role() = 'service_role')
  );

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up via Supabase Auth, automatically initialize their profile
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Valued Customer'),
    NEW.raw_user_meta_data->>'phone',
    'customer'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, customer_profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();
