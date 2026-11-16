"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer/service";
import {
  createDeliveryPerson,
  updateDeliveryPersonStatus,
  assignOrderToDriver,
  acceptDeliveryAssignment,
  rejectDeliveryAssignment,
  startDeliveryTrip,
  completeDeliveryTrip,
  reportDeliveryProblem,
  ingestDeliveryLocationUpdate,
} from "@/lib/delivery/service";
import type { DeliveryVehicleType, DeliveryPersonStatus } from "@/types/delivery";

/**
 * ----------------------------------------------------------------------------
 * ADMIN ACTIONS (Authorized Staff / Admin Only)
 * ----------------------------------------------------------------------------
 */

export async function createDeliveryPersonServerAction(formData: FormData) {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  const fullName = String(formData.get("full_name") || "");
  const email = String(formData.get("email") || "");
  const phone = String(formData.get("phone") || "");
  const vehicleType = (String(formData.get("vehicle_type") || "motorcycle")) as DeliveryVehicleType;
  const plateNumber = String(formData.get("vehicle_plate_number") || "");

  if (!fullName.trim() || !email.trim() || !phone.trim()) {
    return { success: false, error: "Name, email, and phone number are required." };
  }

  try {
    const driver = await createDeliveryPerson({
      full_name: fullName,
      email,
      phone,
      vehicle_type: vehicleType,
      vehicle_plate_number: plateNumber || undefined,
    });
    revalidatePath("/admin/deliveries");
    return { success: true, driver };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create delivery person.";
    return { success: false, error: message };
  }
}

export async function updateDriverStatusServerAction(
  driverId: string,
  status: DeliveryPersonStatus,
  isActive?: boolean
) {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  try {
    const updated = await updateDeliveryPersonStatus(driverId, status, isActive);
    revalidatePath("/admin/deliveries");
    return { success: true, driver: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update driver status.";
    return { success: false, error: message };
  }
}

export async function assignOrderToDriverServerAction(
  orderReference: string,
  driverId: string,
  notes?: string
) {
  const { profile, user } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  try {
    const res = await assignOrderToDriver({
      orderReference,
      driverId,
      assignedByUserId: user?.id,
      notes,
    });
    revalidatePath("/admin/deliveries");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderReference}`);
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Assignment failed.";
    return { success: false, error: message };
  }
}

/**
 * ----------------------------------------------------------------------------
 * DRIVER ACTIONS (Authorized Driver Only)
 * ----------------------------------------------------------------------------
 */

export async function driverAcceptAssignmentAction(assignmentId: string, driverId: string) {
  const res = await acceptDeliveryAssignment({ assignmentId, driverId });
  revalidatePath("/delivery");
  return res;
}

export async function driverRejectAssignmentAction(
  assignmentId: string,
  driverId: string,
  reason: string
) {
  const res = await rejectDeliveryAssignment({ assignmentId, driverId, reason });
  revalidatePath("/delivery");
  revalidatePath("/admin/deliveries");
  return res;
}

export async function driverStartDeliveryAction(assignmentId: string, driverId: string) {
  const res = await startDeliveryTrip({ assignmentId, driverId });
  revalidatePath("/delivery");
  revalidatePath("/admin/deliveries");
  return res;
}

export async function driverCompleteDeliveryAction(
  assignmentId: string,
  driverId: string,
  notes?: string
) {
  const res = await completeDeliveryTrip({ assignmentId, driverId, notes });
  revalidatePath("/delivery");
  revalidatePath("/admin/deliveries");
  return res;
}

export async function driverReportProblemAction(
  assignmentId: string,
  driverId: string,
  reason: string
) {
  const res = await reportDeliveryProblem({ assignmentId, driverId, reason });
  revalidatePath("/delivery");
  revalidatePath("/admin/deliveries");
  return res;
}

export async function submitDriverLocationAction(params: {
  orderReference: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speedMps?: number;
  accuracyMeters?: number;
  isSimulated?: boolean;
}) {
  return await ingestDeliveryLocationUpdate(params);
}
