import { ROUTES } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";
import { ArrowRight, Bike, Store } from "lucide-react";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-wine-950 text-ivory-50">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-wine-700),transparent_80%)] opacity-60"
      />

      <div className="container-x relative z-10 grid items-center gap-14 py-24 lg:grid-cols-12 lg:py-36">
        <Reveal className="lg:col-span-7">
          <p className="eyebrow flex items-center gap-3 text-champagne-400 before:h-px before:w-10 before:bg-current">
            Ready to Feast?
          </p>
          <h2 className="mt-6 font-serif text-(length:--text-h1) font-light leading-[0.95] tracking-tight">
            Your Next Favourite Meal{" "}
            <em className="text-champagne-300">Is Waiting.</em>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory-200/90 font-light">
            Order for speedy direct delivery to your door or schedule an effortless pickup at your convenience. Freshly prepared, securely packaged, and bursting with genuine flavour.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={ROUTES.order} variant="gold" size="lg">
              Order Now <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href={ROUTES.menu} variant="outline" size="lg">
              Explore Our Full Menu
            </ButtonLink>
          </div>

          <div className="mt-10 flex items-center gap-8 text-xs text-ivory-200/70">
            <span className="flex items-center gap-2">
              <Bike className="size-4 text-champagne-400" /> Fast Citywide Delivery
            </span>
            <span className="flex items-center gap-2">
              <Store className="size-4 text-champagne-400" /> Express Counter Pickup
            </span>
          </div>
        </Reveal>

        {/* Live food photo composition */}
        <div className="relative mx-auto h-80 w-full max-w-md lg:col-span-5 lg:h-[30rem]">
          <ImageReveal className="arch absolute inset-y-0 right-0 w-3/5 overflow-hidden shadow-lift border border-ivory-50/10 bg-wine-900">
            <FoodImage
              name="philly-cheesesteak"
              sizes="35vw"
              className="object-cover"
            />
          </ImageReveal>

          <ImageReveal
            delay={0.2}
            className="absolute bottom-2 left-0 aspect-square w-1/2 overflow-hidden rounded-full border-4 border-wine-950 shadow-lift bg-wine-900"
          >
            <FoodImage name="corn-dogs" sizes="25vw" className="object-cover" />
          </ImageReveal>
        </div>
      </div>
    </section>
  );
}
