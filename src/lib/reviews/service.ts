import type {
  CustomerReview,
  CustomerFeedback,
  ReviewStatus,
  FeedbackCategory,
  ReviewSubmissionInput,
  PublicReviewSummary,
} from "@/types/reviews";
import { getDb } from "@/lib/db";
import { getOrderByReferenceAndToken } from "@/lib/order/service";

// In-memory runtime persistence for sandbox/testing/failover
let runtimeReviews: CustomerReview[] = [];
let runtimeFeedback: CustomerFeedback[] = [];

/**
 * ----------------------------------------------------------------------------
 * CUSTOMER REVIEW SUBMISSION (ELIGIBILITY ENFORCED)
 * ----------------------------------------------------------------------------
 */
export async function submitCustomerReview(
  input: ReviewSubmissionInput,
  authenticatedUserId?: string
): Promise<{ success: boolean; review?: CustomerReview; error?: string }> {
  // 1. Validate rating bounds & text length
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5 stars." };
  }
  if (!input.reviewText || input.reviewText.trim().length < 10) {
    return { success: false, error: "Please write at least 10 characters sharing your thoughts." };
  }

  // 2. Look up order securely (works for logged-in or guest via access token / phone)
  const order = await getOrderByReferenceAndToken(
    input.orderReference,
    input.accessTokenOrPhone,
    input.accessTokenOrPhone
  );

  if (!order) {
    return {
      success: false,
      error: "Order not found. Only customers with verified completed orders can submit reviews.",
    };
  }

  // 3. Verify order eligibility: must be paid and fulfilled (delivered or collected)
  const isFulfilled = order.status === "delivered" || order.status === "collected";
  if (!isFulfilled) {
    return {
      success: false,
      error: `Reviews can only be submitted after your order has been delivered or collected. (Current status: ${order.status})`,
    };
  }

  // 4. Product eligibility check: if reviewing a specific product, verify the order contained it
  let verifiedProductName: string | null = null;
  if (input.productId) {
    const purchasedItem = (order.items || []).find(
      (i) => i.product_id === input.productId || i.product_sku === input.productId
    );
    if (!purchasedItem) {
      return {
        success: false,
        error: "You can only review dishes that were purchased in this order.",
      };
    }
    verifiedProductName = purchasedItem.product_name;
  }

  // 5. Prevent duplicate review for the same order item
  const existingReview = runtimeReviews.find(
    (r) =>
      r.order_id === order.id &&
      (input.productId ? r.product_id === input.productId : !r.product_id)
  );

  if (existingReview) {
    return {
      success: false,
      error: "You have already submitted a review for this order item.",
    };
  }

  const now = new Date().toISOString();
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newReview: CustomerReview = {
    id: reviewId,
    order_id: order.id,
    order_reference: order.order_reference,
    product_id: input.productId || null,
    product_name: verifiedProductName,
    user_id: authenticatedUserId || order.user_id || null,
    customer_name: order.customer_name,
    rating: input.rating,
    review_text: input.reviewText.trim(),
    image_urls: input.imageUrls || [],
    status: "pending", // Requires admin approval before appearing publicly
    created_at: now,
    updated_at: now,
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO customer_reviews (
          id, order_id, order_reference, product_id, product_name, user_id,
          customer_name, rating, review_text, image_urls, status, created_at, updated_at
        ) VALUES (
          ${newReview.id}, ${newReview.order_id}, ${newReview.order_reference},
          ${newReview.product_id || null}, ${newReview.product_name || null},
          ${newReview.user_id || null}, ${newReview.customer_name}, ${newReview.rating},
          ${newReview.review_text}, ${JSON.stringify(newReview.image_urls || [])}::jsonb,
          'pending', ${now}, ${now}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        return { success: true, review: rows[0] as CustomerReview };
      }
    } catch (e) {
      console.warn("Neon review insertion notice, maintaining memory cache:", e);
    }
  }

  runtimeReviews.unshift(newReview);
  return { success: true, review: newReview };
}

/**
 * Allows a customer to edit their pending review, or delete it
 */
