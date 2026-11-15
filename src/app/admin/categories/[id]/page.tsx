import { notFound } from "next/navigation";
import { getCategories } from "@/lib/catalogue/service";
import { CategoryForm } from "../category-form";

export const metadata = {
  title: "Edit Category | Empress Admin",
};

export async function generateStaticParams() {
  const categories = await getCategories(true);
  return categories.map((c) => ({ id: c.id }));
}

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
