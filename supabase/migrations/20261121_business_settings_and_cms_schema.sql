-- ==============================================================================
-- EMPRESS DELICACIES: BUSINESS SETTINGS, DELTA STATE DELIVERY ZONES & HOMEPAGE CMS
-- Migration: 20261121_business_settings_and_cms_schema.sql
-- ==============================================================================

-- 1. Business Settings Table (Single-row configuration)
CREATE TABLE IF NOT EXISTS public.business_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  business_name TEXT NOT NULL DEFAULT 'Empress Delicacies',
  logo_url TEXT,
  description TEXT DEFAULT 'Premium handcrafted shawarma, authentic small chops, stir-fried noodles, grills, and culinary specialties.',
  phone TEXT NOT NULL DEFAULT '+234 800 000 0000',
  whatsapp_number TEXT DEFAULT '+234 800 000 0000',
  email TEXT NOT NULL DEFAULT 'orders@empressdelicacies.com',
  address TEXT NOT NULL DEFAULT 'Empress Delicacies Studio, Delta State, Nigeria',
  country TEXT NOT NULL DEFAULT 'Nigeria',
  state TEXT NOT NULL DEFAULT 'Delta State',
  city TEXT NOT NULL DEFAULT 'Asaba',
  currency TEXT NOT NULL DEFAULT 'NGN',
  currency_symbol TEXT NOT NULL DEFAULT '₦',
  opening_time TEXT NOT NULL DEFAULT '10:00',
  closing_time TEXT NOT NULL DEFAULT '22:00',
  operating_days TEXT[] NOT NULL DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  is_temporarily_closed BOOLEAN NOT NULL DEFAULT false,
  temporary_closure_reason TEXT,
  allow_ordering_override BOOLEAN NOT NULL DEFAULT false,
  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_address TEXT DEFAULT 'Empress Delicacies Culinary Studio, Delta State, Nigeria',
  pickup_instructions TEXT DEFAULT 'Present order reference code upon arrival for swift curbside pickup.',
  estimated_preparation_minutes INTEGER NOT NULL DEFAULT 35,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings row if missing
INSERT INTO public.business_settings (id, country, state, city)
VALUES ('default', 'Nigeria', 'Delta State', 'Asaba')
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure delivery_zones defaults to Delta State
ALTER TABLE public.delivery_zones
  ALTER COLUMN state SET DEFAULT 'Delta State',
  ADD COLUMN IF NOT EXISTS min_order_kobo BIGINT NOT NULL DEFAULT 0;

-- 3. Homepage CMS Content Table (Single-row content ledger)
CREATE TABLE IF NOT EXISTS public.homepage_cms (
  id TEXT PRIMARY KEY DEFAULT 'default',
  hero_eyebrow TEXT NOT NULL DEFAULT 'Haute Cuisine & Delicacies',
  hero_title_line1 TEXT NOT NULL DEFAULT 'Royal Taste,',
  hero_title_line2 TEXT NOT NULL DEFAULT 'Modern Sophistication.',
  hero_description TEXT NOT NULL DEFAULT 'Handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and culinary specialties prepared fresh in Delta State for delivery and customer pickup.',
  hero_cta_text TEXT NOT NULL DEFAULT 'Explore Menu',
  hero_cta_destination TEXT NOT NULL DEFAULT '/order',
  hero_image_url TEXT,
  hero_secondary_image_url TEXT,
  story_heading TEXT NOT NULL DEFAULT 'The Empress Culinary Experience',
  story_paragraphs TEXT[] NOT NULL DEFAULT ARRAY[
    'Empress Delicacies was founded on an unapologetic devotion to food excellence. Every shawarma is packed with premium marinated meats and bespoke spices.',
    'From our sizzling stir-fried noodles and grilled specialties to handcrafted small chops, we elevate everyday dining into memorable feasts across Delta State.'
  ],
  story_quote TEXT NOT NULL DEFAULT 'We do not merely prepare meals; we curate culinary indulgence.',
  story_image_url TEXT,
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_tagline TEXT NOT NULL DEFAULT 'Good Food. Unforgettable Moments.',
  footer_description TEXT NOT NULL DEFAULT 'Handcrafted shawarma, authentic small chops, stir-fried noodles, prime grills, fresh seafood and specialties in Delta State, Nigeria.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.homepage_cms (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 4. Row Level Security Policies
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_cms ENABLE ROW LEVEL SECURITY;

-- Public can read business settings and homepage CMS
CREATE POLICY "Public read business settings" ON public.business_settings
  FOR SELECT USING (true);

CREATE POLICY "Public read homepage cms" ON public.homepage_cms
  FOR SELECT USING (true);

-- Admin / Staff can modify business settings and CMS
CREATE POLICY "Admin update business settings" ON public.business_settings
  FOR ALL USING (
    (auth.role() = 'service_role') OR
    (auth.uid() IN (SELECT id FROM public.customer_profiles WHERE role IN ('admin', 'staff')))
  );

CREATE POLICY "Admin update homepage cms" ON public.homepage_cms
  FOR ALL USING (
    (auth.role() = 'service_role') OR
    (auth.uid() IN (SELECT id FROM public.customer_profiles WHERE role IN ('admin', 'staff')))
  );
