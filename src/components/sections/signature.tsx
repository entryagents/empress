"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Check, Clock, Sparkles } from "lucide-react";
import { categories, formatPrice, products, type CategoryId, type Product } from "@/data/catalogue";
import { FoodImage } from "@/components/ui/food-image";

import { SectionHeading } from "@/components/ui/section-heading";
import { useCart } from "@/lib/cart-context";
import { SEED_PRODUCTS } from "@/lib/catalogue/seed-data";
import { FILTER_EVENT } from "./categories";
import { cn } from "@/lib/utils";

type Filter = "all" | CategoryId;

export function Signature() {
  const [filter, setFilter] = useState<Filter>("all");
  const [addedSlug, setAddedSlug] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const on = (e: Event) => setFilter((e as CustomEvent<CategoryId>).detail);
    window.addEventListener(FILTER_EVENT, on);
    return () => window.removeEventListener(FILTER_EVENT, on);
  }, []);

  const handleAddToCart = (product: Product) => {
    const catProduct = SEED_PRODUCTS.find((p) => p.slug === product.slug);
    if (catProduct) {
      addItem(catProduct);
      setAddedSlug(product.slug);
      setTimeout(() => setAddedSlug(null), 1800);
    }
  };

  const list = filter === "all" ? products : products.filter((p) => p.category === filter);
  const nameOf = (id: CategoryId) => categories.find((c) => c.id === id)?.name ?? "";

  return (
    <section id="signature" className="bg-ivory-100 py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Signature Selection"
            title={
              <>
                Handcrafted flavours,{" "}
                <em className="text-wine-600">made fresh to order</em>
              </>
            }
          >
            Explore our curated culinary lineup. Every order is freshly prepared for rapid delivery or prompt customer collection.
          </SectionHeading>

          <div className="inline-flex items-center gap-2 rounded-full border border-wine-900/15 bg-white/70 px-4 py-1.5 text-xs text-wine-800 backdrop-blur-xs">
            <Sparkles className="size-3.5 text-champagne-500" />
            <span>Interactive Demo: Tap <strong>Add to Order</strong> to test the cart</span>
          </div>
        </div>

        {/* Filter pills */}
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-5 mt-12 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {[{ id: "all" as const, name: "All Dishes" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "shrink-0 rounded-[2px] border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                filter === c.id
                  ? "border-wine-900 bg-wine-900 text-ivory-50 shadow-soft"
                  : "border-wine-900/20 bg-transparent text-wine-800 hover:border-wine-900/50 hover:bg-wine-900/5",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <motion.ul
          layout
          className="mt-14 grid grid-cols-1 items-start gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10"
          aria-live="polite"
        >
          <AnimatePresence mode="popLayout">
            {list.map((p) => {
              const isJustAdded = addedSlug === p.slug;
              return (
                <motion.li
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex flex-col overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
                >
                  {/* Image container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-wine-950">
                    <FoodImage
                      name={p.image}
                      sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw"
                      hoverZoom
                      className="object-cover"
                    />

                    {/* Category & Availability tags */}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                      <span className="eyebrow rounded bg-wine-950/80 px-2.5 py-1 text-[0.65rem] text-champagne-300 backdrop-blur-xs">
                        {nameOf(p.category)}
                      </span>
                      <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-300 backdrop-blur-xs">
                        {p.availability}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-wine-950/80 px-2.5 py-1 text-[0.65rem] text-ivory-100 backdrop-blur-xs">
                      <Clock className="size-3 text-champagne-400" />
                      <span>{p.preparationTime}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-serif text-2xl font-medium tracking-tight text-wine-950">
                          {p.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-wine-800/80">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-wine-900/10 pt-4">
                      <div>
                        <span className="block font-serif text-xl font-semibold tracking-tight text-wine-950">
                          {formatPrice(p.price)}
                        </span>
                        <span className="block text-[0.65rem] text-wine-700 uppercase tracking-widest">
                          Initial Price Benchmark
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-[2px] px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-300 active:scale-95",
                          isJustAdded
                            ? "bg-emerald-700 text-white"
                            : "bg-wine-900 text-ivory-50 hover:bg-wine-800 hover:shadow-soft",
                        )}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="size-3.5" /> Added!
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5" /> Add to Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}
