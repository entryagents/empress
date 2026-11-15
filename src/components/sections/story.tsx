import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/config/site";
import { Flame, ShieldCheck, HeartHandshake } from "lucide-react";

const pillars = [
  {
    icon: Flame,
    roman: "I",
    title: "High-Heat & Slow Roast Precision",
    text: "From blistering wok fire for our stir-fried noodles to measured charcoal grilling for whole tilapia, every cooking method is chosen to preserve moisture, enhance natural char, and develop complex layers of flavour.",
  },
  {
    icon: ShieldCheck,
    roman: "II",
    title: "Uncompromising Ingredient Sourcing",
    text: "We source farm-fresh poultry, premium center-cut meats, fresh seafood, and aromatic herbs daily. No shortcuts, no reheated pre-batches, and no synthetic fillers.",
  },
  {
    icon: HeartHandshake,
    roman: "III",
    title: "Designed for Warm Hospitality",
    text: "Food is meant to bring people together. Whether you order a quick lunch delivered to your desk or a grand party spread of small chops and grills for your family, each dish is packaged with warmth and pride.",
  },
];

export function Story() {
  return (
    <section id="experience" className="relative overflow-hidden bg-wine-900 py-24 text-ivory-50 lg:py-36">
      {/* Decorative background radial subtle warmth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/4 h-[35rem] w-[35rem] rounded-full bg-wine-700/20 blur-3xl"
      />

      <div className="container-x grid items-center gap-16 lg:grid-cols-12">
        {/* Editorial composition */}
        <div className="relative lg:col-span-5">
          <ImageReveal className="arch aspect-[3/4] w-full max-w-md shadow-lift border border-ivory-50/10">
            <FoodImage
              name="small-chops"
              sizes="(min-width:1024px) 36vw, 90vw"
              className="object-cover"
            />
          </ImageReveal>

          <Reveal
            delay={0.25}
            className="absolute -bottom-8 right-0 w-[52%] max-w-[16rem] border-4 border-wine-900 shadow-lift sm:right-6"
          >
            <div className="relative aspect-square overflow-hidden bg-wine-950">
              <FoodImage name="chinese-rice" sizes="240px" className="object-cover" />
            </div>
          </Reveal>
        </div>

        {/* Narrative */}
        <div className="lg:col-span-7 lg:pl-8">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-champagne-400 before:h-px before:w-10 before:bg-current">
              The Empress Experience
            </p>
            <h2 className="mt-6 font-serif text-(length:--text-h1) font-light leading-[0.98] tracking-tight">
              Culinary mastery, rooted in passion and{" "}
              <em className="text-champagne-300">honest flavor.</em>
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory-200/90 font-light">
              Empress Delicacies was created to bridge authentic kitchen craft with effortless ordering. We believe that whether you are sharing a platter of golden small chops, unwrapping a seasoned shawarma, or sitting down to smoky grilled tilapia, the food should feel like a true celebration of taste.
            </p>
          </Reveal>

          {/* Pillars */}
          <div className="mt-14 space-y-6">
            {pillars.map((p, i) => (
              <Reveal
                key={p.roman}
                delay={i * 0.1}
                className="flex flex-col gap-4 border-t border-ivory-50/15 pt-6 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-3xl italic text-champagne-400 sm:w-10">
                    {p.roman}
                  </span>
                  <p.icon className="size-5 text-champagne-400 sm:hidden" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-ivory-100">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory-200/75 max-w-xl">
                    {p.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 flex flex-wrap gap-4">
            <ButtonLink href={ROUTES.menu} variant="gold" size="lg">
              Explore The Menu
            </ButtonLink>
            <ButtonLink href={ROUTES.delivery} variant="outline" size="lg">
              How Ordering Works
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