export async function editCustomerReview(params: {
  reviewId: string;
  orderReference: string;
  accessTokenOrPhone: string;
  rating: number;
  reviewText: string;
}): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderByReferenceAndToken(
    params.orderReference,
    params.accessTokenOrPhone,
    params.accessTokenOrPhone
  );
  if (!order) {
    return { success: false, error: "Unauthorized: Invalid order credentials." };
  }

  const review = runtimeReviews.find(
    (r) => r.id === params.reviewId && r.order_reference === params.orderReference
  );
  if (!review) {
    return { success: false, error: "Review not found." };
  }

  review.rating = params.rating;
  review.review_text = params.reviewText.trim();
  review.status = "pending"; // Re-moderate on edit
  review.updated_at = new Date().toISOString();

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE customer_reviews
        SET rating = ${review.rating},
            review_text = ${review.review_text},
            status = 'pending',
            updated_at = ${review.updated_at}
        WHERE id = ${params.reviewId};
      `;
    } catch {
      // Fallback
    }
  }

  return { success: true };
}

export async function deleteCustomerReview(params: {
  reviewId: string;
  orderReference: string;
  accessTokenOrPhone: string;
}): Promise<{ success: boolean; error?: string }> {
  const order = await getOrderByReferenceAndToken(
    params.orderReference,
    params.accessTokenOrPhone,
    params.accessTokenOrPhone
  );
  if (!order) {
    return { success: false, error: "Unauthorized: Invalid order credentials." };
  }

  runtimeReviews = runtimeReviews.filter((r) => r.id !== params.reviewId);

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        DELETE FROM customer_reviews
        WHERE id = ${params.reviewId};
      `;
    } catch {
      // Fallback
    }
  }

  return { success: true };
}

/**
 * ----------------------------------------------------------------------------
 * ADMIN REVIEW MODERATION
 * ----------------------------------------------------------------------------
 */
export async function getAdminReviews(options?: {
  status?: ReviewStatus;
  limit?: number;
}): Promise<CustomerReview[]> {
  const sql = getDb();
  if (sql) {
    try {
      const limitVal = options?.limit || 50;
      const rows = options?.status
        ? await sql`
            SELECT * FROM customer_reviews
            WHERE status = ${options.status}
            ORDER BY created_at DESC
            LIMIT ${limitVal};
          `
        : await sql`
            SELECT * FROM customer_reviews
            ORDER BY created_at DESC
            LIMIT ${limitVal};
          `;

      if (rows && rows.length > 0) {
        return rows as CustomerReview[];
      }
    } catch {
      // Fallback
    }
  }

  return runtimeReviews.filter((r) => (options?.status ? r.status === options.status : true));
}

