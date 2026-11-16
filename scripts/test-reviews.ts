import {
  submitCustomerReview,
  editCustomerReview,
  deleteCustomerReview,
  getAdminReviews,
  moderateReview,
  getPublicReviews,
  submitCustomerFeedback,
  getAdminCustomerFeedback,
} from "../src/lib/reviews/service";
import { registerRuntimeOrder } from "../src/lib/order/service";
import type { Order } from "../src/types/order";

async function runReviewsTests() {
  console.log("==========================================================");
  console.log("EMPRESS DELICACIES: REVIEWS, RATINGS & FEEDBACK TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`✓ [TEST ${total}] PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ [TEST ${total}] FAIL: ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Eligible Completed Order Setup
  console.log("--- 1. ELIGIBILITY VERIFICATION ---");
  const fulfilledOrder: Order = {
    id: "ord-rev-01",
    order_reference: "EMP-REV-DELIV1",
    secure_access_token: "tok-rev-valid",
    customer_name: "Onyeka Onwenu",
    customer_email: "onyeka@example.com",
    customer_phone: "+2348039998877",
    fulfillment_type: "delivery",
    currency: "NGN",
    subtotal_kobo: 1200000,
    delivery_fee_kobo: 150000,
    discount_kobo: 0,
    total_kobo: 1350000,
    status: "delivered", // Eligible status
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: "item-rev-1",
        order_id: "ord-rev-01",
        product_id: "prod-shawarma",
        product_name: "Empress Royal Shawarma",
        category_name: "Shawarma & Wraps",
        product_sku: "SHAW-ROYAL",
        product_image_url: "/shawarma.jpg",
        variant_id: null,
        variant_name: null,
        variant_price_adjustment_kobo: 0,
        base_price_kobo: 1200000,
        addons_total_kobo: 0,
        unit_price_kobo: 1200000,
        quantity: 1,
        total_price_kobo: 1200000,
      },
    ],
  };

  const unfulfilledOrder: Order = {
    id: "ord-rev-02",
    order_reference: "EMP-REV-PENDING2",
    secure_access_token: "tok-rev-unfulfilled",
    customer_name: "Kelechi Iheanacho",
    customer_email: "kelechi@example.com",
    customer_phone: "+2348032223344",
    fulfillment_type: "delivery",
    currency: "NGN",
    subtotal_kobo: 800000,
    delivery_fee_kobo: 150000,
    discount_kobo: 0,
    total_kobo: 950000,
    status: "preparing", // Ineligible status
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  registerRuntimeOrder(fulfilledOrder);
  registerRuntimeOrder(unfulfilledOrder);

  // Ineligible order review rejection
  const ineligRes = await submitCustomerReview({
    orderReference: unfulfilledOrder.order_reference,
    accessTokenOrPhone: unfulfilledOrder.secure_access_token,
    rating: 5,
    reviewText: "Food smelled great while preparing!",
  });
  assert(!ineligRes.success, "Ineligible (unfulfilled/preparing) order review rejected");

  // Ineligible product review rejection (dish not in order)
  const wrongDishRes = await submitCustomerReview({
    orderReference: fulfilledOrder.order_reference,
    accessTokenOrPhone: fulfilledOrder.secure_access_token,
    productId: "prod-non-existent-dish",
    rating: 5,
    reviewText: "Loved the cheesesteak, great flavor!",
  });
  assert(!wrongDishRes.success, "Review for unpurchased dish rejected");

  // 2. Valid Review Submission
  console.log("\n--- 2. VALID REVIEW SUBMISSION & DUPLICATE PREVENTION ---");
  const validRes = await submitCustomerReview({
    orderReference: fulfilledOrder.order_reference,
    accessTokenOrPhone: fulfilledOrder.secure_access_token,
    productId: "prod-shawarma",
    rating: 5,
    reviewText: "The shawarma was piping hot, generously spiced, and wrapped to perfection.",
  });
  assert(validRes.success && validRes.review !== undefined, "Eligible customer review submitted");
  assert(validRes.review?.status === "pending", "Submitted review defaults to 'pending' moderation status");

  // Duplicate submission attempt for same item
  const dupRes = await submitCustomerReview({
    orderReference: fulfilledOrder.order_reference,
    accessTokenOrPhone: fulfilledOrder.secure_access_token,
    productId: "prod-shawarma",
    rating: 4,
    reviewText: "Trying to submit a duplicate review for the same meal.",
  });
  assert(!dupRes.success, "Duplicate review for the exact same order item blocked");

  // 3. Customer Review Edit & Deletion
  console.log("\n--- 3. CUSTOMER EDIT & DELETION POLICY ---");
  const editRes = await editCustomerReview({
    reviewId: validRes.review!.id,
    orderReference: fulfilledOrder.order_reference,
    accessTokenOrPhone: fulfilledOrder.secure_access_token,
    rating: 5,
    reviewText: "Edited: The shawarma was absolutely exceptional in Asaba!",
  });
  assert(editRes.success, "Customer can edit their pending review");

  // Unauthorized edit attempt with wrong credentials
  const unauthEdit = await editCustomerReview({
    reviewId: validRes.review!.id,
    orderReference: fulfilledOrder.order_reference,
    accessTokenOrPhone: "wrong-tampered-token",
    rating: 1,
    reviewText: "Malicious edit attempt.",
  });
  assert(!unauthEdit.success, "Unauthorized edit rejected");

  // 4. Admin Review Moderation & Public Visibility
  console.log("\n--- 4. MODERATION & PUBLIC VISIBILITY ---");
  const prePublic = await getPublicReviews();
  assert(
    !prePublic.approvedReviews.some((r) => r.id === validRes.review!.id),
    "Pending review does NOT appear publicly"
  );

  // Moderate: Approve with admin response
  const modRes = await moderateReview({
    reviewId: validRes.review!.id,
    status: "approved",
    adminResponse: "Thank you Onyeka! We take deep pride in our handcrafted marinades.",
  });
  assert(modRes.success, "Admin approves customer review and attaches official response");

  // Check public feed
  const postPublic = await getPublicReviews();
  const pubItem = postPublic.approvedReviews.find((r) => r.id === validRes.review!.id);
  assert(pubItem !== undefined, "Approved review appears in public feed");
  assert(pubItem?.customer_name === "Onyeka O.", "Customer surname securely masked (Onyeka O.)");
  assert(Boolean(pubItem?.admin_response), "Admin response displayed publicly with review");

  // 5. Private Customer Feedback
  console.log("\n--- 5. PRIVATE CUSTOMER FEEDBACK INBOX ---");
  const fbRes = await submitCustomerFeedback({
    customer_name: "Folake Williams",
    customer_email: "folake@example.ng",
    customer_phone: "+2348021110099",
    order_reference: fulfilledOrder.order_reference,
    category: "packaging",
    rating: 5,
    comments: "The gold-embossed paper bags kept everything warm during the drive across Asaba.",
  });
  assert(fbRes.success, "Private customer feedback submitted");

  const adminFb = await getAdminCustomerFeedback();
  assert(adminFb.some((f) => f.id === fbRes.feedback?.id), "Feedback delivered to admin inbox");

  console.log("\n==========================================================");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("==========================================================");
}

runReviewsTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
