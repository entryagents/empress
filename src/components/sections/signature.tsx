"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { categories, formatPrice, products, type CategoryId } from "@/data/catalogue";
import { ROUTES } from "@/config/site";
import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { FILTER_EVENT } from "./categories";
import { cn } from "@/lib/utils";

/** Varied crops give the grid an editorial rhythm instead of uniform cards. */
const ratios = ["aspect-[4/5]", "aspect-[4/3]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"];

type Filter = "all" | CategoryId;

export function Signature() {
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const on = (e: Event) => setFilter((e as CustomEvent<CategoryId>).detail);
    window.addEventListener(FILTER_EVENT, on);
    return () => window.removeEventListener(FILTER_EVENT, on);
  }, []);

  const list = filter === "all" ? products : products.filter((p) => p.category === filter);
  const nameOf = (id: CategoryId) => categories.find((c) => c.id === id)!.name;

  return (
    <section id="signature" className="bg-ivory-100 py-24 lg:py-36">
      <div className="container-x">
        <SectionHeading eyebrow="Signature Selection" title={<>Ten dishes, <em className="text-wine-600">made to be shared</em></>}>
          Our opening menu. Prices are shown once confirmed, and online ordering opens in the next release.
        </SectionHeading>

        <div role="group" aria-label="Filter by category" className="-mx-5 mt-12 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ id: "all" as const, name: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "shrink-0 border px-4 py-2 text-sm font-medium transition-colors duration-300",
                filter === c.id
                  ? "border-wine-800 bg-wine-800 text-ivory-50"
                  : "border-wine-900/25 hover:border-wine-800",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        <motion.ul layout className="mt-12 grid grid-cols-1 items-start gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12" aria-live="polite">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <motion.li
                key={p.slug}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group lg:nth-[3n+2]:mt-20"
              >
                <ImageReveal className={cn("relative bg-wine-900", ratios[i % ratios.length], i % 5 === 0 && "arch")}>
                  <FoodImage name={p.image} sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw" hoverZoom />
                  <span className="absolute bottom-3 left-3 bg-wine-950/70 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-widest text-ivory-100">
                    Illustrative image
                  </span>
                </ImageReveal>
                <Reveal className="mt-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="eyebrow text-champagne-500">{nameOf(p.category)}</span>
                    <span className="font-serif text-sm italic text-wine-700">{formatPrice(p.price)}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-3xl leading-tight tracking-tight">{p.name}</h3>
                  <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed opacity-75">{p.description}</p>
                  <Link
                    href={ROUTES.order}
                    className="mt-4 inline-flex items-center gap-1.5 border-b border-wine-800 pb-0.5 text-sm font-semibold transition-colors hover:text-wine-600"
                  >
                    Order {p.name} <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Reveal>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </section>
  );
}
