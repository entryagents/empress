"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  updateProduct,
  archiveProduct,
  createCategory,
  updateCategory,
  archiveCategory,
  seedSupabaseCatalogue,
  getProductById,
} from "@/lib/catalogue/service";
import { nairaToKobo } from "@/types/catalogue";
import type { ProductVariant, ProductAddonGroup, ProductImage } from "@/types/catalogue";

export async function saveProductAction(formData: FormData) {
  try {
    const id = formData.get("id") as string | null;
    const name = (formData.get("name") as string) || "Untitled Product";
    const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const sku = (formData.get("sku") as string) || `EMP-${Date.now().toString().slice(-4)}`;
    const category_id = formData.get("category_id") as string;
    const short_description = (formData.get("short_description") as string) || "";
    const full_description = (formData.get("full_description") as string) || "";
    
    // Naira input converted to Kobo
    const priceNaira = parseFloat((formData.get("base_price_naira") as string) || "0");
    const base_price_kobo = nairaToKobo(priceNaira);

    const min_prep_time_minutes = parseInt((formData.get("min_prep_time_minutes") as string) || "15", 10);
    const max_prep_time_minutes = parseInt((formData.get("max_prep_time_minutes") as string) || "25", 10);
    const availability_status = (formData.get("availability_status") as string) || "Fresh to order";
    const is_available = formData.get("is_available") === "on" || formData.get("is_available") === "true";
    const is_featured = formData.get("is_featured") === "on" || formData.get("is_featured") === "true";
    const is_published = formData.get("is_published") === "on" || formData.get("is_published") === "true";

    // JSON fields for variations, addons, and images if supplied
    const variantsRaw = formData.get("variants_json") as string | null;
    const variants: ProductVariant[] = variantsRaw ? JSON.parse(variantsRaw) : [];

    const addonGroupsRaw = formData.get("addon_groups_json") as string | null;
    const addon_groups: ProductAddonGroup[] = addonGroupsRaw ? JSON.parse(addonGroupsRaw) : [];

    const imagesRaw = formData.get("images_json") as string | null;
    const images: ProductImage[] = imagesRaw ? JSON.parse(imagesRaw) : [];

    const productPayload = {
      name,
      slug,
      sku,
      category_id,
      short_description,
      full_description,
      base_price_kobo,
      min_prep_time_minutes,
      max_prep_time_minutes,
      availability_status: availability_status as any,
      is_available,
      is_featured,
      is_published,
      variants,
      addon_groups,
      images,
    };

    if (id && id.trim()) {
      await updateProduct(id, productPayload);
    } else {
      await createProduct(productPayload);
    }

    revalidatePath("/menu");
    revalidatePath(`/menu/${slug}`);
    revalidatePath("/admin/menu");
    return { success: true, message: `Product "${name}" saved successfully.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save product" };
  }
}

export async function archiveProductAction(id: string) {
  try {
    await archiveProduct(id);
    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to archive product" };
  }
}

export async function toggleProductPublishAction(id: string, currentPublished: boolean) {
  try {
    await updateProduct(id, { is_published: !currentPublished });
    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveCategoryAction(formData: FormData) {
  try {
    const id = formData.get("id") as string | null;
    const name = (formData.get("name") as string) || "Untitled Category";
    const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const description = (formData.get("description") as string) || "";
    const image_url = (formData.get("image_url") as string) || "/images/food/shawarma.jpg";
    const display_order = parseInt((formData.get("display_order") as string) || "1", 10);
    const is_published = formData.get("is_published") === "on" || formData.get("is_published") === "true";

    const payload = {
      name,
      slug,
      description,
      image_url,
      display_order,
      is_published,
    };

    if (id && id.trim()) {
      await updateCategory(id, payload);
    } else {
      await createCategory(payload);
    }

    revalidatePath("/menu");
    revalidatePath("/admin/categories");
    return { success: true, message: `Category "${name}" saved.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save category" };
  }
}

export async function archiveCategoryAction(id: string) {
  try {
    await archiveCategory(id);
    revalidatePath("/menu");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Cannot archive category." };
  }
}

export async function toggleCategoryPublishAction(id: string, currentPublished: boolean) {
  try {
    await updateCategory(id, { is_published: !currentPublished });
    revalidatePath("/menu");
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function seedCatalogueServerAction() {
  try {
    const res = await seedSupabaseCatalogue();
    revalidatePath("/menu");
    revalidatePath("/admin/menu");
    revalidatePath("/admin/categories");
    return res;
  } catch (err: any) {
    return { seeded: false, message: err.message };
  }
}
