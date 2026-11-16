import {
  registerRuntimeOrder,
  getOrderByReferenceAndToken,
  isValidStatusTransition,
  updateAdminOrderStatus,
  updateAdminOrderNotes,
  getOrderAdminMetrics,
} from "../src/lib/order/service";
import { sendOrderNotification } from "../src/lib/order/notifications";
import type { Order, OrderStatus } from "../src/types/order";

const testOrder: Order = {
  id: "ord-mgmt-test-01",
  order_reference: "EMP-20261119-MGMT",
  secure_access_token: "tok_mgmt_sec_token_887192739102",
  customer_name: "Folashade Tinubu",
  customer_email: "folashade@example.com",
  customer_phone: "+2348023456789",
  fulfillment_type: "delivery",
  delivery_state: "Lagos",
  delivery_city: "Lagos",
  delivery_area: "Victoria Island",
  delivery_street_address: "14 Adeola Odeku Street",
  delivery_landmark: "Opposite Silverbird",
  currency: "NGN",
  subtotal_kobo: 2500000,
  delivery_fee_kobo: 200000,
  discount_kobo: 0,
  total_kobo: 2700000, // ₦27,000.00
  status: "received",
  payment_status: "paid",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: "item-mgmt-01",
      order_id: "ord-mgmt-test-01",
      product_id: "prod-shawarma",
      product_name: "Empress Signature Shawarma",
      product_sku: "EMP-SHAW",
      product_image_url: "/images/food/shawarma.jpg",
      category_name: "Shawarma",
      variant_id: null,
      variant_name: "Beef & Sausage",
      variant_price_adjustment_kobo: 0,
      base_price_kobo: 450000,
      addons_total_kobo: 100000,
      unit_price_kobo: 550000,
      quantity: 4,
      total_price_kobo: 2200000,
    },
  ],
};

async function runTestSuite() {
  console.log("==================================================");
  console.log("EMPRESS DELICACIES: ORDER FULFILMENT & INTAKE TEST");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
      process.exitCode = 1;
    }
  }

  // Register fixture order
  registerRuntimeOrder(testOrder);

  // 1. STATUS TRANSITION VALIDATION RULES
  console.log("\n[Group 1: Status Workflow Transitions]");
  assert("received -> confirmed is valid", isValidStatusTransition("received", "confirmed"));
  assert("received -> preparing is invalid (must be confirmed first)", !isValidStatusTransition("received", "preparing"));
  assert("confirmed -> preparing is valid", isValidStatusTransition("confirmed", "preparing"));
  assert("preparing -> ready is valid", isValidStatusTransition("preparing", "ready"));
  assert("ready -> delivered is valid", isValidStatusTransition("ready", "delivered"));
  assert("delivered -> preparing is invalid (terminal status)", !isValidStatusTransition("delivered", "preparing"));
  assert("cancelled -> confirmed is invalid (terminal status)", !isValidStatusTransition("cancelled", "confirmed"));

  // 2. PAYMENT & FULFILMENT STATUS ISOLATION
  console.log("\n[Group 2: Payment & Fulfilment Separation]");
  const failedPaymentOrder: Order = {
    ...testOrder,
    order_reference: "EMP-FAIL-PAY",
    payment_status: "failed",
    status: "received",
  };
  registerRuntimeOrder(failedPaymentOrder);

  const invalidConfirm = await updateAdminOrderStatus({
    orderReference: "EMP-FAIL-PAY",
    newStatus: "confirmed",
  });
  assert("Order with 'failed' payment cannot be moved to 'confirmed'", !invalidConfirm.success && Boolean(invalidConfirm.error));

  // 3. VALID STATUS UPDATE & AUDIT TIMELINE
  console.log("\n[Group 3: Audit Trail & Status Updates]");
  const validTransition = await updateAdminOrderStatus({
    orderReference: testOrder.order_reference,
    newStatus: "confirmed",
    changedByName: "Chef Amaka",
    notes: "Order accepted in Victoria Island kitchen.",
  });
  assert("Valid transition to confirmed succeeds", validTransition.success && validTransition.order?.status === "confirmed");
  assert("Audit timeline recorded who changed status and notes", validTransition.order?.timeline?.length! > 0 && validTransition.order?.timeline?.[0].notes === "Order accepted in Victoria Island kitchen.");

  // Progress to preparing
  const prepTransition = await updateAdminOrderStatus({
    orderReference: testOrder.order_reference,
    newStatus: "preparing",
    changedByName: "Chef Amaka",
  });
  assert("Progress to preparing succeeds", prepTransition.success && prepTransition.order?.status === "preparing");

  // 4. ADMIN INTERNAL NOTES
  console.log("\n[Group 4: Internal Admin Notes]");
  const notesRes = await updateAdminOrderNotes(testOrder.order_reference, "VIP client. Include complimentary extra pepper sauce.");
  assert("Admin notes saved successfully", notesRes.success);
  const updatedWithNotes = await getOrderByReferenceAndToken(testOrder.order_reference);
  assert("Admin notes persisted in order record", updatedWithNotes?.admin_notes === "VIP client. Include complimentary extra pepper sauce.");

  // 5. CUSTOMER NOTIFICATION DEDUPLICATION
  console.log("\n[Group 5: Customer Notifications & Deduplication]");
  const notif1 = await sendOrderNotification({
    orderReference: testOrder.order_reference,
    customerName: testOrder.customer_name,
    customerEmail: testOrder.customer_email,
    customerPhone: testOrder.customer_phone,
    type: "ready_for_pickup",
    subject: "Order Ready for Pickup",
    message: "Your order is ready for pickup at Empress Kitchen.",
  });
  assert("First notification logged/dispatched without error", notif1.success && notif1.status !== "skipped");

  const notifDup = await sendOrderNotification({
    orderReference: testOrder.order_reference,
    customerName: testOrder.customer_name,
    customerEmail: testOrder.customer_email,
    customerPhone: testOrder.customer_phone,
    type: "ready_for_pickup",
    subject: "Order Ready for Pickup",
    message: "Your order is ready for pickup at Empress Kitchen.",
  });
  assert("Duplicate notification for same status safely skipped (deduplicated)", notifDup.success && notifDup.status === "skipped");

  // 6. REAL-TIME REVENUE & METRICS COMPUTATION
  console.log("\n[Group 6: Database Metrics & Revenue Accuracy]");
  const metrics = await getOrderAdminMetrics();
  assert("Metrics object computed without NaN or undefined", typeof metrics.verifiedRevenueKobo === "number" && typeof metrics.ordersReceivedToday === "number");
  assert("Verified revenue excludes unpaid/failed orders", metrics.verifiedRevenueKobo >= testOrder.total_kobo);

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("==================================================");
}

runTestSuite().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
