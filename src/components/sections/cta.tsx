import { ROUTES } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-wine-950 text-ivory-50">
      <div className="container-x grid items-center gap-12 py-24 lg:grid-cols-12 lg:py-36">
        <Reveal className="lg:col-span-7">
          <p className="eyebrow text-champagne-400">Hungry?</p>
          <h2 className="mt-6 font-serif text-(length:--text-h1) font-light leading-[0.95] tracking-tight">
            Your Next Favourite Meal <em className="text-champagne-300">Is Waiting.</em>
          </h2>
          <p className="mt-6 max-w-md text-lg text-ivory-200/85">Delivered to your door or ready for pickup.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={ROUTES.order} variant="gold" size="lg">Order Now</ButtonLink>
            <ButtonLink href={ROUTES.menu} variant="outline" size="lg">Browse the menu</ButtonLink>
          </div>
        </Reveal>
        <div className="relative mx-auto h-72 w-full max-w-md lg:col-span-5 lg:h-[26rem]">
          <ImageReveal className="arch absolute inset-y-0 right-0 w-3/5">
            <FoodImage name="philly-cheesesteak" sizes="30vw" className="object-[40%_50%]" />
          </ImageReveal>
          <ImageReveal delay={0.2} className="absolute bottom-0 left-0 aspect-square w-1/2 rounded-full border-[6px] border-wine-950">
            <FoodImage name="corn-dogs" sizes="20vw" />
          </ImageReveal>
        </div>
      </div>
    </section>
  );
}
