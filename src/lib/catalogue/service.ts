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
import { getDb } from "@/lib/db";

// In-memory runtime store used as resilient cache and fallback
let runtimeCategories: Category[] = [...SEED_CATEGORIES];
let runtimeProducts: Product[] = [...SEED_PRODUCTS];

function enrichProduct(p: Product): Product {
  const cat = runtimeCategories.find((c) => c.id === p.category_id || c.slug === p.category_id);
  return {
    ...p,
    category: cat || p.category,
  };
}

/**
 * -------------------------------------------------------------
 * CATEGORY OPERATIONS (NEON POSTGRESQL + CACHE)
 * -------------------------------------------------------------
 */
export async function getCategories(includeUnpublished = false): Promise<Category[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = includeUnpublished
        ? await sql`SELECT * FROM categories WHERE is_archived = FALSE ORDER BY display_order ASC;`
        : await sql`SELECT * FROM categories WHERE is_archived = FALSE AND is_published = TRUE ORDER BY display_order ASC;`;

      if (rows && rows.length > 0) {
        return rows as Category[];
      }
    } catch (e) {
      console.warn("Neon getCategories failed, using memory:", e);
    }
  }

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

export async function getCategoryById(id: string): Promise<Category | null> {
  const cats = await getCategories(true);
  return cats.find((c) => c.id === id) || null;
}

export async function createCategory(input: Omit<Category, "id" | "created_at" | "updated_at">): Promise<Category> {
  const now = new Date().toISOString();
  const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newCat: Category = {
    ...input,
    id,
    display_order: input.display_order || runtimeCategories.length + 1,
    is_published: input.is_published ?? true,
    is_archived: false,
    created_at: now,
    updated_at: now,
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO categories (id, name, slug, description, image_url, display_order, is_published, is_archived, created_at, updated_at)
        VALUES (
          ${newCat.id}, ${newCat.name}, ${newCat.slug}, ${newCat.description || null},
          ${newCat.image_url}, ${newCat.display_order}, ${newCat.is_published}, FALSE, ${now}, ${now}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        runtimeCategories.push(rows[0] as Category);
        return rows[0] as Category;
      }
    } catch (e) {
      console.warn("Neon createCategory failed, using memory:", e);
    }
  }

  runtimeCategories.push(newCat);
  return newCat;
}

