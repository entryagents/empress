import { Star, Quote, Info } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

interface Review {
  id: string;
  name: string;
  location: string;
  occasion: string;
  dish: string;
  quote: string;
  rating: number;
}

const demoReviews: Review[] = [
  {
    id: "r1",
    name: "Amina B.",
    location: "Victoria Island, Lagos",
    occasion: "Office Team Lunch",
    dish: "Classic Chicken Shawarma & Stir-fried Noodles",
    quote: "The shawarma had the perfect balance of spice and garlic whip, with crisp vegetables and meat seasoned all the way through. The order arrived hot, packed with remarkable care.",
    rating: 5,
  },
  {
    id: "r2",
    name: "Emeka O.",
    location: "Lekki Phase 1",
    occasion: "Weekend Family Platter",
    dish: "Deluxe Small Chops & Grilled Tilapia",
    quote: "The puff-puff was golden and airy, and the grilled tilapia had that deep charcoal aroma you only get from true grillmasters. Everyone at the table asked where the food came from.",
    rating: 5,
  },
  {
    id: "r3",
    name: "Tolani A.",
    location: "Ikoyi, Lagos",
    occasion: "Late Evening Pickup",
    dish: "Classic Philly Cheesesteak",
    quote: "Finding an authentic Philly cheesesteak with juicy shaved ribeye and melted provolone in town is rare. Ordering for pickup was seamless — ready right as I pulled up.",
    rating: 5,
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="bg-ivory-100 py-24 lg:py-36">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Customer Reviews"
            title={
              <>
                Words shared around <em className="text-wine-600">our table</em>
              </>
            }
          >
            What early tasters and tasting panels say about our food preparation, presentation and delivery standards.
          </SectionHeading>

          {/* Transparent demo badge as requested */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-900">
            <Info className="size-3.5 shrink-0 text-amber-700" />
            <span>Sample Demonstration Content (Pre-Launch Tasting Panel)</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {demoReviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.12}>
              <article className="flex h-full flex-col justify-between rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-champagne-500" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: r.rating }).map((_, n) => (
                        <Star key={n} className="size-4 fill-current text-champagne-400" />
                      ))}
                    </div>
                    <Quote className="size-6 text-wine-900/15" />
                  </div>

                  <p className="mt-6 font-serif text-lg leading-relaxed text-wine-950 italic">
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-8 border-t border-wine-900/10 pt-4">
                  <h4 className="font-serif text-base font-medium text-wine-950">
                    {r.name}
                  </h4>
                  <p className="text-xs text-wine-800/70">{r.location}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem] text-wine-700">
                    <span className="rounded bg-ivory-200/80 px-2 py-0.5 font-medium">
                      {r.occasion}
                    </span>
                    <span className="italic opacity-80">Ordered: {r.dish}</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
