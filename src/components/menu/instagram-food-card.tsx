"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Check, Clock, Eye, Sparkles } from "lucide-react";
import type { Product } from "@/types/catalogue";
import { formatKobo } from "@/types/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { cn } from "@/lib/utils";

interface InstagramFoodCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isJustAdded: boolean;
  priority?: boolean;
}

export function InstagramFoodCard({
  product,
  onQuickView,
  onQuickAdd,
  isJustAdded,
  priority = false,
}: InstagramFoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const hasAddons = Boolean(product.addon_groups && product.addon_groups.length > 0);
  const primaryImg = product.images?.find((img) => img.is_primary)?.image_url;

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-wine-900/10 shadow-xs hover:shadow-soft transition-all duration-200"
    >
      {/* ── IMAGE SECTION (Balanced 4:3 Aspect, Not Oversized) ── */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-wine-950">
        <FoodImage
          name={product.slug}
          src={primaryImg}
          alt={product.name}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Subtle Bottom Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-950/70 via-transparent to-transparent" />

        {/* Top Floating Badge */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-1.5 z-10">
          <span className="eyebrow rounded-full bg-wine-950/80 px-2 py-0.5 text-[0.6rem] text-champagne-300 backdrop-blur-xs">
            {product.category?.name || "Dish"}
          </span>

          {product.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-champagne-500/95 px-2 py-0.5 text-[0.6rem] font-semibold text-wine-950 shadow-2xs">
              <Sparkles className="size-2.5" /> Featured
            </span>
          )}
        </div>

        {/* Quick View Hover Trigger */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-wine-950/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-label={`Quick view ${product.name}`}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.7rem] font-semibold text-wine-950 shadow-soft">
            <Eye className="size-3 text-wine-800" />
            Quick Customise
          </span>
        </button>

        {/* Prep Time Tag */}
        <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-1 rounded bg-wine-950/75 px-1.5 py-0.5 text-[0.62rem] text-ivory-100 backdrop-blur-xs">
          <Clock className="size-2.5 text-champagne-400" />
          <span>{product.min_prep_time_minutes}–{product.max_prep_time_minutes}m</span>
        </div>
      </div>

      {/* ── CARD CONTENT SECTION ── */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
        <div>
          {/* Dish Title */}
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="text-left font-serif text-base sm:text-lg font-medium tracking-tight text-wine-950 hover:text-wine-700 transition-colors line-clamp-1 block leading-tight"
          >
            {product.name}
          </button>

          {/* Short Narrative Description */}
          <p className="mt-1 text-xs leading-relaxed text-wine-800/70 line-clamp-2 font-light">
            {product.short_description}
          </p>
        </div>

        {/* ── CARD FOOTER: PRICE & ACTION ── */}
        <div className="mt-3 flex items-center justify-between border-t border-wine-900/10 pt-2.5">
          <div>
            <span className="block font-serif text-base sm:text-lg font-bold tracking-tight text-wine-950 leading-none">
              {formatKobo(product.base_price_kobo)}
            </span>
            <span className="block text-[0.58rem] text-wine-700/70 uppercase tracking-wider mt-0.5">
              {hasVariants ? "Starting from" : "Standard"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {hasVariants || hasAddons ? (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="inline-flex items-center gap-1 rounded-md border border-wine-900/20 bg-ivory-100 px-2.5 py-1 text-[0.7rem] font-semibold text-wine-950 hover:bg-wine-900 hover:text-white transition-all"
              >
                <span>Select</span>
                <Plus className="size-2.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAdd(product)}
                disabled={!product.is_available}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide transition-all active:scale-95",
                  !product.is_available
                    ? "bg-wine-900/20 text-wine-950/40 cursor-not-allowed"
                    : isJustAdded
                    ? "bg-emerald-700 text-white"
                    : "bg-wine-900 text-ivory-50 hover:bg-wine-800"
                )}
              >
                {isJustAdded ? (
                  <>
                    <Check className="size-3" /> Added!
                  </>
                ) : !product.is_available ? (
                  "Sold Out"
                ) : (
                  <>
                    <Plus className="size-3" /> Add
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
