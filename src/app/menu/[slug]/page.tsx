import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/catalogue/service";
import { ProductDetailClient } from "./product-detail-client";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Dish Not Found — Empress Delicacies" };
  }

  const primaryImage = product.images?.find((img) => img.is_primary)?.image_url || "/images/food/shawarma.jpg";

  return {
    title: `${product.name} — Empress Delicacies`,
    description: product.short_description,
    openGraph: {
      title: `${product.name} — Empress Delicacies`,
      description: product.short_description,
      images: [{ url: primaryImage, alt: product.name }],
    },
  };
}

export async function generateStaticParams() {
  const products = await getProducts({ includeUnpublished: true });
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  // Related products from same category
  const allProducts = await getProducts({ categorySlug: product.category?.slug, includeUnpublished: false });
  const related = allProducts.filter((p) => p.slug !== product.slug).slice(0, 3);

  return <ProductDetailClient product={product} relatedProducts={related} />;
}
