import { Star, Quote, CornerDownRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicReviews } from "@/lib/reviews/service";

export async function Reviews() {
  const publicData = await getPublicReviews();
  const reviewsList = publicData.approvedReviews;

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
            Verified dining impressions from completed deliveries and collections in Delta State.
          </SectionHeading>

          {/* Real stats badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-champagne-500/30 bg-champagne-500/10 px-4 py-1.5 text-xs text-wine-950 font-medium">
            <div className="flex items-center gap-0.5 text-champagne-600">
              <Star className="size-3.5 fill-current" />
            </div>
            <span>
              {publicData.averageRating} / 5.0 Rating ({publicData.totalReviews} Verified Review{publicData.totalReviews === 1 ? "" : "s"})
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="mt-14">
          {reviewsList.length === 0 ? (
            <div className="rounded-xl border border-wine-900/10 bg-white/70 p-12 text-center text-xs text-wine-800/70">
              Verified customer reviews will appear here once submitted and moderated by our culinary team.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {reviewsList.map((r, i) => (
                <Reveal key={r.id} delay={i * 0.12}>
                  <article className="flex h-full flex-col justify-between rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-1 text-champagne-500"
                          aria-label={`${r.rating} out of 5 stars`}
                        >
                          {Array.from({ length: r.rating }).map((_, n) => (
                            <Star key={n} className="size-4 fill-current text-champagne-400" />
                          ))}
                        </div>
                        <Quote className="size-6 text-wine-900/15" />
                      </div>

                      <p className="mt-6 font-serif text-lg leading-relaxed text-wine-950 italic">
                        &ldquo;{r.review_text}&rdquo;
                      </p>
                    </div>

                    <div className="mt-8 border-t border-wine-900/10 pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif text-base font-medium text-wine-950">
                          {r.customer_name}
                        </h4>
                        <span className="text-[0.65rem] font-medium text-wine-700/60 font-mono">
                          {new Date(r.created_at).toLocaleDateString("en-GB", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {r.product_name && (
                        <p className="text-[0.7rem] text-champagne-700 font-medium">
                          Dish: {r.product_name}
                        </p>
                      )}

                      {r.admin_response && (
                        <div className="mt-3 rounded bg-ivory-50 p-2.5 text-[0.7rem] text-wine-900 border border-wine-900/10 flex items-start gap-1.5">
                          <CornerDownRight className="size-3.5 shrink-0 text-champagne-600 mt-0.5" />
                          <div>
                            <span className="font-semibold block">Empress Concierge:</span>
                            <span>{r.admin_response}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
