import { getCategories } from "@/lib/catalogue/service";
import { ProductForm } from "../product-form";

export const instant = false;


export const metadata = {
  title: "New Dish | Empress Admin",
};

export default async function NewProductPage() {
  const categories = await getCategories(true);
  return <ProductForm categories={categories} />;
}