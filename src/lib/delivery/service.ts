import type {
  DeliveryPersonnel,
  DeliveryAssignment,
  DeliveryLocationUpdate,
  DeliveryPersonStatus,
  DeliveryVehicleType,
  DeliveryAssignmentStatus,
  PublicDeliveryTrackingInfo,
} from "@/types/delivery";
import type { Order } from "@/types/order";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrderByReferenceAndToken, updateAdminOrderStatus } from "@/lib/order/service";

// In-memory runtime persistence for testing & serverless failover
let runtimePersonnel: DeliveryPersonnel[] = [
  {
    id: "dp-tunde-01",
    full_name: "Tunde Bakare",
    email: "tunde.delivery@empress.ng",
    phone: "+2348021112233",
    vehicle_type: "motorcycle",
    vehicle_plate_number: "LAG-492-XY",
    status: "available",
    is_active: true,
    current_latitude: 6.4312,
    current_longitude: 3.4219,
    last_location_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dp-emeka-02",
    full_name: "Emeka Okonkwo",
    email: "emeka.delivery@empress.ng",
    phone: "+2348035556677",
    vehicle_type: "motorcycle",
    vehicle_plate_number: "KJA-818-AA",
    status: "available",
    is_active: true,
    current_latitude: 6.4421,
    current_longitude: 3.435,
    last_location_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "dp-aminu-03",
    full_name: "Aminu Bello",
    email: "aminu.delivery@empress.ng",
    phone: "+2348098889900",
    vehicle_type: "car",
    vehicle_plate_number: "APP-320-ZZ",
    status: "offline",
    is_active: true,
    current_latitude: null,
    current_longitude: null,
    last_location_updated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let runtimeAssignments: DeliveryAssignment[] = [];
let runtimeLocationUpdates: DeliveryLocationUpdate[] = [];

// Realtime listeners in-memory bus for local testing & live subscribers
type LocationListener = (update: DeliveryLocationUpdate) => void;
const orderLocationListeners: Map<string, Set<LocationListener>> = new Map();

export function subscribeToOrderLocation(orderReference: string, listener: LocationListener) {
  const ref = orderReference.toUpperCase();
  if (!orderLocationListeners.has(ref)) {
    orderLocationListeners.set(ref, new Set());
  }
  orderLocationListeners.get(ref)!.add(listener);

  return () => {
    const listeners = orderLocationListeners.get(ref);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        orderLocationListeners.delete(ref);
      }
    }
  };
}

function broadcastLocalLocation(update: DeliveryLocationUpdate) {
  const listeners = orderLocationListeners.get(update.order_reference.toUpperCase());
  if (listeners) {
    listeners.forEach((listener) => {
      try {
        listener(update);
      } catch (e) {
        console.error("Error in location listener:", e);
      }
    });
  }
}

/**
 * ----------------------------------------------------------------------------
 * DELIVERY PERSONNEL MANAGEMENT (ADMIN)
 * ----------------------------------------------------------------------------
 */

export async function getAllDeliveryPersonnel(): Promise<DeliveryPersonnel[]> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("delivery_personnel")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as DeliveryPersonnel[];
      }
    } catch {
      // Fallback
    }
  }
  return [...runtimePersonnel];
}

export async function getDeliveryPersonById(driverId: string): Promise<DeliveryPersonnel | null> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("delivery_personnel")
        .select("*")
        .eq("id", driverId)
        .single();
      if (!error && data) return data as DeliveryPersonnel;
    } catch {
      // Fallback
    }
  }
  return runtimePersonnel.find((p) => p.id === driverId) || null;
}

export async function getDeliveryPersonByUserId(userId: string): Promise<DeliveryPersonnel | null> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("delivery_personnel")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error && data) return data as DeliveryPersonnel;
    } catch {
      // Fallback
    }
  }
  // Check runtime match by id or email
  return runtimePersonnel.find((p) => p.id === userId) || null;
}

