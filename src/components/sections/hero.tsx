"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, Bike, Store } from "lucide-react";
import { ROUTES } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { FoodImage } from "@/components/ui/food-image";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 40 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, delay, ease },
  });

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-wine-900 text-ivory-50">
      {/* tonal depth: one restrained radial glow, no decorative clutter */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_40%,var(--color-wine-700),transparent_70%)] opacity-70"
      />
      <div className="container-x grid items-center gap-10 pb-20 pt-28 lg:min-h-dvh lg:grid-cols-12 lg:gap-6 lg:pb-20 lg:pt-32">
        {/* Typography column */}
        <div className="relative z-10 lg:col-span-7">
          <motion.p {...rise(0.15)} className="eyebrow flex items-center gap-3 text-champagne-400">
            <span className="h-px w-10 bg-current" /> Delivery &amp; Pickup
          </motion.p>

          <h1 id="hero-title" className="mt-6 font-serif font-light leading-[0.9] tracking-[-0.03em] text-(length:--text-display)">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.25, ease }}
              >
                Good Food.
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <motion.span
                className="block italic text-champagne-300"
                initial={reduce ? false : { y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.4, ease }}
              >
                Unforgettable
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <motion.span
                className="block"
                initial={reduce ? false : { y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.55, ease }}
              >
                Moments.
              </motion.span>
            </span>
          </h1>

          <motion.p {...rise(0.8)} className="mt-8 max-w-md text-base leading-relaxed text-ivory-200/90 sm:text-lg">
            From irresistible shawarma to freshly prepared meals, discover flavours worth coming back for.
          </motion.p>

          <motion.div {...rise(0.95)} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={ROUTES.menu} variant="gold" size="lg">
              Explore Our Menu
            </ButtonLink>
            <ButtonLink href={ROUTES.order} variant="outline" size="lg" className="text-ivory-50">
              Order Now
            </ButtonLink>
          </motion.div>

          <motion.ul
            {...rise(1.1)}
            className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ivory-200/80"
          >
            <li className="flex items-center gap-2"><Bike className="size-4 text-champagne-400" strokeWidth={1.6} /> Delivery</li>
            <li className="flex items-center gap-2"><Store className="size-4 text-champagne-400" strokeWidth={1.6} /> Pickup</li>
          </motion.ul>
        </div>

        {/* Image composition: arch + overlapping circle + framed inset */}
        <div className="relative mx-auto mt-4 w-full max-w-md lg:col-span-5 lg:mt-0 lg:max-w-none">
          <motion.div
            initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
            animate={{ clipPath: "inset(0% 0 0 0)" }}
            transition={{ duration: 1.5, delay: 0.3, ease }}
            className="arch relative ml-auto aspect-[4/5] w-[82%] overflow-hidden shadow-lift lg:w-[88%]"
          >
            <motion.div
              className="absolute inset-0"
              initial={reduce ? false : { scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 2, delay: 0.3, ease }}
            >
              <FoodImage name="shawarma" sizes="(min-width:1024px) 40vw, 80vw" priority className="object-[68%_50%]" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 1.0, ease }}
            className="absolute -bottom-6 left-0 aspect-square w-[42%] overflow-hidden rounded-full border-[6px] border-wine-900 shadow-lift"
          >
            <FoodImage name="stir-fried-noodles" sizes="(min-width:1024px) 18vw, 40vw" priority className="object-[40%_60%]" />
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.2, ease }}
            className="absolute right-0 top-[58%] hidden w-36 border border-champagne-400/50 bg-wine-950/80 p-4 backdrop-blur-sm sm:block"
          >
            <p className="eyebrow text-[0.6rem] text-champagne-400">Now serving</p>
            <p className="mt-1 font-serif text-lg leading-tight">Shawarma, small chops &amp; more</p>
          </motion.div>
        </div>
      </div>

      <a
        href="#categories"
        aria-label="Scroll to food categories"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-champagne-400 lg:block"
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="block"
        >
          <ArrowDown className="size-5" strokeWidth={1.5} />
        </motion.span>
      </a>
    </section>
  );
}
