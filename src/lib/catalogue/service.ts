import type {
  Category,
  Product,
  ProductVariant,
  ProductAddonGroup,
  ProductAddon,
  ProductImage,
  ProductFilterParams,
} from "@/types/catalogue";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

// In-memory runtime store used as resilient cache and fallback
let runtimeCategories: Category[] = [...SEED_CATEGORIES];
let runtimeProducts: Product[] = [...SEED_PRODUCTS];

// Attach category pointers to products
function enrichProduct(p: Product): Product {
  const cat = runtimeCategories.find((c) => c.id === p.category_id || c.slug === p.category_id);
  return {
    ...p,
    category: cat || p.category,
  };
}

/**
 * -------------------------------------------------------------
 * CATEGORY OPERATIONS
 * -------------------------------------------------------------
 */
export async function getCategories(includeUnpublished = false): Promise<Category[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase.from("categories").select("*").eq("is_archived", false);
      if (!includeUnpublished) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query.order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
    } catch {
      // Supabase fetch failure, fall back to runtime
    }
  }

  // Runtime fallback
  return runtimeCategories
    .filter((c) => !c.is_archived && (includeUnpublished || c.is_published))
    .sort((a, b) => a.display_order - b.display_order)
    .map((c) => ({
      ...c,
      item_count: runtimeProducts.filter((p) => p.category_id === c.id || p.category_id === c.slug).length,
    }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getCategories(true);
  return cats.find((c) => c.slug === slug) || null;
}

export async function createCategory(input: Partial<Category>): Promise<Category> {
  const newCat: Category = {
    id: input.id || `cat-${Date.now()}`,
    name: input.name || "New Category",
    slug: input.slug || `cat-${Date.now()}`,
    description: input.description || null,
    image_url: input.image_url || "/images/food/shawarma.jpg",
    display_order: input.display_order ?? (runtimeCategories.length + 1),
    is_published: input.is_published ?? true,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin.from("categories").insert([newCat]).select().single();
      if (!error && data) {
        runtimeCategories.push(data as Category);
        return data as Category;
      }
    } catch {
      // DB insert failure fallback
    }
  }

  runtimeCategories.push(newCat);
  return newCat;
}

export async function updateCategory(id: string, input: Partial<Category>): Promise<Category> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("categories")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        const idx = runtimeCategories.findIndex((c) => c.id === id);
        if (idx >= 0) runtimeCategories[idx] = data as Category;
        return data as Category;
      }
    } catch {
      // DB update fallback
    }
  }

  const idx = runtimeCategories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Category ${id} not found`);
  const updated = {
    ...runtimeCategories[idx],
    ...input,
    updated_at: new Date().toISOString(),
  };
  runtimeCategories[idx] = updated;
  return updated;
}

export async function archiveCategory(id: string): Promise<boolean> {
  // Prevent deletion if category contains non-archived products
  const hasProducts = runtimeProducts.some(
    (p) => (p.category_id === id) && !p.is_archived
  );
  if (hasProducts) {
    throw new Error("Cannot archive category that contains active products. Please reassign or archive products first.");
  }

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin.from("categories").update({ is_archived: true }).eq("id", id);
    } catch {
      // DB fallback
    }
  }

  const idx = runtimeCategories.findIndex((c) => c.id === id);
  if (idx >= 0) {
    runtimeCategories[idx].is_archived = true;
    return true;
  }
  return false;
}

/**
 * -------------------------------------------------------------
 * PRODUCT OPERATIONS
 * -------------------------------------------------------------
 */
export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      let query = supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          images:product_images(*),
          variants:product_variants(*),
          addon_groups:product_addon_groups(
            *,
            addons:product_addons(*)
          )
        `)
        .eq("is_archived", false);

      if (!filters?.includeUnpublished) {
        query = query.eq("is_published", true);
      }
      if (filters?.isFeatured !== undefined) {
        query = query.eq("is_featured", filters.isFeatured);
      }
      if (filters?.isAvailable !== undefined) {
        query = query.eq("is_available", filters.isAvailable);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let list = data as Product[];
        if (filters?.categorySlug) {
          list = list.filter((p) => p.category?.slug === filters.categorySlug);
        }
        if (filters?.search) {
          const s = filters.search.toLowerCase();
          list = list.filter(
            (p) =>
              p.name.toLowerCase().includes(s) ||
              p.short_description.toLowerCase().includes(s) ||
              (p.full_description && p.full_description.toLowerCase().includes(s))
          );
        }
        return list;
      }
    } catch {
      // Supabase query error, fall through to runtime
    }
  }

  // Runtime fallback
  let list = runtimeProducts.map(enrichProduct).filter((p) => !p.is_archived);

  if (!filters?.includeUnpublished) {
    list = list.filter((p) => p.is_published);
  }
  if (filters?.categorySlug && filters.categorySlug !== "all") {
    list = list.filter((p) => {
      const cat = runtimeCategories.find((c) => c.id === p.category_id || c.slug === p.category_id);
      return cat?.slug === filters.categorySlug || p.category_id === filters.categorySlug;
    });
  }
  if (filters?.isFeatured !== undefined) {
    list = list.filter((p) => p.is_featured === filters.isFeatured);
  }
  if (filters?.isAvailable !== undefined) {
    list = list.filter((p) => p.is_available === filters.isAvailable);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.short_description.toLowerCase().includes(s) ||
        (p.full_description && p.full_description.toLowerCase().includes(s))
    );
  }

  if (filters?.sortBy === "price_asc") {
    list.sort((a, b) => a.base_price_kobo - b.base_price_kobo);
  } else if (filters?.sortBy === "price_desc") {
    list.sort((a, b) => b.base_price_kobo - a.base_price_kobo);
  } else if (filters?.sortBy === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) => a.display_order - b.display_order);
  }

  return list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts({ includeUnpublished: true });
  const p = products.find((prod) => prod.slug === slug);
  return p || null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts({ includeUnpublished: true });
  const p = products.find((prod) => prod.id === id);
  return p || null;
}