export async function updateCategory(id: string, input: Partial<Category>): Promise<Category> {
  const now = new Date().toISOString();
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        UPDATE categories SET
          name = COALESCE(${input.name || null}, name),
          slug = COALESCE(${input.slug || null}, slug),
          description = COALESCE(${input.description !== undefined ? input.description : null}, description),
          image_url = COALESCE(${input.image_url || null}, image_url),
          display_order = COALESCE(${input.display_order || null}, display_order),
          is_published = COALESCE(${input.is_published !== undefined ? input.is_published : null}, is_published),
          updated_at = ${now}
        WHERE id = ${id}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        const idx = runtimeCategories.findIndex((c) => c.id === id);
        if (idx >= 0) runtimeCategories[idx] = rows[0] as Category;
        return rows[0] as Category;
      }
    } catch (e) {
      console.warn("Neon updateCategory failed, using memory:", e);
    }
  }

  const idx = runtimeCategories.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Category ${id} not found`);
  const updated = {
    ...runtimeCategories[idx],
    ...input,
    updated_at: now,
  };
  runtimeCategories[idx] = updated;
  return updated;
}

export async function archiveCategory(id: string): Promise<boolean> {
  const hasProducts = runtimeProducts.some(
    (p) => p.category_id === id && !p.is_archived
  );
  if (hasProducts) {
    throw new Error("Cannot archive category that contains active products. Please reassign or archive products first.");
  }

  const sql = getDb();
  if (sql) {
    try {
      await sql`UPDATE categories SET is_archived = TRUE WHERE id = ${id};`;
    } catch (e) {
      console.warn("Neon archiveCategory failed:", e);
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
 * PRODUCT OPERATIONS (NEON POSTGRESQL + CACHE)
 * -------------------------------------------------------------
 */
export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT p.*,
          json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'image_url', c.image_url
          ) as category,
          COALESCE(
            (SELECT json_agg(img) FROM product_images img WHERE img.product_id = p.id),
            '[]'::json
          ) as images,
          COALESCE(
            (SELECT json_agg(v) FROM product_variants v WHERE v.product_id = p.id),
            '[]'::json
          ) as variants,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', ag.id,
                  'product_id', ag.product_id,
                  'name', ag.name,
                  'description', ag.description,
                  'min_selections', ag.min_selections,
                  'max_selections', ag.max_selections,
                  'is_required', ag.is_required,
                  'display_order', ag.display_order,
                  'addons', COALESCE((SELECT json_agg(ad) FROM product_addons ad WHERE ad.addon_group_id = ag.id), '[]'::json)
                )
              ) FROM product_addon_groups ag WHERE ag.product_id = p.id
            ),
            '[]'::json
          ) as addon_groups
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_archived = FALSE
        ORDER BY p.display_order ASC;
      `;

      if (rows && rows.length > 0) {
        let list = rows as Product[];
        if (!filters?.includeUnpublished) {
          list = list.filter((p) => p.is_published);
        }
        if (filters?.isFeatured !== undefined) {
          list = list.filter((p) => p.is_featured === filters.isFeatured);
        }
        if (filters?.isAvailable !== undefined) {
          list = list.filter((p) => p.is_available === filters.isAvailable);
        }
        if (filters?.categorySlug && filters.categorySlug !== "all") {
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
    } catch (e) {
      console.warn("Neon getProducts failed, using fallback:", e);
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
  return p ? enrichProduct(p) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts({ includeUnpublished: true });
  const p = products.find((prod) => prod.id === id);
  return p ? enrichProduct(p) : null;
}

export async function createProduct(input: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
  const now = new Date().toISOString();
  const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newProduct: Product = {
    ...input,
    id,
    currency: "NGN",
    display_order: input.display_order || runtimeProducts.length + 1,
    is_published: input.is_published ?? true,
    is_archived: false,
    ingredients: input.ingredients || [],
    allergens: input.allergens || [],
    dietary_labels: input.dietary_labels || [],
    created_at: now,
    updated_at: now,
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO products (
          id, category_id, name, slug, sku, short_description, full_description,
          base_price_kobo, comparison_price_kobo, currency, is_featured, is_available,
          availability_status, min_prep_time_minutes, max_prep_time_minutes, is_published,
          is_archived, display_order, ingredients, allergens, dietary_labels, created_at, updated_at
        ) VALUES (
          ${newProduct.id}, ${newProduct.category_id}, ${newProduct.name}, ${newProduct.slug},
          ${newProduct.sku || null}, ${newProduct.short_description}, ${newProduct.full_description || null},
          ${newProduct.base_price_kobo}, ${newProduct.comparison_price_kobo || null}, 'NGN',
          ${newProduct.is_featured}, ${newProduct.is_available}, ${newProduct.availability_status},
          ${newProduct.min_prep_time_minutes}, ${newProduct.max_prep_time_minutes}, ${newProduct.is_published},
          FALSE, ${newProduct.display_order}, ${JSON.stringify(newProduct.ingredients)}::jsonb,
          ${JSON.stringify(newProduct.allergens)}::jsonb, ${JSON.stringify(newProduct.dietary_labels)}::jsonb,
          ${now}, ${now}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        runtimeProducts.push(rows[0] as Product);
        return enrichProduct(rows[0] as Product);
      }
    } catch (e) {
      console.warn("Neon createProduct failed, using memory:", e);
    }
  }

  runtimeProducts.push(newProduct);
  return enrichProduct(newProduct);
}

