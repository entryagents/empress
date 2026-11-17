"use client";

import Image from "next/image";
import type { Category, Product } from "@/types/catalogue";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface CategoryDiscoveryTilesProps {
  categories: Category[];
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
}

export function CategoryDiscoveryTiles({
  categories,
  products,
  selectedCategory,
  onSelectCategory,
}: CategoryDiscoveryTilesProps) {
  return (
    <div className="w-full">
      {/* Category Horizontal Scroll Container with No Scrollbar */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-7 sm:overflow-visible">
        {/* "All Culinary Dishes" Tile */}
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={cn(
            "group relative flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 sm:w-auto",
            selectedCategory === "all"
              ? "border-champagne-500 ring-2 ring-champagne-500/40 shadow-soft bg-wine-950 text-white"
              : "border-wine-900/10 bg-white hover:border-wine-900/30 text-wine-950 shadow-xs"
          )}
        >
          <div className="relative aspect-4/3 w-full overflow-hidden bg-wine-900">
            <Image
              src="/images/food/shawarma.jpg"
              alt="All Empress Delicacies Dishes"
              fill
              sizes="(min-width: 640px) 15vw, 150px"
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                selectedCategory === "all" ? "opacity-90" : "opacity-80"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-wine-950/90 via-wine-950/30 to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-champagne-500/90 px-2 py-0.5 text-[0.62rem] font-bold text-wine-950">
              <Sparkles className="size-2.5" />
              <span>Full Menu</span>
            </div>
          </div>
          <div className="p-2.5">
            <span className="block font-serif text-xs sm:text-sm font-semibold truncate">
              All Dishes
            </span>
            <span className="block text-[0.65rem] opacity-70">
              {products.length} Items Available
            </span>
          </div>
        </button>

        {/* Dynamic Category Tiles from Database */}
        {categories.map((c) => {
          const isSelected = selectedCategory === c.slug;
          const count = products.filter(
            (p) => p.category?.slug === c.slug || p.category_id === c.id
          ).length;

          // Safe image fallback
          const imageSrc = c.image_url || "/images/food/shawarma.jpg";

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.slug)}
              className={cn(
                "group relative flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border text-left transition-all duration-300 sm:w-auto",
                isSelected
                  ? "border-champagne-500 ring-2 ring-champagne-500/40 shadow-soft bg-wine-950 text-white"
                  : "border-wine-900/10 bg-white hover:border-wine-900/30 text-wine-950 shadow-xs"
              )}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-wine-900">
                <Image
                  src={imageSrc}
                  alt={c.name}
                  fill
                  sizes="(min-width: 640px) 15vw, 150px"
                  className={cn(
                    "object-cover transition-transform duration-500 group-hover:scale-105",
                    isSelected ? "opacity-90" : "opacity-80"
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-wine-950/90 via-wine-950/30 to-transparent" />
              </div>
              <div className="p-2.5">
                <span className="block font-serif text-xs sm:text-sm font-semibold truncate">
                  {c.name}
                </span>
                <span className="block text-[0.65rem] opacity-70">
                  {count} {count === 1 ? "Dish" : "Dishes"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
