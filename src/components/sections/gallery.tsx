"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, X, Sparkles } from "lucide-react";
import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { images, type ImageKey } from "@/config/images";
import { cn } from "@/lib/utils";

/**
 * Editorial bento layout with asymmetric spans and focal crops.
 * Structured so Empress Media Vault assets drop in directly.
 */
interface GalleryItem {
  id: string;
  img: ImageKey;
  title: string;
  category: string;
  cls: string;
  pos?: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: "g1",
    img: "philly-cheesesteak",
    title: "Philly Cheesesteak",
    category: "Specialties",
    cls: "col-span-2 row-span-2 sm:col-[1/6] sm:row-[1/3]",
  },
  {
    id: "g2",
    img: "chinese-rice",
    title: "Chinese Fried Rice",
    category: "Rice & Noodles",
    cls: "col-span-1 row-span-2 sm:col-[6/9] sm:row-[1/5]",
    pos: "object-[50%_45%]",
  },
  {
    id: "g3",
    img: "shawarma",
    title: "Chicken Shawarma Wrap",
    category: "Shawarma & Wraps",
    cls: "col-span-1 row-span-2 sm:col-[1/3] sm:row-[3/5]",
    pos: "object-[60%_50%]",
  },
  {
    id: "g4",
    img: "stir-fried-noodles",
    title: "Wok Stir-fried Noodles",
    category: "Rice & Noodles",
    cls: "col-span-2 row-span-1 sm:col-[3/6] sm:row-[3/5]",
    pos: "object-[50%_55%]",
  },
  {
    id: "g5",
    img: "turkey",
    title: "Slow-Roasted Turkey",
    category: "Grills & Proteins",
    cls: "col-span-1 row-span-1 sm:col-[1/4] sm:row-[5/7]",
  },
  {
    id: "g6",
    img: "corn-dogs",
    title: "Crispy Corn Dog",
    category: "Specialties",
    cls: "col-span-1 row-span-1 sm:col-[4/6] sm:row-[5/7]",
  },
  {
    id: "g7",
    img: "tilapia-fish",
    title: "Charcoal Grilled Tilapia",
    category: "Seafood",
    cls: "col-span-2 row-span-2 sm:col-[6/9] sm:row-[5/7]",
  },
];

export function Gallery() {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  return (
    <section id="gallery" className="bg-ivory-50 py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Food Gallery"
            title={
              <>
                A feast for <em className="text-wine-600">the senses</em>
              </>
            }
          >
            A visual showcase of texture, color and craft across our menu. Click any dish to view in full resolution.
          </SectionHeading>

          <span className="inline-flex items-center gap-1.5 text-xs text-wine-700">
            <Sparkles className="size-3.5 text-champagne-500" />
            Media Vault Active
          </span>
        </div>

        {/* Bento Grid */}
        <div className="mt-14 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[6.5rem] sm:grid-cols-8 lg:auto-rows-[8.5rem] lg:gap-4">
          {galleryItems.map((t, i) => (
            <ImageReveal
              key={t.id}
              delay={(i % 3) * 0.08}
              className={cn("group relative cursor-pointer overflow-hidden rounded-[2px] bg-wine-950", t.cls)}
            >
              <button
                type="button"
                onClick={() => setSelected(t)}
                className="absolute inset-0 z-20 size-full text-left focus-visible:outline-champagne-400"
                aria-label={`View ${t.title} photograph`}
              >
                <span className="sr-only">Enlarge {t.title}</span>
              </button>

              <FoodImage
                name={t.img}
                sizes="(min-width:1024px) 38vw, (min-width:640px) 50vw, 50vw"
                hoverZoom
                className={t.pos}
              />

              {/* Hover overlay */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-wine-950/85 via-wine-950/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="eyebrow text-[0.65rem] text-champagne-300">
                      {t.category}
                    </span>
                    <h4 className="font-serif text-lg font-medium text-ivory-50">
                      {t.title}
                    </h4>
                  </div>
                  <div className="grid size-8 place-items-center rounded-full bg-white/20 text-ivory-50 backdrop-blur-xs">
                    <Maximize2 className="size-4" />
                  </div>
                </div>
              </div>
            </ImageReveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-wine-900/10 pt-4 text-xs text-wine-800/70 sm:flex-row sm:items-center">
            <p>
              Authentic food photography sourced under creative licenses. Zero AI-generated images.
            </p>
            <Link
              href="/credits"
              className="font-medium text-wine-900 underline underline-offset-4 hover:text-wine-700"
            >
              View image registry &amp; licensing credits
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-wine-950/90 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2px] bg-wine-950 text-ivory-50 shadow-lift"
            >
              <div className="relative aspect-[16/10] w-full bg-black">
                <FoodImage
                  name={selected.img}
                  sizes="(min-width:1024px) 70vw, 95vw"
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close preview"
                  className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-wine-900/80 text-ivory-50 backdrop-blur-sm transition-colors hover:bg-wine-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                <div>
                  <span className="eyebrow text-champagne-400">{selected.category}</span>
                  <h3 className="font-serif text-2xl font-medium">{selected.title}</h3>
                  <p className="mt-1 text-xs text-ivory-200/70">
                    {images[selected.img].credit.author} · {images[selected.img].credit.license} · Wikimedia Commons
                  </p>
                </div>
                <Link
                  href="/#signature"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center justify-center rounded-[2px] bg-champagne-400 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-wine-950 hover:bg-champagne-300"
                >
                  Order This Dish
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
