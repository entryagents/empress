-- ====================================================================
-- EMPRESS DELICACIES: PRODUCT CATALOGUE & MENU SCHEMA (Phase 2 & 3)
-- PostgreSQL / Supabase Migration
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for category listing and slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories (display_order) WHERE is_published = true AND is_archived = false;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    sku VARCHAR(50),
    short_description TEXT NOT NULL,
    full_description TEXT,
    base_price_kobo BIGINT NOT NULL CHECK (base_price_kobo >= 0),
    comparison_price_kobo BIGINT CHECK (comparison_price_kobo >= base_price_kobo),
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    is_initial_benchmark BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'Fresh to order',
    min_prep_time_minutes INTEGER NOT NULL DEFAULT 15,
    max_prep_time_minutes INTEGER NOT NULL DEFAULT 30,
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    ingredients TEXT[] DEFAULT '{}',
    allergens TEXT[] DEFAULT '{}',
    dietary_labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for products querying
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id) WHERE is_published = true AND is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_published = true AND is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products (is_available);

-- 4. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    alt_text VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images (product_id, display_order);

-- 5. PRODUCT VARIANTS (e.g. Regular, Large, Jumbo, Family Pack)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sku VARCHAR(60),
    price_adjustment_kobo BIGINT NOT NULL DEFAULT 0,
    explicit_price_kobo BIGINT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id, display_order);

-- 6. PRODUCT ADD-ON GROUPS (e.g. Extra Fillings, Sauces, Proteins)
CREATE TABLE IF NOT EXISTS public.product_addon_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_selections INTEGER NOT NULL DEFAULT 0,
    max_selections INTEGER NOT NULL DEFAULT 5,
    is_required BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_addon_groups_product ON public.product_addon_groups (product_id, display_order);

-- 7. PRODUCT ADD-ONS (Individual extras with pricing)
CREATE TABLE IF NOT EXISTS public.product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    addon_group_id UUID NOT NULL REFERENCES public.product_addon_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_kobo BIGINT NOT NULL DEFAULT 0 CHECK (price_kobo >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_addons_group ON public.product_addons (addon_group_id, display_order);

-- 8. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;

-- CATEGORIES POLICIES
CREATE POLICY "Public users can view published categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (is_published = true AND is_archived = false);

CREATE POLICY "Admins have full access to categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- PRODUCTS POLICIES
CREATE POLICY "Public users can view published products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (is_published = true AND is_archived = false);

CREATE POLICY "Admins have full access to products"
    ON public.products FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- PRODUCT IMAGES POLICIES
CREATE POLICY "Public users can view images of published products"
    ON public.product_images FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_images.product_id
        AND p.is_published = true
        AND p.is_archived = false
    ));

CREATE POLICY "Admins have full access to product images"
    ON public.product_images FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- VARIANTS POLICIES
CREATE POLICY "Public users can view available variants of published products"
    ON public.product_variants FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id
        AND p.is_published = true
        AND p.is_archived = false
    ));

CREATE POLICY "Admins have full access to product variants"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ADD-ON GROUPS & ADD-ONS POLICIES
CREATE POLICY "Public users can view add-on groups of published products"
    ON public.product_addon_groups FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_addon_groups.product_id
        AND p.is_published = true
        AND p.is_archived = false
    ));

CREATE POLICY "Admins have full access to add-on groups"
    ON public.product_addon_groups FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public users can view add-ons of active groups"
    ON public.product_addons FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.product_addon_groups g
        JOIN public.products p ON p.id = g.product_id
        WHERE g.id = product_addons.addon_group_id
        AND p.is_published = true
        AND p.is_archived = false
    ));

CREATE POLICY "Admins have full access to add-ons"
    ON public.product_addons FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
