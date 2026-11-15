import { notFound } from "next/navigation";
import { getProductById, getCategories } from "@/lib/catalogue/service";
import { ProductForm } from "../product-form";

export const metadata = {
  title: "Edit Dish | Empress Admin",
};

export async function generateStaticParams() {
  const products = await getProductById("prod-shawarma");
  // Prerender known seed product IDs
  return [
    { id: "prod-shawarma" },
    { id: "prod-small-chops" },
    { id: "prod-noodles" },
    { id: "prod-pork-chops" },
    { id: "prod-cheesesteak" },
    { id: "prod-chinese-rice" },
    { id: "prod-turkey" },
    { id: "prod-chicken" },
    { id: "prod-tilapia" },
    { id: "prod-corn-dogs" },
  ];
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(true),
  ]);

  if (!product) {
    notFound();
  }

  return <ProductForm initialProduct={product} categories={categories} />;
}