export async function createDeliveryPerson(input: {
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: DeliveryVehicleType;
  vehicle_plate_number?: string;
}): Promise<DeliveryPersonnel> {
  const now = new Date().toISOString();
  const newDriver: DeliveryPersonnel = {
    id: `dp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    full_name: input.full_name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    vehicle_type: input.vehicle_type,
    vehicle_plate_number: input.vehicle_plate_number?.trim() || null,
    status: "available",
    is_active: true,
    current_latitude: null,
    current_longitude: null,
    last_location_updated_at: null,
    created_at: now,
    updated_at: now,
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("delivery_personnel")
        .insert([newDriver])
        .select()
        .single();
      if (!error && data) return data as DeliveryPersonnel;
    } catch {
      // Fallback
    }
  }

  runtimePersonnel.unshift(newDriver);
  return newDriver;
}

export async function updateDeliveryPersonStatus(
  driverId: string,
  status: DeliveryPersonStatus,
  isActive?: boolean
): Promise<DeliveryPersonnel | null> {
  const now = new Date().toISOString();
  const admin = getSupabaseAdminClient();

  const updates: Record<string, unknown> = {
    status,
    updated_at: now,
  };
  if (typeof isActive === "boolean") {
    updates.is_active = isActive;
  }

  if (admin) {
    try {
      const { data, error } = await admin
        .from("delivery_personnel")
        .update(updates)
        .eq("id", driverId)
        .select()
        .single();
      if (!error && data) return data as DeliveryPersonnel;
    } catch {
      // Fallback
    }
  }

  const idx = runtimePersonnel.findIndex((p) => p.id === driverId);
  if (idx >= 0) {
    runtimePersonnel[idx] = {
      ...runtimePersonnel[idx],
      status,
      is_active: typeof isActive === "boolean" ? isActive : runtimePersonnel[idx].is_active,
      updated_at: now,
    };
    return runtimePersonnel[idx];
  }
  return null;
}

/**
 * ----------------------------------------------------------------------------
 * ASSIGNMENT MANAGEMENT (ADMIN & DISPATCH)
 * ----------------------------------------------------------------------------
 */

export async function assignOrderToDriver(params: {
  orderReference: string;
  driverId: string;
  assignedByUserId?: string;
  notes?: string;
}): Promise<{ success: boolean; assignment?: DeliveryAssignment; error?: string }> {
  const order = await getOrderByReferenceAndToken(params.orderReference);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.fulfillment_type !== "delivery") {
    return { success: false, error: "Cannot assign delivery driver to a customer pickup order." };
  }

  if (order.status === "cancelled" || order.status === "delivered") {
    return { success: false, error: `Order is already ${order.status} and cannot be assigned.` };
  }

  const driver = await getDeliveryPersonById(params.driverId);
  if (!driver) {
    return { success: false, error: "Delivery personnel not found." };
  }

  if (!driver.is_active) {
    return { success: false, error: "Selected delivery personnel is deactivated." };
  }

  const now = new Date().toISOString();
  const assignmentId = `asgn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const assignment: DeliveryAssignment = {
    id: assignmentId,
    order_id: order.id,
    order_reference: order.order_reference,
    driver_id: driver.id,
    status: "assigned",
    assigned_by: params.assignedByUserId || null,
    assigned_at: now,
    notes: params.notes || null,
    created_at: now,
    updated_at: now,
    driver,
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      // Insert assignment
      await admin.from("delivery_assignments").insert([assignment]);
      // Update order
      await admin
        .from("orders")
        .update({
          assigned_driver_id: driver.id,
          delivery_assigned_at: now,
        })
        .eq("id", order.id);
    } catch {
      // Fallback
    }
  }

  // Update in-memory order
  order.assigned_driver_id = driver.id;
  order.delivery_assigned_at = now;
  order.assigned_driver = {
    id: driver.id,
    full_name: driver.full_name,
    phone: driver.phone,
    vehicle_type: driver.vehicle_type,
    vehicle_plate_number: driver.vehicle_plate_number,
  };

  // Supersede existing active assignments for this order
  runtimeAssignments.forEach((a) => {
    if (a.order_reference === order.order_reference && a.status === "assigned") {
      a.status = "cancelled";
      a.notes = "Reassigned to another driver";
      a.updated_at = now;
    }
  });
  runtimeAssignments.unshift(assignment);

  return { success: true, assignment };
}

export async function getAssignmentsForDriver(
  driverId: string,
  options?: { activeOnly?: boolean }
): Promise<(DeliveryAssignment & { order?: Order })[]> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      let query = admin
        .from("delivery_assignments")
        .select("*, order:orders(*)")
        .eq("driver_id", driverId)
        .order("assigned_at", { ascending: false });

      if (options?.activeOnly) {
        query = query.in("status", ["assigned", "accepted", "picked_up", "in_transit"]);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as (DeliveryAssignment & { order?: Order })[];
      }
    } catch {
      // Fallback
    }
  }

  // Runtime search
  const { getAdminOrders } = await import("@/lib/order/service");
  const allOrders = await getAdminOrders(100);

  return runtimeAssignments
    .filter((a) => {
      if (a.driver_id !== driverId) return false;
      if (options?.activeOnly) {
        return ["assigned", "accepted", "picked_up", "in_transit"].includes(a.status);
      }
      return true;
    })
    .map((a) => ({
      ...a,
      order: allOrders.find((o) => o.order_reference === a.order_reference),
    }));
}

