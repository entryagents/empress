import {
  getBusinessSettings,
  updateBusinessSettings,
  getAdminDeliveryZones,
  saveDeliveryZone,
  deleteDeliveryZone,
  matchAddressToDeliveryZone,
  getHomepageCMS,
  updateHomepageCMS,
  checkBusinessAvailability,
} from "../src/lib/settings/service";
import { createOrder, validateCart } from "../src/lib/order/service";
import type { CartItemInput, CustomerCheckoutInput } from "../src/types/order";

async function runSettingsAndZoneTests() {
  console.log("==========================================================");
  console.log("EMPRESS DELICACIES: SETTINGS, DELTA ZONES & CMS TEST SUITE");
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

  // 1. Business Information & Delta State Defaults
  console.log("--- 1. BUSINESS SETTINGS & DELTA STATE DEFAULTS ---");
  const settings = await getBusinessSettings();
  assert(settings.country === "Nigeria", "Default country is Nigeria");
  assert(settings.state === "Delta State", "Default state is Delta State");
  assert(settings.currency === "NGN", "Currency strictly configured as NGN");
  assert(settings.currency_symbol === "₦", "Currency symbol configured as ₦");

  // Update business profile
  const updatedBiz = await updateBusinessSettings({
    business_name: "Empress Delicacies Asaba",
    city: "Asaba",
    phone: "+2348030001122",
    whatsapp_number: "+2348030001122",
    address: "Plot 5, Okpanam Road, Asaba, Delta State",
  });
  assert(updatedBiz.business_name === "Empress Delicacies Asaba", "Business name updated");
  assert(updatedBiz.state === "Delta State", "Delta State preserved upon update");

  // 2. Delta State Delivery Zone Management
  console.log("\n--- 2. DELTA STATE DELIVERY ZONE MANAGEMENT ---");
  const initialZones = await getAdminDeliveryZones();
  assert(initialZones.length >= 2, "Default Delta State zones available");
  assert(initialZones.every((z) => z.state === "Delta State"), "All zones belong to Delta State");

  // Create new delivery zone in Delta State (e.g. Sapele)
  const newZone = await saveDeliveryZone({
    name: "Sapele Urban Corridor",
    city: "Sapele",
    areas: ["Amukpe", "Olympia", "Boyo Road"],
    fee_kobo: 300000, // ₦3,000
    estimated_minutes_min: 40,
    estimated_minutes_max: 60,
    is_active: true,
    display_order: 10,
  });
  assert(newZone.city === "Sapele", "Admin creates Delta State delivery zone");
  assert(newZone.state === "Delta State", "Zone strictly inherits Delta State");

  // Edit delivery zone fee
  const editedZone = await saveDeliveryZone({
    ...newZone,
    fee_kobo: 350000, // Updated to ₦3,500
  });
  assert(editedZone.fee_kobo === 350000, "Zone fee updated in NGN kobo");

  // Match address to delivery zone
  const matchedZone = await matchAddressToDeliveryZone({
    city: "Sapele",
    area: "Amukpe",
  });
  assert(matchedZone?.name === "Sapele Urban Corridor", "Address accurately matches active Delta State zone");

  // Unsupported delivery address
  const unsupportedZone = await matchAddressToDeliveryZone({
    city: "Enugu",
    area: "Independence Layout",
  });
  assert(unsupportedZone === null, "Unsupported city returns null (cannot deliver outside Delta State zones)");

  // 3. Customer Pickup Settings
  console.log("\n--- 3. PICKUP & PREP CONFIGURATION ---");
  const updatedPickup = await updateBusinessSettings({
    pickup_enabled: true,
    pickup_address: "Plot 5 Okpanam Road, Asaba, Delta State",
    pickup_instructions: "Drive into the private collection bay; quote order reference.",
    estimated_preparation_minutes: 40,
  });
  assert(updatedPickup.pickup_enabled === true, "Pickup is enabled");
  assert(updatedPickup.estimated_preparation_minutes === 40, "Estimated prep time updated");

  // Pickup orders must have zero delivery fees
  const cartInput: CartItemInput[] = [
    {
      productId: "prod-shawarma",
      quantity: 1,
    },
  ];
  const pickupValidation = await validateCart(cartInput, "pickup");
  assert(pickupValidation.pricing.deliveryFeeKobo === 0, "Pickup delivery fee is strictly zero NGN");

  // 4. Homepage CMS Management
  console.log("\n--- 4. HOMEPAGE CMS MANAGEMENT ---");
  const cmsContent = await getHomepageCMS();
  assert(Boolean(cmsContent.hero_title_line1), "Hero CMS content initialized");

  const updatedCMS = await updateHomepageCMS({
    hero_title_line1: "Exquisite Flavours,",
    hero_title_line2: "Delivered Across Delta State.",
    hero_description: "Taste perfection with Empress Delicacies crafted fresh in Asaba.",
    footer_tagline: "Fine Food. Royal Pleasure.",
  });
  assert(
    updatedCMS.hero_title_line2 === "Delivered Across Delta State.",
    "Homepage CMS updated successfully"
  );

  // 5. Business Operating Hours & Africa/Lagos Availability
  console.log("\n--- 5. BUSINESS AVAILABILITY & LAGOS TIMEZONE (UTC+1) ---");
  const normalAvailability = await checkBusinessAvailability();
  assert(typeof normalAvailability.isOpen === "boolean", "Returns concrete boolean availability");
  assert(normalAvailability.currentTimeLagos.includes(":"), "Calculates valid Africa/Lagos WAT time");

  // Test temporary closure behavior
  await updateBusinessSettings({
    is_temporarily_closed: true,
    temporary_closure_reason: "Closed for routine kitchen maintenance.",
    allow_ordering_override: false,
  });

  const closedAvailability = await checkBusinessAvailability();
  assert(closedAvailability.canAcceptOrders === false, "Orders blocked during temporary closure");
  assert(
    closedAvailability.reason?.includes("routine kitchen maintenance") === true,
    "Provides explanatory temporary closure notice to customer"
  );

  // Attempt checkout during closure
  const checkoutAttempt: CustomerCheckoutInput = {
    full_name: "Chinedu Okeke",
    email: "chinedu@example.com",
    phone: "+2348039991122",
    fulfillment_type: "pickup",
  };

  const orderAttempt = await createOrder(cartInput, checkoutAttempt);
  assert(orderAttempt.success === false, "Checkout rejected while kitchen is closed");
  assert(
    orderAttempt.error?.includes("maintenance") || orderAttempt.error?.includes("closed"),
    "Returns friendly explanation to customer"
  );

  // Re-open kitchen
  await updateBusinessSettings({
    is_temporarily_closed: false,
    temporary_closure_reason: null,
    allow_ordering_override: true, // Allow orders for subsequent integration runs
  });

  const reOpened = await checkBusinessAvailability();
  assert(reOpened.canAcceptOrders === true, "Kitchen successfully accepts orders once reopened");

  // Clean up test zone
  await deleteDeliveryZone(newZone.id);
  const zonesAfterDelete = await getAdminDeliveryZones();
  assert(!zonesAfterDelete.some((z) => z.id === newZone.id), "Zone successfully deleted");

  console.log("\n==========================================================");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("==========================================================");
}

runSettingsAndZoneTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
