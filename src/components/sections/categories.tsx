"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/catalogue";
import { FoodImage } from "@/components/ui/food-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

export const FILTER_EVENT = "empress:filter";

export function Categories() {
  const [active, setActive] = useState(0);

  const choose = (id: string) =>
    window.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: id }));

  return (
    <section id="categories" className="bg-ivory-50 py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="The Menu" title={<>Six ways to <em className="text-wine-600">eat well</em></>}>
            Pick a category to explore. Hover, focus or tap to open each one.
          </SectionHeading>
        </div>

        <div className="mt-14 flex flex-col gap-3 lg:h-[34rem] lg:flex-row">
          {categories.map((c, i) => {
            const on = active === i;
            return (
              <div
                key={c.id}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "group relative overflow-hidden bg-wine-900 text-ivory-50 transition-[flex-grow,height] duration-700 ease-empress",
                  "lg:h-full lg:flex-1 lg:basis-0",
                  on ? "h-80 lg:flex-[3.2]" : "h-24 lg:flex-1",
                )}
              >
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={`cat-${c.id}`}
                  onClick={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="absolute inset-0 z-20 w-full text-left"
                >
                  <span className="sr-only">{c.name}</span>
                </button>

                <FoodImage
                  name={c.image}
                  sizes="(min-width:1024px) 40vw, 100vw"
                  className={cn(
                    "transition-[transform,opacity] duration-[1200ms] ease-empress",
                    on ? "scale-100 opacity-100" : "scale-110 opacity-45",
                  )}
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wine-950/90 via-wine-950/20 to-wine-950/30" />

                <div className="pointer-events-none absolute inset-0 z-10 flex items-end justify-between gap-4 p-5 lg:p-7">
                  <div className="min-w-0">
                    <span className="eyebrow text-champagne-400">0{i + 1}</span>
                    <h3
                      className={cn(
                        "font-serif leading-none tracking-tight transition-all duration-700 ease-empress",
                        on ? "mt-2 text-3xl lg:text-4xl" : "mt-1 text-xl lg:text-xl lg:[writing-mode:vertical-rl] lg:rotate-180",
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
                      <p className="overflow-hidden text-sm leading-relaxed text-ivory-200">{c.blurb}</p>
                    </div>
                  </div>
                  {on && (
                    <Link
                      href="/#signature"
                      onClick={() => choose(c.id)}
                      aria-label={`See ${c.name} in the menu`}
                      className="pointer-events-auto relative z-30 grid size-12 shrink-0 place-items-center rounded-full bg-champagne-400 text-wine-950 transition-transform hover:scale-110"
                    >
                      <ArrowUpRight className="size-5" />
                    </Link>
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
