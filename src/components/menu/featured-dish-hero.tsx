"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check, Clock, Sparkles, ArrowRight, Eye } from "lucide-react";
import type { Product } from "@/types/catalogue";
import { formatKobo } from "@/types/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { cn } from "@/lib/utils";

interface FeaturedDishHeroProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isJustAdded: boolean;
}

export function FeaturedDishHero({
  product,
  onQuickView,
  onQuickAdd,
  isJustAdded,
}: FeaturedDishHeroProps) {
  const primaryImg = product.images?.find((img) => img.is_primary)?.image_url;
  const hasVariants = Boolean(product.variants && product.variants.length > 0);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-wine-950 text-ivory-50 shadow-soft border border-wine-900/40">
      {/* Editorial Decorative Background Elements */}
      <div className="absolute -top-32 -right-32 size-72 rounded-full bg-wine-800/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 size-72 rounded-full bg-champagne-500/10 blur-3xl pointer-events-none" />

      <div className="relative grid items-center lg:grid-cols-12 gap-6 p-5 sm:p-7 lg:p-8">
        {/* LEFT / CONTENT: Editorial Typography */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow flex items-center gap-1.5 rounded-full bg-champagne-500/20 px-3 py-0.5 text-[0.7rem] font-semibold text-champagne-300 border border-champagne-400/30">
              <Sparkles className="size-3 text-champagne-400" />
              Chef&apos;s Signature Spotlight
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.7rem] text-ivory-200">
              {product.category?.name}
            </span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-3xl font-light tracking-tight text-white">
            {product.name}
          </h2>

          <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-ivory-200/85 font-light line-clamp-2">
            {product.full_description || product.short_description}
          </p>

          {/* Pricing & Prep Details */}
          <div className="flex flex-wrap items-center gap-5 border-y border-white/10 py-3">
            <div>
              <span className="block text-[0.6rem] uppercase tracking-wider text-champagne-400">
                Culinary Price
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {formatKobo(product.base_price_kobo)}
              </span>
            </div>

            <div className="h-8 w-px bg-white/15" />

            <div>
              <span className="block text-[0.65rem] uppercase tracking-wider text-ivory-300/80">
                Fresh Prep Time
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ivory-100">
                <Clock className="size-4 text-champagne-400" />
                <span>{product.min_prep_time_minutes}–{product.max_prep_time_minutes} mins</span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/15 hidden sm:block" />

            <div className="hidden sm:block">
              <span className="block text-[0.65rem] uppercase tracking-wider text-ivory-300/80">
                Availability
              </span>
              <span className="mt-1 inline-block text-sm font-medium text-emerald-400">
                {product.availability_status}
              </span>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="inline-flex items-center gap-2 rounded-xl bg-champagne-500 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-wine-950 transition-all hover:bg-champagne-400 hover:shadow-soft active:scale-95"
            >
              <Eye className="size-4" />
              <span>Explore &amp; Customise</span>
            </button>

            {!hasVariants && (
              <button
                type="button"
                onClick={() => onQuickAdd(product)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all",
                  isJustAdded
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isJustAdded ? (
                  <>
                    <Check className="size-4" /> Added to Bag
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Quick Add
                  </>
                )}
              </button>
            )}

            <Link
              href={`/menu/${product.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-champagne-300 hover:text-white transition-colors ml-auto sm:ml-0"
            >
              <span>Full Details</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT / VISUAL: High-resolution Food Frame */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-4/3 sm:aspect-16/10 lg:aspect-4/3 w-full overflow-hidden rounded-xl border border-white/15 shadow-xl">
            <FoodImage
              name={product.slug}
              src={primaryImg}
              alt={product.name}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              hoverZoom
              className="object-cover"
            />
            {/* Subtle Gradient Framing */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine-950/60 via-transparent to-black/20" />

            {/* Tap to inspect badge */}
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-wine-950/85 px-4 py-2 text-xs font-medium text-white backdrop-blur-md border border-white/20 transition-all hover:bg-wine-900"
            >
              <Eye className="size-3.5 text-champagne-400" />
              <span>View Presentation</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
