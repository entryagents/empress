"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Check,
  Star,
  X,
  Sparkles,
  ShoppingBag,
  ArrowUpDown,
  UtensilsCrossed,
} from "lucide-react";
import type { Category, Product } from "@/types/catalogue";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { ProductQuickView } from "@/components/menu/product-quick-view";
import { InstagramFoodCard } from "@/components/menu/instagram-food-card";
import { FeaturedDishHero } from "@/components/menu/featured-dish-hero";
import { CategoryDiscoveryTiles } from "@/components/menu/category-discovery-tiles";

interface MenuClientProps {
  initialCategories: Category[];
  initialProducts: Product[];
}

export function MenuClient({ initialCategories, initialProducts }: MenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"order" | "price_asc" | "price_desc" | "name">("order");
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

  // Quick view state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { addItem, totalCount, openCart } = useCart();

  const handleQuickAdd = (p: Product) => {
    addItem(p);
    setAddedSlug(p.slug);
    setTimeout(() => setAddedSlug(null), 1800);
  };

  const handleOpenQuickView = (p: Product) => {
    setQuickViewProduct(p);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  // Filtered & sorted products
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
        if (availabilityOnly && !p.is_available) {
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
          const matchIngredients = p.ingredients?.some((ing) => ing.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchFull && !matchCat && !matchIngredients) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.base_price_kobo - b.base_price_kobo;
        if (sortBy === "price_desc") return b.base_price_kobo - a.base_price_kobo;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return a.display_order - b.display_order;
      });
  }, [initialProducts, selectedCategory, searchQuery, availabilityOnly, featuredOnly, sortBy]);

  // Determine top featured dish for spotlight
  const spotlightDish = useMemo(() => {
    return (
      initialProducts.find((p) => p.is_featured && p.is_available) ||
      initialProducts[0] ||
      null
    );
  }, [initialProducts]);

  const activeCategoryObj = useMemo(() => {
    return initialCategories.find((c) => c.slug === selectedCategory);
  }, [initialCategories, selectedCategory]);

  return (
    <div className="min-h-screen bg-ivory-50 text-wine-900 pb-28 pt-24 sm:pt-28">
      {/* ── 1. EDITORIAL HEADER SECTION ── */}
      <section className="border-b border-wine-900/10 bg-ivory-100 py-10 sm:py-14">
        <div className="container-x">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="eyebrow flex items-center gap-2.5 text-champagne-500">
                <span className="h-px w-8 bg-current" />
                Visual Food Discovery
              </p>
              <h1 className="mt-3 font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-wine-950 leading-[1.08]">
                Culinary <em className="text-wine-700 italic font-normal">Showcase</em>
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-wine-800/80">
                Explore handcrafted shawarma, prime grills, authentic small chops, and specialty dishes.
                Tap any dish to inspect portions, extras, and kitchen preparation.
              </p>
            </div>

            {/* Quick Access to Order Bag */}
            {totalCount > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openCart}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-wine-900 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-soft hover:bg-wine-800 transition-all active:scale-95"
                >
                  <ShoppingBag className="size-4 text-champagne-400" />
                  <span>View Order Bag ({totalCount})</span>
                </button>
              </div>
            )}
          </div>

          {/* ── SEARCH & FILTER CONTROLS ── */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-wine-700/60" />
              <input
                type="text"
                placeholder="Search shawarma, small chops, tilapia, pork..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-wine-900/20 bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-wine-950 placeholder:text-wine-800/40 focus:border-champagne-500 focus:outline-none shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-wine-600 hover:text-wine-950 p-1"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filters & Sorting Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Featured toggle */}
              <button
                type="button"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-medium transition-all shadow-xs",
                  featuredOnly
                    ? "border-champagne-500 bg-champagne-500/15 text-wine-950 font-semibold ring-1 ring-champagne-500/30"
                    : "border-wine-900/20 bg-white text-wine-800 hover:border-wine-900/40"
                )}
              >
                <Star className="size-3 text-champagne-500" />
                <span>Featured</span>
              </button>

              {/* Ready to order toggle */}
              <button
                type="button"
                onClick={() => setAvailabilityOnly(!availabilityOnly)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-medium transition-all shadow-xs",
                  availabilityOnly
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600/30"
                    : "border-wine-900/20 bg-white text-wine-800 hover:border-wine-900/40"
                )}
              >
                <span className="size-1.5 rounded-full bg-emerald-600" />
                <span>Available Now</span>
              </button>

              {/* Sort selector */}
              <div className="relative inline-flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-lg border border-wine-900/20 bg-white py-2 pl-3 pr-8 font-medium text-wine-900 shadow-xs focus:border-champagne-500 focus:outline-none appearance-none cursor-pointer"
                  aria-label="Sort culinary catalogue"
                >
                  <option value="order">Recommended</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-wine-700/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. VISUAL CATEGORY TILES (Instagram Stories / Highlights Style) ── */}
      <section className="border-b border-wine-900/10 bg-ivory-50 py-6">
        <div className="container-x">
          <div className="flex items-center justify-between mb-3 text-xs text-wine-700 font-medium">
            <span className="uppercase tracking-wider font-semibold text-wine-950">
              Browse by Culinary Category
            </span>
            {selectedCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-wine-800 underline underline-offset-4 hover:text-wine-950"
              >
                Clear category filter
              </button>
            )}
          </div>

          <CategoryDiscoveryTiles
            categories={initialCategories}
            products={initialProducts}
            selectedCategory={selectedCategory}
            onSelectCategory={(slug) => setSelectedCategory(slug)}
          />
        </div>
      </section>

      {/* ── 3. FEATURED DISH HERO SPOTLIGHT (Shown when looking at all or default view) ── */}
      {spotlightDish && selectedCategory === "all" && !searchQuery && !featuredOnly && (
        <section className="container-x mt-10">
          <FeaturedDishHero
            product={spotlightDish}
            onQuickView={handleOpenQuickView}
            onQuickAdd={handleQuickAdd}
            isJustAdded={addedSlug === spotlightDish.slug}
          />
        </section>
      )}

      {/* ── 4. INSTAGRAM-INSPIRED FOOD DISCOVERY FEED ── */}
      <main className="container-x mt-12">
        {/* Feed Header & Results Count */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-wine-800/80">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-wine-950 text-sm">
              {activeCategoryObj ? activeCategoryObj.name : "All Culinary Delicacies"}
            </span>
            <span className="rounded-full bg-wine-900/10 px-2 py-0.5 text-[0.68rem] font-bold text-wine-900">
              {filteredProducts.length} {filteredProducts.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          {(selectedCategory !== "all" || searchQuery || featuredOnly || availabilityOnly) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setFeaturedOnly(false);
                setAvailabilityOnly(false);
              }}
              className="text-wine-800 underline underline-offset-4 hover:text-wine-950 font-medium"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-wine-900/10 bg-white p-12 text-center shadow-soft">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-ivory-100 text-wine-700">
              <UtensilsCrossed className="size-8 stroke-[1.5]" />
            </div>
            <h3 className="mt-4 font-serif text-2xl font-light text-wine-950">
              No matching delicacies found
            </h3>
            <p className="mt-2 text-sm text-wine-800/70 max-w-md mx-auto">
              We couldn&apos;t find dishes matching &ldquo;{searchQuery}&rdquo;. Try checking the spelling,
              exploring another category, or clearing your active filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setFeaturedOnly(false);
                setAvailabilityOnly(false);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-wine-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-wine-800 shadow-soft"
            >
              Explore Full Menu
            </button>
          </div>
        ) : (
          /* Multi-column Visual Discovery Grid (Instagram Explore Feed adapted for food) */
          <motion.div
            layout
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((p, idx) => {
                const isJustAdded = addedSlug === p.slug;

                return (
                  <motion.div
                    key={p.slug}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.2) }}
                  >
                    <InstagramFoodCard
                      product={p}
                      onQuickView={handleOpenQuickView}
                      onQuickAdd={handleQuickAdd}
                      isJustAdded={isJustAdded}
                      priority={idx < 4}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* ── 5. QUICK VIEW MODAL / MOBILE BOTTOM SHEET ── */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={handleCloseQuickView}
      />
    </div>
  );
}
