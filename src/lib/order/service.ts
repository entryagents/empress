import type {
  Order,
  OrderStatus,
  OrderItemSnapshot,
  CartItemInput,
  CustomerCheckoutInput,
  CartValidationResult,
  ValidatedOrderItem,
  PricingSummary,
  Coupon,
  DeliveryZone,
} from "@/types/order";
import { getProducts, getProductById } from "@/lib/catalogue/service";
import { CONFIGURED_DELIVERY_ZONES, CONFIGURED_COUPONS, DEFAULT_PICKUP_LOCATION } from "./config";
import { getDb } from "@/lib/db";
import crypto from "node:crypto";

// Runtime in-memory store for orders and coupons
let runtimeOrders: Order[] = [];
let runtimeCoupons: Coupon[] = [...CONFIGURED_COUPONS];
let runtimeDeliveryZones: DeliveryZone[] = [...CONFIGURED_DELIVERY_ZONES];

/**
 * Generates an elegant human-friendly order reference (e.g. EMP-20261116-8942)
 */
export function generateOrderReference(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${dateStr}-${randomSuffix}`;
}

/**
 * Generates a high-entropy unguessable token for guest customer lookup
 */
export function generateSecureAccessToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * -------------------------------------------------------------
 * DELIVERY ZONE LOOKUP
 * -------------------------------------------------------------
 */
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const { getAdminDeliveryZones } = await import("@/lib/settings/service");
  const zones = await getAdminDeliveryZones();
  return zones.filter((z) => z.is_active).sort((a, b) => a.display_order - b.display_order);
}

export async function getDeliveryZoneById(id: string): Promise<DeliveryZone | null> {
  const zones = await getDeliveryZones();
  return zones.find((z) => z.id === id) || null;
}

/**
 * -------------------------------------------------------------
 * COUPON VALIDATION
 * -------------------------------------------------------------
 */
export async function validateCoupon(
  code: string,
  subtotalKobo: number
): Promise<{ isValid: boolean; coupon?: Coupon; discountKobo: number; reason?: string }> {
  if (!code || !code.trim()) {
    return { isValid: false, discountKobo: 0 };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = runtimeCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.is_active);

  if (!coupon) {
    return { isValid: false, discountKobo: 0, reason: "Invalid or inactive privilege code." };
  }

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { isValid: false, discountKobo: 0, reason: "Privilege code has expired." };
  }

  // Check usage limits
  if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
    return { isValid: false, discountKobo: 0, reason: "Privilege code usage limit has been reached." };
  }

  // Check minimum order amount
  if (subtotalKobo < coupon.min_order_kobo) {
    const minNaira = (coupon.min_order_kobo / 100).toLocaleString();
    return {
      isValid: false,
      discountKobo: 0,
      reason: `Order subtotal must be at least ₦${minNaira} to apply this code.`,
    };
  }

  // Calculate discount (in integer kobo)
  let discountKobo = 0;
  if (coupon.discount_type === "percentage") {
    discountKobo = Math.round((subtotalKobo * coupon.discount_value) / 100);
    if (coupon.max_discount_kobo && discountKobo > coupon.max_discount_kobo) {
      discountKobo = coupon.max_discount_kobo;
    }
  } else if (coupon.discount_type === "fixed") {
    discountKobo = coupon.discount_kobo || Math.round(coupon.discount_value * 100);
  }

  // Never allow discount to exceed order subtotal
  if (discountKobo > subtotalKobo) {
    discountKobo = subtotalKobo;
  }

  return {
    isValid: true,
    coupon,
    discountKobo,
  };
}

/**
 * -------------------------------------------------------------
 * SERVER-SIDE CART VALIDATION & PRICE RECALCULATION
 * -------------------------------------------------------------
 * Validates existence, availability, selected variations, add-ons,
 * and recalculates 100% of prices strictly on the server.
 */
export async function validateCart(
  cartItems: CartItemInput[],
  fulfillmentType: "delivery" | "pickup",
  deliveryZoneId?: string,
  couponCode?: string
): Promise<CartValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedItems: ValidatedOrderItem[] = [];

  if (!cartItems || cartItems.length === 0) {
    return {
      isValid: false,
      errors: ["Your shopping bag is empty."],
      warnings: [],
      items: [],
      pricing: {
        currency: "NGN",
        subtotalKobo: 0,
        deliveryFeeKobo: 0,
        discountKobo: 0,
        totalKobo: 0,
      },
    };
  }

  const allProducts = await getProducts({ includeUnpublished: true });

  for (const item of cartItems) {
    const prod = allProducts.find((p) => p.id === item.productId || p.slug === item.productId);

    if (!prod) {
      errors.push(`A dish in your cart is no longer available on our menu.`);
      continue;
    }

    if (!prod.is_published || prod.is_archived) {
      errors.push(`"${prod.name}" is currently unavailable.`);
      continue;
    }

    if (!prod.is_available) {
      errors.push(`"${prod.name}" is currently sold out.`);
      continue;
    }

    if (item.quantity <= 0) {
      errors.push(`Invalid quantity for "${prod.name}".`);
      continue;
    }

    // Validate variant
    let matchedVariant = undefined;
    let variantAdjustment = 0;
    if (item.variantId) {
      matchedVariant = prod.variants?.find((v) => v.id === item.variantId);
      if (!matchedVariant) {
        errors.push(`Selected portion size for "${prod.name}" is no longer offered.`);
      } else if (!matchedVariant.is_available) {
        errors.push(`Selected portion size "${matchedVariant.name}" for "${prod.name}" is sold out.`);
      } else {
        variantAdjustment = matchedVariant.price_adjustment_kobo;
      }
    }

    // Validate add-ons
    const matchedAddons = [];
    let addonsTotal = 0;
    if (item.addonIds && item.addonIds.length > 0) {
      for (const addonId of item.addonIds) {
        let foundAddon = undefined;
        for (const grp of prod.addon_groups || []) {
          const a = grp.addons?.find((addon) => addon.id === addonId);
          if (a) {
            foundAddon = a;
            break;
          }
        }

        if (!foundAddon) {
          warnings.push(`One of the extras requested for "${prod.name}" is no longer available.`);
        } else if (!foundAddon.is_available) {
          warnings.push(`Extra "${foundAddon.name}" is sold out.`);
        } else {
          matchedAddons.push(foundAddon);
          addonsTotal += foundAddon.price_kobo;
        }
      }
    }

    const unitPriceKobo = prod.base_price_kobo + variantAdjustment + addonsTotal;
    const totalPriceKobo = unitPriceKobo * item.quantity;

    validatedItems.push({
      product: prod,
      variant: matchedVariant,
      addons: matchedAddons,
      quantity: item.quantity,
      basePriceKobo: prod.base_price_kobo,
      variantAdjustmentKobo: variantAdjustment,
      addonsTotalKobo: addonsTotal,
      unitPriceKobo,
      totalPriceKobo,
      specialInstructions: item.specialInstructions?.trim() || undefined,
    });
  }

  // Calculate subtotal
  const subtotalKobo = validatedItems.reduce((acc, curr) => acc + curr.totalPriceKobo, 0);

  // Validate Delivery Zone & Fee
  let deliveryFeeKobo = 0;
  let zone: DeliveryZone | undefined = undefined;

  if (fulfillmentType === "delivery") {
    if (!deliveryZoneId) {
      errors.push("Please select a delivery location/zone.");
    } else {
      const z = await getDeliveryZoneById(deliveryZoneId);
      if (!z || !z.is_active) {
        errors.push("The selected delivery zone is currently unavailable for dispatch.");
      } else {
        zone = z;
        deliveryFeeKobo = z.fee_kobo;
      }
    }
  } else {
    // Pickup delivery fee is strictly zero
    deliveryFeeKobo = 0;
  }

  // Calculate Discount
  let discountKobo = 0;
  let appliedCoupon: Coupon | undefined = undefined;

  if (couponCode) {
    const couponRes = await validateCoupon(couponCode, subtotalKobo);
    if (couponRes.isValid && couponRes.coupon) {
      discountKobo = couponRes.discountKobo;
      appliedCoupon = couponRes.coupon;
    } else if (couponRes.reason) {
      warnings.push(couponRes.reason);
    }
  }

  const totalKobo = Math.max(0, subtotalKobo + deliveryFeeKobo - discountKobo);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    items: validatedItems,
    deliveryZone: zone,
    pricing: {
      currency: "NGN",
      subtotalKobo,
      deliveryFeeKobo,
      discountKobo,
      couponApplied: appliedCoupon,
      totalKobo,
    },
  };
}

/**
 * -------------------------------------------------------------
 * ORDER CREATION SERVICE (IDEMPOTENT & IMMUTABLE)
 * -------------------------------------------------------------
 */
export async function createOrder(
  cartItems: CartItemInput[],
  checkoutInput: CustomerCheckoutInput,
  userId?: string | null
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    // Idempotency check: prevent double submissions
    if (checkoutInput.idempotency_key) {
      const existing = runtimeOrders.find((o) => o.idempotency_key === checkoutInput.idempotency_key);
      if (existing) {
        return { success: true, order: existing };
      }
    }

    // Server-side validation of customer fields
    if (!checkoutInput.full_name || !checkoutInput.full_name.trim()) {
      return { success: false, error: "Customer full name is required." };
    }
    if (!checkoutInput.email || !checkoutInput.email.includes("@")) {
      return { success: false, error: "A valid email address is required for order confirmation." };
    }
    if (!checkoutInput.phone || checkoutInput.phone.trim().length < 8) {
      return { success: false, error: "A valid Nigerian phone number is required." };
    }

    // Verify Business Hours & Availability in Africa/Lagos (UTC+1)
    const { checkBusinessAvailability, getBusinessSettings } = await import("@/lib/settings/service");
    const availability = await checkBusinessAvailability();
    if (!availability.canAcceptOrders) {
      return {
        success: false,
        error:
          availability.reason ||
          "Empress Delicacies is currently closed and unable to accept orders at this time.",
      };
    }

    const bizSettings = await getBusinessSettings();
    if (checkoutInput.fulfillment_type === "delivery" && !bizSettings.delivery_enabled) {
      return {
        success: false,
        error: "Home delivery is temporarily paused by the kitchen. Please choose Customer Pickup.",
      };
    }
    if (checkoutInput.fulfillment_type === "pickup" && !bizSettings.pickup_enabled) {
      return {
        success: false,
        error: "Customer pickup is currently disabled. Please select Home Delivery.",
      };
    }

    // Fulfilment-specific address validation
    if (checkoutInput.fulfillment_type === "delivery") {
      if (!checkoutInput.address?.street_address || !checkoutInput.address.street_address.trim()) {
        return { success: false, error: "Street delivery address is required for dispatch." };
      }
      if (!checkoutInput.address?.area || !checkoutInput.address.area.trim()) {
        return { success: false, error: "Area/neighbourhood is required for delivery routing." };
      }
      if (!checkoutInput.delivery_zone_id) {
        return { success: false, error: "Please select an applicable delivery zone." };
      }
    }

    // Run thorough server-side cart validation & pricing recalculation
    const validation = await validateCart(
      cartItems,
      checkoutInput.fulfillment_type,
      checkoutInput.delivery_zone_id,
      checkoutInput.coupon_code
    );

    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(" ") };
    }

    const orderRef = generateOrderReference();
    const secureToken = generateSecureAccessToken();
    const orderId = `ord-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    // Prepare immutable item snapshots
    const itemSnapshots: OrderItemSnapshot[] = validation.items.map((vi, idx) => {
      const itemId = `item-${orderId}-${idx + 1}`;
      const primaryImg =
        vi.product.images?.find((img) => img.is_primary)?.image_url ||
        vi.product.images?.[0]?.image_url ||
        "/images/food/shawarma.jpg";

      return {
        id: itemId,
        order_id: orderId,
        product_id: vi.product.id,
        product_name: vi.product.name,
        product_sku: vi.product.sku,
        product_image_url: primaryImg,
        category_name: vi.product.category?.name || "Empress Kitchen",
        variant_id: vi.variant?.id || null,
        variant_name: vi.variant?.name || null,
        variant_price_adjustment_kobo: vi.variantAdjustmentKobo,
        base_price_kobo: vi.basePriceKobo,
        addons_total_kobo: vi.addonsTotalKobo,
        unit_price_kobo: vi.unitPriceKobo,
        quantity: vi.quantity,
        total_price_kobo: vi.totalPriceKobo,
        special_instructions: vi.specialInstructions || null,
        addons: vi.addons.map((a, aIdx) => ({
          id: `addsnap-${itemId}-${aIdx + 1}`,
          addon_id: a.id,
          addon_group_name: "Culinary Extra",
          addon_name: a.name,
          price_kobo: a.price_kobo,
        })),
      };
    });

    const newOrder: Order = {
      id: orderId,
      order_reference: orderRef,
      secure_access_token: secureToken,
      customer_name: checkoutInput.full_name.trim(),
      customer_email: checkoutInput.email.trim().toLowerCase(),
      customer_phone: checkoutInput.phone.trim(),
      user_id: userId || null,
      fulfillment_type: checkoutInput.fulfillment_type,
      delivery_state: checkoutInput.address?.state || "Lagos",
      delivery_city: checkoutInput.address?.city || "Lagos",
      delivery_area: checkoutInput.address?.area || null,
      delivery_street_address: checkoutInput.address?.street_address || null,
      delivery_building_number: checkoutInput.address?.building_number || null,
      delivery_landmark: checkoutInput.address?.landmark || null,
      delivery_instructions: checkoutInput.address?.additional_instructions || null,
      delivery_zone_id: validation.deliveryZone?.id || null,
      pickup_location:
        checkoutInput.fulfillment_type === "pickup"
          ? `${DEFAULT_PICKUP_LOCATION.name}, ${DEFAULT_PICKUP_LOCATION.address}`
          : null,
      pickup_instructions: checkoutInput.pickup_instructions || null,
      currency: "NGN",
      subtotal_kobo: validation.pricing.subtotalKobo,
      delivery_fee_kobo: validation.pricing.deliveryFeeKobo,
      discount_kobo: validation.pricing.discountKobo,
      coupon_code: validation.pricing.couponApplied?.code || null,
      coupon_id: validation.pricing.couponApplied?.id || null,
      total_kobo: validation.pricing.totalKobo,
      status: "received",
      payment_status: "unpaid",
      special_instructions: checkoutInput.special_instructions?.trim() || null,
      idempotency_key: checkoutInput.idempotency_key || null,
      created_at: now,
      updated_at: now,
      items: itemSnapshots,
    };

    // Persist order and items to Neon PostgreSQL
    const sql = getDb();
    if (sql) {
      try {
        await sql`
          INSERT INTO orders (
            id, order_reference, secure_access_token, customer_name, customer_email,
            customer_phone, user_id, fulfillment_type, delivery_state, delivery_city,
            delivery_area, delivery_street_address, delivery_building_number,
            delivery_landmark, delivery_instructions, delivery_zone_id, pickup_location,
            pickup_instructions, currency, subtotal_kobo, delivery_fee_kobo, discount_kobo,
            coupon_code, coupon_id, total_kobo, status, payment_status, special_instructions,
            idempotency_key, created_at, updated_at
          ) VALUES (
            ${newOrder.id}, ${newOrder.order_reference}, ${newOrder.secure_access_token},
            ${newOrder.customer_name}, ${newOrder.customer_email}, ${newOrder.customer_phone},
            ${newOrder.user_id || null}, ${newOrder.fulfillment_type}, ${newOrder.delivery_state || null},
            ${newOrder.delivery_city || null}, ${newOrder.delivery_area || null},
            ${newOrder.delivery_street_address || null}, ${newOrder.delivery_building_number || null},
            ${newOrder.delivery_landmark || null}, ${newOrder.delivery_instructions || null},
            ${newOrder.delivery_zone_id || null}, ${newOrder.pickup_location || null},
            ${newOrder.pickup_instructions || null}, 'NGN', ${newOrder.subtotal_kobo},
            ${newOrder.delivery_fee_kobo}, ${newOrder.discount_kobo}, ${newOrder.coupon_code || null},
            ${newOrder.coupon_id || null}, ${newOrder.total_kobo}, ${newOrder.status},
            ${newOrder.payment_status}, ${newOrder.special_instructions || null},
            ${newOrder.idempotency_key || null}, ${now}, ${now}
          )
          ON CONFLICT (id) DO NOTHING;
        `;

        for (const item of itemSnapshots) {
          await sql`
            INSERT INTO order_items (
              id, order_id, product_id, product_name, product_sku, product_image_url,
              category_name, variant_id, variant_name, variant_price_adjustment_kobo,
              base_price_kobo, addons_total_kobo, unit_price_kobo, quantity,
              total_price_kobo, special_instructions, addons, created_at
            ) VALUES (
              ${item.id}, ${item.order_id}, ${item.product_id}, ${item.product_name},
              ${item.product_sku || null}, ${item.product_image_url}, ${item.category_name},
              ${item.variant_id || null}, ${item.variant_name || null},
              ${item.variant_price_adjustment_kobo}, ${item.base_price_kobo},
              ${item.addons_total_kobo}, ${item.unit_price_kobo}, ${item.quantity},
              ${item.total_price_kobo}, ${item.special_instructions || null},
              ${JSON.stringify(item.addons || [])}::jsonb, ${now}
            )
            ON CONFLICT (id) DO NOTHING;
          `;
        }
      } catch (e) {
        console.warn("Neon order persistence notice, maintained in memory:", e);
      }
    }

    // Increment coupon usage
    if (validation.pricing.couponApplied) {
      const c = runtimeCoupons.find((cp) => cp.id === validation.pricing.couponApplied?.id);
      if (c) c.times_used += 1;
    }

    runtimeOrders.unshift(newOrder);
    return { success: true, order: newOrder };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create order." };
  }
}

