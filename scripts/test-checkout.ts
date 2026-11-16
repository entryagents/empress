import assert from "node:assert";
import {
  validateCart,
  createOrder,
  getOrderByReferenceAndToken,
  validateCoupon,
  getDeliveryZones,
} from "../src/lib/order/service.ts";
import { nairaToKobo, formatKobo } from "../src/types/catalogue.ts";

async function runCheckoutTests() {
  console.log("▶ Running Shopping Cart, Checkout & Order Creation Test Suite...\n");

  // 1. Delivery Zones Check
  console.log("1. Verifying Nigerian delivery zones...");
  const zones = await getDeliveryZones();
  assert(zones.length >= 5, `Expected at least 5 delivery zones, found ${zones.length}`);
  const viZone = zones.find((z) => z.id === "zone-vi-ikoyi");
  assert(viZone !== undefined, "Victoria Island & Ikoyi zone must exist");
  assert.strictEqual(viZone?.fee_kobo, 150000, "VI zone fee must be 150,000 kobo (₦1,500)");
  console.log("   ✔ Delivery zones configured accurately.");

  // 2. Coupon Validation Tests
  console.log("2. Testing Coupon Foundation & Calculations...");
  // Percentage coupon test
  const couponWelcome = await validateCoupon("WELCOME10", 1000000); // ₦10,000 subtotal
  assert(couponWelcome.isValid, "WELCOME10 should be valid for ₦10,000");
  assert.strictEqual(couponWelcome.discountKobo, 100000, "10% of ₦10,000 must be 100,000 kobo (₦1,000)");

  // Min order amount check
  const couponMinFail = await validateCoupon("WELCOME10", 200000); // ₦2,000 subtotal (below ₦5,000 min)
  assert(!couponMinFail.isValid, "WELCOME10 must fail when subtotal is below ₦5,000 min");

  // Fixed coupon test
  const couponFixed = await validateCoupon("EMPRESS500", 800000); // ₦8,000 subtotal
  assert(couponFixed.isValid, "EMPRESS500 should be valid for ₦8,000");
  assert.strictEqual(couponFixed.discountKobo, 50000, "EMPRESS500 must discount 50,000 kobo (₦500)");

  // Non-existent coupon
  const couponFake = await validateCoupon("NONEXISTENT99", 500000);
  assert(!couponFake.isValid, "Invalid coupon code must be rejected");
  console.log("   ✔ Coupon validation rules and bounds passed.");

  // 3. Server-side Cart Validation & Recalculation
  console.log("3. Testing Server-side Cart Validation & Price Recalculation...");
  const sampleCart = [
    {
      productId: "prod-shawarma", // Base price ₦4,500 (450,000 kobo)
      variantId: "var-shw-lrg", // +₦1,500 (150,000 kobo) -> ₦6,000
      addonIds: ["add-shw-chs"], // +₦800 (80,000 kobo) -> ₦6,800
      quantity: 2, // 2 * ₦6,800 = ₦13,600 (1,360,000 kobo)
      specialInstructions: "Extra garlic sauce",
    },
    {
      productId: "prod-small-chops", // Base price ₦8,500 (850,000 kobo)
      quantity: 1, // ₦8,500 (850,000 kobo)
    },
  ];

  // Delivery cart validation
  const validationDelivery = await validateCart(
    sampleCart,
    "delivery",
    "zone-vi-ikoyi",
    "WELCOME10"
  );

  assert(validationDelivery.isValid, `Cart validation failed: ${validationDelivery.errors.join(", ")}`);
  assert.strictEqual(validationDelivery.items.length, 2, "Must validate 2 cart items");

  // Subtotal = 1,360,000 + 850,000 = 2,210,000 kobo (₦22,100)
  assert.strictEqual(validationDelivery.pricing.subtotalKobo, 2210000, "Subtotal must equal 2,210,000 kobo");
  // Delivery fee for VI = 150,000 kobo (₦1,500)
  assert.strictEqual(validationDelivery.pricing.deliveryFeeKobo, 150000, "VI delivery fee must equal 150,000 kobo");
  // 10% discount on 2,210,000 = 221,000 kobo (₦2,210)
  assert.strictEqual(validationDelivery.pricing.discountKobo, 221000, "10% discount must equal 221,000 kobo");
  // Total = 2,210,000 + 150,000 - 221,000 = 2,139,000 kobo (₦21,390)
  assert.strictEqual(validationDelivery.pricing.totalKobo, 2139000, "Total must equal 2,139,000 kobo");

  // Pickup cart validation (delivery fee MUST be strictly 0)
  const validationPickup = await validateCart(sampleCart, "pickup", undefined, undefined);
  assert(validationPickup.isValid, "Pickup cart validation must succeed");
  assert.strictEqual(validationPickup.pricing.deliveryFeeKobo, 0, "Pickup delivery fee must be zero");
  assert.strictEqual(validationPickup.pricing.totalKobo, 2210000, "Pickup total must equal subtotal");
  console.log("   ✔ Server-side cart validation and arithmetic passed.");

  // 4. Order Creation & Snapshots
  console.log("4. Testing Order Creation, Nigerian Address & Historical Snapshots...");
  const checkoutInput: CustomerCheckoutInput = {
    full_name: "Chukwudi Okafor",
    email: "chukwudi@example.ng",
    phone: "+234 802 345 6789",
    fulfillment_type: "delivery",
    address: {
      state: "Lagos",
      city: "Lagos",
      area: "Victoria Island",
      street_address: "14 Adeola Odeku Street",
      building_number: "Suite 3",
      landmark: "Opposite Silverbird Galleria",
      additional_instructions: "Call security upon arrival",
    },
    delivery_zone_id: "zone-vi-ikoyi",
    special_instructions: "Please package hot and separate sauces",
    coupon_code: "WELCOME10",
    idempotency_key: "idem-test-key-001",
  };

  const orderResult = await createOrder(sampleCart, checkoutInput);
  assert(orderResult.success, `Order creation failed: ${orderResult.error}`);
  assert(orderResult.order !== undefined, "Order object must be returned");

  const order = orderResult.order!;
  assert(order.order_reference.startsWith("EMP-"), `Order reference must start with EMP-, got: ${order.order_reference}`);
  assert(order.secure_access_token.length >= 32, "Must generate high-entropy secure access token");
  assert.strictEqual(order.customer_name, "Chukwudi Okafor");
  assert.strictEqual(order.fulfillment_type, "delivery");
  assert.strictEqual(order.delivery_area, "Victoria Island");
  assert.strictEqual(order.delivery_landmark, "Opposite Silverbird Galleria");
  assert.strictEqual(order.total_kobo, 2139000);
  assert.strictEqual(order.status, "received");
  assert.strictEqual(order.payment_status, "unpaid", "Unpaid order must be explicitly marked unpaid");

  // Verify Item Snapshots
  assert(order.items && order.items.length === 2, "Order must have 2 snapshot items");
  const shawarmaSnap = order.items.find((i) => i.product_id === "prod-shawarma");
  assert(shawarmaSnap !== undefined, "Shawarma item snapshot must exist");
  assert.strictEqual(shawarmaSnap?.variant_name, "Large Loaded Wrap (Extra Filling)");
  assert.strictEqual(shawarmaSnap?.quantity, 2);
  assert(shawarmaSnap?.addons && shawarmaSnap.addons.length === 1, "Addon snapshot must be preserved");
  assert.strictEqual(shawarmaSnap?.addons?.[0].addon_name, "Melted Mozzarella Cheese");
  console.log("   ✔ Order creation, Nigerian address, and immutable item snapshots preserved.");

  // 5. Idempotency Check (Duplicate Submission Prevention)
  console.log("5. Testing Duplicate Submission Prevention (Idempotency)...");
  const duplicateResult = await createOrder(sampleCart, checkoutInput);
  assert(duplicateResult.success, "Duplicate submission with same idempotency key should return existing order");
  assert.strictEqual(
    duplicateResult.order?.order_reference,
    order.order_reference,
    "Idempotency key must return the exact same order reference"
  );
  console.log("   ✔ Idempotency prevents double order creation.");

  // 6. Secure Customer Order Lookup
  console.log("6. Testing Secure Order Lookup...");
  // Successful lookup via token
  const lookupByToken = await getOrderByReferenceAndToken(order.order_reference, order.secure_access_token);
  assert(lookupByToken !== null, "Order lookup via valid token must succeed");
  assert.strictEqual(lookupByToken?.order_reference, order.order_reference);

  // Successful lookup via phone
  const lookupByPhone = await getOrderByReferenceAndToken(order.order_reference, undefined, "+234 802 345 6789");
  assert(lookupByPhone !== null, "Order lookup via valid phone must succeed");

  // Unauthorized lookup (wrong token)
  const lookupBadToken = await getOrderByReferenceAndToken(order.order_reference, "invalid-token-1234");
  assert(lookupBadToken === null, "Order lookup with invalid token must return null");

  // Unauthorized lookup (wrong phone)
  const lookupBadPhone = await getOrderByReferenceAndToken(order.order_reference, undefined, "+234 800 000 0000");
  assert(lookupBadPhone === null, "Order lookup with incorrect phone must return null");
  console.log("   ✔ Customer order lookup verified secure (no unauthorized enumeration).");

  console.log("\n🎉 ALL SHOPPING CART, CHECKOUT & ORDER CREATION TESTS PASSED SUCCESSFULLY!");
}

runCheckoutTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
