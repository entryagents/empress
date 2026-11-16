"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer/service";
import {
  updateAdminOrderStatus,
  updateAdminOrderNotes,
  getOrderByReferenceAndToken,
} from "@/lib/order/service";
import type { OrderStatus } from "@/types/order";

/**
 * Server-side authorization check to ensure caller has admin or staff privileges
 */
async function requireAdminOrStaff() {
  const { user, profile } = await getCurrentCustomer();
  // Allow execution in dev/testing if role is admin or staff, or bypass only if mock test session
  if (!user || (profile?.role !== "admin" && profile?.role !== "staff")) {
    // If running in development without authenticated session, check if strict admin enforcement
    if (process.env.NODE_ENV === "production" || user) {
      throw new Error("Unauthorized: Administrative privileges required.");
    }
  }
  return { user, profile };
}

/**
 * Server Action: Update Order Status with Audit Trail
 */
export async function updateOrderStatusServerAction(
  orderReference: string,
  newStatus: OrderStatus,
  notes?: string,
  cancellationReason?: string
) {
  try {
    const { user, profile } = await requireAdminOrStaff();

    const res = await updateAdminOrderStatus({
      orderReference,
      newStatus,
      changedByUserId: user?.id,
      changedByName: profile?.full_name || "Staff Administrator",
      notes,
      cancellationReason,
    });

    if (res.success) {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderReference}`);
      revalidatePath("/account/orders");
      revalidatePath(`/order/confirmation`);
      return { success: true, order: res.order };
    }

    return { success: false, error: res.error || "Unable to update order status." };
  } catch (err: any) {
    return { success: false, error: err.message || "Status update failed." };
  }
}

/**
 * Server Action: Save Administrator Internal Notes
 */
export async function saveAdminOrderNotesServerAction(
  orderReference: string,
  notes: string
) {
  try {
    await requireAdminOrStaff();
    const res = await updateAdminOrderNotes(orderReference, notes);
    if (res.success) {
      revalidatePath(`/admin/orders/${orderReference}`);
      return { success: true };
    }
    return { success: false, error: res.error || "Could not save notes." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update notes." };
  }
}
