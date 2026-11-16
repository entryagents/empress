import type { CustomerProfile, CustomerAddress } from "@/types/customer";
import type { Order } from "@/types/order";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// In-memory runtime stores for environments where Supabase is offline or testing
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
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user && user.email) {
        // Fetch matching profile
        const { data: profile } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        return {
          user: { id: user.id, email: user.email },
          profile: (profile as CustomerProfile) || {
            id: user.id,
            email: user.email,
            full_name: (user.user_metadata?.full_name as string) || "Valued Customer",
            phone: (user.user_metadata?.phone as string) || null,
            role: "customer",
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  return { user: null, profile: null };
}

/**
 * -------------------------------------------------------------
 * PROFILE MANAGEMENT
 * -------------------------------------------------------------
 */
export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("customer_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (!error && data) return data as CustomerProfile;
    } catch {
      // Fallback
    }
  }

  return runtimeProfiles.find((p) => p.id === userId) || null;
}

export async function updateCustomerProfile(
  userId: string,
  input: { full_name: string; phone?: string | null }
): Promise<CustomerProfile> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("customer_profiles")
        .update({
          full_name: input.full_name.trim(),
          phone: input.phone ? input.phone.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (!error && data) {
        return data as CustomerProfile;
      }
    } catch {
      // Fallback
    }
  }

  // Runtime fallback
  const idx = runtimeProfiles.findIndex((p) => p.id === userId);
  if (idx >= 0) {
    runtimeProfiles[idx] = {
      ...runtimeProfiles[idx],
      full_name: input.full_name.trim(),
      phone: input.phone ? input.phone.trim() : null,
      updated_at: new Date().toISOString(),
    };
    return runtimeProfiles[idx];
  }

  const fallback: CustomerProfile = {
    id: userId,
    email: "customer@example.ng",
    full_name: input.full_name.trim(),
    phone: input.phone || null,
    role: "customer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      const { data, error } = await admin
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data) return data as CustomerAddress[];
    } catch {
      // Fallback
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
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  // If this address is set as default, unset other defaults
  if (address.is_default) {
    if (admin) {
      await admin.from("customer_addresses").update({ is_default: false }).eq("customer_id", userId);
    }
    runtimeAddresses.forEach((a) => {
      if (a.customer_id === userId) a.is_default = false;
    });
  }

  if (address.id) {
    // Update existing address
    if (admin) {
      try {
        const { data, error } = await admin
          .from("customer_addresses")
          .update({
            label: address.label,
            state: address.state,
            city: address.city,
            area: address.area,
            street_address: address.street_address,
            building_number: address.building_number || null,
            landmark: address.landmark || null,
            delivery_instructions: address.delivery_instructions || null,
            is_default: address.is_default,
            updated_at: now,
          })
          .eq("id", address.id)
          .eq("customer_id", userId)
          .select()
          .single();

        if (!error && data) return data as CustomerAddress;
      } catch {
        // Fallback
      }
    }

    const idx = runtimeAddresses.findIndex((a) => a.id === address.id && a.customer_id === userId);
    if (idx >= 0) {
      runtimeAddresses[idx] = {
        ...runtimeAddresses[idx],
        ...address,
        updated_at: now,
      };
      return runtimeAddresses[idx];
    }
  }

  // Create new address
  const newAddr: CustomerAddress = {
    id: `addr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    customer_id: userId,
    label: address.label || "Home",
    state: address.state || "Lagos",
    city: address.city || "Lagos",
    area: address.area,
    street_address: address.street_address,
    building_number: address.building_number || null,
    landmark: address.landmark || null,
    delivery_instructions: address.delivery_instructions || null,
    is_default: address.is_default || false,
    created_at: now,
    updated_at: now,
  };

  if (admin) {
    try {
      const { data, error } = await admin.from("customer_addresses").insert([newAddr]).select().single();
      if (!error && data) return data as CustomerAddress;
    } catch {
      // Fallback
    }
  }

  runtimeAddresses.push(newAddr);
  return newAddr;
}

export async function deleteCustomerAddress(userId: string, addressId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin.from("customer_addresses").delete().eq("id", addressId).eq("customer_id", userId);
    } catch {
      // Fallback
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
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      let query = admin
        .from("orders")
        .select("*, items:order_items(*)")
        .or(`user_id.eq.${userId}${email ? `,customer_email.eq.${email.toLowerCase()}` : ""}`)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (!error && data) return data as Order[];
    } catch {
      // Fallback
    }
  }

  // Search runtime orders
  const { getAdminOrders } = await import("@/lib/order/service");
  const allOrders = await getAdminOrders(100);
  return allOrders.filter(
    (o) => o.user_id === userId || (email && o.customer_email.toLowerCase() === email.toLowerCase())
  );
}

/**
 * Associates eligible previous guest orders with the customer's account.
 * Requires matching customer_email AND verifying via secure_access_token or verified phone number.
 */
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

  // Check that the order was actually placed under the claiming customer's email address
  if (order.customer_email.toLowerCase() !== userEmail.toLowerCase()) {
    return {
      success: false,
      message: "This order was placed under a different email address and cannot be claimed.",
    };
  }

  // Associate order with account
  const admin = getSupabaseAdminClient();
  if (admin) {
    try {
      await admin.from("orders").update({ user_id: userId }).eq("id", order.id);
    } catch {
      // Fallback
    }
  }

  order.user_id = userId;
  return { success: true, message: `Order ${order.order_reference} successfully linked to your account!` };
}
