"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  Bike,
  Store,
  Clock,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  XCircle,
  Truck,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import type { Order, OrderStatus, OrderAdminMetrics } from "@/types/order";
import { formatKobo } from "@/types/catalogue";

interface Props {
  initialOrders: Order[];
  metrics: OrderAdminMetrics;
}

export function AdminOrdersClient({ initialOrders, metrics }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "value_high" | "value_low">("newest");

  // Filtering & Search
  const filteredOrders = orders.filter((o) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      o.order_reference.toLowerCase().includes(query) ||
      o.customer_name.toLowerCase().includes(query) ||
      o.customer_email.toLowerCase().includes(query) ||
      o.customer_phone.includes(query);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
    const matchesFulfillment = fulfillmentFilter === "all" || o.fulfillment_type === fulfillmentFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesFulfillment;
  });

  // Sorting
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortBy === "value_high") {
      return (b.total_kobo || 0) - (a.total_kobo || 0);
    }
    if (sortBy === "value_low") {
      return (a.total_kobo || 0) - (b.total_kobo || 0);
    }
    return 0;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "received":
      case "awaiting_payment":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-800 border border-slate-300">
            <Clock className="size-3" /> {status}
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-blue-800 border border-blue-200">
            <CheckCircle2 className="size-3" /> Confirmed
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-900 border border-amber-300">
            <ChefHat className="size-3" /> Preparing
          </span>
        );
      case "ready":
      case "ready_for_pickup":
      case "ready_for_dispatch":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-purple-800 border border-purple-200">
            <Package className="size-3" /> Ready
          </span>
        );
      case "out_for_delivery":
      case "dispatched":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-indigo-800 border border-indigo-200">
            <Truck className="size-3" /> In Transit
          </span>
        );
      case "delivered":
      case "collected":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="size-3" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-800 border border-rose-200">
            <XCircle className="size-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-wine-900/5 text-wine-900">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-800 border border-emerald-200">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800 border border-amber-200">
            Pending
          </span>
        );
      case "failed":
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-rose-800 border border-rose-200">
            {status}
          </span>
        );
      case "underpaid":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-orange-800 border border-orange-200">
            Underpaid
          </span>
        );
      default:
        return (
          <span className="inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">
            Culinary Intake &amp; Order Fulfilment
          </p>
          <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">
            Incoming Orders ({orders.length})
          </h1>
          <p className="mt-1 text-sm text-wine-800/80">
            Live operations dashboard for order management, kitchen status transitions, and delivery orchestration.
          </p>
        </div>
      </div>

      {/* Metrics Row (Actual Database Computations) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-600">Today</p>
          <p className="mt-1 font-serif text-xl font-bold text-wine-950">{metrics.ordersReceivedToday}</p>
        </div>

        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">Pending</p>
          <p className="mt-1 font-serif text-xl font-bold text-amber-900">{metrics.pendingOrders}</p>
        </div>

        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700">Paid</p>
          <p className="mt-1 font-serif text-xl font-bold text-emerald-900">{metrics.paidOrders}</p>
        </div>

        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-amber-800">In Kitchen</p>
          <p className="mt-1 font-serif text-xl font-bold text-amber-950">{metrics.preparingOrders}</p>
        </div>

        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-indigo-700">In Transit</p>
          <p className="mt-1 font-serif text-xl font-bold text-indigo-950">{metrics.outForDeliveryOrders}</p>
        </div>

        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700">Completed</p>
          <p className="mt-1 font-serif text-xl font-bold text-emerald-950">{metrics.completedOrders}</p>
        </div>

        <div className="rounded border border-wine-900/10 bg-white p-3 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-rose-700">Cancelled</p>
          <p className="mt-1 font-serif text-xl font-bold text-rose-950">{metrics.cancelledOrders}</p>
        </div>

        <div className="rounded border border-champagne-500/30 bg-wine-950 p-3 text-ivory-50 shadow-2xs">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-champagne-400">Paid Revenue</p>
          <p className="mt-1 font-serif text-base font-bold text-champagne-300">
            {formatKobo(metrics.verifiedRevenueKobo)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded border border-wine-900/10 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-wine-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ref, customer, email, phone..."
            className="w-full rounded border border-wine-900/15 bg-white pl-9 pr-3 py-1.5 text-xs text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-wine-700 shrink-0">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded border border-wine-900/15 bg-white px-2.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="received">Received</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="collected">Collected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-wine-700 shrink-0">Payment:</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full rounded border border-wine-900/15 bg-white px-2.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="unpaid">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="underpaid">Underpaid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Fulfilment Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-wine-700 shrink-0">Type:</label>
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value)}
            className="w-full rounded border border-wine-900/15 bg-white px-2.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
          >
            <option value="all">All Fulfilments</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-wine-700 shrink-0">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full rounded border border-wine-900/15 bg-white px-2.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="value_high">Highest Value</option>
            <option value="value_low">Lowest Value</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-wine-900/10 bg-ivory-100/70 font-semibold uppercase tracking-wider text-wine-800">
              <tr>
                <th className="px-4 py-3">Reference / Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Fulfilment</th>
                <th className="px-4 py-3">Item Breakdown</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Fulfilment Status</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wine-900/5">
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-wine-700">
                    <ChefHat className="mx-auto size-8 text-wine-300 mb-2" />
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((ord) => {
                  const itemCount = ord.items?.reduce((s, i) => s + i.quantity, 0) || 0;

                  return (
                    <tr key={ord.id} className="hover:bg-ivory-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${ord.order_reference}`}
                          className="font-mono font-semibold text-wine-950 hover:text-champagne-600 transition-colors"
                        >
                          {ord.order_reference}
                        </Link>
                        <p className="text-[0.65rem] text-wine-600">
                          {new Date(ord.created_at).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-wine-950">{ord.customer_name}</p>
                        <p className="text-[0.65rem] text-wine-600">{ord.customer_phone}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-wine-900/5 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-wine-900">
                          {ord.fulfillment_type === "delivery" ? (
                            <>
                              <Bike className="size-3 text-champagne-600" /> Delivery ({ord.delivery_area || "Lagos"})
                            </>
                          ) : (
                            <>
                              <Store className="size-3 text-champagne-600" /> Pickup
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-wine-950 truncate">
                          {ord.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || `${itemCount} items`}
                        </p>
                        <span className="text-[0.65rem] text-wine-600">{itemCount} item(s)</span>
                      </td>

                      <td className="px-4 py-3 text-right font-serif font-bold text-wine-950">
                        {formatKobo(ord.total_kobo)}
                      </td>

                      <td className="px-4 py-3 text-center">{getStatusBadge(ord.status)}</td>

                      <td className="px-4 py-3 text-center">{getPaymentBadge(ord.payment_status)}</td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${ord.order_reference}`}
                          className="inline-flex items-center gap-1 rounded border border-wine-900/15 bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-wine-950 hover:bg-wine-900 hover:text-ivory-50 transition-colors shadow-2xs"
                        >
                          <Eye className="size-3" />
                          <span>Details</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
