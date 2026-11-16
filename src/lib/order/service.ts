import type {
  Order,
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
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
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
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return data as DeliveryZone[];
      }
    } catch {
      // Fallback to runtime
    }
  }
  return runtimeDeliveryZones.filter((z) => z.is_active).sort((a, b) => a.display_order - b.display_order);
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
  const supabase = getSupabaseServerClient();
  let coupon: Coupon | undefined;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", cleanCode)
        .eq("is_active", true)
        .single();
      if (!error && data) {
        coupon = data as Coupon;
      }
    } catch {
      // Fallback
    }
  }

  if (!coupon) {
    coupon = runtimeCoupons.find((c) => c.code.toUpperCase() === cleanCode && c.is_active);
  }

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

    // Attempt Supabase insert if configured
    const admin = getSupabaseAdminClient();
    if (admin) {
      try {
        const { error: orderErr } = await admin.from("orders").insert([
          {
            id: newOrder.id,
            order_reference: newOrder.order_reference,
            secure_access_token: newOrder.secure_access_token,
            customer_name: newOrder.customer_name,
            customer_email: newOrder.customer_email,
            customer_phone: newOrder.customer_phone,
            user_id: newOrder.user_id,
            fulfillment_type: newOrder.fulfillment_type,
            delivery_state: newOrder.delivery_state,
            delivery_city: newOrder.delivery_city,
            delivery_area: newOrder.delivery_area,
            delivery_street_address: newOrder.delivery_street_address,
            delivery_building_number: newOrder.delivery_building_number,
            delivery_landmark: newOrder.delivery_landmark,
            delivery_instructions: newOrder.delivery_instructions,
            delivery_zone_id: newOrder.delivery_zone_id,
            pickup_location: newOrder.pickup_location,
            pickup_instructions: newOrder.pickup_instructions,
            currency: newOrder.currency,
            subtotal_kobo: newOrder.subtotal_kobo,
            delivery_fee_kobo: newOrder.delivery_fee_kobo,
            discount_kobo: newOrder.discount_kobo,
            coupon_code: newOrder.coupon_code,
            coupon_id: newOrder.coupon_id,
            total_kobo: newOrder.total_kobo,
            status: newOrder.status,
            payment_status: newOrder.payment_status,
            special_instructions: newOrder.special_instructions,
            idempotency_key: newOrder.idempotency_key,
            created_at: newOrder.created_at,
            updated_at: newOrder.updated_at,
          },
        ]);

        if (!orderErr) {
          // Insert items
          for (const item of itemSnapshots) {
            await admin.from("order_items").insert([
              {
                id: item.id,
                order_id: item.order_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_sku: item.product_sku,
                product_image_url: item.product_image_url,
                category_name: item.category_name,
                variant_id: item.variant_id,
                variant_name: item.variant_name,
                variant_price_adjustment_kobo: item.variant_price_adjustment_kobo,
                base_price_kobo: item.base_price_kobo,
                addons_total_kobo: item.addons_total_kobo,
                unit_price_kobo: item.unit_price_kobo,
                quantity: item.quantity,
                total_price_kobo: item.total_price_kobo,
                special_instructions: item.special_instructions,
              },
            ]);

            for (const add of item.addons || []) {
              await admin.from("order_item_addons").insert([
                {
                  id: add.id,
                  order_item_id: item.id,
                  addon_id: add.addon_id,
                  addon_group_name: add.addon_group_name,
                  addon_name: add.addon_name,
                  price_kobo: add.price_kobo,
                },
              ]);
            }
          }
        }
      } catch {
        // Fallback to runtime
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

  // Try DB first
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      let query = admin.from("orders").select("*, items:order_items(*)").eq("order_reference", cleanRef);
      if (token) {
        query = query.eq("secure_access_token", token);
      } else if (phone) {
        query = query.eq("customer_phone", phone.trim());
      } else {
        return null; // Reject lookup without access token or phone verification
      }
      const { data, error } = await query.single();
      if (!error && data) {
        return data as Order;
      }
    } catch {
      // Fallback
    }
  }

  // Runtime search
  const found = runtimeOrders.find((o) => o.order_reference.toUpperCase() === cleanRef);
  if (!found) return null;

  // Verify access authorization
  if (token && found.secure_access_token === token) {
    return found;
  }
  if (phone && found.customer_phone.replace(/\D/g, "") === phone.replace(/\D/g, "")) {
    return found;
  }

  return null;
}

/**
 * -------------------------------------------------------------
 * ADMIN: RETRIEVE INCOMING ORDERS
 * -------------------------------------------------------------
 */
export async function getAdminOrders(limit = 50): Promise<Order[]> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("orders")
        .select("*, items:order_items(*)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    } catch {
      // Fallback
    }
  }

  return runtimeOrders.slice(0, limit);
}
