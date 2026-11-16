"use server";

import { revalidatePath } from "next/cache";
import { getOrderByReferenceAndToken } from "@/lib/order/service";
import {
  createBachsCheckoutSession,
  getOrderPaymentStatus,
} from "@/lib/payment/service";

/**
 * Server Action to initialize or retrieve Bachs hosted checkout session for an order
 */
export async function initializeBachsPaymentAction(
  orderReference: string,
  accessToken?: string,
  origin?: string
) {
  try {
    const order = await getOrderByReferenceAndToken(orderReference, accessToken);

    if (!order) {
      return {
        success: false,
        error: "Order record not found or access token invalid.",
      };
    }

    const sessionResult = await createBachsCheckoutSession(order, origin);

    if (sessionResult.success && sessionResult.checkoutUrl) {
      revalidatePath(`/order/confirmation`);
      revalidatePath(`/account/orders`);
      return {
        success: true,
        checkoutUrl: sessionResult.checkoutUrl,
        checkoutId: sessionResult.checkoutId,
        orderReference: order.order_reference,
      };
    }

    return {
      success: false,
      error: sessionResult.error || "Unable to generate Bachs checkout session.",
    };
  } catch (err: any) {
    console.error("initializeBachsPaymentAction error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred preparing payment.",
    };
  }
}

/**
 * Server Action to poll or verify payment status on demand
 */
export async function checkOrderPaymentStatusAction(
  orderReference: string,
  accessToken?: string,
  phone?: string
) {
  try {
    const status = await getOrderPaymentStatus(orderReference, accessToken, phone);
    if (!status) {
      return {
        success: false,
        error: "Order not found with provided credentials.",
      };
    }

    return {
      success: true,
      payment: status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Could not retrieve payment status.",
    };
  }
}
