-- ==============================================================================
-- EMPRESS DELICACIES: CUSTOMER REVIEWS, RATINGS & PRIVATE FEEDBACK SCHEMA
-- Migration: 20261122_reviews_and_feedback_schema.sql
-- ==============================================================================

-- 1. Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  moderated_by UUID,
  moderated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_response TEXT,
  admin_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure a customer cannot review the exact same order + product multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_reviews_order_product
  ON public.customer_reviews(order_id, COALESCE(product_id, '00000000-0000-0000-0000-000000000000'));

CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON public.customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_product ON public.customer_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_order_ref ON public.customer_reviews(order_reference);

-- 2. Private Customer Feedback Table (Quality, Packaging, Service)
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  category TEXT NOT NULL CHECK (
    category IN ('food_quality', 'packaging', 'delivery_experience', 'customer_service', 'overall')
  ),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT NOT NULL,
  admin_notes TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_feedback_resolved ON public.customer_feedback(is_resolved);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_created ON public.customer_feedback(created_at DESC);

-- 3. Row Level Security Policies
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- Public can view only approved reviews
CREATE POLICY "Public read approved reviews" ON public.customer_reviews
  FOR SELECT USING (status = 'approved');

-- Admins and staff have full access
CREATE POLICY "Admin full access on customer_reviews" ON public.customer_reviews
  FOR ALL USING (
    (auth.role() = 'service_role') OR
    (auth.uid() IN (SELECT id FROM public.customer_profiles WHERE role IN ('admin', 'staff')))
  );

CREATE POLICY "Admin full access on customer_feedback" ON public.customer_feedback
  FOR ALL USING (
    (auth.role() = 'service_role') OR
    (auth.uid() IN (SELECT id FROM public.customer_profiles WHERE role IN ('admin', 'staff')))
  );
