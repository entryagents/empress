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
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-wine-900/10 shadow-soft hover:shadow-lift transition-all duration-300 hover:-translate-y-1"
    >
      {/* ── IMAGE SECTION (Instagram 4:5 Portrait / Square Dominance) ── */}
      <div className="relative aspect-4/5 sm:aspect-square w-full overflow-hidden bg-wine-950">
        <FoodImage
          name={product.slug}
          src={primaryImg}
          alt={product.name}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Cinematic Film Vignette Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-950/85 via-wine-950/15 to-wine-950/30" />

        {/* Top Header Floating Tags */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 z-10">
          <span className="eyebrow rounded-full bg-wine-950/80 px-2.5 py-1 text-[0.62rem] text-champagne-300 backdrop-blur-md border border-champagne-400/20">
            {product.category?.name || "Culinary Dish"}
          </span>

          {product.is_featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-champagne-500/90 px-2.5 py-0.5 text-[0.62rem] font-semibold text-wine-950 backdrop-blur-md shadow-xs">
              <Sparkles className="size-2.5" /> Featured
            </span>
          ) : (
            <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[0.62rem] font-medium text-emerald-300 backdrop-blur-md border border-emerald-400/20">
              {product.availability_status}
            </span>
          )}
        </div>

        {/* Center Quick View Overlay Trigger on Hover */}
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-wine-950/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100"
          aria-label={`Quick view ${product.name}`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-wine-950 shadow-lift transform scale-95 transition-transform duration-200 group-hover:scale-100">
            <Eye className="size-3.5 text-wine-800" />
            Quick Customise
          </span>
        </button>

        {/* Bottom Floating Info Over Image */}
        <div className="absolute inset-x-3 bottom-3 z-10 flex items-end justify-between text-ivory-50">
          <div className="flex items-center gap-1.5 rounded-full bg-wine-950/80 px-2.5 py-1 text-[0.68rem] backdrop-blur-md border border-white/10">
            <Clock className="size-3 text-champagne-400" />
            <span>{product.min_prep_time_minutes}–{product.max_prep_time_minutes}m</span>
          </div>

          {(hasVariants || hasAddons) && (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[0.62rem] font-medium text-ivory-100 backdrop-blur-md border border-white/15">
              {hasVariants ? "Portions" : "Extras"}
            </span>
          )}
        </div>
      </div>

      {/* ── CARD CONTENT SECTION (Instagram Editorial Caption Style) ── */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Dish Title */}
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="text-left font-serif text-lg sm:text-xl font-medium tracking-tight text-wine-950 hover:text-wine-700 transition-colors line-clamp-1 block"
          >
            {product.name}
          </button>

          {/* Short Narrative Description */}
          <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-wine-800/75 line-clamp-2 font-light">
            {product.short_description}
          </p>
        </div>

        {/* ── CARD FOOTER: PRICE & ACTION ── */}
        <div className="mt-4 flex items-center justify-between border-t border-wine-900/10 pt-3">
          <div>
            <span className="block font-serif text-lg sm:text-xl font-bold tracking-tight text-wine-950">
              {formatKobo(product.base_price_kobo)}
            </span>
            <span className="block text-[0.62rem] text-wine-700/70 uppercase tracking-wider">
              {hasVariants ? "Starting from" : "Per serving"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {hasVariants || hasAddons ? (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-wine-900/20 bg-ivory-100 px-3 py-1.5 text-xs font-semibold text-wine-950 hover:bg-wine-900 hover:text-white transition-all shadow-xs"
              >
                <span>Select</span>
                <Plus className="size-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickAdd(product)}
                disabled={!product.is_available}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-xs",
                  !product.is_available
                    ? "bg-wine-900/20 text-wine-950/40 cursor-not-allowed"
                    : isJustAdded
                    ? "bg-emerald-700 text-white"
                    : "bg-wine-900 text-ivory-50 hover:bg-wine-800 hover:shadow-soft"
                )}
              >
                {isJustAdded ? (
                  <>
                    <Check className="size-3.5" /> Added!
                  </>
                ) : !product.is_available ? (
                  "Sold Out"
                ) : (
                  <>
                    <Plus className="size-3.5" /> Add
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
