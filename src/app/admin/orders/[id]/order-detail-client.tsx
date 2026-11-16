"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  Bike,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Save,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types/order";
import { formatKobo } from "@/types/catalogue";
import { updateOrderStatusServerAction, saveAdminOrderNotesServerAction } from "../actions";

interface Props {
  initialOrder: Order;
  initialTimeline: any[];
  initialNotifications: any[];
}

export function OrderDetailClient({
  initialOrder,
  initialTimeline,
  initialNotifications,
}: Props) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [timeline, setTimeline] = useState<any[]>(initialTimeline);
  const [notifications] = useState<any[]>(initialNotifications);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [statusNotes, setStatusNotes] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || "");

  const [isUpdatingStatus, startStatusTransition] = useTransition();
  const [isSavingNotes, startNotesTransition] = useTransition();

  const [statusFeedback, setStatusFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [notesFeedback, setNotesFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus === order.status) return;

    setStatusFeedback(null);
    startStatusTransition(async () => {
      const res = await updateOrderStatusServerAction(
        order.order_reference,
        selectedStatus,
        statusNotes,
        selectedStatus === "cancelled" ? cancellationReason : undefined
      );

      if (res.success && res.order) {
        setOrder(res.order);
        setStatusFeedback({ success: true, msg: `Order transitioned to ${selectedStatus} successfully.` });
        setStatusNotes("");
        // Prepend timeline locally
        setTimeline((prev) => [
          {
            id: `temp-${Date.now()}`,
            order_reference: order.order_reference,
            from_status: order.status,
            to_status: selectedStatus,
            changed_by_name: "Staff Administrator",
            notes: statusNotes || (selectedStatus === "cancelled" ? cancellationReason : null),
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setStatusFeedback({ success: false, msg: res.error || "Failed to update status." });
      }
    });
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setNotesFeedback(null);
    startNotesTransition(async () => {
      const res = await saveAdminOrderNotesServerAction(order.order_reference, adminNotes);
      if (res.success) {
        setNotesFeedback({ success: true, msg: "Administrator notes updated securely." });
      } else {
        setNotesFeedback({ success: false, msg: res.error || "Unable to save notes." });
      }
    });
  };

  const isTerminal = order.status === "delivered" || order.status === "collected" || order.status === "cancelled";

  return (
    <div className="space-y-8 font-sans">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-wine-900/10 pb-6">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to All Orders
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
              Order {order.order_reference}
            </h1>
            <span className="rounded bg-wine-900/10 px-2.5 py-0.5 font-mono text-xs text-wine-900 font-semibold">
              {order.fulfillment_type.toUpperCase()}
            </span>
          </div>
          <p className="mt-1 text-xs text-wine-600">
            Placed on {new Date(order.created_at).toLocaleString([], { dateStyle: "long", timeStyle: "medium" })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/order/confirmation?ref=${order.order_reference}&token=${order.secure_access_token}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-wine-950 hover:bg-ivory-50 transition-colors shadow-2xs"
          >
            <ExternalLink className="size-3.5 text-champagne-600" />
            Customer Receipt
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (2 Cols): Details, Items, and Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Fulfillment Information Card */}
          <div className="rounded border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Customer &amp; Delivery Destination
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="font-semibold text-wine-900 uppercase tracking-wider text-[0.68rem]">Customer Info</p>
                <p className="mt-1 font-medium text-wine-950 text-sm">{order.customer_name}</p>
                <div className="mt-1 flex items-center gap-1.5 text-wine-700">
                  <Phone className="size-3.5" />
                  <span>{order.customer_phone}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-wine-700">
                  <Mail className="size-3.5" />
                  <span>{order.customer_email}</span>
                </div>
              </div>

              <div>
                <p className="font-semibold text-wine-900 uppercase tracking-wider text-[0.68rem]">Fulfilment Method</p>
                {order.fulfillment_type === "delivery" ? (
                  <div className="mt-1 space-y-1 text-wine-800">
                    <p className="font-medium text-wine-950">
                      {order.delivery_building_number ? `${order.delivery_building_number}, ` : ""}
                      {order.delivery_street_address}
                    </p>
                    <p className="text-wine-700">
                      Area: <strong>{order.delivery_area}</strong>, {order.delivery_city}, {order.delivery_state}
                    </p>
                    {order.delivery_landmark && (
                      <p className="text-wine-600 italic">Landmark: &ldquo;{order.delivery_landmark}&rdquo;</p>
                    )}
                    {order.delivery_instructions && (
                      <p className="text-wine-600 bg-ivory-50 p-2 rounded border border-wine-900/10 text-[0.7rem]">
                        Rider Note: {order.delivery_instructions}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 space-y-1 text-wine-800">
                    <p className="font-medium text-wine-950">Pick-up Location:</p>
                    <p className="text-wine-700">{order.pickup_location || "Empress Kitchen, Victoria Island, Lagos"}</p>
                    {order.pickup_instructions && (
                      <p className="text-wine-600 bg-ivory-50 p-2 rounded border border-wine-900/10 text-[0.7rem]">
                        Collection Note: {order.pickup_instructions}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {order.special_instructions && (
              <div className="border-t border-wine-900/10 pt-3">
                <p className="font-semibold text-wine-900 text-xs">Customer Kitchen Special Instructions:</p>
                <p className="mt-1 text-xs text-wine-800 italic bg-amber-50/50 p-2.5 rounded border border-amber-200">
                  &ldquo;{order.special_instructions}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Ordered Products Snapshot */}
          <div className="rounded border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Itemized Order &amp; Variations
            </h2>

            <div className="divide-y divide-wine-900/10">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <p className="font-medium text-wine-950 text-sm">
                      <span className="font-bold text-champagne-600">{item.quantity}x</span> {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-[0.68rem] text-wine-700 mt-0.5">Variation: <strong>{item.variant_name}</strong></p>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[0.68rem] text-wine-600 mt-0.5">
                        Add-ons: {item.addons.map((a) => a.addon_name).join(", ")}
                      </p>
                    )}
                    {item.special_instructions && (
                      <p className="text-[0.68rem] text-wine-500 italic mt-0.5">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-serif font-bold text-wine-950 text-sm">{formatKobo(item.total_price_kobo)}</p>
                    <p className="text-[0.65rem] text-wine-500">{formatKobo(item.unit_price_kobo)} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-wine-900/10 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-wine-700">
                <span>Subtotal</span>
                <span className="font-serif text-wine-950">{formatKobo(order.subtotal_kobo)}</span>
              </div>
              <div className="flex justify-between text-wine-700">
                <span>Fulfilment Fee ({order.fulfillment_type})</span>
                <span className="font-serif text-wine-950">
                  {order.delivery_fee_kobo > 0 ? formatKobo(order.delivery_fee_kobo) : "Free"}
                </span>
              </div>
              {order.discount_kobo > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Privilege Discount ({order.coupon_code})</span>
                  <span className="font-serif">-{formatKobo(order.discount_kobo)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-wine-900/10 pt-2 text-base font-semibold">
                <span className="text-wine-950">Final Order Total</span>
                <span className="font-serif text-xl font-bold text-wine-950">{formatKobo(order.total_kobo)}</span>
              </div>
            </div>
          </div>

          {/* Internal Administrator Notes */}
          <div className="rounded border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Internal Administrator Notes
            </h2>
            <form onSubmit={handleSaveNotes} className="space-y-3">
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter internal dispatch, kitchen instructions, or VIP customer remarks..."
                className="w-full rounded border border-wine-900/15 bg-ivory-50/50 p-3 text-xs text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSavingNotes}
                  className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-4 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-wine-800 transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
                {notesFeedback && (
                  <span
                    className={`text-xs ${
                      notesFeedback.success ? "text-emerald-700 font-medium" : "text-rose-600"
                    }`}
                  >
                    {notesFeedback.msg}
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Workflow Transitions, Timeline & Audit */}
        <div className="space-y-6">
          {/* Status Workflow Control Box */}
          <div className="rounded border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Order Workflow Status
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-wine-700">Current Status:</span>
                <span className="font-bold uppercase tracking-wider text-wine-950 font-mono">
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-wine-700">Payment Status:</span>
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    order.payment_status === "paid" ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>
            </div>

            {isTerminal ? (
              <div className="rounded bg-wine-900/5 p-3 text-xs text-wine-800">
                This order has reached its terminal status (<strong>{order.status}</strong>). Further automated transitions are locked.
              </div>
            ) : (
              <form onSubmit={handleUpdateStatus} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-800 mb-1">
                    Transition to Status:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                    className="w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3 py-2 text-xs font-medium text-wine-950 focus:border-champagne-500 focus:outline-none"
                  >
                    <option value="confirmed">Confirmed (Accept to Kitchen)</option>
                    <option value="preparing">Preparing (Cooking in Kitchen)</option>
                    {order.fulfillment_type === "pickup" ? (
                      <option value="ready_for_pickup">Ready for Pickup</option>
                    ) : (
                      <>
                        <option value="ready_for_dispatch">Ready for Dispatch</option>
                        <option value="out_for_delivery">Out for Delivery (In Transit)</option>
                      </>
                    )}
                    <option value={order.fulfillment_type === "pickup" ? "collected" : "delivered"}>
                      {order.fulfillment_type === "pickup" ? "Collected (Completed)" : "Delivered (Completed)"}
                    </option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {selectedStatus === "cancelled" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-rose-800 mb-1">
                      Cancellation Reason *
                    </label>
                    <input
                      type="text"
                      required
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="e.g. Customer requested, stock shortage..."
                      className="w-full rounded border border-rose-300 bg-rose-50/50 px-3 py-1.5 text-xs text-rose-950 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-800 mb-1">
                    Status Audit Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="e.g. Dispatched with Rider Samuel (08012345678)"
                    className="w-full rounded border border-wine-900/20 bg-ivory-50/50 px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingStatus || selectedStatus === order.status}
                  className="w-full flex items-center justify-center gap-1.5 rounded bg-wine-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory-50 hover:bg-wine-800 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <CheckCircle2 className="size-3.5 text-champagne-400" />
                  {isUpdatingStatus ? "Updating..." : "Update Status"}
                </button>

                {statusFeedback && (
                  <p
                    className={`text-xs ${
                      statusFeedback.success ? "text-emerald-700 font-medium" : "text-rose-600"
                    }`}
                  >
                    {statusFeedback.msg}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Fulfillment Status Audit Timeline */}
          <div className="rounded border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Fulfilment Audit Timeline
            </h2>

            <div className="space-y-4 text-xs">
              {timeline.length === 0 ? (
                <p className="text-wine-600">No status changes recorded yet.</p>
              ) : (
                timeline.map((entry, idx) => (
                  <div key={entry.id || idx} className="relative pl-5 border-l border-wine-900/20 pb-2">
                    <div className="absolute -left-1.5 top-0 size-3 rounded-full bg-champagne-500 border border-white" />
                    <p className="font-semibold text-wine-950 capitalize">
                      Transition: {entry.from_status} → {entry.to_status}
                    </p>
                    <p className="text-[0.65rem] text-wine-600">
                      By {entry.changed_by_name || "Staff"} ·{" "}
                      {new Date(entry.created_at).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    {entry.notes && (
                      <p className="mt-1 text-[0.68rem] text-wine-800 italic bg-ivory-50 p-1.5 rounded border border-wine-900/10">
                        &ldquo;{entry.notes}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Notifications Audit Log */}
          <div className="rounded border border-wine-900/10 bg-white p-6 shadow-soft space-y-4">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Customer Notification Audit
            </h2>

            <div className="space-y-3 text-xs">
              {notifications.length === 0 ? (
                <p className="text-wine-600">No notifications dispatched yet.</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="rounded border border-wine-900/10 bg-ivory-50/60 p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-wine-950 capitalize">{notif.notification_type}</span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[0.6rem] font-semibold uppercase ${
                          notif.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : notif.status === "skipped"
                            ? "bg-slate-100 text-slate-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {notif.status}
                      </span>
                    </div>
                    <p className="text-[0.65rem] text-wine-600 font-mono truncate">{notif.provider}</p>
                    <p className="text-[0.68rem] text-wine-800">{notif.subject}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
