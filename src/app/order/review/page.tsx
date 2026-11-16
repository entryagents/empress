import { Suspense } from "react";
import { connection } from "next/server";
import { getOrderByReferenceAndToken } from "@/lib/order/service";
import { PostOrderFeedbackClient } from "./review-client";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const instant = false;


export const metadata = {
  title: "Review Your Order | Empress Delicacies",
  description: "Share your rating and food review for your recent Empress Delicacies order",
};

interface OrderReviewPageProps {
  searchParams: Promise<{
    ref?: string;
    token?: string;
  }>;
}

async function ReviewDataLoader({ searchParams }: OrderReviewPageProps) {
  await connection();
  const params = await searchParams;
  const ref = params.ref?.trim().toUpperCase();
  const token = params.token?.trim();

  if (!ref) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-wine-900/10 bg-white p-8 text-center shadow-xs">
        <AlertCircle className="mx-auto size-8 text-amber-600 mb-3" />
        <h2 className="font-serif text-lg font-bold text-wine-950">Order Reference Required</h2>
        <p className="mt-2 text-xs text-wine-800/80">
          Please access review submission from your order receipt or confirmation link.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const order = await getOrderByReferenceAndToken(ref, token, token);
  if (!order) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-wine-900/10 bg-white p-8 text-center shadow-xs">
        <AlertCircle className="mx-auto size-8 text-red-600 mb-3" />
        <h2 className="font-serif text-lg font-bold text-wine-950">Order Not Found</h2>
        <p className="mt-2 text-xs text-wine-800/80">
          Could not locate a verified order matching &ldquo;{ref}&rdquo;.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const items = (order.items || []).map((i) => ({
    product_id: i.product_id,
    product_name: i.product_name,
  }));

  return (
    <PostOrderFeedbackClient
      orderReference={order.order_reference}
      token={token}
      customerName={order.customer_name}
      items={items}
    />
  );
}

export default function OrderReviewPage({ searchParams }: OrderReviewPageProps) {
  return (
    <div className="min-h-screen bg-ivory-100/60 py-8">
      <Suspense
        fallback={
          <div className="py-20 text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-champagne-500 border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-wine-900">
              Loading Review Form...
            </p>
          </div>
        }
      >
        <ReviewDataLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}