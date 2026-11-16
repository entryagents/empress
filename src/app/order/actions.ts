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
    const { getSessionUser } = await import("@/lib/auth/session");
    const user = await getSessionUser();
    const userId: string | null = user ? user.id : null;

    const res = await createOrder(cartItems, checkoutInput, userId);
    if (res.success && res.order) {
      revalidatePath("/admin/orders");
      revalidatePath("/account/orders");

      // Remember the delivery address for next time (skip if already saved)
      const addr = checkoutInput.address;
      if (userId && checkoutInput.fulfillment_type === "delivery" && addr?.street_address) {
        try {
          const { getCustomerAddresses, saveCustomerAddress } = await import("@/lib/customer/service");
          const existing = await getCustomerAddresses(userId);
          const norm = (s?: string | null) => (s || "").trim().toLowerCase();
          const dup = existing.some(
            (a) =>
              norm(a.street_address) === norm(addr.street_address) &&
              norm(a.area) === norm(addr.area) &&
              norm(a.building_number) === norm(addr.building_number)
          );
          if (!dup) {
            await saveCustomerAddress(userId, {
              label: existing.length === 0 ? "Home" : `Address ${existing.length + 1}`,
              state: addr.state,
              city: addr.city,
              area: addr.area,
              street_address: addr.street_address,
              building_number: addr.building_number || null,
              landmark: addr.landmark || null,
              delivery_instructions: addr.additional_instructions || null,
              is_default: existing.length === 0,
            });
            revalidatePath("/account/addresses");
          }
        } catch (e) {
          console.warn("Could not auto-save delivery address:", e);
        }
      }

      // Initialize Bachs hosted checkout session
      const { createBachsCheckoutSession } = await import("@/lib/payment/service");
      const paymentRes = await createBachsCheckoutSession(res.order);

      return {
        success: true,
        orderReference: res.order.order_reference,
        accessToken: res.order.secure_access_token,
        checkoutUrl: paymentRes.success ? paymentRes.checkoutUrl : null,
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
    if (!phoneOrToken || !phoneOrToken.trim()) {
      return {
        success: false,
        error: "Access token or customer phone number is required.",
      };
    }

    const isToken = phoneOrToken.length > 20;
    const order = await getOrderByReferenceAndToken(
      reference,
      isToken ? phoneOrToken.trim() : undefined,
      !isToken ? phoneOrToken.trim() : undefined
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