export async function updateProduct(id: string, input: Partial<Product>): Promise<Product> {
  const now = new Date().toISOString();
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        UPDATE products SET
          name = COALESCE(${input.name || null}, name),
          short_description = COALESCE(${input.short_description || null}, short_description),
          full_description = COALESCE(${input.full_description !== undefined ? input.full_description : null}, full_description),
          base_price_kobo = COALESCE(${input.base_price_kobo || null}, base_price_kobo),
          is_available = COALESCE(${input.is_available !== undefined ? input.is_available : null}, is_available),
          is_published = COALESCE(${input.is_published !== undefined ? input.is_published : null}, is_published),
          updated_at = ${now}
        WHERE id = ${id}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        const idx = runtimeProducts.findIndex((p) => p.id === id);
        if (idx >= 0) runtimeProducts[idx] = rows[0] as Product;
        return enrichProduct(rows[0] as Product);
      }
    } catch (e) {
      console.warn("Neon updateProduct failed, using memory:", e);
    }
  }

  const idx = runtimeProducts.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Product ${id} not found`);
  const updated = {
    ...runtimeProducts[idx],
    ...input,
    updated_at: now,
  };
  runtimeProducts[idx] = updated;
  return enrichProduct(updated);
}

export async function archiveProduct(id: string): Promise<boolean> {
  const sql = getDb();
  if (sql) {
    try {
      await sql`UPDATE products SET is_archived = TRUE WHERE id = ${id};`;
    } catch (e) {
      console.warn("Neon archiveProduct failed:", e);
    }
  }

  const idx = runtimeProducts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    runtimeProducts[idx].is_archived = true;
    return true;
  }
  return false;
}

export async function deleteProductVariant(variantId: string): Promise<boolean> {
  const sql = getDb();
  if (sql) {
    try {
      await sql`DELETE FROM product_variants WHERE id = ${variantId};`;
    } catch (e) {
      console.warn("Neon deleteProductVariant failed:", e);
    }
  }

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

export async function seedCatalogue(): Promise<{ seeded: boolean; message: string }> {
  const sql = getDb();
  if (!sql) {
    return {
      seeded: false,
      message: "Database connection not configured in environment. Using robust runtime store.",
    };
  }

  try {
    const countRes = await sql`SELECT count(*)::int as cnt FROM categories;`;
    if (countRes && countRes[0].cnt > 0) {
      return { seeded: false, message: `Database already contains ${countRes[0].cnt} categories. Skipping seed.` };
    }

    for (const cat of SEED_CATEGORIES) {
      await sql`
        INSERT INTO categories (id, name, slug, description, image_url, display_order, is_published, is_archived)
        VALUES (${cat.id}, ${cat.name}, ${cat.slug}, ${cat.description || null}, ${cat.image_url}, ${cat.display_order}, TRUE, FALSE)
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    for (const p of SEED_PRODUCTS) {
      await sql`
        INSERT INTO products (
          id, category_id, name, slug, sku, short_description, full_description,
          base_price_kobo, comparison_price_kobo, currency, is_featured, is_available,
          availability_status, min_prep_time_minutes, max_prep_time_minutes, is_published,
          is_archived, display_order, ingredients, allergens, dietary_labels
        ) VALUES (
          ${p.id}, ${p.category_id}, ${p.name}, ${p.slug}, ${p.sku || null},
          ${p.short_description}, ${p.full_description || null}, ${p.base_price_kobo},
          ${p.comparison_price_kobo || null}, 'NGN', ${p.is_featured}, ${p.is_available},
          ${p.availability_status}, ${p.min_prep_time_minutes}, ${p.max_prep_time_minutes},
          ${p.is_published}, FALSE, ${p.display_order}, ${JSON.stringify(p.ingredients)}::jsonb,
          ${JSON.stringify(p.allergens)}::jsonb, ${JSON.stringify(p.dietary_labels)}::jsonb
        ) ON CONFLICT (id) DO NOTHING;
      `;
    }

    return {
      seeded: true,
      message: `Successfully seeded ${SEED_CATEGORIES.length} categories and ${SEED_PRODUCTS.length} products to Neon PostgreSQL!`,
    };
  } catch (err: any) {
    return { seeded: false, message: `Seed error: ${err.message}` };
  }
}
