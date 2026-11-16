import assert from "node:assert";
import {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerAddresses,
  saveCustomerAddress,
  deleteCustomerAddress,
  getCustomerOrders,
  claimGuestOrderForAccount,
} from "../src/lib/customer/service";
import { createOrder } from "../src/lib/order/service";

async function runCustomerAuthTests() {
  console.log("▶ Running Customer Auth, Account & Address Management Test Suite...\n");

  const testUserId = "user-test-uuid-4242";
  const testUserEmail = "amina.bello@example.ng";

  // 1. Profile Management & Role Escalation Protection
  console.log("1. Testing Customer Profile Management & Role Immutability...");
  const initialProfile = await updateCustomerProfile(testUserId, {
    full_name: "Amina Bello",
    phone: "+234 803 111 2222",
  });

  assert(initialProfile !== null, "Profile must be created");
  assert.strictEqual(initialProfile.full_name, "Amina Bello");
  assert.strictEqual(initialProfile.phone, "+234 803 111 2222");
  assert.strictEqual(initialProfile.role, "customer", "Role must be 'customer' by default and cannot be self-escalated");

  const fetchedProfile = await getCustomerProfile(testUserId);
  assert.strictEqual(fetchedProfile?.full_name, "Amina Bello");
  console.log("   ✔ Customer profile updated and role protected.");

  // 2. Saved Delivery Address Management
  console.log("2. Testing Saved Delivery Addresses & Default Address Switching...");
  // Save Address 1 (Home)
  const homeAddr = await saveCustomerAddress(testUserId, {
    label: "Home",
    state: "Lagos",
    city: "Lagos",
    area: "Victoria Island",
    street_address: "12 Bishop Oluwole Street",
    building_number: "Flat 4A",
    landmark: "Behind Eko Hotel",
    delivery_instructions: "Call security gate upon arrival",
    is_default: true,
  });

  assert(homeAddr.id !== undefined, "Saved address must have an ID");
  assert.strictEqual(homeAddr.is_default, true, "First address should be default");

  // Save Address 2 (Office - set as new default)
  const officeAddr = await saveCustomerAddress(testUserId, {
    label: "Work Studio",
    state: "Lagos",
    city: "Lagos",
    area: "Lekki Phase 1",
    street_address: "Admiralty Way",
    building_number: "Plot 14",
    landmark: "Opposite Domino's Pizza",
    delivery_instructions: "Leave at front desk reception",
    is_default: true,
  });

  // Verify list: officeAddr must now be default, homeAddr must be non-default
  const addressList = await getCustomerAddresses(testUserId);
  assert.strictEqual(addressList.length, 2, "Customer should have 2 saved addresses");
  assert.strictEqual(addressList[0].id, officeAddr.id, "Default address must be sorted first");
  assert.strictEqual(addressList[0].is_default, true, "New address must be marked default");
  assert.strictEqual(addressList[1].is_default, false, "Previous address must have is_default set to false");

  // Delete address
  await deleteCustomerAddress(testUserId, homeAddr.id);
  const remainingAddresses = await getCustomerAddresses(testUserId);
  assert.strictEqual(remainingAddresses.length, 1, "Should have 1 address after deletion");
  assert.strictEqual(remainingAddresses[0].id, officeAddr.id);
  console.log("   ✔ Saved delivery addresses CRUD and default toggling passed.");

  // 3. Guest Order Creation & Account Association
  console.log("3. Testing Guest Order Claiming & Account Association...");
  const guestCart = [
    {
      productId: "prod-shawarma",
      quantity: 1,
    },
  ];

  // Guest places order under testUserEmail
  const guestOrderRes = await createOrder(guestCart, {
    full_name: "Amina Guest",
    email: testUserEmail,
    phone: "+234 803 111 2222",
    fulfillment_type: "delivery",
    address: {
      state: "Lagos",
      city: "Lagos",
      area: "Victoria Island",
      street_address: "12 Bishop Oluwole St",
    },
    delivery_zone_id: "zone-vi-ikoyi",
    idempotency_key: "idem-guest-claim-001",
  });

  assert(guestOrderRes.success && guestOrderRes.order, "Guest order creation must succeed");
  const guestOrder = guestOrderRes.order!;
  assert.strictEqual(guestOrder.user_id, null, "Guest order must start with user_id = null");

  // Attempt claim with wrong email (should fail)
  const badEmailClaim = await claimGuestOrderForAccount(
    testUserId,
    "wrong.person@example.ng",
    guestOrder.order_reference,
    guestOrder.secure_access_token
  );
  assert(!badEmailClaim.success, "Claiming order placed under different email must be rejected");

  // Attempt claim with wrong token / phone (should fail)
  const badTokenClaim = await claimGuestOrderForAccount(
    testUserId,
    testUserEmail,
    guestOrder.order_reference,
    "wrong-token-999"
  );
  assert(!badTokenClaim.success, "Claiming order with invalid token must be rejected");

  // Legitimate claim by rightful account owner
  const validClaim = await claimGuestOrderForAccount(
    testUserId,
    testUserEmail,
    guestOrder.order_reference,
    guestOrder.secure_access_token
  );
  assert(validClaim.success, `Legitimate claim should succeed: ${validClaim.message}`);

  // Verify order is now listed under customer's order history
  const customerOrders = await getCustomerOrders(testUserId, testUserEmail);
  const claimed = customerOrders.find((o) => o.order_reference === guestOrder.order_reference);
  assert(claimed !== undefined, "Claimed order must appear in customer order history");
  assert.strictEqual(claimed?.user_id, testUserId, "Claimed order must have user_id associated");
  console.log("   ✔ Guest order verification and secure account linking passed.");

  console.log("\n🎉 ALL CUSTOMER AUTHENTICATION, ACCOUNT & ADDRESS TESTS PASSED!");
}

runCustomerAuthTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