/**
 * -------------------------------------------------------------
 * SECURE ORDER LOOKUP
 * -------------------------------------------------------------
 * Authenticated via secure_access_token or verified phone number + reference.
 * Prevents IDOR / sequential ID enumeration.
 */
export async function getOrderByReferenceAndToken(
  reference: string,
  token?: string,
  phone?: string
): Promise<Order | null> {
  const cleanRef = reference.trim().toUpperCase();

  // Try Neon PostgreSQL first
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'order_id', oi.order_id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'product_sku', oi.product_sku,
                'product_image_url', oi.product_image_url,
                'category_name', oi.category_name,
                'variant_id', oi.variant_id,
                'variant_name', oi.variant_name,
                'variant_price_adjustment_kobo', oi.variant_price_adjustment_kobo,
                'base_price_kobo', oi.base_price_kobo,
                'addons_total_kobo', oi.addons_total_kobo,
                'unit_price_kobo', oi.unit_price_kobo,
                'quantity', oi.quantity,
                'total_price_kobo', oi.total_price_kobo,
                'special_instructions', oi.special_instructions,
                'addons', oi.addons
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE UPPER(o.order_reference) = ${cleanRef}
          AND (${token || null}::text IS NULL OR o.secure_access_token = ${token || ""})
          AND (${phone || null}::text IS NULL OR o.customer_phone = ${phone || ""})
        GROUP BY o.id
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return rows[0] as Order;
      }
    } catch (e) {
      console.warn("Neon getOrderByReference notice, falling back:", e);
    }
  }

  // Runtime search
  const found = runtimeOrders.find((o) => o.order_reference.toUpperCase() === cleanRef);
  if (!found) return null;

  // If token or phone specified, verify access authorization
  if (token) {
    return found.secure_access_token === token ? found : null;
  }
  if (phone) {
    return found.customer_phone.replace(/\D/g, "") === phone.replace(/\D/g, "") ? found : null;
  }

  // If neither token nor phone passed (trusted server call), return found
  return found;
}