export async function getActiveDeliveriesAdmin(): Promise<
  {
    assignment: DeliveryAssignment;
    order: Order;
    driver: DeliveryPersonnel;
    latestLocation?: DeliveryLocationUpdate;
  }[]
> {
  const { getAdminOrders } = await import("@/lib/order/service");
  const allOrders = await getAdminOrders(100);
  const activeOrders = allOrders.filter(
    (o) =>
      o.fulfillment_type === "delivery" &&
      ["ready_for_dispatch", "out_for_delivery", "dispatched", "preparing", "confirmed"].includes(o.status)
  );

  const results: {
    assignment: DeliveryAssignment;
    order: Order;
    driver: DeliveryPersonnel;
    latestLocation?: DeliveryLocationUpdate;
  }[] = [];

  for (const ord of activeOrders) {
    if (!ord.assigned_driver_id) continue;
    const driver =
      (await getDeliveryPersonById(ord.assigned_driver_id)) ||
      runtimePersonnel.find((p) => p.id === ord.assigned_driver_id);
    if (!driver) continue;

    const assignment =
      runtimeAssignments.find(
        (a) => a.order_reference === ord.order_reference && a.driver_id === driver.id
      ) || {
        id: `asgn-rt-${ord.order_reference}`,
        order_id: ord.id,
        order_reference: ord.order_reference,
        driver_id: driver.id,
        status: (ord.status === "out_for_delivery" ? "in_transit" : "assigned") as DeliveryAssignmentStatus,
        assigned_at: ord.delivery_assigned_at || ord.created_at,
        created_at: ord.created_at,
        updated_at: ord.updated_at,
        driver,
      };

    const latestLocation = runtimeLocationUpdates
      .filter((loc) => loc.order_reference === ord.order_reference)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];

    results.push({
      assignment,
      order: ord,
      driver,
      latestLocation,
    });
  }

  return results;
}

/**
 * ----------------------------------------------------------------------------
 * DRIVER WORKFLOW ACTIONS (MOBILE DASHBOARD)
 * ----------------------------------------------------------------------------
 */

export async function acceptDeliveryAssignment(params: {
  assignmentId: string;
  driverId: string;
}): Promise<{ success: boolean; error?: string }> {
  const assignment = runtimeAssignments.find((a) => a.id === params.assignmentId);
  if (!assignment || assignment.driver_id !== params.driverId) {
    return { success: false, error: "Assignment not found or not authorized for this driver." };
  }

  if (assignment.status !== "assigned") {
    return { success: false, error: `Assignment cannot be accepted from status '${assignment.status}'.` };
  }

  const now = new Date().toISOString();
  assignment.status = "accepted";
  assignment.accepted_at = now;
  assignment.updated_at = now;

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin
        .from("delivery_assignments")
        .update({ status: "accepted", accepted_at: now, updated_at: now })
        .eq("id", params.assignmentId);
    } catch {
      // Fallback
    }
  }

  return { success: true };
}

export async function rejectDeliveryAssignment(params: {
  assignmentId: string;
  driverId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!params.reason || params.reason.trim().length < 5) {
    return { success: false, error: "A valid rejection reason (minimum 5 characters) is required." };
  }

  const assignment = runtimeAssignments.find((a) => a.id === params.assignmentId);
  if (!assignment || assignment.driver_id !== params.driverId) {
    return { success: false, error: "Assignment not found or not authorized for this driver." };
  }

  const now = new Date().toISOString();
  assignment.status = "rejected";
  assignment.rejected_at = now;
  assignment.rejection_reason = params.reason.trim();
  assignment.updated_at = now;

  // Unassign order so admin can reassign
  const order = await getOrderByReferenceAndToken(assignment.order_reference);
  if (order) {
    order.assigned_driver_id = null;
    order.assigned_driver = null;
  }

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin
        .from("delivery_assignments")
        .update({
          status: "rejected",
          rejected_at: now,
          rejection_reason: params.reason.trim(),
          updated_at: now,
        })
        .eq("id", params.assignmentId);

      if (order) {
        await admin
          .from("orders")
          .update({ assigned_driver_id: null })
          .eq("id", order.id);
      }
    } catch {
      // Fallback
    }
  }

  return { success: true };
}

