import { FoodImage } from "@/components/ui/food-image";
import { ImageReveal, Reveal } from "@/components/ui/reveal";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/config/site";

const pillars = [
  { n: "I", title: "Cooked with care", text: "Every dish is prepared with attention to seasoning, texture and temperature." },
  { n: "II", title: "Honest flavour", text: "Food that tastes like itself: bold where it should be, comforting where it matters." },
  { n: "III", title: "Made for moments", text: "Meals for a quiet lunch, a family table or a full house. Delivered or ready for pickup." },
];

export function Story() {
  return (
    <section id="about" className="relative overflow-hidden bg-wine-900 py-24 text-ivory-50 lg:py-40">
      <div className="container-x grid items-center gap-16 lg:grid-cols-12">
        <div className="relative lg:col-span-5">
          <ImageReveal className="arch aspect-[3/4] w-full max-w-md">
            <FoodImage name="small-chops" sizes="(min-width:1024px) 36vw, 90vw" className="object-[30%_50%]" />
          </ImageReveal>
          <Reveal delay={0.3} className="absolute -bottom-8 right-0 w-[48%] max-w-[15rem] border-[6px] border-wine-900 sm:right-8">
            <div className="relative aspect-square overflow-hidden">
              <FoodImage name="chinese-rice" sizes="240px" />
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7 lg:pl-10">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-champagne-400 before:h-px before:w-10 before:bg-current">
              About Empress Delicacies
            </p>
            <h2 className="mt-6 font-serif text-(length:--text-h1) font-light leading-[0.98] tracking-tight">
              Food that makes the table <em className="text-champagne-300">feel like an occasion.</em>
            </h2>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory-200/90">
              Empress Delicacies is built around one idea: delicious food, properly prepared, should be easy to enjoy.
              From shawarma and small chops to noodles, grills and seafood, we cook dishes people love and make them
              simple to order, whether you want them delivered or ready to collect.
            </p>
          </Reveal>

          <dl className="mt-14 grid gap-px bg-ivory-50/15 sm:grid-cols-3">
            {pillars.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.1} className="bg-wine-900 py-6 sm:px-5 sm:first:pl-0">
                <dt className="font-serif text-3xl italic text-champagne-400">{p.n}</dt>
                <dd className="mt-3">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-ivory-200/75">{p.text}</span>
                </dd>
              </Reveal>
            ))}
          </dl>

          <Reveal className="mt-12">
            <ButtonLink href={ROUTES.menu} variant="outline" size="lg">See what&apos;s on the menu</ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
