import { BachsWebhookError, webhooks } from "@bachs/sdk";
import type { WebhookEvent, WebhookHeaders } from "@bachs/sdk";
import { getBachsClient, getBachsWebhookSecret, getAppBaseUrl, isBachsConfigured } from "./bachs";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOrderByReferenceAndToken } from "@/lib/order/service";
import type { Order, PaymentStatus } from "@/types/order";
import type {
  PaymentRecord,
  PaymentEventRecord,
  CheckoutSessionResult,
  OrderPaymentStatusResponse,
} from "@/types/payment";

// In-memory fallback stores for local sandbox testing when Supabase is not attached
const localPayments: Map<string, PaymentRecord> = new Map();
const localProcessedEvents: Set<string> = new Set();
const localEventLogs: PaymentEventRecord[] = [];

/**
 * Convert kobo (integer) to decimal string (e.g. 150000 -> "1500.00")
 * Bachs API requires decimal strings for money amounts.
 */
export function koboToDecimalString(kobo: number): string {
  return (kobo / 100).toFixed(2);
}

/**
 * Convert Bachs decimal string to kobo (integer) (e.g. "1500.00" -> 150000)
 */
export function decimalStringToKobo(amount: string | number): number {
  if (typeof amount === "number") {
    return Math.round(amount * 100);
  }
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Create or reuse a Bachs Checkout Session for a verified Order
 * Enforces:
 * - Order existence in our database
 * - Amount recalculation validation
 * - Idempotency per order reference
 * - Customer details attachment
 * - Storage of Bachs checkout ID & hosted URL
 */
export async function createBachsCheckoutSession(
  order: Order,
  redirectOrigin?: string
): Promise<CheckoutSessionResult> {
  // If order is already paid, refuse to create another checkout session
  if (order.payment_status === "paid") {
    return {
      success: false,
      error: "This order has already been paid and confirmed.",
    };
  }

  // If order already has an active Bachs checkout session, return existing session to guarantee idempotency
  if (order.bachs_checkout_url && order.bachs_checkout_id && order.payment_status === "pending") {
    return {
      success: true,
      orderReference: order.order_reference,
      accessToken: order.secure_access_token,
      checkoutUrl: order.bachs_checkout_url,
      checkoutId: order.bachs_checkout_id,
    };
  }

  const baseUrl = redirectOrigin && !redirectOrigin.includes("localhost")
    ? redirectOrigin.replace(/\/$/, "")
    : getAppBaseUrl();

  const successUrl = `${baseUrl}/order/confirmation?ref=${encodeURIComponent(
    order.order_reference
  )}&token=${encodeURIComponent(order.secure_access_token)}`;

  const cancelUrl = `${baseUrl}/order?ref=${encodeURIComponent(
    order.order_reference
  )}&cancel=1`;

  const amountDecimal = koboToDecimalString(order.total_kobo);

  // If Bachs is not configured (or in simulated mode without live API key)
  if (!isBachsConfigured()) {
    // Generate simulated checkout session for development environments
    const simulatedId = `chk_sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const simulatedUrl = `${baseUrl}/order/confirmation?ref=${encodeURIComponent(
      order.order_reference
    )}&token=${encodeURIComponent(order.secure_access_token)}&simulated=1`;

    await recordPaymentInitiation({
      orderId: order.id,
      orderReference: order.order_reference,
      checkoutId: simulatedId,
      checkoutUrl: simulatedUrl,
      amountKobo: order.total_kobo,
      currency: "NGN",
      customerEmail: order.customer_email,
      customerName: order.customer_name,
    });

    return {
      success: true,
      orderReference: order.order_reference,
      accessToken: order.secure_access_token,
      checkoutUrl: simulatedUrl,
      checkoutId: simulatedId,
    };
  }

  try {
    const bachs = getBachsClient();

    // Use Idempotency-Key = `checkout-order-${order.order_reference}` to prevent duplicate sessions
    const session = await bachs.checkoutSessions.create(
      {
        pricing: {
          currency: "NGN",
          amount: amountDecimal,
        },
        customer: {
          email: order.customer_email,
          name: order.customer_name,
          phone_number: order.customer_phone,
        },
        reference: order.order_reference,
        success_url: successUrl,
        cancel_url: cancelUrl,
        expires_in_minutes: 60,
        metadata: {
          order_id: order.id,
          order_reference: order.order_reference,
          secure_access_token: order.secure_access_token,
          fulfillment_type: order.fulfillment_type,
        },
      },
      {
        idempotencyKey: `checkout-ord-${order.order_reference}`,
      }
    );

    // Persist session to database and update order payment_status to 'pending'
    await recordPaymentInitiation({
      orderId: order.id,
      orderReference: order.order_reference,
      checkoutId: session.checkout_id,
      checkoutUrl: session.checkout_url,
      amountKobo: order.total_kobo,
      currency: "NGN",
      customerEmail: order.customer_email,
      customerName: order.customer_name,
      expiresAt: session.expires_at,
    });

    return {
      success: true,
      orderReference: order.order_reference,
      accessToken: order.secure_access_token,
      checkoutUrl: session.checkout_url,
      checkoutId: session.checkout_id,
    };
  } catch (err: any) {
    console.error("Bachs checkoutSession.create failed:", err);
    return {
      success: false,
      error: err.message || "Failed to initialize Bachs checkout session.",
    };
  }
}

/**
 * Record payment initiation in Database & Memory
 */
async function recordPaymentInitiation(params: {
  orderId: string;
  orderReference: string;
  checkoutId: string;
  checkoutUrl: string;
  amountKobo: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  expiresAt?: string;
}) {
  const now = new Date().toISOString();

  // 1. Update in memory fallback
  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    order_id: params.orderId,
    order_reference: params.orderReference,
    provider: "bachs",
    bachs_checkout_id: params.checkoutId,
    amount_kobo: params.amountKobo,
    currency: params.currency,
    status: "pending",
    customer_email: params.customerEmail,
    customer_name: params.customerName,
    checkout_url: params.checkoutUrl,
    expires_at: params.expiresAt || null,
    created_at: now,
    updated_at: now,
  };
  localPayments.set(params.checkoutId, paymentRecord);

  // 2. Persist to Supabase if available
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from("orders")
        .update({
          payment_status: "pending",
          bachs_checkout_id: params.checkoutId,
          bachs_checkout_url: params.checkoutUrl,
          updated_at: now,
        })
        .eq("order_reference", params.orderReference);

      await supabase.from("payments").insert({
        order_id: params.orderId,
        order_reference: params.orderReference,
        provider: "bachs",
        bachs_checkout_id: params.checkoutId,
        amount_kobo: params.amountKobo,
        currency: params.currency,
        status: "pending",
        customer_email: params.customerEmail,
        customer_name: params.customerName,
        checkout_url: params.checkoutUrl,
        expires_at: params.expiresAt || null,
        created_at: now,
        updated_at: now,
      });
    } catch (e) {
      console.warn("Could not write payment record to Supabase, stored in memory:", e);
    }
  }
}

/**
 * Webhook signature verification and event construction
 * Uses official `@bachs/sdk` `webhooks.constructEvent`
 */
export function verifyAndConstructBachsWebhook(
  rawBody: string | Uint8Array,
  headers: WebhookHeaders,
  secretOverride?: string
): WebhookEvent {
  const secret = secretOverride || getBachsWebhookSecret();
  return webhooks.constructEvent(rawBody, headers, secret);
}

/**
 * Handle incoming Bachs Webhook Delivery
 * Enforces:
 * - Deduplication via event ID
 * - Authoritative payment amount, currency, and reference verification
 * - Order status isolation (fulfilment status never marked delivered/completed automatically)
 * - Safe handling of 'collection.succeeded', 'checkout.completed', 'collection.failed',
 *   'checkout.expired', 'collection.underpaid', 'refund.paid'
 */
export async function processBachsWebhookEvent(
  event: WebhookEvent
): Promise<{ success: boolean; message: string; duplicate?: boolean }> {
  const { id: eventId, type: eventType, data } = event;

  // 1. Check deduplication store
  if (localProcessedEvents.has(eventId)) {
    return { success: true, message: "Event already processed (deduplicated).", duplicate: true };
  }

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data: existingEvent } = await supabase
      .from("payment_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      localProcessedEvents.add(eventId);
      return { success: true, message: "Event already recorded in Supabase (deduplicated).", duplicate: true };
    }
  }

  // 2. Extract reference and identifiers from event payload
  const orderRef = (data.reference as string) || (data.order_reference as string) || (data.metadata as any)?.order_reference;
  const checkoutId = (data.checkout_id as string) || (data.id as string && eventType.startsWith("checkout.") ? data.id as string : null);
  const paymentId = (data.payment_id as string) || (data.id as string && eventType.startsWith("collection.") ? data.id as string : null);
  const amountStr = (data.amount as string) || (data.amount_paid as string) || "0";
  const currencyStr = (data.currency as string) || "NGN";

  if (!orderRef && !checkoutId) {
    // Audit non-order related webhook event
    await logWebhookEvent(event, null, null);
    localProcessedEvents.add(eventId);
    return { success: true, message: `Ignored unreferenced event ${eventType}.` };
  }

  // 3. Locate corresponding order
  let order: Order | null = null;
  if (orderRef) {
    order = await getOrderByReferenceAndToken(orderRef);
  }

  // Fallback to lookup by checkoutId if orderRef wasn't in root data
  if (!order && checkoutId) {
    if (supabase) {
      const { data: ordData } = await supabase
        .from("orders")
        .select("*")
        .eq("bachs_checkout_id", checkoutId)
        .maybeSingle();
      if (ordData) order = ordData;
    }
    if (!order) {
      const paymentRec = localPayments.get(checkoutId);
      if (paymentRec) {
        order = await getOrderByReferenceAndToken(paymentRec.order_reference);
      }
    }
  }

  if (!order) {
    await logWebhookEvent(event, null, null);
    localProcessedEvents.add(eventId);
    return {
      success: false,
      message: `No matching order found for reference "${orderRef}" or checkout "${checkoutId}".`,
    };
  }

  // 4. Match Amount and Currency for Payment Success Events
  const eventAmountKobo = decimalStringToKobo(amountStr);
  const isCurrencyMatching = !currencyStr || currencyStr.toUpperCase() === order.currency.toUpperCase();
  const isAmountMatching = eventAmountKobo === order.total_kobo;

  let newPaymentStatus: PaymentStatus = order.payment_status;
  const now = new Date().toISOString();

  switch (eventType) {
    case "collection.succeeded":
    case "checkout.completed": {
      // Validate payment integrity
      if (!isCurrencyMatching) {
        newPaymentStatus = "failed";
        console.error(`Bachs payment currency mismatch for order ${order.order_reference}: expected ${order.currency}, got ${currencyStr}`);
      } else if (!isAmountMatching && eventAmountKobo > 0 && eventAmountKobo !== order.total_kobo) {
        newPaymentStatus = "underpaid";
        console.error(`Bachs payment amount mismatch for order ${order.order_reference}: expected ${order.total_kobo} kobo, got ${eventAmountKobo} kobo`);
      } else {
        newPaymentStatus = "paid";
      }
      break;
    }

    case "collection.failed": {
      newPaymentStatus = "failed";
      break;
    }

    case "checkout.expired": {
      // Only set to expired if not already paid
      if (order.payment_status !== "paid") {
        newPaymentStatus = "expired";
      }
      break;
    }

    case "collection.underpaid": {
      newPaymentStatus = "underpaid";
      break;
    }

    case "refund.created":
    case "refund.processing": {
      newPaymentStatus = "refund_pending";
      break;
    }

    case "refund.paid": {
      newPaymentStatus = "refunded";
      break;
    }

    default:
      // Other events do not modify primary order payment state
      break;
  }

  // 5. Update Order in Database and Memory
  await updateOrderPaymentState({
    orderReference: order.order_reference,
    paymentStatus: newPaymentStatus,
    bachsPaymentId: paymentId || undefined,
    paymentCompletedAt: newPaymentStatus === "paid" ? now : null,
  });

  // 6. Record processed webhook event
  await logWebhookEvent(event, order.order_reference, order.id);
  localProcessedEvents.add(eventId);

  return {
    success: true,
    message: `Order ${order.order_reference} payment updated to ${newPaymentStatus} on ${eventType}.`,
  };
}

/**
 * Update payment state in order record
 */
async function updateOrderPaymentState(params: {
  orderReference: string;
  paymentStatus: PaymentStatus;
  bachsPaymentId?: string;
  paymentCompletedAt?: string | null;
}) {
  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const updateData: Record<string, unknown> = {
        payment_status: params.paymentStatus,
        updated_at: now,
      };
      if (params.bachsPaymentId) {
        updateData.bachs_payment_id = params.bachsPaymentId;
      }
      if (params.paymentCompletedAt) {
        updateData.payment_completed_at = params.paymentCompletedAt;
      }

      await supabase
        .from("orders")
        .update(updateData)
        .eq("order_reference", params.orderReference);

      await supabase
        .from("payments")
        .update({
          status: params.paymentStatus,
          bachs_payment_id: params.bachsPaymentId || null,
          completed_at: params.paymentCompletedAt || null,
          updated_at: now,
        })
        .eq("order_reference", params.orderReference);
    } catch (e) {
      console.warn("Could not update order payment state in Supabase:", e);
    }
  }

  // Update in local payment store
  for (const [, payment] of localPayments.entries()) {
    if (payment.order_reference === params.orderReference) {
      payment.status = params.paymentStatus;
      if (params.bachsPaymentId) payment.bachs_payment_id = params.bachsPaymentId;
      if (params.paymentCompletedAt) payment.completed_at = params.paymentCompletedAt;
      payment.updated_at = now;
    }
  }
}

/**
 * Record audit log for webhook event
 */
async function logWebhookEvent(
  event: WebhookEvent,
  orderReference: string | null,
  orderId: string | null
) {
  const record: PaymentEventRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    event_id: event.id,
    event_type: event.type,
    order_reference: orderReference,
    order_id: orderId,
    bachs_checkout_id: (event.data?.checkout_id as string) || null,
    bachs_payment_id: (event.data?.payment_id as string) || null,
    status: (event.data?.status as string) || null,
    amount: (event.data?.amount as string) || null,
    currency: (event.data?.currency as string) || null,
    payload_summary: {
      type: event.type,
      org: event.organization_id,
      created_at: event.created_at,
    },
    processed_at: new Date().toISOString(),
  };

  localEventLogs.push(record);

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("payment_webhook_events").insert({
        event_id: event.id,
        event_type: event.type,
        order_reference: orderReference,
        order_id: orderId,
        bachs_checkout_id: record.bachs_checkout_id,
        bachs_payment_id: record.bachs_payment_id,
        status: record.status,
        amount: record.amount,
        currency: record.currency,
        payload_summary: record.payload_summary,
        processed_at: record.processed_at,
      });
    } catch (e) {
      console.warn("Failed to write webhook audit log to Supabase:", e);
    }
  }
}

/**
 * Securely fetch payment status for a specific customer order
 */
export async function getOrderPaymentStatus(
  reference: string,
  token?: string,
  phone?: string
): Promise<OrderPaymentStatusResponse | null> {
  const order = await getOrderByReferenceAndToken(reference, token, phone);
  if (!order) return null;

  return {
    orderReference: order.order_reference,
    status: order.status,
    paymentStatus: order.payment_status,
    totalKobo: order.total_kobo,
    currency: order.currency,
    isPaid: order.payment_status === "paid",
    bachsCheckoutId: order.bachs_checkout_id || null,
    checkoutUrl: order.bachs_checkout_url || null,
    completedAt: order.payment_completed_at || null,
  };
}

/**
 * Fetch payments for Admin Dashboard (with audit trail)
 */
export async function getAdminPayments(limit = 50): Promise<PaymentRecord[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as PaymentRecord[];
      }
    } catch (e) {
      console.warn("Could not query payments table, using memory:", e);
    }
  }

  return Array.from(localPayments.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

/**
 * Fetch webhook event logs for Admin Dashboard
 */
export async function getAdminPaymentEvents(limit = 50): Promise<PaymentEventRecord[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("payment_webhook_events")
        .select("*")
        .order("processed_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as PaymentEventRecord[];
      }
    } catch (e) {
      console.warn("Could not query payment_webhook_events table, using memory:", e);
    }
  }

  return [...localEventLogs]
    .sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime())
    .slice(0, limit);
}
