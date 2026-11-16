export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export interface CustomerReview {
  id: string;
  order_id: string;
  order_reference: string;
  product_id?: string | null;
  product_name?: string | null;
  user_id?: string | null; // null for guest diners
  customer_name: string;
  rating: number; // 1 to 5 stars
  review_text: string;
  image_urls?: string[];
  status: ReviewStatus;
  moderated_by?: string | null;
  moderated_at?: string | null;
  rejection_reason?: string | null;
  admin_response?: string | null;
  admin_responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type FeedbackCategory =
  | "food_quality"
  | "packaging"
  | "delivery_experience"
  | "customer_service"
  | "overall";

export interface CustomerFeedback {
  id: string;
  order_reference?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  category: FeedbackCategory;
  rating: number; // 1 to 5
  comments: string;
  admin_notes?: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewSubmissionInput {
  orderReference: string;
  accessTokenOrPhone: string;
  productId?: string;
  rating: number;
  reviewText: string;
  imageUrls?: string[];
}

export interface PublicReviewSummary {
  averageRating: number;
  totalReviews: number;
  approvedReviews: {
    id: string;
    customer_name: string;
    product_name?: string | null;
    rating: number;
    review_text: string;
    image_urls?: string[];
    created_at: string;
    admin_response?: string | null;
  }[];
}