/**
 * -------------------------------------------------------------
 * ADMIN: RETRIEVE INCOMING ORDERS
 * -------------------------------------------------------------
 */
export async function getAdminOrders(limit = 50): Promise<Order[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT o.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'order_id', oi.order_id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'product_sku', oi.product_sku,
                'product_image_url', oi.product_image_url,
                'category_name', oi.category_name,
                'variant_id', oi.variant_id,
                'variant_name', oi.variant_name,
                'variant_price_adjustment_kobo', oi.variant_price_adjustment_kobo,
                'base_price_kobo', oi.base_price_kobo,
                'addons_total_kobo', oi.addons_total_kobo,
                'unit_price_kobo', oi.unit_price_kobo,
                'quantity', oi.quantity,
                'total_price_kobo', oi.total_price_kobo,
                'special_instructions', oi.special_instructions,
                'addons', oi.addons
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ${limit};
      `;
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          ...r,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
          updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        })) as Order[];
      }
    } catch (e) {
      console.warn("Neon getAdminOrders notice, falling back:", e);
    }
  }

  return runtimeOrders.slice(0, limit);
}

/**
 * Valid status transitions matrix for culinary fulfillment
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["confirmed", "awaiting_payment", "cancelled"],
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["preparing", "ready_for_dispatch", "out_for_delivery", "cancelled"],
  preparing: ["ready", "ready_for_pickup", "ready_for_dispatch", "out_for_delivery", "cancelled"],
  ready: ["dispatched", "collected", "out_for_delivery", "delivered", "cancelled"],
  ready_for_pickup: ["collected", "cancelled"],
  ready_for_dispatch: ["out_for_delivery", "dispatched", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  delivered: [], // Terminal fulfillment status
  collected: [], // Terminal fulfillment status
  cancelled: [], // Terminal fulfillment status
};

/**
 * Validate whether a requested status transition is allowable
 */
export function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  if (currentStatus === newStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

/**
 * Update an order's fulfillment status with audit logging and optional customer notification
 */
export async function updateAdminOrderStatus(params: {
  orderReference: string;
  newStatus: OrderStatus;
  changedByUserId?: string | null;
  changedByName?: string | null;
  notes?: string | null;
  cancellationReason?: string | null;
}): Promise<{ success: boolean; error?: string; order?: Order }> {
  const cleanRef = params.orderReference.trim().toUpperCase();
  const order = await getOrderByReferenceAndToken(cleanRef);

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  // Enforce workflow validation rules
  if (!isValidStatusTransition(order.status, params.newStatus)) {
    return {
      success: false,
      error: `Invalid status transition: cannot move order from '${order.status}' to '${params.newStatus}'.`,
    };
  }

  // If moving to confirmed or preparing, verify payment is not explicitly failed
  if (
    (params.newStatus === "confirmed" || params.newStatus === "preparing") &&
    order.payment_status === "failed"
  ) {
    return {
      success: false,
      error: "Cannot confirm or prepare an order with a 'failed' payment status.",
    };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    status: params.newStatus,
    updated_at: now,
  };

  if (params.newStatus === "cancelled") {
    updatePayload.cancellation_reason = params.cancellationReason || "Cancelled by kitchen administration.";
    updatePayload.cancelled_at = now;
    updatePayload.cancelled_by = params.changedByName || "Staff";
  }

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE orders SET
          status = ${params.newStatus},
          updated_at = ${now},
          cancellation_reason = COALESCE(${params.cancellationReason || null}, cancellation_reason),
          cancelled_at = ${params.newStatus === "cancelled" ? now : null},
          cancelled_by = COALESCE(${params.changedByName || null}, cancelled_by)
        WHERE UPPER(order_reference) = ${cleanRef};
      `;

      await sql`
        INSERT INTO order_status_history (
          id, order_id, order_reference, from_status, to_status, changed_by_user_id, changed_by_name, notes, created_at
        ) VALUES (
          ${`hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`},
          ${order.id}, ${cleanRef}, ${order.status}, ${params.newStatus},
          ${params.changedByUserId || null}, ${params.changedByName || "Staff Administrator"},
          ${params.notes || (params.newStatus === "cancelled" ? params.cancellationReason : null)},
          ${now}
        );
      `;
    } catch (e) {
      console.warn("Neon order status update notice, maintained in memory:", e);
    }
  }

  // Update in runtime memory
  order.status = params.newStatus;
  order.updated_at = now;
  if (params.newStatus === "cancelled") {
    order.cancellation_reason = params.cancellationReason || "Cancelled by kitchen administration.";
    order.cancelled_at = now;
    order.cancelled_by = params.changedByName || "Staff";
  }

  const historyEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: order.id,
    order_reference: cleanRef,
    from_status: order.status,
    to_status: params.newStatus,
    changed_by_user_id: params.changedByUserId || null,
    changed_by_name: params.changedByName || "Staff Administrator",
    notes: params.notes || null,
    created_at: now,
  };

  if (!order.timeline) order.timeline = [];
  order.timeline.unshift(historyEntry);

  // Send customer notification via notification abstraction
  try {
    const { buildNotificationTemplate, sendOrderNotification } = await import("./notifications");
    const notif = buildNotificationTemplate(order, params.newStatus);
    await sendOrderNotification(notif);
  } catch (e) {
    console.warn("Notification dispatch notice:", e);
  }

  return { success: true, order };
}