export async function createProduct(input: Partial<Product>): Promise<Product> {
  const newProd: Product = {
    id: input.id || `prod-${Date.now()}`,
    category_id: input.category_id || runtimeCategories[0].id,
    name: input.name || "New Dish",
    slug: input.slug || `dish-${Date.now()}`,
    sku: input.sku || `EMP-${Date.now().toString().slice(-4)}`,
    short_description: input.short_description || "Freshly prepared meal",
    full_description: input.full_description || null,
    base_price_kobo: input.base_price_kobo ?? 450000,
    comparison_price_kobo: input.comparison_price_kobo ?? null,
    currency: input.currency || "NGN",
    is_initial_benchmark: input.is_initial_benchmark ?? true,
    is_featured: input.is_featured ?? false,
    is_available: input.is_available ?? true,
    availability_status: input.availability_status || "Fresh to order",
    min_prep_time_minutes: input.min_prep_time_minutes ?? 15,
    max_prep_time_minutes: input.max_prep_time_minutes ?? 25,
    is_published: input.is_published ?? true,
    is_archived: false,
    display_order: input.display_order ?? (runtimeProducts.length + 1),
    ingredients: input.ingredients || [],
    allergens: input.allergens || [],
    dietary_labels: input.dietary_labels || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: input.images || [],
    variants: input.variants || [],
    addon_groups: input.addon_groups || [],
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin.from("products").insert([newProd]).select().single();
      if (!error && data) {
        runtimeProducts.push(data as Product);
        return enrichProduct(data as Product);
      }
    } catch {
      // DB insert fallback
    }
  }

  runtimeProducts.push(newProd);
  return enrichProduct(newProd);
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<Product> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("products")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) {
        const idx = runtimeProducts.findIndex((p) => p.id === id);
        if (idx >= 0) runtimeProducts[idx] = { ...runtimeProducts[idx], ...(data as Product) };
        return enrichProduct(runtimeProducts[idx]);
      }
    } catch {
      // DB update fallback
    }
  }

  const idx = runtimeProducts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Product ${id} not found`);
  const updated = {
    ...runtimeProducts[idx],
    ...input,
    updated_at: new Date().toISOString(),
  };
  runtimeProducts[idx] = updated;
  return enrichProduct(updated);
}

export async function archiveProduct(id: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin.from("products").update({ is_archived: true }).eq("id", id);
    } catch {
      // DB fallback
    }
  }

  const idx = runtimeProducts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    runtimeProducts[idx].is_archived = true;
    return true;
  }
  return false;
}

/**
 * -------------------------------------------------------------
 * VARIATIONS & ADD-ONS & IMAGES OPERATIONS
 * -------------------------------------------------------------
 */
export async function addProductVariant(productId: string, variant: Partial<ProductVariant>): Promise<ProductVariant> {
  const newVariant: ProductVariant = {
    id: variant.id || `var-${Date.now()}`,
    product_id: productId,
    name: variant.name || "Standard",
    sku: variant.sku || null,
    price_adjustment_kobo: variant.price_adjustment_kobo ?? 0,
    explicit_price_kobo: variant.explicit_price_kobo ?? null,
    is_available: variant.is_available ?? true,
    display_order: variant.display_order ?? 1,
    created_at: new Date().toISOString(),
  };

  const p = runtimeProducts.find((prod) => prod.id === productId);
  if (p) {
    p.variants = [...(p.variants || []), newVariant];
  }
  return newVariant;
}

export async function deleteProductVariant(variantId: string): Promise<boolean> {
  for (const p of runtimeProducts) {
    if (p.variants) {
      p.variants = p.variants.filter((v) => v.id !== variantId);
    }
  }
  return true;
}

export async function addProductAddonGroup(productId: string, group: Partial<ProductAddonGroup>): Promise<ProductAddonGroup> {
  const newGroup: ProductAddonGroup = {
    id: group.id || `ag-${Date.now()}`,
    product_id: productId,
    name: group.name || "Extras",
    description: group.description || null,
    min_selections: group.min_selections ?? 0,
    max_selections: group.max_selections ?? 5,
    is_required: group.is_required ?? false,
    display_order: group.display_order ?? 1,
    created_at: new Date().toISOString(),
    addons: [],
  };

  const p = runtimeProducts.find((prod) => prod.id === productId);
  if (p) {
    p.addon_groups = [...(p.addon_groups || []), newGroup];
  }
  return newGroup;
}

export async function addProductAddon(groupId: string, addon: Partial<ProductAddon>): Promise<ProductAddon> {
  const newAddon: ProductAddon = {
    id: addon.id || `add-${Date.now()}`,
    addon_group_id: groupId,
    name: addon.name || "Extra Portion",
    description: addon.description || null,
    price_kobo: addon.price_kobo ?? 50000,
    is_available: addon.is_available ?? true,
    display_order: addon.display_order ?? 1,
    created_at: new Date().toISOString(),
  };

  for (const p of runtimeProducts) {
    const grp = p.addon_groups?.find((g) => g.id === groupId);
    if (grp) {
      grp.addons = [...(grp.addons || []), newAddon];
    }
  }
  return newAddon;
}

export async function addProductImage(productId: string, img: Partial<ProductImage>): Promise<ProductImage> {
  const newImg: ProductImage = {
    id: img.id || `img-${Date.now()}`,
    product_id: productId,
    image_url: img.image_url || "/images/food/shawarma.jpg",
    storage_path: img.storage_path || null,
    alt_text: img.alt_text || "Product photo",
    display_order: img.display_order ?? 1,
    is_primary: img.is_primary ?? false,
    created_at: new Date().toISOString(),
  };

  const p = runtimeProducts.find((prod) => prod.id === productId);
  if (p) {
    p.images = [...(p.images || []), newImg];
  }
  return newImg;
}

/**
 * Sync / Seed utility:
 * If connected to Supabase, checks if tables are empty and seeds them.
 */
export async function seedSupabaseCatalogue(): Promise<{ seeded: boolean; message: string }> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      seeded: false,
      message: "Supabase credentials not configured in environment. Using robust runtime store.",
    };
  }

  try {
    const { count } = await admin.from("categories").select("*", { count: "exact", head: true });
    if (count && count > 0) {
      return { seeded: false, message: `Database already contains ${count} categories. Skipping seed.` };
    }

    // Insert categories
    const catRows = SEED_CATEGORIES.map(({ item_count, ...c }) => c);
    const { error: catErr } = await admin.from("categories").insert(catRows);
    if (catErr) throw catErr;

    // Insert products
    const prodRows = SEED_PRODUCTS.map(({ images, variants, addon_groups, category, ...p }) => p);
    const { error: prodErr } = await admin.from("products").insert(prodRows);
    if (prodErr) throw prodErr;

    return { seeded: true, message: `Successfully seeded ${SEED_CATEGORIES.length} categories and ${SEED_PRODUCTS.length} products to Supabase!` };
  } catch (err: any) {
    return { seeded: false, message: `Seed error: ${err.message}` };
  }
}
