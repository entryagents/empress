import { getCategories, getProducts } from "@/lib/catalogue/service";
import { CategoriesClient } from "./categories-client";

export const instant = false;


export const metadata = {
  title: "Category Management | Empress Admin",
};

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(true),
    getProducts({ includeUnpublished: true }),
  ]);

  // Compute live item counts per category
  const categoriesWithCounts = categories.map((cat) => {
    const count = products.filter(
      (p) => (p.category_id === cat.id || p.category_id === cat.slug) && !p.is_archived
    ).length;
    return { ...cat, item_count: count };
  });

  return <CategoriesClient initialCategories={categoriesWithCounts} />;
}