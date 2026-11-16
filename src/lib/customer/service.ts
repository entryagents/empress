import type { CustomerProfile, CustomerAddress } from "@/types/customer";
import type { Order } from "@/types/order";
import { getDb } from "@/lib/db";
import { getCurrentCustomer as getSessionCustomer } from "@/lib/auth/session";

// In-memory runtime stores for test cases / local sandboxes
let runtimeProfiles: CustomerProfile[] = [];
let runtimeAddresses: CustomerAddress[] = [];

/**
 * -------------------------------------------------------------
 * CURRENT AUTHENTICATED CUSTOMER SESSION
 * -------------------------------------------------------------
 */
export async function getCurrentCustomer(): Promise<{
  user: { id: string; email: string } | null;
  profile: CustomerProfile | null;
}> {
  return getSessionCustomer();
}

/**
 * -------------------------------------------------------------
 * PROFILE MANAGEMENT
 * -------------------------------------------------------------
 */
export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM customer_profiles WHERE id = ${userId} LIMIT 1;
      `;
      if (rows && rows.length > 0) return rows[0] as CustomerProfile;
    } catch (e) {
      console.warn("Neon getCustomerProfile failed, falling back:", e);
    }
  }

  return runtimeProfiles.find((p) => p.id === userId) || null;
}

export async function updateCustomerProfile(
  userId: string,
  input: { full_name: string; phone?: string | null }
): Promise<CustomerProfile> {
  const sql = getDb();
  const now = new Date().toISOString();

  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO customer_profiles (id, email, full_name, phone, role, created_at, updated_at)
        VALUES (${userId}, 'customer@empress.ng', ${input.full_name.trim()}, ${input.phone ? input.phone.trim() : null}, 'customer', ${now}, ${now})
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      if (rows && rows.length > 0) return rows[0] as CustomerProfile;
    } catch (e) {
      console.warn("Neon updateCustomerProfile failed, using memory:", e);
    }
  }

  // Runtime fallback
  const idx = runtimeProfiles.findIndex((p) => p.id === userId);
  if (idx >= 0) {
    runtimeProfiles[idx] = {
      ...runtimeProfiles[idx],
      full_name: input.full_name.trim(),
      phone: input.phone ? input.phone.trim() : null,
      updated_at: now,
    };
    return runtimeProfiles[idx];
  }

  const fallback: CustomerProfile = {
    id: userId,
    email: "customer@empress.ng",
    full_name: input.full_name.trim(),
    phone: input.phone || null,
    role: "customer",
    created_at: now,
    updated_at: now,
  };
  runtimeProfiles.push(fallback);
  return fallback;
}

/**
 * -------------------------------------------------------------
 * SAVED DELIVERY ADDRESSES
 * -------------------------------------------------------------
 */
export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM customer_addresses
        WHERE customer_id = ${userId}
        ORDER BY is_default DESC, created_at DESC;
      `;
      return rows as CustomerAddress[];
    } catch (e) {
      console.warn("Neon getCustomerAddresses failed, using memory:", e);
    }
  }

  return runtimeAddresses
    .filter((a) => a.customer_id === userId)
    .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
}

