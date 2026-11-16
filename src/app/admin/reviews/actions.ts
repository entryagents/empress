"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer/service";
import {
  submitCustomerReview,
  editCustomerReview,
  deleteCustomerReview,
  moderateReview,
  submitCustomerFeedback,
} from "@/lib/reviews/service";
import type { ReviewStatus, FeedbackCategory } from "@/types/reviews";

/**
 * Customer Actions
 */
export async function submitCustomerReviewAction(formData: FormData) {
  const { user } = await getCurrentCustomer();

  const orderReference = String(formData.get("order_reference") || "");
  const accessTokenOrPhone = String(formData.get("access_token_or_phone") || "");
  const productId = String(formData.get("product_id") || "") || undefined;
  const rating = parseInt(String(formData.get("rating") || "5"), 10);
  const reviewText = String(formData.get("review_text") || "");
  const imageUrls = formData.getAll("image_urls").map(String);

  const res = await submitCustomerReview(
    {
      orderReference,
      accessTokenOrPhone,
      productId,
      rating,
      reviewText,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    },
    user?.id
  );

  if (res.success) {
    revalidatePath("/reviews");
    revalidatePath("/admin/reviews");
  }

  return res;
}

export async function submitGeneralFeedbackAction(formData: FormData) {
  const name = String(formData.get("customer_name") || "");
  const email = String(formData.get("customer_email") || "");
  const phone = String(formData.get("customer_phone") || "");
  const orderRef = String(formData.get("order_reference") || "");
  const category = (String(formData.get("category") || "overall")) as FeedbackCategory;
  const rating = parseInt(String(formData.get("rating") || "5"), 10);
  const comments = String(formData.get("comments") || "");

  const res = await submitCustomerFeedback({
    customer_name: name,
    customer_email: email,
    customer_phone: phone || undefined,
    order_reference: orderRef || undefined,
    category,
    rating,
    comments,
  });

  return res;
}

/**
 * Admin Moderation Actions
 */
export async function moderateReviewAction(params: {
  reviewId: string;
  status: ReviewStatus;
  rejectionReason?: string;
  adminResponse?: string;
}) {
  const { profile, user } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  const res = await moderateReview({
    ...params,
    moderatorUserId: user?.id,
  });

  if (res.success) {
    revalidatePath("/admin/reviews");
    revalidatePath("/reviews");
    revalidatePath("/");
  }

  return res;
}
