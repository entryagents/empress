-- ==============================================================================
-- EMPRESS DELICACIES: DELIVERY MANAGEMENT & LIVE GPS TRACKING
-- Migration: 20261120_delivery_and_tracking_schema.sql
-- ==============================================================================

-- 1. Extend user_role check if present, or ensure profiles support delivery_driver
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customer_profiles_role_check'
  ) THEN
    ALTER TABLE customer_profiles DROP CONSTRAINT customer_profiles_role_check;
  END IF;
END $$;

ALTER TABLE customer_profiles
  ADD CONSTRAINT customer_profiles_role_check
  CHECK (role IN ('customer', 'staff', 'delivery_driver', 'admin'));

-- 2. Delivery Personnel Profiles Table
CREATE TABLE IF NOT EXISTS public.delivery_personnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car', 'van')),
  vehicle_plate_number TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline', 'inactive')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  last_location_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_personnel_status ON public.delivery_personnel(status, is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_personnel_user ON public.delivery_personnel(user_id);

-- 3. Add assigned_driver_id to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.delivery_personnel(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON public.orders(assigned_driver_id);

-- 4. Delivery Assignments Ledger
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.delivery_personnel(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (
    status IN ('assigned', 'accepted', 'rejected', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')
  ),
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON public.delivery_assignments(driver_id, status);

-- 5. Delivery Location Updates (Live GPS Breadcrumbs)
CREATE TABLE IF NOT EXISTS public.delivery_location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL,
  driver_id UUID NOT NULL REFERENCES public.delivery_personnel(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed_mps DOUBLE PRECISION,
  accuracy_meters DOUBLE PRECISION,
  is_simulated BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_location_order_time ON public.delivery_location_updates(order_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_location_driver ON public.delivery_location_updates(driver_id, recorded_at DESC);

-- 6. Row Level Security Policies
ALTER TABLE public.delivery_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_location_updates ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on delivery_personnel" ON public.delivery_personnel
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on delivery_assignments" ON public.delivery_assignments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on delivery_location_updates" ON public.delivery_location_updates
  FOR ALL USING (auth.role() = 'service_role');

-- Drivers can read their own profile
CREATE POLICY "Driver read own profile" ON public.delivery_personnel
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Drivers can read their own assignments
CREATE POLICY "Driver read assigned deliveries" ON public.delivery_assignments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND driver_id IN (
      SELECT id FROM public.delivery_personnel WHERE user_id = auth.uid()
    )
  );

-- Drivers can update their active assignments (accept, reject, start, complete)
CREATE POLICY "Driver update assigned deliveries" ON public.delivery_assignments
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND driver_id IN (
      SELECT id FROM public.delivery_personnel WHERE user_id = auth.uid()
    )
  );

-- Enable Supabase Realtime broadcast for location updates
-- (Allows clients subscribing to realtime channel 'order-tracking:REF' to receive updates)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_location_updates;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table might already be in publication or publication not configured
  NULL;
END $$;
