import { notFound } from "next/navigation";
import { getProductById, getCategories } from "@/lib/catalogue/service";
import { ProductForm } from "../product-form";

export const instant = false;


export const metadata = {
  title: "Edit Dish | Empress Admin",
};



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