export async function moderateReview(params: {
  reviewId: string;
  status: ReviewStatus;
  moderatorUserId?: string;
  rejectionReason?: string;
  adminResponse?: string;
}): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  const review = runtimeReviews.find((r) => r.id === params.reviewId);
  if (review) {
    review.status = params.status;
    review.moderated_by = params.moderatorUserId || null;
    review.moderated_at = now;
    if (params.rejectionReason) review.rejection_reason = params.rejectionReason;
    if (params.adminResponse) {
      review.admin_response = params.adminResponse;
      review.admin_responded_at = now;
    }
    review.updated_at = now;
  }

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE customer_reviews
        SET status = ${params.status},
            moderated_by = ${params.moderatorUserId || null},
            moderated_at = ${now},
            rejection_reason = ${params.rejectionReason || null},
            admin_response = ${params.adminResponse || null},
            admin_responded_at = ${params.adminResponse ? now : null},
            updated_at = ${now}
        WHERE id = ${params.reviewId};
      `;
    } catch {
      // Fallback
    }
  }

  return { success: true };
}

/**
 * ----------------------------------------------------------------------------
 * PUBLIC REVIEW QUERIES (ONLY APPROVED REVIEWS)
 * ----------------------------------------------------------------------------
 */
export async function getPublicReviews(productId?: string): Promise<PublicReviewSummary> {
  const sql = getDb();
  let approved: CustomerReview[] = [];

  if (sql) {
    try {
      const rows = productId
        ? await sql`
            SELECT * FROM customer_reviews
            WHERE status = 'approved' AND product_id = ${productId}
            ORDER BY created_at DESC;
          `
        : await sql`
            SELECT * FROM customer_reviews
            WHERE status = 'approved'
            ORDER BY created_at DESC;
          `;

      if (rows && rows.length > 0) {
        approved = rows as CustomerReview[];
      }
    } catch (e) {
      console.warn("Neon getPublicReviews notice, using memory:", e);
    }
  }

  if (approved.length === 0) {
    approved = runtimeReviews.filter(
      (r) => r.status === "approved" && (productId ? r.product_id === productId : true)
    );
  }

  const totalReviews = approved.length;
  const avgRating =
    totalReviews > 0
      ? parseFloat((approved.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

  return {
    averageRating: avgRating,
    totalReviews,
    approvedReviews: approved.map((r) => {
      // Mask customer surname for privacy (e.g. "Chinedu O.")
      const parts = r.customer_name.trim().split(" ");
      const maskedName =
        parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0] || "Valued Diner";

      return {
        id: r.id,
        customer_name: maskedName,
        product_name: r.product_name,
        rating: r.rating,
        review_text: r.review_text,
        image_urls: r.image_urls,
        created_at: r.created_at,
        admin_response: r.admin_response,
      };
    }),
  };
}

/**
 * ----------------------------------------------------------------------------
 * PRIVATE CUSTOMER FEEDBACK
 * ----------------------------------------------------------------------------
 */
export async function submitCustomerFeedback(input: {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  order_reference?: string;
  category: FeedbackCategory;
  rating: number;
  comments: string;
}): Promise<{ success: boolean; feedback?: CustomerFeedback; error?: string }> {
  if (!input.customer_name.trim() || !input.customer_email.trim() || !input.comments.trim()) {
    return { success: false, error: "Name, email, and comments are required." };
  }

  const now = new Date().toISOString();
  const feedback: CustomerFeedback = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    customer_name: input.customer_name.trim(),
    customer_email: input.customer_email.trim().toLowerCase(),
    customer_phone: input.customer_phone?.trim() || null,
    order_reference: input.order_reference?.trim().toUpperCase() || null,
    category: input.category,
    rating: Math.min(5, Math.max(1, input.rating || 5)),
    comments: input.comments.trim(),
    is_resolved: false,
    created_at: now,
    updated_at: now,
  };

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO customer_feedback (
          id, customer_name, customer_email, customer_phone, order_reference,
          category, rating, comments, is_resolved, created_at, updated_at
        ) VALUES (
          ${feedback.id}, ${feedback.customer_name}, ${feedback.customer_email},
          ${feedback.customer_phone || null}, ${feedback.order_reference || null},
          ${feedback.category}, ${feedback.rating}, ${feedback.comments},
          FALSE, ${now}, ${now}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        return { success: true, feedback: rows[0] as CustomerFeedback };
      }
    } catch (e) {
      console.warn("Neon customer_feedback notice, using memory:", e);
    }
  }

  runtimeFeedback.unshift(feedback);
  return { success: true, feedback };
}

export async function getAdminCustomerFeedback(options?: {
  isResolved?: boolean;
}): Promise<CustomerFeedback[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = typeof options?.isResolved === "boolean"
        ? await sql`
            SELECT * FROM customer_feedback
            WHERE is_resolved = ${options.isResolved}
            ORDER BY created_at DESC;
          `
        : await sql`
            SELECT * FROM customer_feedback
            ORDER BY created_at DESC;
          `;

      if (rows && rows.length > 0) {
        return rows as CustomerFeedback[];
      }
    } catch (e) {
      console.warn("Neon getAdminCustomerFeedback notice, using memory:", e);
    }
  }

  return runtimeFeedback.filter((f) =>
    typeof options?.isResolved === "boolean" ? f.is_resolved === options.isResolved : true
  );
}
