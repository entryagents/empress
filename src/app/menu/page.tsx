import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/catalogue/service";
import { MenuClient } from "./menu-client";

export const metadata: Metadata = {
  title: "Our Menu — Handcrafted Shawarma, Small Chops & Grills",
  description:
    "Explore our full culinary catalogue: freshly prepared shawarma, authentic Nigerian small chops, wok stir-fried noodles, prime grills, whole grilled tilapia, and specialties.",
};

export default async function MenuPage() {
  const [categories, products] = await Promise.all([
    getCategories(false),
    getProducts({ includeUnpublished: false }),
  ]);

  return <MenuClient initialCategories={categories} initialProducts={products} />;
}