/**
 * Update internal administrator notes on an order
 */
export async function updateAdminOrderNotes(
  orderReference: string,
  adminNotes: string
): Promise<{ success: boolean; error?: string }> {
  const cleanRef = orderReference.trim().toUpperCase();
  const now = new Date().toISOString();

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE orders SET
          admin_notes = ${adminNotes},
          updated_at = ${now}
        WHERE UPPER(order_reference) = ${cleanRef};
      `;
    } catch (e) {
      console.warn("Could not save admin notes to Neon:", e);
    }
  }

  const found = runtimeOrders.find((o) => o.order_reference.toUpperCase() === cleanRef);
  if (found) {
    found.admin_notes = adminNotes;
    found.updated_at = now;
  }

  return { success: true };
}

/**
 * Fetch full order status audit timeline
 */
export async function getOrderStatusHistory(orderReference: string): Promise<any[]> {
  const cleanRef = orderReference.trim().toUpperCase();
  const sql = getDb();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM order_status_history
        WHERE UPPER(order_reference) = ${cleanRef}
        ORDER BY created_at DESC;
      `;
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (e) {
      console.warn("Neon getOrderStatusHistory notice, falling back:", e);
    }
  }

  const found = runtimeOrders.find((o) => o.order_reference.toUpperCase() === cleanRef);
  return found?.timeline || [];
}