export async function saveCustomerAddress(
  userId: string,
  address: Omit<CustomerAddress, "id" | "customer_id" | "created_at" | "updated_at"> & { id?: string }
): Promise<CustomerAddress> {
  const sql = getDb();
  const now = new Date().toISOString();

  // If this address is default, reset others
  if (address.is_default && sql) {
    try {
      await sql`
        UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ${userId};
      `;
    } catch (e) {
      console.warn("Could not reset default address on Neon:", e);
    }
  }

  if (address.id && sql) {
    try {
      const rows = await sql`
        UPDATE customer_addresses SET
          label = ${address.label},
          state = ${address.state},
          city = ${address.city},
          area = ${address.area},
          street_address = ${address.street_address},
          building_number = ${address.building_number || null},
          landmark = ${address.landmark || null},
          delivery_instructions = ${address.delivery_instructions || null},
          is_default = ${address.is_default},
          updated_at = ${now}
        WHERE id = ${address.id} AND customer_id = ${userId}
        RETURNING *;
      `;
      if (rows && rows.length > 0) return rows[0] as CustomerAddress;
    } catch (e) {
      console.warn("Neon update address failed, using memory:", e);
    }
  }

  const id = address.id || `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO customer_addresses (
          id, customer_id, label, state, city, area, street_address,
          building_number, landmark, delivery_instructions, is_default, created_at, updated_at
        ) VALUES (
          ${id}, ${userId}, ${address.label || "Home"}, ${address.state || "Delta State"},
          ${address.city}, ${address.area}, ${address.street_address},
          ${address.building_number || null}, ${address.landmark || null},
          ${address.delivery_instructions || null}, ${address.is_default || false},
          ${now}, ${now}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) return rows[0] as CustomerAddress;
    } catch (e) {
      console.warn("Neon insert address failed, using memory:", e);
    }
  }

  const newAddr: CustomerAddress = {
    id,
    customer_id: userId,
    label: address.label || "Home",
    state: address.state || "Delta State",
    city: address.city || "Warri",
    area: address.area,
    street_address: address.street_address,
    building_number: address.building_number || null,
    landmark: address.landmark || null,
    delivery_instructions: address.delivery_instructions || null,
    is_default: address.is_default || false,
    created_at: now,
    updated_at: now,
  };

  runtimeAddresses.push(newAddr);
  return newAddr;
}

export async function deleteCustomerAddress(userId: string, addressId: string): Promise<boolean> {
  const sql = getDb();
  if (sql) {
    try {
      await sql`
        DELETE FROM customer_addresses WHERE id = ${addressId} AND customer_id = ${userId};
      `;
    } catch (e) {
      console.warn("Neon deleteCustomerAddress failed:", e);
    }
  }

  runtimeAddresses = runtimeAddresses.filter((a) => !(a.id === addressId && a.customer_id === userId));
  return true;
}

/**
 * -------------------------------------------------------------
 * CUSTOMER ORDER HISTORY & GUEST-TO-ACCOUNT ASSOCIATION
 * -------------------------------------------------------------
 */
export async function getCustomerOrders(userId: string, email?: string): Promise<Order[]> {
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
        WHERE o.user_id = ${userId} OR (${email || null}::text IS NOT NULL AND LOWER(o.customer_email) = LOWER(${email || ""}))
        GROUP BY o.id
        ORDER BY o.created_at DESC;
      `;
      return rows as Order[];
    } catch (e) {
      console.warn("Neon getCustomerOrders failed, checking in-memory:", e);
    }
  }

  const { getAdminOrders } = await import("@/lib/order/service");
  const allOrders = await getAdminOrders(100);
  return allOrders.filter(
    (o) => o.user_id === userId || (email && o.customer_email.toLowerCase() === email.toLowerCase())
  );
}

export async function claimGuestOrderForAccount(
  userId: string,
  userEmail: string,
  orderReference: string,
  accessTokenOrPhone: string
): Promise<{ success: boolean; message: string }> {
  const { getOrderByReferenceAndToken } = await import("@/lib/order/service");
  const order = await getOrderByReferenceAndToken(orderReference, accessTokenOrPhone, accessTokenOrPhone);

  if (!order) {
    return { success: false, message: "Order verification failed. Ensure the reference and contact info match." };
  }

  if (order.customer_email.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      success: false,
      message: "This order was placed under a different email address and cannot be claimed.",
    };
  }

  const sql = getDb();
  if (sql) {
    try {
      await sql`
        UPDATE orders SET user_id = ${userId} WHERE id = ${order.id};
      `;
    } catch (e) {
      console.warn("Neon link order to user failed:", e);
    }
  }

  order.user_id = userId;
  return { success: true, message: `Order ${order.order_reference} successfully linked to your account!` };
}
