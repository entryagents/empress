import { Suspense } from "react";
import { connection } from "next/server";
import { getAdminReviews, getAdminCustomerFeedback } from "@/lib/reviews/service";
import { AdminReviewsClient } from "./reviews-client";

export const metadata = {
  title: "Review Moderation & Feedback | Empress Admin",
  description: "Moderation queue for customer reviews and private quality feedback",
};

async function ReviewsDataLoader() {
  await connection();
  const [reviews, feedback] = await Promise.all([
    getAdminReviews(),
    getAdminCustomerFeedback(),
  ]);

  return <AdminReviewsClient initialReviews={reviews} initialFeedback={feedback} />;
}

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
            Loading Customer Reviews Queue...
          </p>
        </div>
      }
    >
      <ReviewsDataLoader />
    </Suspense>
  );
}
