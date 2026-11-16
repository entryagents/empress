import { notFound } from "next/navigation";
import { getCategories } from "@/lib/catalogue/service";
import { CategoryForm } from "../category-form";

export const instant = false;


export const metadata = {
  title: "Edit Category | Empress Admin",
};



export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await getCategories(true);
  const category = categories.find((c) => c.id === id || c.slug === id);

  if (!category) {
    notFound();
  }

  return <CategoryForm initialData={category} />;
}