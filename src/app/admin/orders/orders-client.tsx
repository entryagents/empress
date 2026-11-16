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
} from "lucide-react";
import type { Order } from "@/types/order";
import { formatKobo } from "@/types/catalogue";

interface Props {
  initialOrders: Order[];
}

export function AdminOrdersClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      search === "" ||
      o.order_reference.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchesType = filterType === "all" || o.fulfillment_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-champagne-600">
            Kitchen &amp; Order Intake
          </p>
          <h1 className="mt-1 font-serif text-3xl font-light text-wine-950">
            Incoming Orders ({orders.length})
          </h1>
          <p className="mt-1 text-sm text-wine-800/80">
            Real-time feed of submitted customer orders, delivery specifications, and payment reservation states.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-wine-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, name, or phone..."
            className="w-full rounded border border-wine-900/15 bg-white pl-9 pr-3 py-1.5 text-xs text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-wine-800">Fulfilment:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded border border-wine-900/15 bg-white px-2.5 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
          >
            <option value="all">All Orders</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-4 overflow-hidden rounded-[2px] border border-wine-900/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-wine-900/10 bg-ivory-100/70 font-semibold uppercase tracking-wider text-wine-800">
              <tr>
                <th className="px-4 py-3">Reference / Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Fulfilment</th>
                <th className="px-4 py-3">Items Snapshot</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Order Status</th>
                <th className="px-4 py-3 text-center">Payment</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wine-900/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-wine-700">
                    <ChefHat className="mx-auto size-8 text-wine-300 mb-2" />
                    No orders recorded yet. Orders submitted via checkout will display here immediately.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const itemCount = ord.items?.reduce((s, i) => s + i.quantity, 0) || 0;

                  return (
                    <tr key={ord.id} className="hover:bg-ivory-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono font-semibold text-wine-950">{ord.order_reference}</p>
                        <span className="text-[0.65rem] text-wine-600">
                          {new Date(ord.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
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

                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {ord.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          {ord.payment_status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/order/confirmation?ref=${ord.order_reference}&token=${ord.secure_access_token}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[0.7rem] text-champagne-700 hover:text-wine-950 hover:underline"
                        >
                          <span>Review</span>
                          <ExternalLink className="size-3" />
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
