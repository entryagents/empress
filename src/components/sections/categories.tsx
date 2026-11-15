"use client";

import { useState } from "react";

import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

export const FILTER_EVENT = "empress:filter";

export function Categories() {
  const [active, setActive] = useState(0);

  const choose = (id: string) => {
    window.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: id }));
    const el = document.getElementById("signature");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="categories" className="bg-ivory-50 py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Discover Our Menu"
            title={
              <>
                Six curated culinary paths,{" "}
                <em className="text-wine-600">one standard of excellence</em>
              </>
            }
          >
            Explore each category below to filter our initial selection. Click any category to jump directly to its freshly prepared dishes.
          </SectionHeading>
        </div>

        {/* Desktop accordion + mobile responsive cards */}
        <div className="mt-14 flex flex-col gap-3 lg:h-[34rem] lg:flex-row">
          {categories.map((c, i) => {
            const on = active === i;
            return (
              <div
                key={c.id}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "group relative overflow-hidden bg-wine-900 text-ivory-50 transition-[flex-grow,height] duration-700 ease-empress",
                  "lg:h-full lg:flex-1 lg:basis-0 rounded-[2px]",
                  on ? "h-80 lg:flex-[3.2]" : "h-24 lg:flex-1",
                )}
              >
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={`cat-${c.id}`}
                  onClick={() => {
                    setActive(i);
                    choose(c.id);
                  }}
                  onFocus={() => setActive(i)}
                  className="absolute inset-0 z-20 w-full text-left cursor-pointer"
                >
                  <span className="sr-only">Select {c.name} category</span>
                </button>

                <FoodImage
                  name={c.image}
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className={cn(
                    "transition-[transform,opacity] duration-[1200ms] ease-empress object-cover",
                    on ? "scale-100 opacity-90" : "scale-110 opacity-40",
                  )}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-wine-950/95 via-wine-950/40 to-wine-950/20"
                />

                <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-between gap-4 p-6 lg:p-7">
                  <div className="min-w-0">
                    <span className="eyebrow text-champagne-400">0{i + 1}</span>
                    <h3
                      className={cn(
                        "font-serif leading-none tracking-tight transition-all duration-700 ease-empress",
                        on
                          ? "mt-2 text-3xl lg:text-4xl text-ivory-50 font-medium"
                          : "mt-1 text-xl lg:text-xl lg:[writing-mode:vertical-rl] lg:rotate-180 text-ivory-200",
                      )}
                    >
                      {c.name}
                    </h3>
                    <div
                      id={`cat-${c.id}`}
                      className={cn(
                        "grid transition-all duration-700 ease-empress",
                        on ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <p className="overflow-hidden text-sm leading-relaxed text-ivory-200/90 max-w-sm">
                        {c.blurb}
                      </p>
                    </div>
                  </div>

                  {on && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        choose(c.id);
                      }}
                      aria-label={`View ${c.name} dishes`}
                      className="pointer-events-auto relative z-30 grid size-12 shrink-0 place-items-center rounded-full bg-champagne-400 text-wine-950 transition-transform hover:scale-110 hover:bg-champagne-300 shadow-soft"
                    >
                      <ArrowUpRight className="size-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
