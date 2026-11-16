"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, Plus, Check, Clock, Star, X, ArrowRight, Eye } from "lucide-react";
import type { Category, Product } from "@/types/catalogue";
import { formatKobo } from "@/types/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { useCart } from "@/lib/cart-context";
import type { ImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

interface MenuClientProps {
  initialCategories: Category[];
  initialProducts: Product[];
}

export function MenuClient({ initialCategories, initialProducts }: MenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"order" | "price_asc" | "price_desc" | "name">("order");
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  const { addItem } = useCart();

  const handleQuickAdd = (p: Product) => {
    addItem(p);
    setAddedSlug(p.slug);
    setTimeout(() => setAddedSlug(null), 1800);
  };

  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        // Category filter
        if (selectedCategory !== "all") {
          const matchCat =
            p.category?.slug === selectedCategory ||
            p.category_id === selectedCategory ||
            p.category?.id === selectedCategory;
          if (!matchCat) return false;
        }

        // Availability
        if (availabilityFilter === "available" && !p.is_available) {
          return false;
        }

        // Featured
        if (featuredOnly && !p.is_featured) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.short_description.toLowerCase().includes(q);
          const matchFull = p.full_description?.toLowerCase().includes(q);
          const matchCat = p.category?.name.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchFull && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.base_price_kobo - b.base_price_kobo;
        if (sortBy === "price_desc") return b.base_price_kobo - a.base_price_kobo;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return a.display_order - b.display_order;
      });
  }, [initialProducts, selectedCategory, searchQuery, availabilityFilter, featuredOnly, sortBy]);

  return (
    <div className="bg-ivory-50 pb-28 pt-28 text-wine-900 min-h-screen">
      {/* Editorial Page Header */}
      <section className="border-b border-wine-900/10 bg-ivory-100 py-16">
        <div className="container-x">
          <div className="max-w-3xl">
            <p className="eyebrow flex items-center gap-3 text-champagne-500 before:h-px before:w-10 before:bg-current">
              Full Catalogue
            </p>
            <h1 className="mt-4 font-serif text-(length:--text-h1) font-light leading-[0.98] tracking-tight text-wine-950">
              Our Culinary <em className="text-wine-600">Menu</em>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-wine-800/80 sm:text-lg">
              Explore every dish crafted at Empress Delicacies. Select an item to customize your portion size and add-on extras, or add directly to your order.
            </p>
          </div>

          {/* Search & Global Controls Bar */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-wine-700/60" />
              <input
                type="text"
                placeholder="Search shawarma, small chops, noodles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[2px] border border-wine-900/20 bg-white py-2.5 pl-10 pr-10 text-sm text-wine-950 placeholder:text-wine-800/40 focus:border-champagne-500 focus:outline-none shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-600 hover:text-wine-950"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Toggles & Sorting */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-2 font-medium transition-colors",
                  featuredOnly
                    ? "border-champagne-500 bg-champagne-400/20 text-wine-950 font-semibold"
                    : "border-wine-900/20 bg-white text-wine-800 hover:border-wine-900/50"
                )}
              >
                <Star className="size-3.5 text-champagne-500" />
                Featured Only
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-[2px] border border-wine-900/20 bg-white px-3 py-2 font-medium text-wine-900 focus:border-champagne-500 focus:outline-none"
                aria-label="Sort dishes"
              >
                <option value="order">Sort: Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation Pills */}
      <div className="sticky top-[4.5rem] z-20 border-b border-wine-900/10 bg-ivory-50/95 backdrop-blur-md">
        <div className="container-x">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 py-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0 rounded-[2px] border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                selectedCategory === "all"
                  ? "border-wine-900 bg-wine-900 text-ivory-50 shadow-soft"
                  : "border-wine-900/20 bg-white text-wine-800 hover:bg-wine-900/5"
              )}
            >
              All Dishes ({initialProducts.length})
            </button>
            {initialCategories.map((c) => {
              const count = initialProducts.filter(
                (p) => p.category?.slug === c.slug || p.category_id === c.id
              ).length;
              const isSelected = selectedCategory === c.slug;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.slug)}
                  className={cn(
                    "shrink-0 rounded-[2px] border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                    isSelected
                      ? "border-wine-900 bg-wine-900 text-ivory-50 shadow-soft"
                      : "border-wine-900/20 bg-white text-wine-800 hover:bg-wine-900/5"
                  )}
                >
                  {c.name} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Product Catalogue Grid */}
      <div className="container-x mt-12">
        <div className="mb-6 flex items-center justify-between text-xs text-wine-800/70">
          <span>
            Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "dish" : "dishes"}
            {selectedCategory !== "all" && (
              <> in <em>{initialCategories.find((c) => c.slug === selectedCategory)?.name}</em></>
            )}
          </span>
          {(selectedCategory !== "all" || searchQuery || featuredOnly) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setFeaturedOnly(false);
              }}
              className="text-wine-700 underline underline-offset-4 hover:text-wine-950 font-medium"
            >
              Reset filters
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-[2px] border border-wine-900/10 bg-white p-14 text-center shadow-soft">
            <SlidersHorizontal className="mx-auto size-10 text-wine-600/40" />
            <h3 className="mt-4 font-serif text-2xl font-light text-wine-950">
              No matching dishes found
            </h3>
            <p className="mt-2 text-sm text-wine-800/70">
              Try adjusting your search keywords or switching category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setFeaturedOnly(false);
              }}
              className="mt-6 rounded bg-wine-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-wine-800"
            >
              View Full Menu
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 items-start gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p) => {
                const isJustAdded = addedSlug === p.slug;
                const hasVariants = p.variants && p.variants.length > 0;
                const hasAddons = p.addon_groups && p.addon_groups.length > 0;

                return (
                  <motion.article
                    key={p.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                    className="group flex flex-col overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  >
                    {/* Image Header with Detail Page Link */}
                    <Link
                      href={`/menu/${p.slug}`}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-wine-950 block focus-visible:outline-champagne-500"
                    >
                      <FoodImage
                        name={(p.slug || "shawarma") as ImageKey}
                        sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 95vw"
                        hoverZoom
                        className="object-cover"
                      />

                      {/* Top Badges */}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="eyebrow rounded bg-wine-950/85 px-2.5 py-1 text-[0.65rem] text-champagne-300 backdrop-blur-xs">
                          {p.category?.name || "Dish"}
                        </span>
                        <span className="rounded bg-emerald-950/85 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-300 backdrop-blur-xs">
                          {p.availability_status}
                        </span>
                      </div>

                      {/* Prep Time */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-wine-950/80 px-2.5 py-1 text-[0.65rem] text-ivory-100 backdrop-blur-xs">
                        <Clock className="size-3 text-champagne-400" />
                        <span>{p.min_prep_time_minutes}–{p.max_prep_time_minutes} mins</span>
                      </div>

                      {/* Hover Overlay Hint */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-wine-950/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-wine-950 shadow-soft">
                          <Eye className="size-3.5" /> View Details &amp; Customise
                        </span>
                      </div>
                    </Link>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <Link
                          href={`/menu/${p.slug}`}
                          className="font-serif text-2xl font-medium tracking-tight text-wine-950 hover:underline block leading-snug"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-2 text-sm leading-relaxed text-wine-800/80 line-clamp-2">
                          {p.short_description}
                        </p>

                        {(hasVariants || hasAddons) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-wine-700">
                            {hasVariants && (
                              <span className="rounded bg-ivory-100 px-2 py-0.5 font-medium">
                                {p.variants?.length} Portion Options
                              </span>
                            )}
                            {hasAddons && (
                              <span className="rounded bg-ivory-100 px-2 py-0.5 font-medium">
                                Optional Extras
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 flex items-center justify-between border-t border-wine-900/10 pt-4">
                        <div>
                          <span className="block font-serif text-xl font-bold tracking-tight text-wine-950">
                            {formatKobo(p.base_price_kobo)}
                          </span>
                          <span className="block text-[0.65rem] text-wine-700 uppercase tracking-widest">
                            {hasVariants ? "Starting from" : "Standard portion"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasVariants || hasAddons ? (
                            <Link
                              href={`/menu/${p.slug}`}
                              className="inline-flex items-center gap-1.5 rounded-[2px] border border-wine-900/30 bg-ivory-50 px-3.5 py-2 text-xs font-semibold text-wine-950 hover:bg-wine-900 hover:text-ivory-50 transition-colors"
                            >
                              <span>Configure</span>
                              <ArrowRight className="size-3.5" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(p)}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-[2px] px-3.5 py-2 text-xs font-semibold tracking-wide transition-all active:scale-95",
                                isJustAdded
                                  ? "bg-emerald-700 text-white"
                                  : "bg-wine-900 text-ivory-50 hover:bg-wine-800 hover:shadow-soft"
                              )}
                            >
                              {isJustAdded ? (
                                <>
                                  <Check className="size-3.5" /> Added!
                                </>
                              ) : (
                                <>
                                  <Plus className="size-3.5" /> Quick Add
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