export async function startDeliveryTrip(params: {
  assignmentId: string;
  driverId: string;
}): Promise<{ success: boolean; error?: string }> {
  const assignment = runtimeAssignments.find((a) => a.id === params.assignmentId);
  if (!assignment || assignment.driver_id !== params.driverId) {
    return { success: false, error: "Assignment not found or not authorized for this driver." };
  }

  const now = new Date().toISOString();
  assignment.status = "in_transit";
  assignment.picked_up_at = now;
  assignment.updated_at = now;

  // Update order status to out_for_delivery
  const statusRes = await updateAdminOrderStatus({
    orderReference: assignment.order_reference,
    newStatus: "out_for_delivery",
    changedByUserId: params.driverId,
    changedByName: "Delivery Personnel",
    notes: "Driver picked up food packages and initiated transit.",
  });

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin
        .from("delivery_assignments")
        .update({
          status: "in_transit",
          picked_up_at: now,
          updated_at: now,
        })
        .eq("id", params.assignmentId);
    } catch {
      // Fallback
    }
  }

  // Update driver status to busy
  await updateDeliveryPersonStatus(params.driverId, "busy");

  return { success: statusRes.success, error: statusRes.error };
}

export async function completeDeliveryTrip(params: {
  assignmentId: string;
  driverId: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const assignment = runtimeAssignments.find((a) => a.id === params.assignmentId);
  if (!assignment || assignment.driver_id !== params.driverId) {
    return { success: false, error: "Assignment not found or not authorized for this driver." };
  }

  const now = new Date().toISOString();
  assignment.status = "delivered";
  assignment.delivered_at = now;
  assignment.notes = params.notes || assignment.notes;
  assignment.updated_at = now;

  // Update order status to delivered
  const statusRes = await updateAdminOrderStatus({
    orderReference: assignment.order_reference,
    newStatus: "delivered",
    changedByUserId: params.driverId,
    changedByName: "Delivery Personnel",
    notes: params.notes || "Driver safely handed packages to customer at destination.",
  });

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin
        .from("delivery_assignments")
        .update({
          status: "delivered",
          delivered_at: now,
          notes: params.notes || null,
          updated_at: now,
        })
        .eq("id", params.assignmentId);
    } catch {
      // Fallback
    }
  }

  // Release driver back to available
  await updateDeliveryPersonStatus(params.driverId, "available");

  return { success: statusRes.success, error: statusRes.error };
}

export async function reportDeliveryProblem(params: {
  assignmentId: string;
  driverId: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!params.reason || params.reason.trim().length < 5) {
    return { success: false, error: "Please enter an informative explanation of the issue." };
  }

  const assignment = runtimeAssignments.find((a) => a.id === params.assignmentId);
  if (!assignment || assignment.driver_id !== params.driverId) {
    return { success: false, error: "Assignment not found." };
  }

  const now = new Date().toISOString();
  assignment.status = "failed";
  assignment.failed_at = now;
  assignment.failure_reason = params.reason.trim();
  assignment.updated_at = now;

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin
        .from("delivery_assignments")
        .update({
          status: "failed",
          failed_at: now,
          failure_reason: params.reason.trim(),
          updated_at: now,
        })
        .eq("id", params.assignmentId);
    } catch {
      // Fallback
    }
  }

  await updateDeliveryPersonStatus(params.driverId, "available");

  return { success: true };
}

/**
 * ----------------------------------------------------------------------------
 * LIVE GPS TRACKING INGESTION & BROADCAST
 * ----------------------------------------------------------------------------
 */

export async function ingestDeliveryLocationUpdate(params: {
  orderReference: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speedMps?: number;
  accuracyMeters?: number;
  isSimulated?: boolean;
}): Promise<{ success: boolean; update?: DeliveryLocationUpdate; error?: string }> {
  // Validate coordinates: lat between -90 and 90, lng between -180 and 180
  if (
    typeof params.latitude !== "number" ||
    params.latitude < -90 ||
    params.latitude > 90 ||
    typeof params.longitude !== "number" ||
    params.longitude < -180 ||
    params.longitude > 180
  ) {
    return { success: false, error: "Invalid GPS coordinates." };
  }

  const order = await getOrderByReferenceAndToken(params.orderReference);
  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // Location tracking is strictly accepted only when an order is actively in progress
  const activeStatuses = ["out_for_delivery", "ready_for_dispatch", "dispatched", "preparing"];
  if (!activeStatuses.includes(order.status)) {
    return {
      success: false,
      error: `Tracking rejected: Order is '${order.status}'. Live tracking only active during transit.`,
    };
  }

  const now = new Date().toISOString();
  const updateId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const update: DeliveryLocationUpdate = {
    id: updateId,
    order_id: order.id,
    order_reference: order.order_reference,
    driver_id: params.driverId,
    latitude: params.latitude,
    longitude: params.longitude,
    heading: params.heading ?? null,
    speed_mps: params.speedMps ?? null,
    accuracy_meters: params.accuracyMeters ?? null,
    is_simulated: Boolean(params.isSimulated),
    recorded_at: now,
    created_at: now,
  };

  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin.from("delivery_location_updates").insert([update]);
      // Update driver current position snapshot
      await admin
        .from("delivery_personnel")
        .update({
          current_latitude: params.latitude,
          current_longitude: params.longitude,
          last_location_updated_at: now,
          updated_at: now,
        })
        .eq("id", params.driverId);
    } catch {
      // Fallback
    }
  }

  // Update in-memory driver position
  const driver = runtimePersonnel.find((p) => p.id === params.driverId);
  if (driver) {
    driver.current_latitude = params.latitude;
    driver.current_longitude = params.longitude;
    driver.last_location_updated_at = now;
  }

  runtimeLocationUpdates.push(update);

  // Broadcast to local event bus subscribers
  broadcastLocalLocation(update);

  return { success: true, update };
}

