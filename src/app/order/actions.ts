"use server";

import { revalidatePath } from "next/cache";
import {
  validateCart,
  createOrder,
  getOrderByReferenceAndToken,
  getDeliveryZones,
  validateCoupon,
} from "@/lib/order/service";
import type { CartItemInput, CustomerCheckoutInput } from "@/types/order";

export async function validateCartAction(
  items: CartItemInput[],
  fulfillmentType: "delivery" | "pickup",
  deliveryZoneId?: string,
  couponCode?: string
) {
  try {
    const result = await validateCart(items, fulfillmentType, deliveryZoneId, couponCode);
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to validate bag." };
  }
}

export async function applyCouponAction(code: string, subtotalKobo: number) {
  try {
    const result = await validateCoupon(code, subtotalKobo);
    return {
      success: true,
      isValid: result.isValid,
      coupon: result.coupon,
      discountKobo: result.discountKobo,
      reason: result.reason,
    };
  } catch (err: any) {
    return {
      success: false,
      isValid: false,
      coupon: undefined,
      discountKobo: 0,
      reason: err.message || "Failed to validate code.",
    };
  }
}

export async function submitCheckoutOrderAction(
  cartItems: CartItemInput[],
  checkoutInput: CustomerCheckoutInput
) {
  try {
    const res = await createOrder(cartItems, checkoutInput);
    if (res.success && res.order) {
      revalidatePath("/admin/orders");
      return {
        success: true,
        orderReference: res.order.order_reference,
        accessToken: res.order.secure_access_token,
      };
    }
    return {
      success: false,
      error: res.error || "Unable to complete order creation.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "An unexpected error occurred during checkout.",
    };
  }
}

export async function lookupOrderAction(reference: string, phoneOrToken: string) {
  try {
    const isToken = phoneOrToken.length > 20;
    const order = await getOrderByReferenceAndToken(
      reference,
      isToken ? phoneOrToken : undefined,
      !isToken ? phoneOrToken : undefined
    );

    if (!order) {
      return {
        success: false,
        error: "Order not found. Please verify your reference and contact number.",
      };
    }

    return { success: true, order };
  } catch (err: any) {
    return { success: false, error: err.message || "Lookup failed." };
  }
}

export async function fetchDeliveryZonesAction() {
  try {
    const zones = await getDeliveryZones();
    return { success: true, zones };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch delivery zones." };
  }
}
