"use client";

import React, { useState } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  CornerDownRight,
} from "lucide-react";
import type { CustomerReview, CustomerFeedback, ReviewStatus } from "@/types/reviews";
import { moderateReviewAction } from "./actions";

interface AdminReviewsClientProps {
  initialReviews: CustomerReview[];
  initialFeedback: CustomerFeedback[];
}

export function AdminReviewsClient({
  initialReviews,
  initialFeedback,
}: AdminReviewsClientProps) {
  const [activeTab, setActiveTab] = useState<"reviews" | "feedback">("reviews");
  const [reviews, setReviews] = useState<CustomerReview[]>(initialReviews);
  const [feedback] = useState<CustomerFeedback[]>(initialFeedback);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Moderation state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [responseModal, setResponseModal] = useState<CustomerReview | null>(null);
  const [responseText, setResponseText] = useState("");

  const handleModerate = async (reviewId: string, status: ReviewStatus, reason?: string) => {
    setActionLoadingId(reviewId);
    const res = await moderateReviewAction({ reviewId, status, rejectionReason: reason });
    setActionLoadingId(null);

    if (res.success) {
      setReviews(
        reviews.map((r) =>
          r.id === reviewId ? { ...r, status, rejection_reason: reason || r.rejection_reason } : r
        )
      );
    }
  };

  const handleSaveResponse = async () => {
    if (!responseModal || !responseText.trim()) return;
    setActionLoadingId(responseModal.id);
    const res = await moderateReviewAction({
      reviewId: responseModal.id,
      status: responseModal.status,
      adminResponse: responseText.trim(),
    });
    setActionLoadingId(null);

    if (res.success) {
      setReviews(
        reviews.map((r) =>
          r.id === responseModal.id ? { ...r, admin_response: responseText.trim() } : r
        )
      );
      setResponseModal(null);
      setResponseText("");
    }
  };

  const filteredReviews = reviews.filter((r) =>
    statusFilter === "all" ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-champagne-600">
            Reputation &amp; Diner Trust
          </span>
          <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
            Customer Reviews &amp; Moderation
          </h1>
          <p className="mt-1 text-xs text-wine-800/80">
            Review real customer feedback from completed orders. Only approved reviews appear publicly.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "reviews"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-white text-wine-900 border border-wine-900/10 hover:bg-ivory-100"
            }`}
          >
            Product Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "feedback"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-white text-wine-900 border border-wine-900/10 hover:bg-ivory-100"
            }`}
          >
            Private Feedback ({feedback.length})
          </button>
        </div>
      </div>

      {activeTab === "reviews" ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between rounded-xl border border-wine-900/10 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-wine-700">
              <Filter className="size-3.5" />
              <span>Status Filter:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["all", "pending", "approved", "rejected", "hidden"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                    statusFilter === st
                      ? "bg-wine-900 text-ivory-50"
                      : "bg-ivory-100 text-wine-900 hover:bg-ivory-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          {filteredReviews.length === 0 ? (
            <div className="rounded-xl border border-wine-900/10 bg-white p-12 text-center text-xs text-wine-700/60">
              No customer reviews found matching filter criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-wine-950 text-sm">{rev.customer_name}</span>
                        <span className="text-xs text-wine-700 font-mono">
                          (Order #{rev.order_reference})
                        </span>
                        {rev.product_name && (
                          <span className="rounded bg-champagne-400/20 px-2 py-0.5 text-[0.65rem] font-semibold text-wine-900">
                            Dish: {rev.product_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < rev.rating
                                ? "text-champagne-500 fill-current"
                                : "text-gray-200 fill-current"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-[0.7rem] text-wine-700 font-medium">
                          {new Date(rev.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider self-start sm:self-auto ${
                        rev.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : rev.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : rev.status === "hidden"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-amber-100 text-amber-800 animate-pulse"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  <p className="text-xs text-wine-900 leading-relaxed italic">
                    &ldquo;{rev.review_text}&rdquo;
                  </p>

                  {/* Public Admin Response preview if present */}
                  {rev.admin_response && (
                    <div className="flex items-start gap-2 rounded-lg bg-ivory-50 p-3 border border-wine-900/10 text-xs text-wine-900">
                      <CornerDownRight className="size-4 shrink-0 text-champagne-600 mt-0.5" />
                      <div>
                        <span className="font-bold text-[0.7rem] uppercase text-wine-950 block">
                          Official Empress Delicacies Response:
                        </span>
                        <p className="mt-0.5 text-xs text-wine-800">{rev.admin_response}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-wine-900/10">
                    <button
                      onClick={() => {
                        setResponseModal(rev);
                        setResponseText(rev.admin_response || "");
                      }}
                      className="rounded border border-wine-900/20 px-3 py-1.5 text-xs font-medium text-wine-900 hover:bg-ivory-100"
                    >
                      {rev.admin_response ? "Edit Response" : "Public Response"}
                    </button>

                    {rev.status !== "approved" && (
                      <button
                        onClick={() => handleModerate(rev.id, "approved")}
                        disabled={actionLoadingId === rev.id}
                        className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}

                    {rev.status !== "rejected" && (
                      <button
                        onClick={() => {
                          const reason = prompt("Enter rejection reason (spam, offensive, etc.):");
                          if (reason) handleModerate(rev.id, "rejected", reason);
                        }}
                        disabled={actionLoadingId === rev.id}
                        className="rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}

                    {rev.status === "approved" && (
                      <button
                        onClick={() => handleModerate(rev.id, "hidden")}
                        disabled={actionLoadingId === rev.id}
                        className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: PRIVATE CUSTOMER FEEDBACK */
        <div className="space-y-4">
          <div className="rounded-xl border border-wine-900/10 bg-white p-4 shadow-xs">
            <h2 className="font-serif text-base font-semibold text-wine-950">
              Private Customer Feedback Inbox
            </h2>
            <p className="text-xs text-wine-800/80">
              Direct feedback regarding food quality, packaging, and logistics. Not published publicly.
            </p>
          </div>

          {feedback.length === 0 ? (
            <div className="rounded-xl border border-wine-900/10 bg-white p-12 text-center text-xs text-wine-700/60">
              No private feedback entries submitted.
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-wine-950">{fb.customer_name}</span>
                      <span className="text-[0.7rem] text-wine-700 ml-2">({fb.customer_email})</span>
                      {fb.order_reference && (
                        <span className="text-[0.7rem] text-wine-900 font-mono ml-2">
                          #{fb.order_reference}
                        </span>
                      )}
                    </div>
                    <span className="rounded bg-champagne-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-wine-900">
                      {fb.category.replace("_", " ")} &bull; {fb.rating}/5 Stars
                    </span>
                  </div>

                  <p className="text-xs text-wine-900 bg-ivory-50/70 p-3 rounded border border-wine-900/10">
                    {fb.comments}
                  </p>

                  <div className="text-[0.7rem] text-wine-700/70 text-right">
                    Received: {new Date(fb.created_at).toLocaleString("en-GB")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Response Modal */}
      {responseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-wine-950">
              Official Response to {responseModal.customer_name}
            </h3>
            <p className="mt-1 text-xs text-wine-800/80">
              This response will appear publicly alongside the approved customer review.
            </p>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="e.g. Thank you for your review! Our kitchen team is delighted..."
              rows={4}
              className="mt-3 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResponseModal(null)}
                className="rounded border border-wine-900/20 px-4 py-2 text-xs font-medium text-wine-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSaveResponse}
                disabled={!responseText.trim() || actionLoadingId === responseModal.id}
                className="rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
              >
                Publish Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