/**
 * ----------------------------------------------------------------------------
 * PUBLIC CUSTOMER TRACKING RESOLVER
 * ----------------------------------------------------------------------------
 */

export async function getCustomerOrderTracking(
  reference: string,
  accessTokenOrPhone?: string
): Promise<PublicDeliveryTrackingInfo | null> {
  const order = await getOrderByReferenceAndToken(reference, accessTokenOrPhone, accessTokenOrPhone);
  if (!order) return null;

  // Retrieve assigned driver if present
  let driverInfo: PublicDeliveryTrackingInfo["driver"] = null;
  if (order.assigned_driver_id) {
    const driver =
      (await getDeliveryPersonById(order.assigned_driver_id)) ||
      runtimePersonnel.find((p) => p.id === order.assigned_driver_id);
    if (driver) {
      // Privacy safeguard: only share first name, vehicle type, and masked phone
      const firstName = driver.full_name.split(" ")[0] || "Empress Courier";
      const maskedPhone =
        driver.phone.length > 7
          ? `${driver.phone.slice(0, 4)}***${driver.phone.slice(-3)}`
          : undefined;

      driverInfo = {
        first_name: firstName,
        vehicle_type: driver.vehicle_type,
        phone_masked: maskedPhone,
      };
    }
  }

  // Retrieve latest location update
  let locationData: PublicDeliveryTrackingInfo["location"] = null;
  const isTrackingActive = order.status === "out_for_delivery" || order.status === "dispatched";

  if (isTrackingActive) {
    const updates = runtimeLocationUpdates.filter(
      (loc) => loc.order_reference === order.order_reference
    );
    if (updates.length > 0) {
      const latest = updates.sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )[0];

      // Check if location is stale (older than 4 minutes)
      const recordedTime = new Date(latest.recorded_at).getTime();
      const ageMinutes = (Date.now() - recordedTime) / (1000 * 60);
      const isStale = ageMinutes > 4;

      locationData = {
        latitude: latest.latitude,
        longitude: latest.longitude,
        heading: latest.heading,
        accuracy_meters: latest.accuracy_meters,
        recorded_at: latest.recorded_at,
        is_stale: isStale,
      };
    }
  }

  // Construct status timeline
  const statusSteps = [
    { status: "received", label: "Order Received" },
    { status: "confirmed", label: "Confirmed" },
    { status: "preparing", label: "In The Kitchen" },
    { status: "out_for_delivery", label: "On The Way" },
    { status: "delivered", label: "Delivered" },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === order.status);
  const timeline = statusSteps.map((step, idx) => {
    return {
      status: step.status,
      label: step.label,
      completed: currentStatusIndex >= idx || order.status === "delivered",
      current: step.status === order.status,
    };
  });

  // Calculate estimated minutes remaining defensively (only if active in transit)
  let estimatedArrivalMinutes: number | null = null;
  if (isTrackingActive) {
    estimatedArrivalMinutes = 20; // Defensible default for inner Lagos delivery
  }

  return {
    order_reference: order.order_reference,
    order_status: order.status,
    fulfillment_type: order.fulfillment_type,
    recipient_name: order.customer_name,
    delivery_address: {
      state: order.delivery_state,
      city: order.delivery_city,
      area: order.delivery_area,
      street_address: order.delivery_street_address,
      building_number: order.delivery_building_number,
      landmark: order.delivery_landmark,
      instructions: order.delivery_instructions,
    },
    driver: driverInfo,
    location: locationData,
    estimated_arrival_minutes: estimatedArrivalMinutes,
    tracking_active: isTrackingActive,
    status_timeline: timeline,
  };
}
