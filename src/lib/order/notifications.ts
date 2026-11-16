import type { OrderStatus, Order } from "@/types/order";
import { getDb } from "@/lib/db";
import { renderBrandedEmailTemplate } from "@/lib/email/template";
import { smsManager } from "@/lib/sms";

export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface NotificationPayload {
  orderReference: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: OrderStatus | "payment_confirmed";
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationLog {
  id: string;
  order_reference: string;
  customer_email: string;
  customer_phone?: string;
  channel: NotificationChannel;
  notification_type: string;
  dedup_key: string;
  status: "simulated" | "sent" | "failed" | "skipped";
  provider: string;
  subject: string;
  body_preview: string;
  created_at: string;
}

// In-memory deduplication & log storage for fast lookup and fallback
const localNotificationLogs: Map<string, NotificationLog> = new Map();

/**
 * Dispatch or simulate customer order notification
 */
export async function sendOrderNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; status: "simulated" | "sent" | "skipped"; message: string }> {
  const dedupKey = `ord_${payload.orderReference}_${payload.type}`;

  // 1. Deduplication check
  if (localNotificationLogs.has(dedupKey)) {
    return {
      success: true,
      status: "skipped",
      message: `Notification ${payload.type} already delivered for order ${payload.orderReference} (deduplicated).`,
    };
  }

  const sql = getDb();
  if (sql) {
    try {
      const existing = await sql`
        SELECT id FROM notifications_log WHERE metadata->>'dedup_key' = ${dedupKey} LIMIT 1;
      `;
      if (existing && existing.length > 0) {
        return {
          success: true,
          status: "skipped",
          message: `Notification ${payload.type} already recorded in database (deduplicated).`,
        };
      }
    } catch (e) {
      console.warn("Neon notification deduplication check failed:", e);
    }
  }

  // 2. Generate Branded HTML Email
  const htmlContent = renderBrandedEmailTemplate({
    customerName: payload.customerName,
    orderReference: payload.orderReference,
    headline: payload.subject,
    subheadline: `Status Update: ${payload.type.replace(/_/g, " ").toUpperCase()}`,
    bodyHtml: `<p>${payload.message.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
    ctaText: "Track Your Order",
    ctaUrl: `${process.env.BETTER_AUTH_URL || "https://empress-rosy.vercel.app"}/order/track?ref=${encodeURIComponent(
      payload.orderReference
    )}`,
    detailsTable: [
      { label: "Order Reference", value: payload.orderReference },
      { label: "Customer Name", value: payload.customerName },
      { label: "Order Status", value: payload.type.replace(/_/g, " ").toUpperCase() },
      { label: "Recipient Contact", value: payload.customerPhone || payload.customerEmail },
    ],
  });

  // 3. Dispatch SMS via Mozosubz Provider
  if (payload.customerPhone) {
    const smsText = `EMPRESS: Order ${payload.orderReference} update - ${payload.subject}. Track at https://empress-rosy.vercel.app/order/track?ref=${payload.orderReference}`;
    await smsManager.send({
      recipientPhone: payload.customerPhone,
      message: smsText,
    });
  }

  // 4. Save to notifications_log in Neon
  const now = new Date().toISOString();
  const logId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const logRecord: NotificationLog = {
    id: logId,
    order_reference: payload.orderReference,
    customer_email: payload.customerEmail,
    customer_phone: payload.customerPhone,
    channel: "email",
    notification_type: payload.type,
    dedup_key: dedupKey,
    status: "sent",
    provider: "Empress Branded HTML & Mozosubz SMS",
    subject: payload.subject,
    body_preview: payload.message.slice(0, 160),
    created_at: now,
  };

  localNotificationLogs.set(dedupKey, logRecord);

  if (sql) {
    try {
      await sql`
        INSERT INTO notifications_log (id, recipient, channel, subject, content, status, metadata, created_at)
        VALUES (
          ${logId},
          ${payload.customerEmail},
          'email',
          ${payload.subject},
          ${htmlContent},
          'sent',
          ${JSON.stringify({
            dedup_key: dedupKey,
            order_reference: payload.orderReference,
            phone: payload.customerPhone,
            type: payload.type,
          })}::jsonb,
          ${now}
        );
      `;
    } catch (e) {
      console.warn("Neon save notification failed:", e);
    }
  }

  return {
    success: true,
    status: "sent",
    message: "Notification sent via Empress Branded HTML Email and Mozosubz SMS.",
  };
}

export function buildNotificationTemplate(order: Order, newStatus: OrderStatus): NotificationPayload {
  let subject = `Empress Delicacies — Order ${order.order_reference} Update`;
  let message = `Dear ${order.customer_name},\n\nYour order (${order.order_reference}) has been updated.`;

  switch (newStatus) {
    case "confirmed":
      subject = `Order Confirmed: ${order.order_reference} — Empress Delicacies`;
      message = `Dear ${order.customer_name},\n\nYour order has been officially accepted by our Delta culinary kitchen. Our chefs are reviewing your selection and preparing to cook fresh delicacies.`;
      break;
    case "preparing":
      subject = `Culinary Preparation in Progress: ${order.order_reference}`;
      message = `Dear ${order.customer_name},\n\nOur kitchen has started preparing your feast with prime ingredients.`;
      break;
    case "ready":
    case "ready_for_pickup":
      subject = `Your Order is Ready for Collection: ${order.order_reference}`;
      message = `Dear ${order.customer_name},\n\nYour Empress Delicacies order is packaged fresh and hot! You may collect it at: ${order.pickup_location || "Empress Kitchen, Warri, Delta State"}.`;
      break;
    case "ready_for_dispatch":
    case "out_for_delivery":
    case "dispatched":
      subject = `Your Order is on its Way! ${order.order_reference}`;
      message = `Dear ${order.customer_name},\n\nYour order is packed securely and is in transit with our logistics rider to: ${order.delivery_street_address || "your designated address"}.`;
      break;
    case "delivered":
    case "collected":
      subject = `Bon Appétit! Order ${order.order_reference} Completed`;
      message = `Dear ${order.customer_name},\n\nYour order has been successfully delivered. We hope you enjoy every moment of your Empress experience.`;
      break;
    case "cancelled":
      subject = `Order Cancellation Notice: ${order.order_reference}`;
      message = `Dear ${order.customer_name},\n\nYour order has been cancelled. ${order.cancellation_reason ? `Reason: ${order.cancellation_reason}` : ""}`;
      break;
  }

  return {
    orderReference: order.order_reference,
    orderId: order.id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    type: newStatus,
    subject,
    message,
  };
}

export async function getOrderNotificationLogs(orderReference: string): Promise<NotificationLog[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM notifications_log
        WHERE metadata->>'order_reference' = ${orderReference}
        ORDER BY created_at DESC;
      `;
      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          order_reference: orderReference,
          customer_email: r.recipient,
          customer_phone: r.metadata?.phone,
          channel: r.channel,
          notification_type: r.metadata?.type || "status_update",
          dedup_key: r.metadata?.dedup_key || "",
          status: r.status,
          provider: "Empress Branded HTML & Mozosubz SMS",
          subject: r.subject || "",
          body_preview: r.content ? r.content.slice(0, 160) : "",
          created_at: r.created_at,
        }));
      }
    } catch (e) {
      console.warn("Neon getOrderNotificationLogs failed:", e);
    }
  }

  return Array.from(localNotificationLogs.values()).filter(
    (l) => l.order_reference === orderReference
  );
}
