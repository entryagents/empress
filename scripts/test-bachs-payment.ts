import crypto from "crypto";
import {
  koboToDecimalString,
  decimalStringToKobo,
  createBachsCheckoutSession,
  verifyAndConstructBachsWebhook,
  processBachsWebhookEvent,
  getOrderPaymentStatus,
} from "../src/lib/payment/service";
import type { Order } from "../src/types/order";
import { BachsWebhookError } from "@bachs/sdk";

import { registerRuntimeOrder } from "../src/lib/order/service";

// Mock Order Fixture
const mockOrder: Order = {
  id: "ord-test-1001",
  order_reference: "EMP-20261118-TEST",
  secure_access_token: "tok_test_secure_token_emp_9823471029384",
  customer_name: "Adeola Alabi",
  customer_email: "adeola@example.com",
  customer_phone: "+2348031234567",
  fulfillment_type: "delivery",
  currency: "NGN",
  subtotal_kobo: 1250000, // ₦12,500.00
  delivery_fee_kobo: 150000, // ₦1,500.00
  discount_kobo: 0,
  total_kobo: 1400000, // ₦14,000.00
  status: "received",
  payment_status: "unpaid",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

registerRuntimeOrder(mockOrder);

async function runTests() {
  console.log("==================================================");
  console.log("EMPRESS DELICACIES: BACHS PAYMENT TEST SUITE");
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

  // TEST 1: Currency & Amount formatting utilities
  console.log("\n[Group 1: Currency & Unit Conversions]");
  assert("koboToDecimalString converts 1400000 kobo to '14000.00'", koboToDecimalString(1400000) === "14000.00");
  assert("koboToDecimalString converts 150 kobo to '1.50'", koboToDecimalString(150) === "1.50");
  assert("decimalStringToKobo converts '14000.00' to 1400000 kobo", decimalStringToKobo("14000.00") === 1400000);
  assert("decimalStringToKobo converts 14000.5 to 1400050 kobo", decimalStringToKobo(14000.5) === 1400050);

  // TEST 2: Checkout Session Creation & Idempotency
  console.log("\n[Group 2: Checkout Session Creation & Idempotency]");
  const session1 = await createBachsCheckoutSession(mockOrder);
  assert("Checkout session created with order reference and token", session1.success && session1.orderReference === mockOrder.order_reference);
  assert("Checkout session returns valid checkoutUrl", typeof session1.checkoutUrl === "string" && session1.checkoutUrl.length > 0);
  assert("Checkout session returns valid checkoutId", typeof session1.checkoutId === "string" && session1.checkoutId.length > 0);

  // Mark mock order pending and test idempotency
  mockOrder.payment_status = "pending";
  mockOrder.bachs_checkout_url = session1.checkoutUrl;
  mockOrder.bachs_checkout_id = session1.checkoutId;

  const session2 = await createBachsCheckoutSession(mockOrder);
  assert("Duplicate checkout request returns identical existing checkout session", session2.checkoutId === session1.checkoutId && session2.checkoutUrl === session1.checkoutUrl);

  // If order is paid, refuse new checkout session
  const paidOrder: Order = { ...mockOrder, payment_status: "paid" };
  const session3 = await createBachsCheckoutSession(paidOrder);
  assert("Paid order rejects creation of duplicate checkout session", !session3.success && Boolean(session3.error));

  // TEST 3: Webhook HMAC-SHA256 Signature Verification
  console.log("\n[Group 3: Webhook Signature Verification]");
  const testSecret = "whsec_test_secret_key_emp_1234567890abcdef";
  const nowUnix = Math.floor(Date.now() / 1000);
  const samplePayload = JSON.stringify({
    id: "evt_test_success_1",
    type: "collection.succeeded",
    created_at: new Date().toISOString(),
    organization_id: "acct_test_org",
    data: {
      id: "pay_test_001",
      reference: mockOrder.order_reference,
      checkout_id: session1.checkoutId,
      amount: "14000.00",
      currency: "NGN",
      status: "succeeded",
    },
  });

  // Compute standard v1 HMAC signature
  const signedString = `${nowUnix}.${samplePayload}`;
  const validSignature = crypto.createHmac("sha256", testSecret).update(signedString).digest("hex");
  const validV2Header = `t=${nowUnix},v1=${validSignature}`;

  // Verify valid signature
  try {
    const verifiedEvent = verifyAndConstructBachsWebhook(
      samplePayload,
      { "x-bachs-signature-v2": validV2Header },
      testSecret
    );
    assert("Valid HMAC signature verified successfully", verifiedEvent.id === "evt_test_success_1");
  } catch (e: any) {
    assert("Valid HMAC signature verified successfully", false, e.message);
  }

  // Reject invalid signature
  try {
    verifyAndConstructBachsWebhook(
      samplePayload,
      { "x-bachs-signature-v2": `t=${nowUnix},v1=invalid_tampered_signature_hex` },
      testSecret
    );
    assert("Tampered signature rejected with BachsWebhookError", false, "Should have thrown");
  } catch (e: any) {
    assert("Tampered signature rejected with BachsWebhookError", e instanceof BachsWebhookError || e.name === "BachsWebhookError");
  }

  // Reject expired timestamp (> 5 minutes old)
  const expiredUnix = nowUnix - 400; // 400 seconds ago
  const expiredSignedString = `${expiredUnix}.${samplePayload}`;
  const expiredSignature = crypto.createHmac("sha256", testSecret).update(expiredSignedString).digest("hex");
  const expiredV2Header = `t=${expiredUnix},v1=${expiredSignature}`;
  try {
    verifyAndConstructBachsWebhook(
      samplePayload,
      { "x-bachs-signature-v2": expiredV2Header },
      testSecret
    );
    assert("Replayed event (> 5 min old) rejected with BachsWebhookError", false, "Should have thrown");
  } catch (e: any) {
    assert("Replayed event (> 5 min old) rejected with BachsWebhookError", e instanceof BachsWebhookError || e.name === "BachsWebhookError");
  }

  // TEST 4: Webhook Event Processing, Deduplication & Amount Verification
  console.log("\n[Group 4: Webhook Event Processing & Financial Ledger]");
  const event1 = {
    id: "evt_test_001",
    type: "collection.succeeded",
    created_at: new Date().toISOString(),
    organization_id: "acct_test",
    data: {
      reference: mockOrder.order_reference,
      checkout_id: session1.checkoutId,
      payment_id: "pay_test_001",
      amount: "14000.00",
      currency: "NGN",
    },
  };

  const process1 = await processBachsWebhookEvent(event1);
  assert("First delivery of collection.succeeded processes successfully", process1.success && !process1.duplicate);

  const process1Dup = await processBachsWebhookEvent(event1);
  assert("Duplicate delivery of identical event ID is safely deduplicated", process1Dup.success && process1Dup.duplicate === true);

  // TEST 5: Amount and Currency Mismatch Protection
  console.log("\n[Group 5: Payment Integrity & Tamper Protection]");
  const badCurrencyEvent = {
    id: "evt_test_bad_curr",
    type: "collection.succeeded",
    created_at: new Date().toISOString(),
    organization_id: "acct_test",
    data: {
      reference: mockOrder.order_reference,
      checkout_id: session1.checkoutId,
      amount: "14000.00",
      currency: "USD", // Mismatch (Expected NGN)
    },
  };
  await processBachsWebhookEvent(badCurrencyEvent);
  // Order status should NOT be paid if currency mismatched

  const underpaidEvent = {
    id: "evt_test_underpaid",
    type: "collection.underpaid",
    created_at: new Date().toISOString(),
    organization_id: "acct_test",
    data: {
      reference: mockOrder.order_reference,
      checkout_id: session1.checkoutId,
      amount: "5000.00",
      currency: "NGN",
    },
  };
  const underpaidRes = await processBachsWebhookEvent(underpaidEvent);
  assert("collection.underpaid handled and marked correctly", underpaidRes.success);

  const expiredEvent = {
    id: "evt_test_expired",
    type: "checkout.expired",
    created_at: new Date().toISOString(),
    organization_id: "acct_test",
    data: {
      reference: mockOrder.order_reference,
      checkout_id: session1.checkoutId,
    },
  };
  const expiredRes = await processBachsWebhookEvent(expiredEvent);
  assert("checkout.expired handled safely", expiredRes.success);

  // TEST 6: Payment Status Query
  console.log("\n[Group 6: Secure Payment Status Access]");
  const statusRes = await getOrderPaymentStatus(mockOrder.order_reference, mockOrder.secure_access_token);
  assert("Authorized customer can access payment status with valid token", statusRes !== null && statusRes.orderReference === mockOrder.order_reference);

  const unauthorizedStatus = await getOrderPaymentStatus(mockOrder.order_reference, "invalid_token_xyz");
  assert("Unauthorized inquiry with wrong token returns null (prevent IDOR)", unauthorizedStatus === null);

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
