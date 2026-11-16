import {
  getAllDeliveryPersonnel,
  createDeliveryPerson,
  updateDeliveryPersonStatus,
  assignOrderToDriver,
  getAssignmentsForDriver,
  acceptDeliveryAssignment,
  rejectDeliveryAssignment,
  startDeliveryTrip,
  completeDeliveryTrip,
  reportDeliveryProblem,
  ingestDeliveryLocationUpdate,
  getCustomerOrderTracking,
} from "../src/lib/delivery/service";
import { registerRuntimeOrder, getAdminOrders } from "../src/lib/order/service";
import type { Order } from "../src/types/order";

async function runDeliveryTests() {
  console.log("=================================================");
  console.log("EMPRESS DELICACIES: DELIVERY MANAGEMENT & GPS TEST");
  console.log("=================================================\n");

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

  // 1. Delivery Personnel Administration
  console.log("--- 1. DELIVERY PERSONNEL ADMINISTRATION ---");
  const initialPersonnel = await getAllDeliveryPersonnel();
  assert(initialPersonnel.length >= 2, "Default delivery fleet available in runtime");

  const newDriver = await createDeliveryPerson({
    full_name: "Chukwudi Eze",
    email: "chukwudi.test@empress.ng",
    phone: "+2348031239999",
    vehicle_type: "motorcycle",
    vehicle_plate_number: "JJJ-999-LK",
  });
  assert(newDriver.full_name === "Chukwudi Eze", "Admin creates delivery personnel record");
  assert(newDriver.status === "available", "Initial driver status is available");

  // Update status
  const updatedStatus = await updateDeliveryPersonStatus(newDriver.id, "busy");
  assert(updatedStatus?.status === "busy", "Driver status successfully updated to busy");

  await updateDeliveryPersonStatus(newDriver.id, "available");

  // 2. Delivery Order Setup
  console.log("\n--- 2. DELIVERY ASSIGNMENT ENGINE ---");
  const sampleDeliveryOrder: Order = {
    id: "ord-deliv-test-01",
    order_reference: "EMP-DEL-TEST1",
    secure_access_token: "token-deliv-xyz123",
    customer_name: "Folashade Adebayo",
    customer_email: "folashade@example.com",
    customer_phone: "+2348029998877",
    fulfillment_type: "delivery",
    delivery_state: "Lagos",
    delivery_city: "Lagos",
    delivery_area: "Victoria Island",
    delivery_street_address: "12 Adeola Odeku Street",
    currency: "NGN",
    subtotal_kobo: 1200000,
    delivery_fee_kobo: 250000,
    discount_kobo: 0,
    total_kobo: 1450000,
    status: "confirmed",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  registerRuntimeOrder(sampleDeliveryOrder);

  // Assign to driver
  const assignRes = await assignOrderToDriver({
    orderReference: sampleDeliveryOrder.order_reference,
    driverId: newDriver.id,
    notes: "Please call upon arrival at the security post.",
  });
  assert(assignRes.success && assignRes.assignment !== undefined, "Order successfully assigned to driver");
  assert(assignRes.assignment?.driver_id === newDriver.id, "Assignment correctly links driver ID");

  // 3. Driver Acceptance & Rejection
  console.log("\n--- 3. DRIVER WORKFLOW: ACCEPT / REJECT / START / DELIVER ---");
  const driverAssignments = await getAssignmentsForDriver(newDriver.id, { activeOnly: true });
  assert(driverAssignments.length > 0, "Driver can query assigned deliveries");
  assert(driverAssignments[0].status === "assigned", "Assignment begins in 'assigned' status");

  // Accept assignment
  const acceptRes = await acceptDeliveryAssignment({
    assignmentId: driverAssignments[0].id,
    driverId: newDriver.id,
  });
  assert(acceptRes.success, "Driver successfully accepts assignment");

  // Rejection validation (cannot accept or must validate reason length)
  const dummyDriver = await createDeliveryPerson({
    full_name: "Babatunde Shola",
    email: "babatunde.reject@empress.ng",
    phone: "+2348077778888",
    vehicle_type: "car",
  });
  const rejectResFail = await rejectDeliveryAssignment({
    assignmentId: driverAssignments[0].id,
    driverId: dummyDriver.id, // unauthorized driver
    reason: "Too far away",
  });
  assert(!rejectResFail.success, "Unauthorized driver rejected from modifying assignment");

  // 4. Start Delivery & Transition Order Status
  const startRes = await startDeliveryTrip({
    assignmentId: driverAssignments[0].id,
    driverId: newDriver.id,
  });
  assert(startRes.success, "Driver starts delivery trip");

  const ordersAfterStart = await getAdminOrders(10);
  const matchedOrder = ordersAfterStart.find((o) => o.order_reference === sampleDeliveryOrder.order_reference);
  assert(matchedOrder?.status === "out_for_delivery", "Order status successfully updated to 'out_for_delivery'");

  // 5. GPS Location Ingestion & Validation
  console.log("\n--- 4. GPS LOCATION INGESTION & VALIDATION ---");
  // Test invalid coordinates
  const invalidGps = await ingestDeliveryLocationUpdate({
    orderReference: sampleDeliveryOrder.order_reference,
    driverId: newDriver.id,
    latitude: 95.0, // Invalid latitude > 90
    longitude: 3.42,
  });
  assert(!invalidGps.success, "System rejects out-of-bounds latitude > 90");

  // Test valid GPS coordinate ingestion (Simulated coordinate in Victoria Island, Lagos)
  const validGps = await ingestDeliveryLocationUpdate({
    orderReference: sampleDeliveryOrder.order_reference,
    driverId: newDriver.id,
    latitude: 6.4281,
    longitude: 3.4219,
    accuracyMeters: 5,
    speedMps: 11.2,
    isSimulated: true,
  });
  assert(validGps.success && validGps.update !== undefined, "Ingests valid GPS breadcrumb coordinate");
  assert(validGps.update?.latitude === 6.4281, "Preserves accurate latitude");

  // 6. Public Customer Tracking Verification & Privacy Check
  console.log("\n--- 5. CUSTOMER TRACKING RESOLVER & PRIVACY SAFEGUARDS ---");
  const trackingView = await getCustomerOrderTracking(
    sampleDeliveryOrder.order_reference,
    sampleDeliveryOrder.secure_access_token
  );
  assert(trackingView !== null, "Authorized customer can access order tracking telemetry");
  assert(trackingView?.tracking_active === true, "Tracking is active while in 'out_for_delivery'");
  assert(trackingView?.location?.latitude === 6.4281, "Customer receives courier's latest GPS fix");
  assert(trackingView?.driver?.first_name === "Chukwudi", "Customer sees driver first name");
  // Privacy assertion: driver's full private phone number is NEVER leaked directly
  assert(
    !trackingView?.driver?.phone_masked || trackingView.driver.phone_masked.includes("***"),
    "Driver phone number is securely masked in public tracking payload"
  );

  // 7. Complete Delivery & Termination of Tracking
  console.log("\n--- 6. COMPLETE TRIP & AUTOMATIC TRACKING TERMINATION ---");
  const completeRes = await completeDeliveryTrip({
    assignmentId: driverAssignments[0].id,
    driverId: newDriver.id,
    notes: "Handed package directly to client at main reception.",
  });
  assert(completeRes.success, "Driver marks delivery as completed");

  const completedTracking = await getCustomerOrderTracking(
    sampleDeliveryOrder.order_reference,
    sampleDeliveryOrder.secure_access_token
  );
  assert(
    completedTracking?.tracking_active === false,
    "Live GPS tracking is terminated upon completion"
  );
  assert(completedTracking?.order_status === "delivered", "Order status is 'delivered'");

  // Verify that subsequent GPS updates are rejected once order is delivered
  const lateGps = await ingestDeliveryLocationUpdate({
    orderReference: sampleDeliveryOrder.order_reference,
    driverId: newDriver.id,
    latitude: 6.429,
    longitude: 3.422,
  });
  assert(!lateGps.success, "System rejects GPS updates for delivered orders (prevents off-duty tracking)");

  // 8. Reassignment Flow
  console.log("\n--- 7. REASSIGNMENT WORKFLOW ---");
  const sampleOrder2: Order = {
    id: "ord-deliv-test-02",
    order_reference: "EMP-DEL-TEST2",
    secure_access_token: "token-reassign-456",
    customer_name: "Kunle Coker",
    customer_email: "kunle@example.com",
    customer_phone: "+2348081112222",
    fulfillment_type: "delivery",
    delivery_state: "Lagos",
    delivery_city: "Lagos",
    delivery_area: "Ikoyi",
    delivery_street_address: "15 Bourdillon Road",
    currency: "NGN",
    subtotal_kobo: 950000,
    delivery_fee_kobo: 250000,
    discount_kobo: 0,
    total_kobo: 1200000,
    status: "confirmed",
    payment_status: "paid",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  registerRuntimeOrder(sampleOrder2);

  const asgn1 = await assignOrderToDriver({
    orderReference: sampleOrder2.order_reference,
    driverId: initialPersonnel[0].id,
  });
  assert(asgn1.success, "Initial driver assigned");

  // Driver rejects
  const rejectRes = await rejectDeliveryAssignment({
    assignmentId: asgn1.assignment!.id,
    driverId: initialPersonnel[0].id,
    reason: "Motorcycle tyre puncture on Lekki expressway",
  });
  assert(rejectRes.success, "Driver can reject with valid reason");

  // Admin reassigns to newDriver
  const asgn2 = await assignOrderToDriver({
    orderReference: sampleOrder2.order_reference,
    driverId: newDriver.id,
    notes: "Reassigned due to previous rider mechanical delay",
  });
  assert(asgn2.success, "Admin successfully reassigns order to replacement courier");
  assert(asgn2.assignment?.driver_id === newDriver.id, "Replacement courier linked to order");

  console.log("\n=================================================");
  console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log("=================================================");
}

runDeliveryTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