/**
 * Compute real-time Order Management Metrics from database
 * Revenue is strictly calculated from verified payments (payment_status = 'paid')
 */
export async function getOrderAdminMetrics(): Promise<import("@/types/order").OrderAdminMetrics> {
  const orders = await getAdminOrders(250);

  const todayStr = new Date().toISOString().slice(0, 10);
  let ordersReceivedToday = 0;
  let pendingOrders = 0;
  let paidOrders = 0;
  let preparingOrders = 0;
  let outForDeliveryOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let verifiedRevenueKobo = 0;

  for (const o of orders) {
    const createdStr = o.created_at
      ? typeof o.created_at === "string"
        ? o.created_at
        : (o.created_at as any) instanceof Date
        ? (o.created_at as any).toISOString()
        : String(o.created_at)
      : "";

    if (createdStr && createdStr.slice(0, 10) === todayStr) {
      ordersReceivedToday++;
    }

    if (o.status === "received" || o.status === "awaiting_payment" || o.status === "confirmed") {
      pendingOrders++;
    }

    if (o.payment_status === "paid") {
      paidOrders++;
      // Only count revenue from paid orders that are NOT cancelled
      if (o.status !== "cancelled") {
        verifiedRevenueKobo += o.total_kobo || 0;
      }
    }

    if (o.status === "preparing") {
      preparingOrders++;
    }

    if (o.status === "out_for_delivery" || o.status === "dispatched") {
      outForDeliveryOrders++;
    }

    if (o.status === "delivered" || o.status === "collected") {
      completedOrders++;
    }

    if (o.status === "cancelled") {
      cancelledOrders++;
    }
  }

  return {
    ordersReceivedToday,
    pendingOrders,
    paidOrders,
    preparingOrders,
    outForDeliveryOrders,
    completedOrders,
    cancelledOrders,
    verifiedRevenueKobo,
  };
}

/**
 * Register an order in runtime memory (used for test fixtures & local fallbacks)
 */
export function registerRuntimeOrder(order: Order): void {
  const existingIdx = runtimeOrders.findIndex(
    (o) => o.order_reference.toUpperCase() === order.order_reference.toUpperCase()
  );
  if (existingIdx >= 0) {
    runtimeOrders[existingIdx] = order;
  } else {
    runtimeOrders.unshift(order);
  }
}
