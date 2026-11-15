export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  display_order: number;
  is_published: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  storage_path: string | null;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_adjustment_kobo: number;
  explicit_price_kobo: number | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductAddon {
  id: string;
  addon_group_id: string;
  name: string;
  description: string | null;
  price_kobo: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface ProductAddonGroup {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  display_order: number;
  created_at: string;
  addons?: ProductAddon[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string;
  full_description: string | null;
  base_price_kobo: number;
  comparison_price_kobo: number | null;
  currency: string;
  is_initial_benchmark: boolean;
  is_featured: boolean;
  is_available: boolean;
  availability_status: string;
  min_prep_time_minutes: number;
  max_prep_time_minutes: number;
  is_published: boolean;
  is_archived: boolean;
  display_order: number;
  ingredients: string[];
  allergens: string[];
  dietary_labels: string[];
  created_at: string;
  updated_at: string;

  // Joined relations
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  addon_groups?: ProductAddonGroup[];
}

export interface ProductFilterParams {
  categorySlug?: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
  search?: string;
  sortBy?: "display_order" | "price_asc" | "price_desc" | "name" | "newest";
  includeUnpublished?: boolean;
}

/**
 * Monetary utility functions:
 * Prices are strictly stored as integer minor units (kobo).
 * 100 kobo = 1 Naira (NGN).
 */
export function formatKobo(kobo: number, currency: string = "NGN"): string {
  const units = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(units);
}

export function koboToNaira(kobo: number): number {
  return Math.round(kobo / 100);
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function calculateItemPrice(
  basePriceKobo: number,
  variant?: ProductVariant | null,
  addons?: ProductAddon[]
): number {
  let total = basePriceKobo;
  if (variant) {
    if (variant.explicit_price_kobo !== null) {
      total = variant.explicit_price_kobo;
    } else {
      total += variant.price_adjustment_kobo;
    }
  }
  if (addons && addons.length > 0) {
    total += addons.reduce((sum, a) => sum + a.price_kobo, 0);
  }
  return total;
}
