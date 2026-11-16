import { getProducts, getCategories } from "@/lib/catalogue/service";
import { AdminMenuListClient } from "./menu-list-client";

export const instant = false;


export const metadata = {
  title: "Dish Catalogue | Empress Admin",
};

export default async function AdminMenuPage() {
  const [products, categories] = await Promise.all([
    getProducts({ includeUnpublished: true }),
    getCategories(true),
  ]);

  return <AdminMenuListClient initialProducts={products} categories={categories} />;
}