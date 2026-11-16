"use client";

import React, { useState } from "react";
import { Star, MessageSquare, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitCustomerReviewAction, submitGeneralFeedbackAction } from "@/app/admin/reviews/actions";

interface PostOrderFeedbackClientProps {
  orderReference: string;
  token?: string;
  customerName?: string;
  items?: { product_id: string; product_name: string }[];
}

export function PostOrderFeedbackClient({
  orderReference,
  token,
  customerName,
  items = [],
}: PostOrderFeedbackClientProps) {
  const [activeTab, setActiveTab] = useState<"review" | "feedback">("review");

  // Review Form State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ success: boolean; message: string } | null>(null);

  // General Feedback Form State
  const [feedbackCategory, setFeedbackCategory] = useState<string>("overall");
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewResult(null);

    const formData = new FormData();
    formData.append("order_reference", orderReference);
    formData.append("access_token_or_phone", token || "");
    if (selectedProductId) formData.append("product_id", selectedProductId);
    formData.append("rating", String(rating));
    formData.append("review_text", reviewText);

    const res = await submitCustomerReviewAction(formData);
    setReviewSubmitting(false);

    if (res.success) {
      setReviewResult({
        success: true,
        message: "Thank you! Your review has been submitted to our moderation queue.",
      });
      setReviewText("");
    } else {
      setReviewResult({
        success: false,
        message: res.error || "Could not submit review.",
      });
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackResult(null);

    const formData = new FormData();
    formData.append("customer_name", customerName || "Valued Diner");
    formData.append("customer_email", feedbackEmail || "diner@example.ng");
    formData.append("order_reference", orderReference);
    formData.append("category", feedbackCategory);
    formData.append("rating", String(feedbackRating));
    formData.append("comments", feedbackComments);

    const res = await submitGeneralFeedbackAction(formData);
    setFeedbackSubmitting(false);

    if (res.success) {
      setFeedbackResult({
        success: true,
        message: "Thank you for your feedback! Our management team reviews all submissions.",
      });
      setFeedbackComments("");
    } else {
      setFeedbackResult({
        success: false,
        message: res.error || "Could not submit feedback.",
      });
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link
        href={`/order/confirmation?ref=${orderReference}${token ? `&token=${token}` : ""}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-900 hover:text-champagne-600 transition-colors mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to Order Receipt
      </Link>

      <div className="rounded-2xl border border-wine-900/10 bg-white p-6 shadow-sm space-y-6">
        <div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-champagne-600">
            Diner Satisfaction &bull; Order #{orderReference}
          </span>
          <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
            How was your Empress experience?
          </h1>
          <p className="mt-1 text-xs text-wine-800/80">
            Every review is moderated by our executive team. Share your candid impression.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-wine-900/10 pb-3">
          <button
            onClick={() => setActiveTab("review")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "review"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-ivory-100 text-wine-900 hover:bg-ivory-200"
            }`}
          >
            Review Dishes (Public)
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "feedback"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-ivory-100 text-wine-900 hover:bg-ivory-200"
            }`}
          >
            Private Service Feedback
          </button>
        </div>

        {/* TAB 1: PRODUCT REVIEW */}
        {activeTab === "review" && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {reviewResult && (
              <div
                className={`flex items-center gap-2 rounded-xl p-4 text-xs font-medium ${
                  reviewResult.success
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {reviewResult.success ? (
                  <CheckCircle className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{reviewResult.message}</span>
              </div>
            )}

            {items.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-wine-900">
                  Select Purchased Dish to Review
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                >
                  <option value="">Overall Order Experience</option>
                  {items.map((it) => (
                    <option key={it.product_id} value={it.product_id}>
                      {it.product_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-wine-900 mb-1.5">
                Rating (1 to 5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition hover:scale-110"
                  >
                    <Star
                      className={`size-6 ${
                        star <= rating
                          ? "text-champagne-500 fill-current"
                          : "text-gray-200 fill-current"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-serif text-sm font-bold text-wine-950">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-wine-900">
                Your Review
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                required
                rows={4}
                placeholder="Share your culinary experience, flavor profile, and delivery freshness..."
                className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting || reviewText.trim().length < 10}
              className="w-full rounded bg-wine-900 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 disabled:opacity-50"
            >
              {reviewSubmitting ? "Submitting..." : "Submit Review for Moderation"}
            </button>
          </form>
        )}

        {/* TAB 2: PRIVATE FEEDBACK */}
        {activeTab === "feedback" && (
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            {feedbackResult && (
              <div
                className={`flex items-center gap-2 rounded-xl p-4 text-xs font-medium ${
                  feedbackResult.success
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                <CheckCircle className="size-4 shrink-0" />
                <span>{feedbackResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-wine-900">Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                >
                  <option value="food_quality">Food Quality</option>
                  <option value="packaging">Packaging Standards</option>
                  <option value="delivery_experience">Delivery &amp; Logistics</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="overall">Overall Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-wine-900">Email Address</label>
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  required
                  placeholder="For management follow-up"
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-wine-900">Private Comments</label>
              <textarea
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                required
                rows={4}
                placeholder="Share private observations with our executive management team..."
                className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting || !feedbackComments.trim()}
              className="w-full rounded bg-wine-900 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 disabled:opacity-50"
            >
              {feedbackSubmitting ? "Sending..." : "Submit Confidential Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
